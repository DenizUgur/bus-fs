import {
	Box,
	Card,
	Checkbox,
	Container,
	Paper,
	Snackbar,
	TextField,
} from "@material-ui/core";
import { Alert, Autocomplete } from "@material-ui/lab";
import React, { useEffect, useState } from "react";
import "./App.css";

const dev = process.env.NODE_ENV !== "production";
const host = dev ? "http://localhost:5000" : "https://bus-fs.herokuapp.com";

function App() {
	//* States
	const [meta, setMeta] = useState<any>();
	const [student, setStudent] = useState<any>();
	const [type, setType] = useState<any>("hw5");
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
		newAccesses[index] = {
			...newAccesses[index],
			...options,
		};
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
	//TODO: Finish UI
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
							id="combo-box-demo"
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
							renderOption={(option, { selected }) => (
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
							<Card>
								<h2>Enable File</h2>
								<Checkbox
									onChange={(e) =>
										modifyMeta({
											enabled: e.target.checked,
										})
									}
									checked={getMeta().enabled || false}
								/>
							</Card>
							<Card>
								<h2>Access Control</h2>
								<Checkbox
									onChange={(e) =>
										modifyAccess({
											accessed: e.target.checked,
										})
									}
									checked={getAccess().accessed || false}
								/>
							</Card>
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
