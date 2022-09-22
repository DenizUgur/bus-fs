/**
 * @author Deniz Ugur <deniz343@gmail.com>
 */
import { Router } from "express";
import util from "util";
import { exec } from "child_process";
import fs from "fs";
import { FileAccess, User, UserAccess } from "../db";
import axios from "axios";
import moment from "moment";
import { Op } from "sequelize";

if (process.env.FALLBACK_TYPE == undefined)
	throw new Error("FALLBACK_TYPE is not available");

const pkg = (<any>process).pkg ? true : false;

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
		(parseInt(id.split("S")[1]) * 48565) % (Math.pow(2, 31) - 1);
	password = password.toString();
	password = password.substr(password.length - 5);
	return parseInt(password) + 1e5;
};

const shuffle = (array: string[]) => {
	var currentIndex = array.length,
		temporaryValue,
		randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
};

router.get("/", async (req, res) => {
	const type = req.session.type || process.env.FALLBACK_TYPE;
	let file: any = await isAvailable(type, req.user.level);

	if (!file.enabled)
		return res.render("index", {
			message: "This assignment is not available yet.",
			serve: false,
		});

	let ta_names: any = [];
	let valid_index = 0;
	if (req.user.level >= 150) {
		let tas = await User.findAll({
			where: {
				level: {
					[Op.gte]: 150,
				},
			},
			attributes: ["displayName"],
		});
		ta_names = tas.map((val) => val.getDataValue("displayName"));
		ta_names = shuffle(ta_names);
		valid_index = ta_names.indexOf(req.user.displayName);
	}

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
		ta: req.user.level >= 150,
		ta_names,
		valid_index,
	});
});

router.get("/download", async (req, res) => {
	const type = req.session.type || process.env.FALLBACK_TYPE;
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
		if (file.vba_password) {
			return res.render("index", {
				message: `You are not allowed to download more than once.<br><span>Password: ${getIndividualPassword(
					req.user.sid
				)}</span>`,
			});
		}
		return res.render("index", {
			message: "You are not allowed to download more than once.",
		});
	}

	//* Define Cutoff Date
	const url = `https://ipapi.co/${req.ip}/json`;
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
		`python3 ${pkg ? "./data/worker/app.py" : "../worker/app.py"} ${[
			type,
			req.user.sid,
			extension,
			cutoff,
			getIndividualPassword(req.user.sid),
			encrypt ? 1 : 0,
			file.password,
		].join(" ")}`
	)
		.then(() => {
			const sourceFile = `./data/out/${req.user.sid}_${type}${
				encrypt ? "_enc" : ""
			}.${extension}`;
			res.download(
				sourceFile,
				`${req.user.sid}_${type}.${extension}`,
				async (error) => {
					if (error) throw error;

					if (access) {
						await access.update({
							accessed: true,
							downloadCount: (access.downloadCount || 0) + 1,
						});
					} else {
						await UserAccess.create({
							accessed: true,
							type: type,
							userEmail: user.dataValues.email,
							downloadCount: 1,
						});
					}
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
