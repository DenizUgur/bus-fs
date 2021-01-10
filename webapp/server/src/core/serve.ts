import { Router } from "express";
import util from "util";
import { exec } from "child_process";
import fs from "fs";
import { FileAccess, Stats, User, UserAccess } from "../db";
import axios from "axios";
import moment from "moment";

const router = Router();
const exec_prom = util.promisify(exec);

const isAvailable = async (type: string, level: number) => {
	try {
		const file: any = await FileAccess.findByPk(type);
		if (!file) return false;

		if (file.level > level) return false;

		return file;
	} catch (error) {
		console.error(error);
		return false;
	}
};

const getIndividualPassword = (id: string) => {
	let password: any =
		(parseInt(id.split("S")[1]) * 48123) % (Math.pow(2, 31) - 1);
	password = password.toString();
	password = parseInt(password.substr(password.length - 5));
	return password;
};

router.get("/", async (req, res) => {
	const type = req.session.type || process.env.FALLBACK_TYPE;
	let file: any = await isAvailable(type, req.user.level);

	if (!file.enabled)
		return res.render("index", {
			message: "This assignment is not available yet.",
			serve: false,
		});

	if (file.vba_password) {
		return res.render("index", {
			message: `Hi ${
				req.user.displayName
			}, your file is currently being prepared. Please wait...<br><span>Password: ${getIndividualPassword(
				req.user.sid
			)}</span>`,
			serve: true,
		});
	}
	return res.render("index", {
		message: `Hi ${req.user.displayName}, your file is currently being prepared. Please wait...`,
		serve: true,
	});
});

router.get("/download", async (req, res) => {
	const type = req.session.type || process.env.FALLBACK_TYPE;
	await Stats.create({
		ip: req.ip,
		userAgent: req.headers["user-agent"],
		type: req.session.type || "N/A",
	});

	let file: any = await isAvailable(type, req.user.level);

	if (!file.enabled)
		return res.render("index", {
			message: "This assignment is not available yet.",
			serve: false,
		});

	//* Check user access
	const user: any = await User.findOne({
		where: {
			email: req.user.email,
		},
		include: [UserAccess],
	});

	if (!user) {
		throw new Error("Sanity Check: User not found!");
	}

	let access = user.user_accesses?.find(
		(el: any) => el.dataValues.type === type
	);

	if (access?.accessed && file.onetime) {
		return res.render("index", {
			message: `You are not allowed to download more than once.<br><span>Password: ${getIndividualPassword(
				req.user.sid
			)}</span>`,
		});
	}

	//* Define Cutoff Date
	const url = `https://ipapi.co/8.8.8.8/json`;
	let cutoff = moment().add(24, "hour").unix();
	try {
		const offset = await axios.get(url);
		if (offset.status == 200 && !offset.data.error) {
			cutoff = moment()
				.utcOffset(offset.data.utc_offset)
				.add(4, "hour")
				.unix();
		}
	} catch (err) {}

	//* Decide preferences
	const encrypt = file.encrypt && !(access && !access.encrypt);
	const extension = access?.macrofree ? "xlsx" : "xlsm";

	exec_prom(
		`python3 ../worker/app.py ${[
			type,
			req.user.sid,
			extension,
			cutoff,
			encrypt ? 1 : 0,
			file.password,
		].join(" ")}`
	)
		.then(() => {
			const sourceFile = `../data/out/${req.user.sid}_${type}${
				encrypt ? "_enc" : ""
			}.${extension}`;
			res.download(
				sourceFile,
				`${req.user.sid}_${type}.${extension}`,
				async (error) => {
					if (error) throw error;

					const downloadCount = (access?.downloadCount || 0) + 1;

					await UserAccess.upsert({
						accessed: true,
						type: type,
						userOid: user.dataValues.oid,
						downloadCount,
					});
					fs.unlinkSync(sourceFile);
				}
			);
		})
		.catch((error) => {
			throw error;
		});
});

export default router;
export { isAvailable, getIndividualPassword };
