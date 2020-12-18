import app from "./core/server";
import * as Sentry from "@sentry/node";

const dev = process.env.NODE_ENV !== "production";

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

if (dev) {
	app.use("/manage", routerManage);
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
} else {
	app.use("/manage", [isAuthenticated, isTA, routerManage]);
	app.use("/serve", [isAuthenticated, rateLimiterMiddleware, routerServe]);
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

const PORT = process.env.PORT || 5000;

sequelize.sync({ force: process.env.NODE_ENV != "production" }).then(() => {
	app.listen(PORT, () => console.log(`Listening on ${PORT}`));
});
