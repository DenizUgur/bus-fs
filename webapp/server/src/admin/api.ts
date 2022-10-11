/**
 * @author Deniz Ugur <deniz343@gmail.com>
 */
import { Router } from "express";
import FileUpload from "express-fileupload";
import xlsx from "xlsx";
import sequelize, { FileAccess, User } from "../db";
import { promises as fs } from "fs";
import { aws_delete, aws_download, aws_upload } from "../core/aws";

const { nanoid } = require("nanoid");

const pkg = (<any>process).pkg ? true : false;
const dev = pkg ? false : process.env.NODE_ENV !== "production";

const router = Router();
router.use(FileUpload());

type Cell = {
	state: "added" | "deleted" | "modified" | null;
	email: string;
	sid: string;
	privileges: object;
	displayName: string | undefined;
	level: number | undefined;
};

type AWSFile = {
	[key: string]: {
		aws: string;
		actual: string;
		out: string;
		file?: FileUpload.UploadedFile;
	};
};

const _cell = (sheet: any) => {
	const numToAlpha = (num: number) => {
		var alpha = "";
		for (; num >= 0; num = num / 26 - 1) {
			alpha = String.fromCharCode((num % 26) + 0x41) + alpha;
		}
		return alpha;
	};
	return (column: number, row: number) => {
		var desired_cell = sheet[`${numToAlpha(column - 1)}${row}`];
		let desired_value = desired_cell ? desired_cell.v : undefined;
		if (desired_value) {
			if (typeof desired_value == "string")
				desired_value = desired_value.trim();
			return desired_value != "" ? desired_value : undefined;
		}
		return undefined;
	};
};

router.post("/user", async (req, res) => {
	try {
		if (!req.files?.file)
			return res.status(400).send("No file was supplied.");
		const isTA = req.query.ta === "true";
		const dry = req.query.dry === "true";

		let file: any = req.files.file;
		let workbook = xlsx.read(file.data);

		//* Get worksheet
		var first_sheet_name = workbook.SheetNames[0];
		var worksheet = workbook.Sheets[first_sheet_name];

		//* Find desired columns
		const cell = _cell(worksheet);
		let columns: any = {
			email: null,
			student_id: null,
			privileges: null,
		};
		if (isTA) {
			columns.displayName = null;
			columns.level = null;
		}

		for (let i = 1; ; i++) {
			let column = cell(i, 1);
			if (column == undefined) break;
			if (Object.keys(columns).includes(column)) columns[column] = i;
		}

		if (Object.values(columns).some((el) => el == undefined))
			return res.status(400).send("Column names were not correct.");

		//* Extract the data
		let data: Cell[] = [];
		for (let i = 2; cell(columns.email, i) != undefined; i++) {
			let user: Cell = {
				email: cell(columns.email, i),
				sid: cell(columns.student_id, i),
				privileges: cell(columns.privileges, i),
				state: null,
				displayName: undefined,
				level: undefined,
			};
			if (isTA) {
				user.displayName = cell(columns.displayName, i);
				user.level = cell(columns.level, i);
			}
			data.push(user);
		}

		//* Determine state
		//* Look at added or modified
		let prev = await User.findAll();
		data = data.map((user: Cell) => {
			let present = prev.find((e: any) => {
				if (e.dataValues.email == user.email) {
					user.state =
						(isTA &&
							(e.dataValues.level != user.level ||
								e.dataValues.displayName !=
									user.displayName)) ||
						e.dataValues.sid != user.sid ||
						e.dataValues.privileges != user.privileges
							? "modified"
							: null;
					return true;
				}
				return false;
			});
			if (!present) user.state = "added";
			return user;
		});

		//* Add deleted users
		prev.forEach((user: any) => {
			let present = data.find(
				(el: Cell) => user.dataValues.email == el.email
			);
			if (
				!present &&
				((isTA && user.dataValues.level > 0) ||
					(!isTA && user.dataValues.level == 0))
			)
				data.push({
					email: user.dataValues.email,
					sid: user.dataValues.sid,
					privileges: user.dataValues.privileges,
					level: user.dataValues.level,
					displayName: user.dataValues.displayName,
					state: "deleted",
				});
		});

		//* Submit the changes if "dry" isn't true
		if (dry) return res.json(data);

		await sequelize.transaction(async (transaction) => {
			for (const user of data) {
				let _user;
				switch (user.state) {
					case "added":
						await User.create(
							{
								oid: nanoid(),
								displayName: user.email,
								email: user.email,
								sid: user.sid,
								privileges: user.privileges,
								level: user.level,
								enrolled: false,
							},
							{ transaction }
						);
						break;
					case "modified":
						_user = await User.findOne({
							where: {
								email: user.email,
							},
							transaction,
						});
						if (!_user)
							throw new Error(
								`[UPDATE] Couldn't found ${user.email}`
							);
						await _user.update(
							{
								displayName: user.displayName,
								level: user.level,
								sid: user.sid,
								privileges: user.privileges,
							},
							{ transaction }
						);
						break;
					case "deleted":
						_user = await User.findOne({
							where: {
								email: user.email,
							},
							transaction,
						});
						if (!_user)
							throw new Error(
								`[DELETE] Couldn't found ${user.email}`
							);
						await _user.destroy({ transaction });
						break;
					default:
						break;
				}
			}
		});

		return res.json(data);
	} catch (error) {
		console.error(error);
		return res.status(500).send("Internal Error.");
	}
});

