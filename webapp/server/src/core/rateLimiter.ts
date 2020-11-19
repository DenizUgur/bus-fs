import sequelize from "../db";
import { RateLimiterPostgres } from "rate-limiter-flexible";

const opts = {
	keyPrefix: "rlDefault",
	storeClient: sequelize,
	points: 10, // Number of available points
	duration: 60, // Per minute
	tableName: "ratelimit",
	tableCreated: true,
	clearExpiredByTimeout: true,
};

const rateLimiterDefault = new RateLimiterPostgres(opts);

const rateLimiterMiddleware = (req: any, res: any, next: any) => {
	rateLimiterDefault
		.consume(req.user.mail, 1)
		.then((RLResponse) => {
			return next();
		})
		.catch((RLResponse) => {
			if (RLResponse instanceof Error) {
				console.error(RLResponse.message, RLResponse.stack);
				return res.render("error", {
					title: "500 Error",
					message: "500",
					subtitle: "Internal Server Error",
					description:
						"Sorry to see you here, please report us what happend so that we can help you",
				});
			} else {
				const seconds = (
					parseFloat(RLResponse.toJSON().msBeforeNext) / 1000
				).toFixed(0);
				return res.render("error", {
					title: "429 Error",
					message: "429",
					subtitle: "Too Many Requests",
					description: `Please wait ${seconds} seconds before trying again`,
				});
			}
		});
};

export default rateLimiterMiddleware;
