import {
	Box,
	Button,
	Card,
	Checkbox,
	Container,
	Paper,
	TextField,
} from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import React, { useEffect, useState } from "react";
import qs from "querystring";
import "./App.css";

const dev = process.env.NODE_ENV !== "production";
const host = dev ? "http://localhost:5000" : "https://bus-fs.herokuapp.com";

function App() {
	//* States
	const [meta, setMeta] = useState<any>();
	const [student, setStudent] = useState<any>();
	const [access, setAccess] = useState(true);
	const [MacroFree, setMacroFree] = useState(false);

	//* Initialization
	useEffect(() => {
		fetch(host + "/manage/meta/all", {
			method: "POST",
		})
			.then((res) => res.json())
			.then((data) => {
				setMeta(data);
			});
		return () => {};
	}, []);

	useEffect(() => {
		if (student && !student.loaded) {
			fetch(host + "/manage/meta/student", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: qs.stringify({ email: student.email }),
			}).then(async (data) => {
				if (data.status === 200) {
					const json = await data.json();
					let password: any =
						(parseInt(json.sid.split("S")[1]) * 48271) %
						(Math.pow(2, 31) - 1);
					password = password.toString();
					password = parseInt(password.substr(password.length - 5));
					json.password = password;
					setStudent({
						loaded: true,
						...json,
					});
					if (json.accesses.length > 0) {
						setAccess(true);
						let state = false;
						json.accesses.forEach((el: any) => {
							if (el.macrofree) state = true;
						});
						setMacroFree(state);
					}
				}
			});
		}
		return () => {};
	}, [student]);

	//* Handlers
	const handleAccess = (event: any) => {
		setAccess(false);
		fetch(host + "/manage/modify/access", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: qs.stringify({
				oid: student.oid,
				access: false,
				macrofree: MacroFree,
			}),
		}).then(async (data) => {
			if (data.status === 200) {
				alert("Done");
			} else {
				alert("Error occured");
			}
		});
	};

	const handleMacroFree = (event: any) => {
		setMacroFree(event.target.checked);
		setAccess(false);
		fetch(host + "/manage/modify/access", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: qs.stringify({
				oid: student.oid,
				access: false,
				macrofree: event.target.checked,
			}),
		}).then(async (data) => {
			if (data.status === 200) {
				alert("Done");
			} else {
				alert("Error occured");
			}
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
								<h2>Access Control</h2>
								{student.accesses.length !== 0 && access ? (
									<Button onClick={handleAccess}>
										Submit
									</Button>
								) : (
									<p>
										Student haven't accessed the system yet
									</p>
								)}
							</Card>
							<Card>
								<h2>MacroFree</h2>
								<Checkbox
									onChange={handleMacroFree}
									checked={MacroFree}
								/>
							</Card>
						</Box>
					)}
				</Paper>
			</Container>
		</div>
	);
}

export default App;
