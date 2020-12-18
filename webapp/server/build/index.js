"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = __importDefault(require("./core/server"));
const Sentry = __importStar(require("@sentry/node"));
const dev = process.env.NODE_ENV !== "production";
//////////////////////////
//		APP START		//
//////////////////////////
const db_1 = __importDefault(require("./db"));
const serve_1 = __importStar(require("./core/serve"));
const manage_1 = __importDefault(require("./core/manage"));
const auth_1 = __importStar(require("./core/auth"));
const rateLimiter_1 = __importDefault(require("./core/rateLimiter"));
// Initialize Passport
server_1.default.use(auth_1.passport.initialize());
server_1.default.use((req, res, next) => {
    if (req.url.match(/\/(?:auth|serve|manage)/))
        auth_1.passport.authenticate("session", (err, user, info) => {
            if (err)
                req.logOut();
            if (!user)
                return res.redirect("/auth/login");
            req.logIn(user, (err) => {
                if (err)
                    return next(err);
                return next();
            });
        })(req, res, next);
    else
        next();
});
server_1.default.use("/auth", auth_1.default);
if (dev) {
    server_1.default.use("/manage", manage_1.default);
    server_1.default.use("/serve", (req, res, next) => {
        req.user = {
            displayName: "Test User",
            sid: "S000002",
        };
        next();
    }, serve_1.default);
}
else {
    server_1.default.use("/manage", [auth_1.isAuthenticated, auth_1.isTA, manage_1.default]);
    server_1.default.use("/serve", [auth_1.isAuthenticated, rateLimiter_1.default, serve_1.default]);
}
server_1.default.get("/:type", (req, res, next) => {
    if (!serve_1.isAvailable(req.params.type)) {
        return res.render("index", {
            title: "BUS File Service",
            message: "This homework is not available yet.",
            serve: false,
        });
    }
    return res.redirect(`/serve/${req.params.type}`);
});
server_1.default.use(Sentry.Handlers.errorHandler());
server_1.default.use((err, req, res, next) => {
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
db_1.default.sync({ force: process.env.NODE_ENV != "production" }).then(() => {
    server_1.default.listen(PORT, () => console.log(`Listening on ${PORT}`));
});
//# sourceMappingURL=index.js.map