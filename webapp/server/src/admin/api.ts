/**
 * @author Deniz Ugur <deniz343@gmail.com>
 */
import { Router } from "express";
import FileUpload from "express-fileupload";
import xlsx from "xlsx";
import { nanoid } from "nanoid";
import sequelize, { FileAccess, User } from "../db";
import { promises as fs } from "fs";
import { aws_delete, aws_download, aws_upload } from "../core/aws";

const router = Router();
router.use(FileUpload());

type Cell = {
	state: "added" | "deleted" | "modified" | null;
	email: string;
	sid: string;
	level: number | undefined;
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
		return desired_cell ? desired_cell.v : undefined;
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
		};
		if (isTA) columns.level = null;

		for (let i = 1; ; i++) {
			let column = cell(i, 1);
			if (column == undefined) break;
			if (Object.keys(columns).includes(column)) columns[column] = i;
		}

		if (Object.values(columns).some((el) => el == undefined))
			return res.status(400).send("Column names were not correct.");

		//* Extract the data
		let data: Cell[] = [];
		for (let i = 2; cell(1, i) != undefined; i++) {
			let user: Cell = {
				email: cell(columns.email, i),
				sid: cell(columns.student_id, i),
				state: null,
				level: undefined,
			};
			if (isTA) user.level = cell(columns.level, i);
			data.push(user);
		}

		//* Determine state
		//* Look at added or modified
		let prev = await User.findAll();
		data = data.map((user: Cell) => {
			let present = prev.find((e: any) => {
				if (e.dataValues.email == user.email) {
					user.state =
						(isTA && e.dataValues.level != user.level) ||
						e.dataValues.sid != user.sid
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
			if (!present)
				data.push({
					email: user.dataValues.email,
					sid: user.dataValues.sid,
					level: user.dataValues.level,
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
								level: user.level,
								sid: user.sid,
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

router.post("/file/flush", async (req, res) => {
	try {
		await flushFiles();
		return res.sendStatus(200);
	} catch (error) {
		console.error(error);
		return res.status(500).send(error);
	}
});

router.post("/file/:fileid", async (req, res) => {
	if (!req.files?.macroenabled || !req.files?.macrofree)
		return res.status(400).send("Not enough files has been supplied.");
	const fileID = req.params.fileid;

	//* Get current state of the file
	const file: any = await FileAccess.findByPk(fileID);
	if (!file) return res.status(404).send("This file was not found.");
	const initialState = file.enabled;

	//* Temporarily disable access
	if (initialState) await file.update({ enabled: false });

	//* Generate keys
	const keys = {
		macrofree: {
			aws: `${fileID}/${nanoid()}_free`,
			actual: `${fileID}_template.xlsx`,
		},
		macroenabled: {
			aws: `${fileID}/${nanoid()}_macro`,
			actual: `${fileID}_template.xlsm`,
		},
	};

	const rollback = async (error: any, restore = true) => {
		console.error(error);
		try {
			await fs.rm(`/tmp/${fileID}`, { recursive: true });
		} catch (error) {}
		await aws_delete(keys.macrofree.aws);
		await aws_delete(keys.macroenabled.aws);
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
	let freeFile: any, enabledFile: any;
	// Macro Free
	freeFile = req.files.macrofree;
	response = await aws_upload({
		key: keys.macrofree.aws,
		body: freeFile.data,
	});
	if (response.error) return await rollback(response.error);

	// Macro Enabled
	enabledFile = req.files.macroenabled;
	response = await aws_upload({
		key: keys.macroenabled.aws,
		body: enabledFile.data,
	});
	if (response.error) return await rollback(response.error);

	//* Save files to a temporary destination
	try {
		await fs.rm(`/tmp/${fileID}`, { recursive: true });
		await fs.mkdir(`/tmp/${fileID}`);
		await fs.writeFile(`/tmp/${keys.macrofree.aws}`, freeFile.data);
		await fs.writeFile(`/tmp/${keys.macroenabled.aws}`, enabledFile.data);
	} catch (error) {
		return await rollback(error);
	}

	//* Swap with current files
	try {
		await fs.copyFile(
			`/tmp/${keys.macrofree.aws}`,
			`../data/templates/${keys.macrofree.actual}`
		);
		await fs.copyFile(
			`/tmp/${keys.macroenabled.aws}`,
			`../data/templates/${keys.macroenabled.actual}`
		);
	} catch (error) {
		return await rollback(error, false);
	}

	//* Update keys on database and restore initial state
	await file.update({ files: keys, enabled: initialState });

	return res.sendStatus(200);
});

const flushFiles = () => {
	return new Promise(async (resolve, reject) => {
		await sequelize.transaction(async (transaction) => {
			//* Disable access to files
			const files = await FileAccess.findAll({ transaction });
			if (files?.length == 0) return reject("No files on database");

			let prev: any = {};
			for (const file of files) {
				prev[file.getDataValue("name")] = file.getDataValue("enabled");
				await file.update({ enabled: false }, { transaction });
			}

			//* Clean current files (if present)
			try {
				await fs.rm(`../data/templates`, { recursive: true });
			} catch (error) {}
			await fs.mkdir(`../data/templates`, { recursive: true });

			//* Download files from AWS
			try {
				for (const file of files) {
					let keys = file.getDataValue("files");
					let response: any = await aws_download(keys.macrofree.aws);

					if (response.error) throw new Error(response.error);
					await fs.writeFile(
						`../data/templates/${keys.macrofree.actual}`,
						response.file
					);

					response = await aws_download(keys.macroenabled.aws);

					if (response.error) throw new Error(response.error);
					await fs.writeFile(
						`../data/templates/${keys.macroenabled.actual}`,
						response.file
					);
				}
			} catch (error) {
				reject(error);
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
