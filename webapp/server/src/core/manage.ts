import express, { Router } from "express";
import path from "path";
import { FileAccess, User, UserAccess } from "../db";
import { getIndividualPassword } from "./serve";

const router = Router();

const list = require("../../../data/users/students.json");
const listTA = require("../../../data/users/TAs.json");
const uiRoot = path.join(__dirname, "../../../ui/build/");

router.use(express.json());

router.get("/", (req, res) => {
	return res.sendFile(path.join(uiRoot, "index.html"));
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

		if (user) {
			return res.json({
				oid: user.oid,
				sid: user.sid,
				email: user.email,
				displayName: user.displayName,
				level: user.level,
				accesses: user.user_accesses,
				password: getIndividualPassword(user.sid),
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
