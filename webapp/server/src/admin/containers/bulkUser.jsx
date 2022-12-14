/**
 * @author Deniz Ugur <deniz343@gmail.com>
 */
import React, { useState, useRef } from "react";
import { FileDropzone } from "./Dropzone";
import {
	SubmitButton,
	SubmitContainer,
	DropArea,
	UpdateArea,
} from "../components/styles";
import UserTable from "../components/UserTable";
import { useNotice } from "adminjs";
import Overlay from "../components/Overlay";

export default function bulkUser(props) {
	const isTA = props.action.name === "updateAssistants";
	const [loading, setLoading] = useState(false);
	const [state, setState] = useState({
		response: false,
		file: null,
	});
	const sendNotice = useNotice();
	const verifyRef = useRef(null);
	const submitRef = useRef(null);

	const fileHandler = (file) => {
		let newState = Object.assign({}, state);
		newState.file = file;
		setState(newState);
	};

	const apiHandle = (dry) => {
		setLoading(true);
		verifyRef.current.disabled = true;
		submitRef.current.disabled = true;

		if (state.file) {
			let form = new FormData();
			form.append("file", state.file);
			fetch(`/api/user?ta=${isTA}&dry=${dry}`, {
				method: "POST",
				credentials: "same-origin",
				body: form,
			}).then(async (res) => {
				if (res.status !== 200) {
					const body = await res.text();
					sendNotice({
						message: `Error ${res.status}: ${body}`,
						type: "error",
					});
				} else {
					sendNotice({
						message: dry
							? "File is valid"
							: "File has been submitted to database",
					});
					if (dry) submitRef.current.disabled = false;

					let newState = Object.assign({}, state);
					newState.response = await res.json();

					setState(newState);
				}

				setLoading(false);
				verifyRef.current.disabled = false;
			});
		} else {
			sendNotice({
				message: "You must provide a file",
				type: "error",
			});
			verifyRef.current.disabled = false;
		}
	};

	return (
		<Overlay text="Processing the file... Please wait!" enable={loading}>
			<UpdateArea>
				<DropArea style={{ flex: 1 }}>
					<FileDropzone
						title={`${isTA ? "Assistant" : "Student"} List`}
						message={`The server will look at the first row for "email", "student_id", "privileges"${
							isTA ? `, "displayName", and "level"` : ""
						} columns. The cells below these will be used for data input.`}
						callback={(file) => fileHandler(file)}
					>
						<SubmitContainer>
							<SubmitButton
								onClick={() => apiHandle(true)}
								ref={verifyRef}
							>
								Verify
							</SubmitButton>
							<SubmitButton
								onClick={() => apiHandle(false)}
								disabled={!state.response}
								ref={submitRef}
							>
								Submit
							</SubmitButton>
						</SubmitContainer>
					</FileDropzone>
				</DropArea>
				{state.response && (
					<UserTable data={state.response}></UserTable>
				)}
			</UpdateArea>
		</Overlay>
	);
}
