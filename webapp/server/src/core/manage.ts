import { Router } from "express";
import path from "path";
import { FileAccess, User, UserAccess } from "../db";

const router = Router();

const list = require("../../../data/users/students.json");
const listTA = require("../../../data/users/TAs.json");

const uiRoot = path.join(__dirname, "../../../ui/build/");

router.get("/", (req, res) => {
	return res.sendFile(path.join(uiRoot, "index.html"));
});

router.post("/modify/access", async (req, res) => {
	const user_accesses = await UserAccess.findAll({
		where: {
			userOid: req.body.oid,
		},
	});
	if (user_accesses) {
		user_accesses.forEach(async (access) => {
			await access.update({
				accessed: req.body.access === "true",
				macrofree: req.body.macrofree === "true",
			});
		});
		return res.status(200).end();
	}
	return res.status(500).end();
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
