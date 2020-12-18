"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTA = exports.isAuthenticated = exports.passport = void 0;
const express_1 = require("express");
const passport_azure_ad_1 = require("passport-azure-ad");
const db_1 = require("../db");
const passport = require("passport");
exports.passport = passport;
const config = require("../config");
const router = express_1.Router();
const list = require("../../../data/users/students.json");
const listTA = require("../../../data/users/TAs.json");
passport.serializeUser((user, done) => {
    done(null, user.oid);
});
passport.deserializeUser((oid, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield findByOid(oid, (error, user) => {
            if (error) {
                done(error, null);
            }
            else {
                done(null, user.dataValues);
            }
        });
    }
    catch (error) {
        done(error, null);
    }
}));
const findByOid = (oid, fn) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield db_1.User.findOne({
            where: { oid },
        });
        if (user)
            return fn(null, user);
        return fn(new Error("No user"), null);
    }
    catch (error) {
        return fn(error, null);
    }
});
const getIdByEmail = (email) => {
    const TA = listTA.find((el) => el.email === email);
    const student = list.find((el) => el.email === email);
    let details = {
        level: 0,
        sid: "",
        enrolled: true,
    };
    if (TA)
        details.level = 100;
    if (TA || student) {
        details.sid = (TA || student).id;
    }
    else {
        details.enrolled = false;
    }
    return details;
};
passport.use(new passport_azure_ad_1.OIDCStrategy({
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
}, (iss, sub, profile, accessToken, refreshToken, done) => __awaiter(void 0, void 0, void 0, function* () {
    if (!profile.oid) {
        return done(new Error("No oid found"), null);
    }
    yield findByOid(profile.oid, (err, user) => __awaiter(void 0, void 0, void 0, function* () {
        if (err || !user) {
            try {
                const details = getIdByEmail(profile._json.email);
                yield db_1.User.create({
                    oid: profile.oid,
                    displayName: profile.displayName,
                    email: profile._json.email,
                    sid: details.sid,
                    enrolled: details.enrolled,
                    level: details.level,
                });
                return done(null, profile);
            }
            catch (error) {
                return done(error, null);
            }
        }
        return done(null, user);
    }));
})));
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
        description: "There has been a problem authenticating your profile. Please log out and try again.",
        mail: false,
    });
});
router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        req.logOut();
        res.redirect("http://lms.ozyegin.edu.tr");
    });
});
const isAuthenticated = (req, res, next) => {
    // Save returnTo
    req.session.returnTo = req.originalUrl;
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
    }
    else {
        return res.redirect("/auth/login");
    }
};
exports.isAuthenticated = isAuthenticated;
const isTA = (req, res, next) => {
    // Save returnTo
    req.session.returnTo = req.originalUrl;
    if (req.isAuthenticated()) {
        if (req.user) {
            if (req.user.level > 0) {
                return next();
            }
        }
        return res.render("index", {
            title: "BUS File Service",
            message: `Sorry, you are not allowed to access this page.`,
            serve: false,
        });
    }
    else {
        return res.redirect("/auth/login");
    }
};
exports.isTA = isTA;
exports.default = router;
//# sourceMappingURL=auth.js.map