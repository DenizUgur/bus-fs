import express from "express";
import helmet from "helmet";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import redis from "redis";
import methodOverride from "method-override";
import session from "express-session";
import cookieParser from "cookie-parser";
import * as Tracing from "@sentry/tracing";
import * as Sentry from "@sentry/node";

const dev = process.env.NODE_ENV !== "production";

const app: express.Application = express();
app.set("trust proxy", 1);
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "../views"));

Sentry.init({
	dsn: process.env.SENTRY_DSN,
	integrations: [
		new Sentry.Integrations.Http({ tracing: true }),
		new Tracing.Integrations.Express({ app }),
	],
	tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
app.use("/assets", express.static(path.join(__dirname, "../assets")));
app.use("/", express.static(path.join(__dirname, "../../../ui/build/")));

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
				styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
				scriptSrc: ["'self'", "'unsafe-inline'"],
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

if (dev) {
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
} else {
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
}

export default app;
