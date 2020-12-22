import express, { Router } from "express";
import util from "util";
import { exec } from "child_process";
import path from "path";
import { FileAccess, User, UserAccess } from "../db";

const router = Router();

const list = require("../../../data/users/students.json");
const listTA = require("../../../data/users/TAs.json");
const uiRoot = path.join(__dirname, "../../../ui/build/");

router.use(express.json());

router.get("/", (req, res) => {
	return res.sendFile(path.join(uiRoot, "index.html"));
});

router.get("/compile", async (req, res) => {
	//! CAUTION: ONLY FOR A WORKAROUND
	//TODO: Remove this endpoint
	const dummy = Promise.resolve("Loaded");
	return dummy
		.then(() => {
			res.send("Bombs fired");
		})
		.then(() => {
			console.log("Compiling");
			try {
				const exec_prom = util.promisify(exec);
				exec_prom(
					"cd /opt/encryptor/msoffice && make -j RELEASE=1"
				).then(() => {
					console.log("Done compiling");
				});
			} catch (error) {
				console.log(error);
			}
		});
});

router.post("/modify/:type", async (req, res) => {
	try {
		if (req.params.type === "file") {
			await FileAccess.upsert(req.body);
		} else if (req.params.type === "access") {
			req.body.accesses.forEach(async (access: any) => {
				await UserAccess.upsert(access);
			});
		} else throw new Error();
		return res.sendStatus(200);
	} catch (error) {
		return res.sendStatus(500);
	}
});

router.post("/meta/:type", async (req, res) => {
	if (req.params.type === "student") {
		const user: any = await User.findOne({
			where: {
				email: req.body.email,
			},
			include: [UserAccess],
		});

		let password: any =
			(parseInt(user.sid.split("S")[1]) * 48271) % (Math.pow(2, 31) - 1);
		password = password.toString();
		password = parseInt(password.substr(password.length - 5));

		if (user) {
			return res.json({
				oid: user.oid,
				sid: user.sid,
				email: user.email,
				displayName: user.displayName,
				level: user.level,
				accesses: user.user_accesses,
				password: password,
			});
		}
		return res.status(500).end();
	} else {
		const files = await FileAccess.findAll();
		return res.json({
			list: list.concat(listTA),
			files,
		});
	}
});

export default router;
