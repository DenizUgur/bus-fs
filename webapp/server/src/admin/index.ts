/**
 * @author Deniz Ugur <deniz343@gmail.com>
 */
import express from "express";
import AdminBro, {
	ActionResponse,
	AdminBroOptions,
	After,
	NotFoundError,
	RecordJSON,
} from "admin-bro";
import AdminBroExpress from "@admin-bro/express";
import AdminBroSequelize from "@admin-bro/sequelize";
import { FileAccess, User, UserAccess } from "../db";
import { isAuthenticated, isSeniorTA } from "../core/auth";
import routerApi from "./api";

const isSuperUser = ({ currentAdmin }: any) => {
	return currentAdmin && currentAdmin.level == 300;
};

const canEditFile = ({ currentAdmin, record }: any) => {
	return (
		currentAdmin &&
		(isSuperUser({ currentAdmin }) ||
			currentAdmin.privileges.includes(record.params.name))
	);
};

const defaultActionProps = {
	list: {
		isAccessible: true,
	},
	search: {
		isAccessible: true,
	},
	show: {
		isAccessible: true,
	},
	edit: {
		isAccessible: isSuperUser,
	},
	new: {
		isAccessible: isSuperUser,
	},
	bulkDelete: {
		isAccessible: isSuperUser,
	},
	delete: {
		isAccessible: isSuperUser,
	},
};

const addUserAttributes: After<ActionResponse> = async (
	response,
	request,
	context
) => {
	const records: RecordJSON[] = response.records || [];
	response.records = records.map((record) => ({
		...record,
		params: {
			...record.params,
			sid: record.populated.userOid?.params.sid,
		},
	}));
	return response;
};

const options: AdminBroOptions = {
	resources: [
		{
			resource: User,
			options: {
				listProperties: ["displayName", "email", "level", "sid"],
				actions: {
					...defaultActionProps,
					updateStudents: {
						actionType: "resource",
						isAccessible: isSuperUser,
						component: AdminBro.bundle("./containers/bulkUser"),
					},
					updateAssistants: {
						actionType: "resource",
						isAccessible: isSuperUser,
						component: AdminBro.bundle("./containers/bulkUser"),
					},
				},
			},
		},
		{
			resource: UserAccess,
			options: {
				properties: {
					sid: {
						isVisible: {
							list: true,
						},
					},
					downloadCount: {
						isDisabled: true,
					},
				},
				actions: {
					...defaultActionProps,
					edit: {
						isAccessible: true,
					},
					list: {
						isAccessible: true,
						after: addUserAttributes,
					},
				},
			},
		},
		{
			resource: FileAccess,
			options: {
				listProperties: [
					"name",
					"enabled",
					"level",
					"encrypt",
					"onetime",
				],
				actions: {
					...defaultActionProps,
					edit: {
						isAccessible: canEditFile,
					},
					uploadFile: {
						actionType: "record",
						isAccessible: canEditFile,
						handler: async (
							request: any,
							response: any,
							data: any
						) => {
							if (!data.record) {
								throw new NotFoundError(
									[
										`Record of given id ("${request.params.recordId}") could not be found`,
									].join("\n"),
									"Action#handler"
								);
							}
							return {
								record: data.record.toJSON(data.currentAdmin),
							};
						},
						component: AdminBro.bundle("./containers/fileUpload"),
					},
				},
			},
		},
	],
	pages: {
		Documentation: {
			component: AdminBro.bundle("./containers/documentation"),
		},
	},
	rootPath: "/manage",
	branding: {
		companyName: "BUS 101",
	},
};

AdminBro.registerAdapter(AdminBroSequelize);
const adminBro = new AdminBro(options);
const adminRouter = AdminBroExpress.buildRouter(adminBro);

const prepareAdmin = (app: express.Application) => {
	app.use("/api", [isAuthenticated, isSeniorTA, routerApi]);
	app.use(adminBro.options.rootPath, [
		isAuthenticated,
		isSeniorTA,
		adminRouter,
	]);
};

export default prepareAdmin;
