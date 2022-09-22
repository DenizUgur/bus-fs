/**
 * @author Deniz Ugur <deniz343@gmail.com>
 */
import sequelize from "../db";
import { RateLimiterPostgres, RateLimiterMemory } from "rate-limiter-flexible";

const opts = {
	keyPrefix: "rlDefault",
	storeClient: sequelize,
	points: 10, // Number of available points
	duration: 60, // Per minute
	tableName: "ratelimit",
	tableCreated: true,
	clearExpiredByTimeout: true,
};

const pkg = (<any>process).pkg ? true : false;
const dev = process.env.NODE_ENV !== "production";
const rateLimiterDefault = pkg ? new RateLimiterMemory(opts) : new RateLimiterPostgres(opts);

const rateLimiterMiddleware = (req: any, res: any, next: any) => {
	if (dev) return next();
	rateLimiterDefault
		.consume(req.user.email, 1)
		.then((RLResponse) => {
			return next();
		})
		.catch((RLResponse) => {
			if (RLResponse instanceof Error) {
				throw RLResponse;
			} else {
				const seconds = (
					parseFloat(RLResponse.toJSON().msBeforeNext) / 1000
				).toFixed(0);
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

export default rateLimiterMiddleware;
