"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
const router = express_1.Router();
const uiRoot = path_1.default.join(__dirname, "../../../ui/build/");
router.get("/", (req, res) => {
    return res.sendFile(path_1.default.join(uiRoot, "index.html"));
});
router.post("/modify", (req, res) => {
    console.log(req.body);
    res.status(200).end();
});
exports.default = router;
//# sourceMappingURL=manage.js.map