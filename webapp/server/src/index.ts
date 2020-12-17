import express from "express";
import helmet from "helmet";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import redis from "redis";
import methodOverride from "method-override";
import session from "express-session";
import cookieParser from "cookie-parser";

import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";

const PORT = process.env.PORT || 5000;

// Express App
const app: express.Application = express();
app.set("trust proxy", 1);
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

Sentry.init({
	dsn:
		"https://5a5a7255b5a04d1fa2448350fa3ede5e@o484758.ingest.sentry.io/5538458",
	integrations: [
		new Sentry.Integrations.Http({ tracing: true }),
		new Tracing.Integrations.Express({ app }),
	],
	tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'", "fonts.googleapis.com"],
				fontSrc: [
					"'self'",
					"fonts.googleapis.com",
					"fonts.gstatic.com",
				],
				scriptSrc: ["'self'"],
				objectSrc: ["'none'"],
				upgradeInsecureRequests: [],
			},
		},
	})
);
app.use(
	cors({
		origin: "https://bus-fs.herokuapp.com/",
		credentials: true,
		allowedHeaders: "Content-Type, Set-Cookie, Authorization",
	})
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());
app.use(cookieParser());

if (process.env.NODE_ENV == "production") {
	const RedisStore = require("connect-redis")(session);
	const redisClient = redis.createClient(process.env.REDIS_URL || "");
	app.use(
		session({
			store: new RedisStore({ client: redisClient, ttl: 1000 * 60 * 15 }),
			secret: process.env.SESSION_KEY || "",
			resave: false,
			saveUninitialized: false,
			cookie: {
				secure: true,
				sameSite: "none",
			},
		})
	);
} else {
	app.use(
		session({
			secret: process.env.SESSION_KEY || "",
			resave: false,
			saveUninitialized: false,
			cookie: {
				secure: false,
				sameSite: "none",
			},
		})
	);
}

//////////////////////////
//		APP START		//
//////////////////////////
import sequelize from "./db";
import routerServe, { isAvailable } from "./core/serve";
import routerManage from "./core/manage";
import routerAuth, { passport, isAuthenticated, isTA } from "./core/auth";
import rateLimiterMiddleware from "./core/rateLimiter";

// Initialize Passport
app.use(passport.initialize());
app.use((req, res, next) => {
	if (req.url.match(/\/(?:auth|serve|manage)/))
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

app.use("/auth", routerAuth);
app.use("/manage", [isAuthenticated, isTA, routerManage]);

if (process.env.NODE_ENV == "production") {
	app.use("/serve", [isAuthenticated, rateLimiterMiddleware, routerServe]);
} else {
	app.use(
		"/serve",
		(req, res, next) => {
			req.user = {
				displayName: "Test User",
				sid: "S000002",
			};
			next();
		},
		routerServe
	);
}

app.get("/:type", (req, res, next) => {
	if (!isAvailable(req.params.type)) {
		return res.render("index", {
			title: "BUS File Service",
			message: "This homework is not available yet.",
			serve: false,
		});
	}
	return res.redirect(`/serve/${req.params.type}`);
});

app.use(Sentry.Handlers.errorHandler());

app.use((err: any, req: any, res: any, next: any) => {
	console.error(err);
	return res.render("error", {
		title: "Error",
		message: "500",
		subtitle: "Internal Server Error",
		description: `Sorry to see you here, please report us what happend so that we can help you. Error ID: ${res.sentry}`,
		mail: true,
	});
});

sequelize.sync({ force: process.env.NODE_ENV != "production" }).then(() => {
	app.listen(PORT, () => console.log(`Listening on ${PORT}`));
});
