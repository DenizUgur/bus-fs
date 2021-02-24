/**
 * @author Deniz Ugur <deniz343@gmail.com>
 */
import app from "./core/server";
import * as Sentry from "@sentry/node";

//////////////////////////
//		APP START		//
//////////////////////////
import routerServe from "./core/serve";
import routerAuth, { isAuthenticated } from "./core/auth";
import rateLimiterMiddleware from "./core/rateLimiter";
import sequelize, { FileAccess } from "./db";
import { flushFiles } from "./admin/api";

const dev = process.env.NODE_ENV !== "production";
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

const PORT = process.env.PORT || 5000;

sequelize
	.sync({ force: process.env.NODE_ENV != "production" })
	.then(async () => {
		app.listen(PORT, async () => {
			try {
				await flushFiles();
				console.log("Files Downloaded");
			} catch (error) {
				console.error(error);
				throw new Error("Something is seriously wrong!");
			}
			console.log(`Listening on ${PORT}`);
		});
	});
