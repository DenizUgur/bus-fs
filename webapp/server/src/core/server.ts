/**
 * @author Deniz Ugur <deniz343@gmail.com>
 */
import express from "express";
import helmet from "helmet";
import cors from "cors";
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

const dev = process.env.NODE_ENV !== "production";

const app: express.Application = express();
app.set("trust proxy", 1);
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "../views"));

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

app.use("/assets", express.static(path.join(__dirname, "../assets")));

app.use(helmet({ contentSecurityPolicy: false }));
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

if (dev) {
	app.use(
		session({
			secret: process.env.SESSION_KEY || "",
			resave: false,
			saveUninitialized: false,
			cookie: {
				secure: false,
				sameSite: "lax",
			},
		})
	);
} else {
	const RedisStore = require("connect-redis")(session);
	const redisClient = createClient({
		url: process.env.REDIS_URL || "",
		legacyMode: true,
	});
	redisClient.connect().catch(console.error);

	app.use(
		session({
			store: new RedisStore({ client: redisClient, ttl: 1000 * 60 * 15 }),
			secret: process.env.SESSION_KEY || "",
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
			if (err) req.logOut();
			if (!user) return res.redirect("/auth/login");

			req.logIn(user, (err) => {
				if (err) return next(err);
				return next();
			});
		})(req, res, next);
	else next();
});

// Initialize Admin UI
prepareAdmin(app);

export default app;
