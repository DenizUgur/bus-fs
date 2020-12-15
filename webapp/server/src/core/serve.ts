import { Router } from "express";
import util from "util";
import { exec } from "child_process";
import fs from "fs";
import { Stats } from "../db";

const router = Router();
const exec_prom = util.promisify(exec);

router.get("/", (req, res) => {
	res.render("index", {
		title: "BUS File Service",
		message: `Hi ${req.user.displayName}, your file is currently being prepared. Please wait...`,
		serve: true,
	});
});

router.post("/test", async (req, res) => {
	await Stats.create({
		ip: req.ip,
		userAgent: req.headers["user-agent"],
		type: req.session.type || "N/A",
		origin: "POST",
	});
	res.status(200).end();
});

router.get("/download", async (req, res) => {
	//TODO: Change fallback behavior
	const type = req.session.type || "hw5";
	await Stats.create({
		ip: req.ip,
		userAgent: req.headers["user-agent"],
		type: req.session.type || "N/A",
		origin: "GET",
	});
	exec_prom(`python3 ../worker/app.py ${type} ${req.user.sid || ""}`)
		.then(() => {
			res.download(
				`../data/out/${req.user.sid}_${type}.xlsm`,
				`${req.user.sid}_${type}.xlsm`,
				(error) => {
					if (error) throw error;
					fs.unlinkSync(`../data/out/${req.user.sid}_${type}.xlsm`);
				}
			);
		})
		.catch((error) => {
			throw error;
		});
});

export default router;
