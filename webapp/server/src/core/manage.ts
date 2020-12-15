import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
	return res.render("manage");
});

router.post("/modify", (req, res) => {
    console.log(req.body)
    res.status(200).end();
});

export default router;
