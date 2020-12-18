import { Sequelize, DataTypes } from "sequelize";
let sequelize: Sequelize;
if (process.env.NODE_ENV == "production") {
	if (process.env.DATABASE_URL == undefined) {
		throw new Error("DATABASE_URL is not available");
	} else {
		sequelize = new Sequelize(process.env.DATABASE_URL, {
			dialect: "postgres",
		});
	}
} else {
	sequelize = new Sequelize("postgres://admin:root@localhost:5432/busfs", {
		dialect: "postgres",
	});
}

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
		oid: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		displayName: {
			type: DataTypes.STRING,
		},
		email: {
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
	},
	{
		freezeTableName: true,
		createdAt: false,
		updatedAt: false,
	}
);

const UserAccess = sequelize.define(
	"user_access",
	{
		userOid: {
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
		macrofree: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
	},
	{
		freezeTableName: true,
		createdAt: false,
		updatedAt: false,
	}
);

const Stats = sequelize.define(
	"stats",
	{
		ip: {
			type: DataTypes.STRING,
		},
		type: {
			type: DataTypes.STRING,
		},
		userAgent: {
			type: DataTypes.STRING,
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
export { RateLimit, User, FileAccess, UserAccess, Stats };
