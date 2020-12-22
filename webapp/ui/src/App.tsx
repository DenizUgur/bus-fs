import {
	Box,
	Checkbox,
	Container,
	FormControl,
	FormControlLabel,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Snackbar,
	TextField,
} from "@material-ui/core";
import { Alert, Autocomplete } from "@material-ui/lab";
import React, { useEffect, useState } from "react";
import "./App.css";
import { DebouncedTextField } from "./DebouncedTextField";

const dev = process.env.NODE_ENV !== "production";
const host = dev ? "http://localhost:5000" : "https://bus-fs.herokuapp.com";

function App() {
	//* States
	const [meta, setMeta] = useState<any>();
	const [student, setStudent] = useState<any>();
	const [type, setType] = useState<any>("None");
	const [snackbar, setSnackbar] = useState<any>({
		message: "",
		open: false,
		severity: "success",
	});

	//* Initialization
	useEffect(() => {
		fetch(host + "/manage/meta/all", {
			method: "POST",
		})
			.then((res) => res.json())
			.then((data) => {
				setMeta(data);
				setSnackbar({
					message: "Student metadata received",
					open: true,
					severity: "success",
				});
			});
		return () => {};
	}, []);

	useEffect(() => {
		if (student && !student.loaded) {
			fetch(host + "/manage/meta/student", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email: student.email }),
			}).then(async (data) => {
				if (data.status === 200) {
					const json = await data.json();
					setStudent({
						loaded: true,
						...json,
					});
					setSnackbar({
						message: `${json.displayName} data gathered`,
						open: true,
						severity: "success",
					});
				} else {
					setSnackbar({
						message: `Student data couldn't be gathered`,
						open: true,
						severity: "error",
					});
				}
			});
		}
		return () => {};
	}, [student]);

	//* Handlers
	const getMeta = () => meta.files.find((e: any) => e.name === type) || {};
	const modifyMeta = (options: any) => {
		let newMeta = Object.assign({}, meta);
		const index = newMeta.files.findIndex((e: any) => e.name === type);
		let newFile = (newMeta.files[index] = {
			...newMeta.files[index],
			...options,
		});
		setMeta(newMeta);

		fetch(host + "/manage/modify/file", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(newFile),
		}).then((data) => {
			if (data.status === 200) {
				setSnackbar({
					message: `${newFile.name.toUpperCase()}'s details has been changed`,
					open: true,
					severity: "success",
				});
			} else {
				setSnackbar({
					message: `${newFile.name.toUpperCase()}'s details couldn't be changed`,
					open: true,
					severity: "error",
				});
			}
		});
	};

	const getAccess = () =>
		student.accesses.find((e: any) => e.type === type) || {};
	const modifyAccess = (options: any) => {
		let newAccesses = Object.assign([], student.accesses);
		const index = newAccesses.findIndex((e: any) => e.type === type);
		if (index === -1) {
			newAccesses.push({
				userOid: student.oid,
				type: type,
				...options,
			});
		} else {
			newAccesses[index] = {
				...newAccesses[index],
				...options,
			};
		}

		let newStudent = {
			...student,
			accesses: [...newAccesses],
		};
		setStudent(newStudent);

		fetch(host + "/manage/modify/access", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(newStudent),
		}).then(async (data) => {
			if (data.status === 200) {
				setSnackbar({
					message: `${student.displayName}'s file access data has been changed`,
					open: true,
					severity: "success",
				});
			} else {
				setSnackbar({
					message: `${student.displayName}'s file access data couldn't be changed`,
					open: true,
					severity: "error",
				});
			}
		});
	};

	//* Snackbar
	const handleClose = () => {
		setSnackbar({
			...snackbar,
			open: false,
		});
	};

	//* Render
	return (
		<div className="App">
			<Container>
				<Paper className="Stage">
					{student && student.loaded ? (
						<Box className="StudentInfo">
							<h1>{student.displayName}</h1>
							<p>Password: {student.password}</p>
						</Box>
					) : (
						<h2>
							Start typing the student's information to get
							started
						</h2>
					)}
					{meta && (
						<Autocomplete
							options={meta.list}
							getOptionLabel={(option: any) =>
								option.sid + " - " + option.email
							}
							className="SearchBox"
							renderInput={(params) => (
								<TextField
									{...params}
									label="Student ID or E-Mail"
									variant="outlined"
								/>
							)}
							renderOption={(option) => (
								<>
									{option.sid}
									<br />
									{option.email}
								</>
							)}
							onChange={(event, option) => {
								setStudent(option);
							}}
						/>
					)}
					{student && student.loaded && (
						<Box className="Controls">
							<Paper className="ControlPaper">
								<h2>File Control</h2>
								<FormControl>
									<InputLabel htmlFor="select-type">
										File type
									</InputLabel>
									<Select
										value={type}
										onChange={(e) =>
											setType(e.target.value)
										}
									>
										<MenuItem value="None">None</MenuItem>
										{meta.files.map((file: any) => {
											return (
												<MenuItem
													value={file.name}
													key={file.name}
												>
													{file.name.toUpperCase()}
												</MenuItem>
											);
										})}
									</Select>
									{type && type !== "None" && (
										<>
											<FormControlLabel
												control={
													<Checkbox
														onChange={(e) =>
															modifyMeta({
																enabled:
																	e.target
																		.checked,
															})
														}
														checked={
															getMeta().enabled ||
															false
														}
													/>
												}
												label={`File is ${
													getMeta().enabled
														? "enabled"
														: "disabled"
												}`}
											/>
											<FormControlLabel
												control={
													<Checkbox
														onChange={(e) =>
															modifyMeta({
																onetime:
																	e.target
																		.checked,
															})
														}
														checked={
															getMeta().onetime ||
															false
														}
													/>
												}
												label={`File can be downloaded ${
													getMeta().onetime
														? "only one time"
														: "without a limit"
												}`}
											/>
											<FormControlLabel
												control={
													<Checkbox
														onChange={(e) =>
															modifyMeta({
																encrypt:
																	e.target
																		.checked,
															})
														}
														checked={
															getMeta().encrypt ||
															false
														}
													/>
												}
												label={`File is ${
													getMeta().encrypt
														? "encrypted"
														: "not encrypted"
												}`}
											/>
											<div className="Inputs">
												<DebouncedTextField
													label="Access Level"
													value={getMeta().level || 0}
													onChange={(payload: any) =>
														modifyMeta({
															level: payload,
														})
													}
													helperText="Only students with the specified level and above will be able to access the file"
												/>
												{getMeta().encrypt && (
													<DebouncedTextField
														label="Password"
														value={
															getMeta()
																.password || ""
														}
														onChange={(
															payload: any
														) =>
															modifyMeta({
																password: payload,
															})
														}
														helperText="Password to open encrypted files"
													/>
												)}
											</div>
										</>
									)}
								</FormControl>
							</Paper>
							<Paper className="ControlPaper">
								<h2>User Access</h2>
								<FormControl>
									<InputLabel htmlFor="select-type">
										File type
									</InputLabel>
									<Select
										value={type}
										onChange={(e) =>
											setType(e.target.value)
										}
									>
										<MenuItem value="None">None</MenuItem>
										{meta.files.map((file: any) => {
											return (
												<MenuItem
													value={file.name}
													key={file.name}
												>
													{file.name.toUpperCase()}
												</MenuItem>
											);
										})}
									</Select>
									{type && type !== "None" && (
										<>
											<FormControlLabel
												control={
													<Checkbox
														onChange={(e) =>
															modifyAccess({
																accessed:
																	e.target
																		.checked,
															})
														}
														checked={
															getAccess()
																.accessed ||
															false
														}
													/>
												}
												label={`User has ${
													getAccess().accessed
														? "accessed"
														: "not accessed"
												} the file`}
											/>
											<FormControlLabel
												control={
													<Checkbox
														onChange={(e) =>
															modifyAccess({
																macrofree:
																	e.target
																		.checked,
															})
														}
														checked={
															getAccess()
																.macrofree ||
															false
														}
													/>
												}
												label={`User's file will be ${
													getAccess().macrofree
														? "MacroFree"
														: "Macro-enabled"
												}`}
											/>
											<FormControlLabel
												control={
													<Checkbox
														onChange={(e) =>
															modifyAccess({
																encrypt:
																	e.target
																		.checked,
															})
														}
														checked={
															getAccess()
																.encrypt ||
															false
														}
													/>
												}
												label={`User's file will ${
													getAccess().encrypt
														? ""
														: "not"
												} obey encryption protocol`}
											/>
										</>
									)}
								</FormControl>
							</Paper>
						</Box>
					)}
				</Paper>
			</Container>
			<Snackbar
				open={snackbar.open}
				autoHideDuration={4000}
				onClose={handleClose}
			>
				<Alert onClose={handleClose} severity={snackbar.severity}>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</div>
	);
}

export default App;
