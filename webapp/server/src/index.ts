/**
 * @author Deniz Ugur <deniz343@gmail.com>
 */
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
}

import app from "./core/server";
import * as Sentry from "@sentry/node";
import fs from "fs";
import path from "path";

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
	return res.render("index", {
		message: "Redirecting you to your assignment.",
		session: true,
	});
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

const PORT = process.env.PORT || 80;

sequelize
	.sync({ force: process.env.NODE_ENV != "production" })
	.then(async () => {
		app.listen(PORT, async () => {
			try {
				await flushFiles();
				console.log("Files Downloaded");

				if (pkg && !fs.existsSync("./data/worker")) {
					await fs.promises.mkdir("./data/worker", {
						recursive: true,
					});
					await fs.promises.copyFile(
						path.join(__dirname, "../../worker/app.py"),
						"./data/worker/app.py"
					);
					await fs.promises.copyFile(
						path.join(__dirname, "../../worker/encryptor"),
						"./data/worker/encryptor"
					);
					await fs.promises.chmod("./data/worker/encryptor", 0o555);
				}
			} catch (error) {
				console.error(error);
				throw new Error("Something is seriously wrong!");
			}
			console.log(`Listening on ${PORT}`);
		});
	});
