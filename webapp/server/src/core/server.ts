/**
 * @author Deniz Ugur <deniz343@gmail.com>
 */
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { createClient } from "redis";
import methodOverride from "method-override";
import session from "express-session";
import cookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import { CaptureConsole } from "@sentry/integrations";
import { passport } from "./auth";
import prepareAdmin from "../admin";

const pkg = (<any>process).pkg ? true : false;
const dev = process.env.NODE_ENV !== "production";

const app: express.Application = express();
app.set("trust proxy", 1);
app.set("view engine", "pug");

app.set("views", path.join(__dirname, pkg ? "../../src/views" : "../views"));

if (process.env.ORIGIN_HOST == undefined)
	throw new Error("ORIGIN_HOST is not available");

if (process.env.SENTRY_DSN == undefined)
	console.warn("SENTRY_DSN is not available");

if (!dev && process.env.SENTRY_DSN) {
	Sentry.init({
		dsn: process.env.SENTRY_DSN,
		integrations: [
			new Sentry.Integrations.Http({ tracing: true }),
			new Tracing.Integrations.Express({ app }),
			new CaptureConsole({ levels: ["error"] }),
		],
		tracesSampleRate: 1.0,
	});
	app.use(Sentry.Handlers.requestHandler());
	app.use(Sentry.Handlers.tracingHandler());
}

app.use(
	"/assets",
	express.static(path.join(__dirname, pkg ? "../../src/assets" : "../assets"))
);

app.use(require("helmet")({ contentSecurityPolicy: false }));
app.use(
	cors({
		origin: dev ? "*" : process.env.ORIGIN_HOST,
		credentials: true,
		allowedHeaders: "Content-Type, Set-Cookie, Authorization",
	})
);
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride());
app.use(cookieParser());
app.use(morgan("dev"));

if (process.env.SESSION_KEY == undefined)
	throw new Error("SESSION_KEY is not available");

if (dev || pkg) {
	const SQLiteStore = require("connect-sqlite3")(session);
	app.use(
		session({
			store: new SQLiteStore({
				db: "sessions.sqlite",
				dir: "./data",
			}),
			secret: process.env.SESSION_KEY,
			resave: false,
			saveUninitialized: false,
			cookie: {
				secure: true,
			},
		})
	);
} else {
	if (process.env.REDIS_URL == undefined)
		throw new Error("REDIS_URL is not available");

	const RedisStore = require("connect-redis")(session);
	const redisClient = createClient({
		url: process.env.REDIS_URL,
		legacyMode: true,
	});
	redisClient.connect().catch(console.error);

	app.use(
		session({
			store: new RedisStore({ client: redisClient, ttl: 1000 * 60 * 15 }),
			secret: process.env.SESSION_KEY,
			resave: false,
			saveUninitialized: false,
			cookie: {
				secure: true,
				sameSite: "lax",
			},
		})
	);
}

// Initialize Passport
app.use(passport.initialize());
app.use((req, res, next) => {
	if (req.url.match(/\/(?:auth|serve|manage|api)/))
		passport.authenticate("session", (err: any, user: any, info: any) => {
			if (err) {
				req.logout((err: any) => {
					if (err) return next(err);
				});
			}
			if (!user) return res.redirect("/auth/login");

			req.login(user, (err) => {
				if (err) return next(err);
				return next();
			});
		})(req, res, next);
	else next();
});

// Initialize Admin UI
prepareAdmin(app);

export default app;
