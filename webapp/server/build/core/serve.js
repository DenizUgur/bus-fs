"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAvailable = void 0;
const express_1 = require("express");
const util_1 = __importDefault(require("util"));
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const db_1 = require("../db");
const router = express_1.Router();
const exec_prom = util_1.default.promisify(child_process_1.exec);
const isAvailable = (type) => {
    //TODO: Make this dynamic
    return type == "hw5";
};
exports.isAvailable = isAvailable;
router.get("/:type", (req, res) => {
    res.render("index", {
        title: "BUS File Service",
        message: `Hi ${req.user.displayName}, your file is currently being prepared. Please wait...`,
        serve: true,
    });
});
router.get("/", (req, res) => {
    //TODO: Change fallback behavior
    res.render("index", {
        title: "BUS File Service",
        message: `Hi ${req.user.displayName}, your file is currently being prepared. Please wait...`,
        serve: true,
    });
});
router.get("/download/:type", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //TODO: Change fallback behavior
    const type = "hw5";
    yield db_1.Stats.create({
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        type: req.params.type || "N/A",
        origin: "GET",
    });
    if (isAvailable(type)) {
        exec_prom(`python3 ../worker/app.py ${type} ${req.user.sid || ""}`)
            .then(() => {
            res.download(`../data/out/${req.user.sid}_${type}.xlsm`, `${req.user.sid}_${type}.xlsm`, (error) => {
                if (error)
                    throw error;
                fs_1.default.unlinkSync(`../data/out/${req.user.sid}_${type}.xlsm`);
            });
        })
            .catch((error) => {
            throw error;
        });
    }
    else {
        return res.render("index", {
            title: "BUS File Service",
            message: "This homework is not available yet.",
            serve: false,
        });
    }
}));
exports.default = router;
//# sourceMappingURL=serve.js.map