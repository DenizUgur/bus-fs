/**
 * @author Deniz Ugur <deniz343@gmail.com>
 */
import AWS from "aws-sdk";

if (
	process.env.AWS_ACCESS_KEY_ID == undefined ||
	process.env.AWS_SECRET_ACCESS_KEY == undefined ||
	process.env.S3_BUCKET_NAME == undefined
)
	throw new Error("AWS credentials are not complete");

AWS.config.update({ region: "eu-central-1" });

const s3 = new AWS.S3();

type File = {
	key: string;
	body: Buffer;
};

const _delete = (params: any) => {
	return new Promise((resolve, reject) => {
		s3.deleteObject(params, (err: any, data: any) => {
			if (err || !data) reject(err);
			resolve(data);
		});
	});
};

const aws_delete = async (key: string) => {
	let delete_params = {
		Bucket: process.env.S3_BUCKET_NAME,
		Key: key,
	};

	try {
		await _delete(delete_params);
		return { Key: delete_params.Key };
	} catch (error) {
		return { error };
	}
};

const _upload = (params: any) => {
	return new Promise((resolve, reject) => {
		s3.upload(params, (err: any, data: any) => {
			if (err || !data) reject(err);
			resolve(data);
		});
	});
};

const aws_upload = async (file: File) => {
	let upload_params = {
		Bucket: process.env.S3_BUCKET_NAME,
		Key: file.key,
	};

	try {
		await _upload({ ...upload_params, Body: file.body });
		return { Key: upload_params.Key };
	} catch (error) {
		return { error };
	}
};

const _download = (params: any) => {
	return new Promise((resolve, reject) => {
		s3.getObject(params, (error, data: any) => {
			if (error) reject(error);
			resolve(data.Body);
		});
	});
};

const aws_download = async (key: string) => {
	let download_params = {
		Bucket: process.env.S3_BUCKET_NAME,
		Key: key,
	};

	try {
		const response = await _download(download_params);
		return { file: response };
	} catch (error) {
		return { error };
	}
};

export { aws_delete, aws_upload, aws_download };
