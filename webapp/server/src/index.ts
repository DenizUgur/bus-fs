import express from "express";
import helmet from "helmet";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import redis from "redis";
const session = require("express-session");
const cookieParser = require("cookie-parser");

const PORT = process.env.PORT || 5000;

// Express App
const app: express.Application = express();
app.set("trust proxy", 1);
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
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
		allowedHeaders: "Content-Type, Set-Cookie",
	})
);
app.use(bodyParser.json());
app.use(cookieParser());

const RedisStore = require("connect-redis")(session);
const redisClient = redis.createClient(process.env.REDIS_URL || "");

app.use(
	session({
		store: new RedisStore({ client: redisClient, ttl: 1000 * 60 * 15 }),
		secret: process.env.SESSION_KEY || "",
		resave: false,
		saveUninitialized: true,
		cookie: { secure: true },
	})
);

//////////////////////////
//		APP START		//
//////////////////////////
import sequelize from "./db";
import routerServe from "./core/serve";
import routerAuth, { isAuthenticated, isValidUser } from "./core/auth";
import rateLimiterMiddleware from "./core/rateLimiter";

app.use("/serve", [
	isAuthenticated,
	rateLimiterMiddleware,
	isValidUser,
	routerServe,
]);
app.use("/auth", routerAuth);

app.get("/:type", (req, res, next) => {
	/**
	 * @param {param} type => Homework type
	 * @param {query} manual => Change prompt type
	 */
	//* Save request to session before redirect
	if (req.params.type != "hw4") {
		return res.render("index", {
			title: "BUS File Service",
			message: "This homework is not available yet.",
			serve: false,
		});
	}
	req.session.type = req.params.type;
	req.session.prompt = req.query.manual == "1";

	req.session.save((error: any) => {
		if (error) return next(error);
		return res.redirect("/serve");
	});
});

app.use((err: any, req: any, res: any, next: any) => {
	console.error(err);
	return res.render("error", {
		title: "500 Error",
		message: "500",
		subtitle: "Internal Server Error",
		description:
			"Sorry to see you here, please report us what happend so that we can help you",
	});
});

sequelize.sync({ force: process.env.NODE_ENV != "production" }).then(() => {
	app.listen(PORT, () => console.log(`Listening on ${PORT}`));
});
