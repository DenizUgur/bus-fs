import { Router } from "express";
import util from "util";
import { exec } from "child_process";
import fs from "fs";
import { FileAccess, Stats, User, UserAccess } from "../db";

const router = Router();
const exec_prom = util.promisify(exec);

const isAvailable = async (type: string, level: number, object: boolean) => {
	try {
		const file: any = await FileAccess.findByPk(type);
		if (!file) return false;

		if (file.level > level) return false;

		if (object) return file;
		return file.dataValues.enabled;
	} catch (error) {
		console.error(error);
		return false;
	}
};

router.get("/", (req, res) => {
	res.render("index", {
		message: `Hi ${req.user.displayName}, your file is currently being prepared. Please wait...`,
		serve: true,
	});
});

router.get("/download/:type", async (req, res) => {
	//TODO: Change fallback behavior
	const type = req.session.type || "hw5";
	await Stats.create({
		ip: req.ip,
		userAgent: req.headers["user-agent"],
		type: req.session.type || "N/A",
	});

	let file: any = await isAvailable(type, req.user.level, true);

	if (file.enabled) {
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
				message: "You are not allowed to download more than once.",
			});
		}

		if (access?.macrofree) {
			exec_prom(`python3 ../worker/app.py ${type} 1 ${req.user.sid}`)
				.then(() => {
					res.download(
						`../data/out/${req.user.sid}_${type}.xlsx`,
						`${req.user.sid}_${type}.xlsx`,
						async (error) => {
							if (error) throw error;

							await UserAccess.upsert({
								accessed: true,
								type: type,
								userOid: user.dataValues.oid,
							});
							fs.unlinkSync(
								`../data/out/${req.user.sid}_${type}.xlsx`
							);
						}
					);
				})
				.catch((error) => {
					throw error;
				});
		} else {
			exec_prom(`python3 ../worker/app.py ${type} 0 ${req.user.sid}`)
				.then(() => {
					res.download(
						`../data/out/${req.user.sid}_${type}.xlsm`,
						`${req.user.sid}_${type}.xlsm`,
						async (error) => {
							if (error) throw error;

							await UserAccess.upsert({
								accessed: true,
								type: type,
								userOid: user.dataValues.oid,
							});
							fs.unlinkSync(
								`../data/out/${req.user.sid}_${type}.xlsm`
							);
						}
					);
				})
				.catch((error) => {
					throw error;
				});
		}
	} else {
		return res.render("index", {
			message: "This homework is not available yet.",
			serve: false,
		});
	}
});

export default router;
export { isAvailable };
