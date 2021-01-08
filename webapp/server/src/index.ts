import app from "./core/server";
import * as Sentry from "@sentry/node";

const dev = process.env.NODE_ENV !== "production";

//////////////////////////
//		APP START		//
//////////////////////////
import sequelize, { FileAccess, User } from "./db";
import routerServe from "./core/serve";
import routerManage from "./core/manage";
import routerAuth, { passport, isAuthenticated, isSeniorTA } from "./core/auth";
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

if (dev) {
	app.use("/manage", routerManage);
	app.use(
		"/serve",
		(req, res, next) => {
			req.user = {
				displayName: "Deniz Ugur",
				sid: "S014557",
				oid: "test_oid",
				email: "deniz.ugur@ozu.edu.tr",
				enrolled: true,
				level: 100,
			};
			next();
		},
		routerServe
	);
} else {
	app.use("/manage", [isAuthenticated, isSeniorTA, routerManage]);
	app.use("/serve", [isAuthenticated, rateLimiterMiddleware, routerServe]);
}

app.get("/:type", (req, res, next) => {
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
		if (dev) {
			// Create seed data
			await FileAccess.bulkCreate([
				{
					name: "final",
					enabled: true,
					onetime: false,
					level: 100,
					encrypt: false,
					password: "NINENINE",
					vba_password: true,
				},
			]);
			await User.create({
				oid: "test_oid",
				displayName: "Deniz Ugur",
				email: "deniz.ugur@ozu.edu.tr",
				sid: "S014557",
				enrolled: true,
				level: 100,
			});
		}
		app.listen(PORT, () => console.log(`Listening on ${PORT}`));
	});
