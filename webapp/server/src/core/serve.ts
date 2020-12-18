import { Router } from "express";
import util from "util";
import { exec } from "child_process";
import fs from "fs";
import { Stats } from "../db";

const router = Router();
const exec_prom = util.promisify(exec);

const isAvailable = (type: string) => {
	//TODO: Make this dynamic
	return type == "hw5";
};

router.get("/:type", (req, res) => {
	res.render("index", {
		title: "BUS File Service",
		message: `Hi ${req.user.displayName}, your file is currently being prepared. Please wait...`,
		serve: true,
	});
});

router.get("/", (req, res) => {
	//TODO: Change fallback behavior
	res.render("index", {
		title: "BUS File Service",
		message: `Hi ${req.user.displayName}, your file is currently being prepared. Please wait...`,
		serve: true,
	});
});

router.get("/download/:type", async (req, res) => {
	//TODO: Change fallback behavior
	const type = "hw5";
	await Stats.create({
		ip: req.ip,
		userAgent: req.headers["user-agent"],
		type: req.params.type || "N/A",
		origin: "GET",
	});
	if (isAvailable(type)) {
		exec_prom(`python3 ../worker/app.py ${type} ${req.user.sid || ""}`)
			.then(() => {
				res.download(
					`../data/out/${req.user.sid}_${type}.xlsm`,
					`${req.user.sid}_${type}.xlsm`,
					(error) => {
						if (error) throw error;
						fs.unlinkSync(
							`../data/out/${req.user.sid}_${type}.xlsm`
						);
					}
				);
			})
			.catch((error) => {
				throw error;
			});
	} else {
		return res.render("index", {
			title: "BUS File Service",
			message: "This homework is not available yet.",
			serve: false,
		});
	}
});

export default router;
export { isAvailable };
