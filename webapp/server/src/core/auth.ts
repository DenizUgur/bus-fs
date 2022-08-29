/**
 * @author Deniz Ugur <deniz343@gmail.com>
 */
import { Request, Response, Router } from "express";
import { OIDCStrategy } from "passport-azure-ad";
import { User } from "../db";
const passport = require("passport");
const config = require("../config");

const pkg = (<any>process).pkg ? true : false;
const dev = pkg ? false : process.env.NODE_ENV !== "production";
const router = Router();

passport.serializeUser((user: any, done: any) => {
	done(null, user.oid);
});

passport.deserializeUser(async (oid: any, done: any) => {
	try {
		await findByOid(oid, (error: any, user: any) => {
			if (error) {
				done(error, null);
			} else {
				done(null, user.dataValues);
			}
		});
	} catch (error) {
		done(error, null);
	}
});

const findByOid = async (oid: any, fn: any) => {
	try {
		const user = await User.findOne({
			where: { oid },
		});
		if (user) return fn(null, user);
		return fn(new Error("No user"), null);
	} catch (error) {
		return fn(error, null);
	}
};

passport.use(
	new OIDCStrategy(
		{
			identityMetadata: config.creds.identityMetadata,
			clientID: config.creds.clientID,
			responseType: config.creds.responseType,
			responseMode: config.creds.responseMode,
			redirectUrl: config.creds.redirectUrl,
			allowHttpForRedirectUrl: config.creds.allowHttpForRedirectUrl,
			clientSecret: config.creds.clientSecret,
			validateIssuer: config.creds.validateIssuer,
			isB2C: config.creds.isB2C,
			issuer: config.creds.issuer,
			passReqToCallback: config.creds.passReqToCallback,
			scope: config.creds.scope,
			loggingLevel: config.creds.loggingLevel,
			nonceLifetime: config.creds.nonceLifetime,
			nonceMaxAmount: config.creds.nonceMaxAmount,
			useCookieInsteadOfSession: config.creds.useCookieInsteadOfSession,
			cookieEncryptionKeys: config.creds.cookieEncryptionKeys,
			clockSkew: config.creds.clockSkew,
		},
		async (
			iss: any,
			sub: any,
			profile: any,
			accessToken: string,
			refreshToken: string,
			done: any
		) => {
			if (!profile.oid) {
				return done(new Error("No oid found"), null);
			}

			await findByOid(profile.oid, async (err: any, user: any) => {
				if (err || !user) {
					try {
						const _user = await User.findOne({
							where: {
								email: profile._json.email,
							},
						});

						if (!_user) return done(null, null);
						await _user.update({
							oid: profile.oid,
							displayName: profile.displayName,
							enrolled: true,
						});

						return done(null, profile);
					} catch (error) {
						return done(error, null);
					}
				}
				return done(null, user);
			});
		}
	)
);

router.get("/login", (req, res, next) => {
	passport.authenticate("azuread-openidconnect", {
		response: res,
		successReturnToOrRedirect: "/serve",
		failureRedirect: "/auth/fail",
	})(req, res, next);
});

router.get("/openid/return", (req, res, next) => {
	passport.authenticate("azuread-openidconnect", {
		response: res,
		successReturnToOrRedirect: "/serve",
		failureRedirect: "/auth/fail",
	})(req, res, next);
});

router.post("/openid/return", (req, res, next) => {
	passport.authenticate("azuread-openidconnect", {
		response: res,
		successReturnToOrRedirect: "/serve",
		failureRedirect: "/auth/fail",
	})(req, res, next);
});

router.get("/fail", (req, res) => {
	res.render("error", {
		message: "401",
		subtitle: "Unauthorized",
		description:
			"There has been a problem authenticating your profile. Please log out and try again.",
		mail: false,
	});
});

router.get("/logout", (req, res) => {
	req.session.destroy((err: any) => {
		req.logOut();
		res.redirect("http://lms.ozyegin.edu.tr");
	});
});

const isAuthenticated = async (req: Request, res: Response, next: any) => {
	// Save returnTo
	req.session.returnTo = req.originalUrl;

	if (dev) {
		req.user = {
			displayName: "Deniz Ugur",
			sid: "S014557",
			oid: "test_oid",
			email: "deniz.ugur@ozu.edu.tr",
			enrolled: true,
			level: 300,
			privileges: [],
		};
		await User.upsert(req.user);
		// Copy user to adminUser for AdminBro compatibility
		req.session.adminUser = req.user;
		return next();
	}

	if (req.isAuthenticated()) {
		if (req.user) {
			// Copy user to adminUser for AdminBro compatibility
			req.session.adminUser = req.user;

			if (req.user.enrolled) {
				return next();
			}
		}
		return res.render("index", {
			message: `Sorry, you are not enrolled to this course.`,
			serve: false,
		});
	} else {
		return res.redirect("/auth/login");
	}
};

const isSeniorTA = (req: Request, res: Response, next: any) => {
	// Save returnTo
	req.session.returnTo = req.originalUrl;
	let TA_treshold = 200;

	if (dev) {
		if (req.user.level >= TA_treshold) {
			return next();
		} else {
			return res.render("index", {
				message: `Sorry, you are not allowed to access this page.`,
				serve: false,
			});
		}
	}

	if (req.isAuthenticated()) {
		if (req.user) {
			if (req.user.level >= TA_treshold) {
				return next();
			}
		}
		return res.render("index", {
			message: `Sorry, you are not allowed to access this page.`,
			serve: false,
		});
	} else {
		return res.redirect("/auth/login");
	}
};

export default router;
export { passport, isAuthenticated, isSeniorTA };
