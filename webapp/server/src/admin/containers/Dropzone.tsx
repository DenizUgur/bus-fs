/**
 * @author Deniz Ugur <deniz343@gmail.com>
 */
import React, { useMemo, useState, useEffect } from "react";
import { useNotice } from "admin-bro";
import { useDropzone } from "react-dropzone";
import { File } from "../components/styles";
import { DropZoneParent } from "../components/styles";

const baseStyle = {
	flex: 1,
	display: "flex",
	justifyContent: "center",
	flexDirection: "column" as const,
	alignItems: "center",
	padding: "20px",
	borderWidth: 2,
	borderRadius: 2,
	borderColor: "#444E58",
	borderStyle: "dashed",
	color: "#444E58",
	outline: "none",
	transition: "border .24s ease-in-out",
};

const activeStyle = {
	borderColor: "#2196f3",
};

const acceptStyle = {
	borderColor: "#00e676",
};

const rejectStyle = {
	borderColor: "#ff1744",
};

export const FileDropzone = (props: any) => {
	const { title, message, callback, macro, children } = props;
	return (
		<DropZoneParent>
			<h1>{title}</h1>
			<p
				style={{
					textAlign: "center",
					padding: "16px 0",
				}}
			>
				{message}
			</p>
			<StyledDropzone fileCallback={callback} macro={macro} />
			{children}
		</DropZoneParent>
	);
};

export const StyledDropzone = (props: any) => {
	const { fileCallback, macro } = props;
	const sendNotice = useNotice();
	const [file, setFile] = useState<any[]>([]);

	const handleDrop = (file: any) => {
		if (
			(macro && file[0].name.includes(".xlsm")) ||
			(!macro && file[0].name.includes(".xlsx"))
		) {
			setFile(file);
		} else {
			sendNotice({ message: "Wrong file extension.", type: "error" });
		}
	};

	const {
		getRootProps,
		getInputProps,
		isDragActive,
		isDragAccept,
		isDragReject,
	} = useDropzone({
		onDrop: (file) => handleDrop(file),
	});

	const style = useMemo(
		() => ({
			...baseStyle,
			...(isDragActive ? activeStyle : {}),
			...(isDragAccept ? acceptStyle : {}),
			...(isDragReject ? rejectStyle : {}),
		}),
		[isDragActive, isDragReject, isDragAccept]
	);

	useEffect(() => {
		fileCallback(file.length > 0 ? file[0] : undefined);
		return () => {};
	}, [file]);

	return (
		<div {...getRootProps({ style })}>
			<input {...getInputProps()} />
			{file.length > 0 ? (
				<File>
					<img src="/assets/img/excel.svg" />
					<span>{file[0].name}</span>
				</File>
			) : (
				<p>Drag 'n' drop some file here, or click to select file</p>
			)}
		</div>
	);
};
