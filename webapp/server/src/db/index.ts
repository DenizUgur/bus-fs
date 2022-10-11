/**
 * @author Deniz Ugur <deniz343@gmail.com>
 */
import sqlite3 from "sqlite3";
import { Sequelize, DataTypes } from "sequelize";
import path from "path";
import { aws_delete } from "../core/aws";

const sequelize = new Sequelize({
	dialect: "sqlite",
	dialectModule: sqlite3,
	storage: path.join(process.cwd(), "data", "db.sqlite"),
});

const RateLimit = sequelize.define(
	"ratelimit",
	{
		key: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		points: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		expire: {
			type: DataTypes.BIGINT,
		},
	},
	{
		freezeTableName: true,
		createdAt: false,
		updatedAt: false,
	}
);

const User = sequelize.define(
	"user",
	{
		email: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		oid: {
			type: DataTypes.STRING,
		},
		displayName: {
			type: DataTypes.STRING,
		},
		sid: {
			type: DataTypes.STRING,
		},
		enrolled: {
			type: DataTypes.BOOLEAN,
		},
		level: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		privileges: {
			type: DataTypes.STRING,
			defaultValue: "{}",
		},
	},
	{
		freezeTableName: true,
		createdAt: false,
		updatedAt: false,
	}
);

const FileAccess = sequelize.define(
	"file_access",
	{
		name: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		enabled: {
			type: DataTypes.BOOLEAN,
		},
		onetime: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		level: {
			type: DataTypes.INTEGER,
		},
		files: {
			type: DataTypes.JSON,
		},
		encrypt: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		vba_password: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		password: {
			type: DataTypes.STRING,
			allowNull: true,
		},
	},
	{
		freezeTableName: true,
		createdAt: false,
		updatedAt: false,
		hooks: {
			afterDestroy: async (file: any, _) => {
				if (file.files) {
					try {
						for (const key of Object.values(file.files))
							await aws_delete((key as any).aws);
					} catch (_) {}
				}
			},
		},
	}
);

const UserAccess = sequelize.define(
	"user_access",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		userEmail: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		type: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		accessed: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
		downloadCount: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		macrofree: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		encrypt: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
	},
	{
		freezeTableName: true,
		createdAt: false,
		updatedAt: false,
	}
);

const Settings = sequelize.define(
	"settings",
	{
		key: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		value: {
			type: DataTypes.JSON,
		},
	},
	{
		freezeTableName: true,
		createdAt: false,
		updatedAt: false,
	}
);

//* Relations
User.hasMany(UserAccess);
UserAccess.belongsTo(User);

export default sequelize;
export { RateLimit, User, FileAccess, UserAccess, Settings };
