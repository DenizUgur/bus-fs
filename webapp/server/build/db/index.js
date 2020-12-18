"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stats = exports.User = exports.RateLimit = void 0;
const sequelize_1 = require("sequelize");
let sequelize;
if (process.env.NODE_ENV == "production") {
    if (process.env.DATABASE_URL == undefined) {
        throw new Error("DATABASE_URL is not available");
    }
    else {
        sequelize = new sequelize_1.Sequelize(process.env.DATABASE_URL, {
            dialect: "postgres",
        });
    }
}
else {
    sequelize = new sequelize_1.Sequelize("postgres://admin:root@localhost:5432/busfs", {
        dialect: "postgres",
    });
}
const RateLimit = sequelize.define("ratelimit", {
    key: {
        type: sequelize_1.DataTypes.STRING,
        primaryKey: true,
    },
    points: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    expire: {
        type: sequelize_1.DataTypes.BIGINT,
    },
}, {
    freezeTableName: true,
    createdAt: false,
    updatedAt: false,
});
exports.RateLimit = RateLimit;
const User = sequelize.define("user", {
    oid: {
        type: sequelize_1.DataTypes.STRING,
        primaryKey: true,
    },
    displayName: {
        type: sequelize_1.DataTypes.STRING,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
    },
    sid: {
        type: sequelize_1.DataTypes.STRING,
    },
    enrolled: {
        type: sequelize_1.DataTypes.BOOLEAN,
    },
    level: {
        type: sequelize_1.DataTypes.INTEGER,
    },
}, {
    freezeTableName: true,
    createdAt: false,
    updatedAt: false,
});
exports.User = User;
const Stats = sequelize.define("stats", {
    ip: {
        type: sequelize_1.DataTypes.STRING,
    },
    type: {
        type: sequelize_1.DataTypes.STRING,
    },
    userAgent: {
        type: sequelize_1.DataTypes.STRING,
    },
    origin: {
        type: sequelize_1.DataTypes.STRING,
    },
}, {
    freezeTableName: true,
    createdAt: false,
    updatedAt: false,
});
exports.Stats = Stats;
exports.default = sequelize;
//# sourceMappingURL=index.js.map