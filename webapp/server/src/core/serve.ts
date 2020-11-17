import { Router } from "express";
import util from "util";
import { exec } from "child_process";
import fs from "fs";

const router = Router();
const exec_prom = util.promisify(exec);

router.get("/", (req, res) => {
	//TODO: Change fallback behavior
	const type = req.session.type || "hw4";
	exec_prom(
		`python3 ../worker/app.py ${type} ${req.user.id || ""}`
	)
		.then(() => {
			res.download(
				`../data/out/${req.user.id}_${type}.xlsm`,
				`${req.user.id}_${type}.xlsm`,
				(err) => {
					if (err) {
						console.error(err);
						return res.render("error", {
							title: "500 Error",
							message: "500",
							subtitle: "Internal Server Error",
							description:
								"Sorry to see you here, please report us what happend so that we can help you",
						});
					}
					fs.unlinkSync(
						`../data/out/${req.user.id}_${type}.xlsm`
					);
				}
			);
		})
		.catch((error) => {
			console.error(error);
			return res.render("error", {
				title: "500 Error",
				message: "500",
				subtitle: "Internal Server Error",
				description:
					"Sorry to see you here, please report us what happend so that we can help you",
			});
		});
});

export default router;
