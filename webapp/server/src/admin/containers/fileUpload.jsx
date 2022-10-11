/**
 * @author Deniz Ugur <deniz343@gmail.com>
 */
import React, { useState, useRef } from "react";
import { FileDropzone } from "./Dropzone";
import { useNotice } from "adminjs";
import {
	SubmitButton,
	SubmitContainer,
	DropArea,
	Parent,
} from "../components/styles";
import Overlay from "../components/Overlay";

export default function fileUpload(props) {
	const fileID = props.record.id;
	const sendNotice = useNotice();
	const submitRef = useRef(null);
	const [loading, setLoading] = useState(false);
	const [state, setState] = useState({
		macro_free: undefined,
		macro_enabled: undefined,
		valid: false,
	});

	const fileHandler = (origin, file) => {
		let newState = Object.assign({}, state);
		newState[origin] = file;
		newState.valid = newState.macro_free != undefined;
		setState(newState);
	};

	const apiHandle = () => {
		setLoading(true);
		submitRef.current.disabled = true;

		let form = new FormData();
		form.append("macrofree", state.macro_free);
		form.append("macroenabled", state.macro_enabled);
		fetch(`/api/file/${fileID}`, {
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
					message: "Files has been submitted to the server",
				});
			}

			setLoading(false);
			submitRef.current.disabled = false;
		});
	};

	return (
		<Overlay text="Uploading Files... Please wait!" enable={loading}>
			<Parent>
				<DropArea>
					<FileDropzone
						title="Macro-enabled File (Optional)"
						macro={true}
						callback={(file) => fileHandler("macro_enabled", file)}
					/>
					<FileDropzone
						title="Macro-free File"
						macro={false}
						callback={(file) => fileHandler("macro_free", file)}
					/>
				</DropArea>
				<SubmitContainer>
					<SubmitButton
						disabled={!state.valid}
						onClick={apiHandle}
						ref={submitRef}
					>
						Upload
					</SubmitButton>
				</SubmitContainer>
			</Parent>
		</Overlay>
	);
}
