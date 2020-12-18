"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../db"));
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const opts = {
    keyPrefix: "rlDefault",
    storeClient: db_1.default,
    points: 10,
    duration: 60,
    tableName: "ratelimit",
    tableCreated: true,
    clearExpiredByTimeout: true,
};
const rateLimiterDefault = new rate_limiter_flexible_1.RateLimiterPostgres(opts);
const rateLimiterMiddleware = (req, res, next) => {
    rateLimiterDefault
        .consume(req.user.email, 1)
        .then((RLResponse) => {
        return next();
    })
        .catch((RLResponse) => {
        if (RLResponse instanceof Error) {
            throw RLResponse;
        }
        else {
            const seconds = (parseFloat(RLResponse.toJSON().msBeforeNext) / 1000).toFixed(0);
            return res.render("error", {
                title: "429 Error",
                message: "429",
                subtitle: "Too Many Requests",
                description: `Please wait ${seconds} seconds before trying again`,
                mail: true,
            });
        }
    });
};
exports.default = rateLimiterMiddleware;
//# sourceMappingURL=rateLimiter.js.map