router.post("/file/:fileid", async (req, res) => {
	if (!req.files?.macrofree)
		return res
			.status(400)
			.send(
				"Not enough files has been supplied. Submit at least macro free file."
			);
	const fileID = req.params.fileid;

	//* Get current state of the file
	const file: any = await FileAccess.findByPk(fileID);
	if (!file) return res.status(404).send("This file was not found.");
	const initialState = file.enabled;

	//* Temporarily disable access
	if (initialState) await file.update({ enabled: false });

	//* Generate keys
	const files: AWSFile = {
		macrofree: {
			aws: `${fileID}/${nanoid()}_free`,
			actual: `${fileID}_template.xlsx`,
			out: `${fileID}_template_xlsx`,
			file: req.files.macrofree as FileUpload.UploadedFile,
		},
		...(req.files?.macroenabled && {
			macroenabled: {
				aws: `${fileID}/${nanoid()}_macro`,
				actual: `${fileID}_template.xlsm`,
				out: `${fileID}_template_xlsm`,
				file: req.files.macroenabled as FileUpload.UploadedFile,
			},
		}),
	};

	const rollback = async (error: any, restore = true) => {
		console.error(error);
		await fs.rm(`/tmp/${fileID}`, { recursive: true, force: true });
		for (const file of Object.values(files)) await aws_delete(file.aws);
		await file.update({ enabled: restore ? initialState : false });
		return res
			.status(500)
			.send(
				`Internal Error. ${
					restore ? "Recovered!" : "Possible Corruption!"
				}`
			);
	};

	//* Upload files
	let response;
	for (const file of Object.values(files)) {
		if (file?.file?.data == null) continue;
		response = await aws_upload({
			key: file.aws,
			body: file.file.data,
		});
		if (response.error) return await rollback(response.error);
	}

	//* Save files to a temporary destination
	try {
		await fs.rm(`/tmp/${fileID}`, { recursive: true, force: true });
		await fs.mkdir(`/tmp/${fileID}`);
		for (const file of Object.values(files)) {
			if (file?.file?.data == null) continue;
			await fs.writeFile(`/tmp/${file.aws}`, file.file.data);
		}
	} catch (error) {
		return await rollback(error);
	}

	//* Swap with current files
	try {
		for (const file of Object.values(files)) {
			await fs.rm(`./data/out/unzipped/${file.out}`, {
				recursive: true,
				force: true,
			});

			await fs.copyFile(
				`/tmp/${file.aws}`,
				`./data/templates/${file.actual}`
			);
		}
	} catch (error) {
		return await rollback(error, false);
	}

	//* Update keys on database and restore initial state
	let keys = Object.assign({}, files);
	delete keys.macrofree?.file;
	if (req.files?.macroenabled) delete keys.macroenabled?.file;
	await file.update({ files: keys, enabled: initialState });

	return res.sendStatus(200);
});

const flushFiles = () => {
	return new Promise(async (resolve, reject) => {
		await sequelize.transaction(async (transaction) => {
			//* Disable access to files
			const files = await FileAccess.findAll({ transaction });

			let prev: any = {};
			for (const file of files) {
				prev[file.getDataValue("name")] = file.getDataValue("enabled");
				await file.update({ enabled: false }, { transaction });
			}

			//* Clean current files (if present)
			await fs.rm(`./data/templates`, { recursive: true, force: true });
			await fs.mkdir(`./data/templates`, { recursive: true });

			//* Download files from AWS
			try {
				for (const file of files) {
					let keys: AWSFile = file.getDataValue("files");

					for (const key of Object.values(keys)) {
						let response: any = await aws_download(key.aws);
						if (response.error) throw new Error(response.error);
						await fs.writeFile(
							`./data/templates/${key.actual}`,
							response.file
						);
					}
				}
			} catch (error) {
				console.error(error);
				return reject(error);
			}

			for (const file of files) {
				await file.update(
					{ enabled: prev[file.getDataValue("name")] },
					{ transaction }
				);
			}
		});
		resolve(true);
	});
};

export default router;
export { Cell, flushFiles };
