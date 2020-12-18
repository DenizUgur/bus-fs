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
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const path_1 = __importDefault(require("path"));
const redis_1 = __importDefault(require("redis"));
const method_override_1 = __importDefault(require("method-override"));
const express_session_1 = __importDefault(require("express-session"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const Tracing = __importStar(require("@sentry/tracing"));
const Sentry = __importStar(require("@sentry/node"));
const dev = process.env.NODE_ENV !== "production";
const app = express_1.default();
app.set("trust proxy", 1);
app.set("view engine", "pug");
app.set("views", path_1.default.join(__dirname, "../views"));
Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Tracing.Integrations.Express({ app }),
    ],
    tracesSampleRate: 1.0,
});
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
app.use("/assets", express_1.default.static(path_1.default.join(__dirname, "../assets")));
app.use("/", express_1.default.static(path_1.default.join(__dirname, "../../../ui/build/")));
app.use(helmet_1.default({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'", "fonts.googleapis.com"],
            fontSrc: [
                "'self'",
                "fonts.googleapis.com",
                "fonts.gstatic.com",
            ],
            styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
}));
app.use(cors_1.default({
    origin: "https://bus-fs.herokuapp.com/",
    credentials: true,
    allowedHeaders: "Content-Type, Set-Cookie, Authorization",
}));
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(method_override_1.default());
app.use(cookie_parser_1.default());
if (dev) {
    app.use(express_session_1.default({
        secret: process.env.SESSION_KEY || "",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false,
            sameSite: "none",
        },
    }));
}
else {
    const RedisStore = require("connect-redis")(express_session_1.default);
    const redisClient = redis_1.default.createClient(process.env.REDIS_URL || "");
    app.use(express_session_1.default({
        store: new RedisStore({ client: redisClient, ttl: 1000 * 60 * 15 }),
        secret: process.env.SESSION_KEY || "",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: true,
            sameSite: "none",
        },
    }));
}
exports.default = app;
//# sourceMappingURL=server.js.map