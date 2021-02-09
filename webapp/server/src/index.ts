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
import sequelize, { FileAccess, User, UserAccess } from "./db";
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
				if (dev) {
					const csv = require("csv-parser");
					const fs = require("fs");
					// Create seed data
					let users: any = [];
					await fs
						.createReadStream("seed/user.csv")
						.pipe(csv())
						.on("data", (row: any) => {
							users.push(row);
						})
						.on("end", async () => {
							console.log(users);
							await User.bulkCreate(users);
						});

					let user_access: any = [];
					await fs
						.createReadStream("seed/user_access.csv")
						.pipe(csv())
						.on("data", (row: any) => {
							user_access.push(row);
						})
						.on("end", async () => {
							await UserAccess.bulkCreate(user_access);
						});

					let file_access: any = [];
					await fs
						.createReadStream("seed/file_access.csv")
						.pipe(csv())
						.on("data", (row: any) => {
							file_access.push(row);
						})
						.on("end", async () => {
							await FileAccess.bulkCreate(file_access);
							const comp = await FileAccess.findByPk("comp");
							await comp?.update({
								files: {
									macrofree: {
										aws: "comp/qd206VXgPsYTIjAJAJVOW_free",
										actual: "comp_template.xlsx",
									},
									macroenabled: {
										aws: "comp/oVKxdEMIF754B4ADHvzd8_macro",
										actual: "comp_template.xlsm",
									},
								},
							});
							const final = await FileAccess.findByPk("final");
							await final?.update({
								files: {
									macrofree: {
										aws: "final/HXKwPQL7b7t2MpdTY3E3S_free",
										actual: "final_template.xlsx",
									},
									macroenabled: {
										aws:
											"final/KUB9wnw_GppDLt7J6GNUy_macro",
										actual: "final_template.xlsm",
									},
								},
							});
							await flushFiles();
						});
				} else {
					await flushFiles();
				}
			} catch (error) {
				console.error(error);
				throw new Error("Something is seriously wrong!");
			}
			console.log(`Listening on ${PORT}`);
		});
	});
