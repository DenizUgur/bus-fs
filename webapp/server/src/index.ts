/**
 * @author Deniz Ugur <deniz343@gmail.com>
 */
import fs from "fs";
import path from "path";

// Setup env
const pkg = (<any>process).pkg ? true : false;
const dev = pkg ? false : process.env.NODE_ENV !== "production";

if (dev)
	require("dotenv").config({
		path: require("path").join(__dirname, "../../../.env"),
	});

if (pkg) {
	require("dotenv").config({
		path: require("path").join(process.cwd(), ".env"),
	});
	if (process.env.NODE_ENV == undefined) process.env.NODE_ENV = "production";
	process.env.ADMIN_JS_TMP_DIR = "./data/.adminjs";
}

//* Prepare data folder
//* Copy worker files to data folder
if (!fs.existsSync("./data/worker")) {
	try {
		fs.mkdirSync("./data/worker", {
			recursive: true,
		});
		fs.copyFileSync(
			path.join(__dirname, "../../worker/app.py"),
			"./data/worker/app.py"
		);
		fs.copyFileSync(
			path.join(__dirname, "../../worker/encryptor"),
			"./data/worker/encryptor"
		);
		fs.chmodSync("./data/worker/encryptor", 0o555);
	} catch (error) {
		throw new Error("worker files could not be copied");
	}
}

//* Copy credentials to data folder
if (!fs.existsSync("./data/ssl")) {
	try {
		fs.mkdirSync("./data/ssl", { recursive: true });
		fs.copyFileSync("./cert.pem", "./data/ssl/cert.pem");
		fs.copyFileSync("./key.pem", "./data/ssl/key.pem");
	} catch (err) {
		throw new Error("SSL key/cert pair not found");
	}
}

//* Copy auth configuraton to data folder
if (!fs.existsSync("./data/auth.json")) {
	try {
		fs.copyFileSync("./auth.json", "./data/auth.json");
	} catch (err) {
		throw new Error("auth.json not found");
	}
}

import app from "./core/server";
import * as Sentry from "@sentry/node";
import https from "https";

//////////////////////////
//		APP START		//
//////////////////////////
import routerServe from "./core/serve";
import routerAuth, { isAuthenticated } from "./core/auth";
import rateLimiterMiddleware from "./core/rateLimiter";
import sequelize, { FileAccess } from "./db";
import { flushFiles } from "./admin/api";

app.use("/auth", routerAuth);
app.use("/serve", [isAuthenticated, rateLimiterMiddleware, routerServe]);

app.get("/f/:type", (req, res, next) => {
	req.session.type = req.params.type;
	return res.redirect("/serve");
});

app.get("/", (req, res) => {
	res.render("index", {
		message: "BUS 101 - File Service",
	});
});

app.use((req, res) => {
	res.render("index", {
		message: "The page you are looking does not exists.",
	});
});

if (!dev) app.use(Sentry.Handlers.errorHandler());

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

const PORT_HTTP = process.env.PORT_HTTP || 80;
const PORT_HTTPS = process.env.PORT_HTTPS || 443;

sequelize
	.sync({ force: process.env.NODE_ENV != "production" })
	.then(async () => {
		try {
			await flushFiles();
			console.log("Files Downloaded");
		} catch (error) {
			console.error(error);
			throw new Error("Something is seriously wrong!");
		}

		//* Start the servers
		app.listen(PORT_HTTP, () =>
			console.log(`Listening HTTP server on ${PORT_HTTP}`)
		);
		https
			.createServer(
				{
					key: fs.readFileSync("./data/ssl/key.pem"),
					cert: fs.readFileSync("./data/ssl/cert.pem"),
				},
				app
			)
			.listen(PORT_HTTPS, () =>
				console.log(`Listening HTTPS server on ${PORT_HTTPS}`)
			);
	});
