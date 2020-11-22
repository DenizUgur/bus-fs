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

const Stats = sequelize.define(
	"stats",
	{
		ip: {
			type: DataTypes.STRING,
		},
		session: {
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

export default sequelize;
export { RateLimit, Stats };
