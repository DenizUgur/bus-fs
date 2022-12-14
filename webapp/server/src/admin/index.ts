/**
 * @author Deniz Ugur <deniz343@gmail.com>
 */
import express from "express";
import path from "path";
import AdminJS, { AdminJSOptions, NotFoundError } from "adminjs";
import AdminJSExpress from "@adminjs/express";
import AdminJSSequelize from "@adminjs/sequelize";
import { FileAccess, User, UserAccess } from "../db";
import { isAuthenticated, isSeniorTA } from "../core/auth";
import routerApi from "./api";

const isSuperUser = ({ currentAdmin }: any) => {
	return currentAdmin && currentAdmin.level >= 400;
};

const isManager = ({ currentAdmin }: any) => {
	return currentAdmin && currentAdmin.level >= 300;
};

const canEditFile = ({ currentAdmin, record }: any) => {
	return (
		currentAdmin &&
		(isManager({ currentAdmin }) ||
			currentAdmin.privileges?.editFiles?.includes(record.params.name))
	);
};

const newRecordHandler = (table: any) => {
	const _handle = async (request: any, response: any, context: any) => {
		const { resource, h, currentAdmin, translateMessage } = context;
		if (request.method === "post") {
			let record = await resource.build(
				request.payload ? request.payload : {}
			);

			// eslint-disable-next-line no-param-reassign
			context.record = record;

			if (record.isValid()) {
				await table.create(request.payload);
				return {
					redirectUrl: h.resourceUrl({
						resourceId: resource._decorated?.id() || resource.id(),
					}),
					notice: {
						message: translateMessage(
							"successfullyCreated",
							resource.id()
						),
						type: "success",
					},
					record: record.toJSON(currentAdmin),
				};
			}
			return {
				record: record.toJSON(currentAdmin),
				notice: {
					message: translateMessage(
						"thereWereValidationErrors",
						resource.id()
					),
					type: "error",
				},
			};
		}
		throw new Error(
			"new action can be invoked only via `post` http method"
		);
	};
	return _handle;
};

const defaultActionProps = (table: any) => {
	return {
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
			isAccessible: isManager,
		},
		new: {
			isAccessible: isManager,
			handler: newRecordHandler(table),
		},
		bulkDelete: {
			isAccessible: isSuperUser,
		},
		delete: {
			isAccessible: isSuperUser,
		},
	};
};

const LSEProperties = (
	list: string[],
	show: string[] = [],
	edit: string[] = []
) => {
	return {
		listProperties: [...list],
		showProperties: [...list, ...show],
		editProperties: [...list, ...show, ...edit],
	};
};

const options: AdminJSOptions = {
	resources: [
		{
			resource: User,
			options: {
				...LSEProperties(
					["displayName", "email", "level", "sid"],
					[],
					["oid", "enrolled", "privileges"]
				),
				actions: {
					...defaultActionProps(User),
					updateStudents: {
						actionType: "resource",
						isAccessible: isManager,
						component: AdminJS.bundle("./containers/bulkUser"),
					},
					updateAssistants: {
						actionType: "resource",
						isAccessible: isManager,
						component: AdminJS.bundle("./containers/bulkUser"),
					},
				},
			},
		},
		{
			resource: UserAccess,
			options: {
				...LSEProperties(
					["type", "userEmail", "accessed", "downloadCount"],
					[],
					["macrofree", "encrypt"]
				),
				properties: {
					downloadCount: {
						isDisabled: true,
					},
				},
				actions: {
					...defaultActionProps(UserAccess),
					edit: {
						isAccessible: true,
					},
				},
			},
		},
		{
			resource: FileAccess,
			options: {
				...LSEProperties(
					["name", "level", "enabled", "encrypt", "onetime"],
					["password", "vba_password"],
					[]
				),
				actions: {
					...defaultActionProps(FileAccess),
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
						component: AdminJS.bundle("./containers/fileUpload"),
					},
				},
			},
		},
	],
	pages: {
		Documentation: {
			component: AdminJS.bundle("./containers/documentation"),
		},
	},
	rootPath: "/manage",
	branding: {
		companyName: "BUS 101",
	},
};

AdminJS.registerAdapter(AdminJSSequelize);
const adminJS = new AdminJS(options);
const adminRouter = AdminJSExpress.buildRouter(adminJS);

const prepareAdmin = (app: express.Application) => {
	app.use("/api", [isAuthenticated, isSeniorTA, routerApi]);
	app.use(adminJS.options.rootPath, [
		isAuthenticated,
		isSeniorTA,
		adminRouter,
	]);
};

export default prepareAdmin;
