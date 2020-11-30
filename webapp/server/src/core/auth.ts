import { Request, Response, Router } from "express";
import { OIDCStrategy } from "passport-azure-ad";
import { User } from "../db";
const passport = require("passport");
const config = require("../config");

const router = Router();

const list = require("../../../data/users/students.json");
const listTA = require("../../../data/users/TAs.json");

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

const getIdByEmail = (email: any) => {
	const TA = listTA.find((el: any) => el.email === email);
	const student = list.find((el: any) => el.email === email);
	let details = {
		ta: false,
		sid: "",
		enrolled: true,
	};

	if (TA) details.ta = true;
	if (TA || student) {
		details.sid = (TA || student).id;
	} else {
		details.enrolled = false;
	}
	return details;
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
						const details: any = getIdByEmail(profile._json.email);
						await User.create({
							oid: profile.oid,
							displayName: profile.displayName,
							email: profile._json.email,
							sid: details.sid,
							ta: details.ta,
							enrolled: details.enrolled,
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

router.get(
	"/login",
	(req, res, next) => {
		passport.authenticate("azuread-openidconnect", {
			response: res,
			failureRedirect: "/auth/fail",
		})(req, res, next);
	},
	(req, res) => {
		res.redirect("/serve");
	}
);

router.get(
	"/openid/return",
	(req, res, next) => {
		passport.authenticate("azuread-openidconnect", {
			response: res,
			failureRedirect: "/auth/fail",
		})(req, res, next);
	},
	(req, res) => {
		res.redirect("/serve");
	}
);

router.post(
	"/openid/return",
	(req, res, next) => {
		passport.authenticate("azuread-openidconnect", {
			response: res,
			failureRedirect: "/auth/fail",
		})(req, res, next);
	},
	(req, res) => {
		res.redirect("/serve");
	}
);

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

const isAuthenticated = (req: Request, res: Response, next: any) => {
	if (req.isAuthenticated()) {
		if (req.user) {
			if (req.user.enrolled) {
				return next();
			}
		}
		return res.render("index", {
			title: "BUS File Service",
			message: `Sorry, you are not enrolled to this course.`,
			serve: false,
		});
	} else {
		return res.redirect("/auth/login");
	}
};

export default router;
export { passport, isAuthenticated };
