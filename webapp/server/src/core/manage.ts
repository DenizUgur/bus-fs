import { Router } from "express";
import path from "path";

const router = Router();
const uiRoot = path.join(__dirname, "../../../ui/build/");

router.get("/", (req, res) => {
	return res.sendFile(path.join(uiRoot, "index.html"));
});

router.post("/modify", (req, res) => {
	console.log(req.body);
	res.status(200).end();
});

export default router;
