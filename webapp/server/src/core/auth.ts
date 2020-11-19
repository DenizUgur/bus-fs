import { Request, Response, Router } from "express";
import { nanoid } from "nanoid";
import jsonwebtoken from "jsonwebtoken";
import axios, { AxiosError, AxiosResponse } from "axios";
import crypto from "crypto";
import base64url from "base64url";
import qs from "querystring";
const randomstring = require("randomstring");

const router = Router();
const code_verifier = randomstring.generate(128);

const list = require("../../../data/users/students.json");
const listTA = require("../../../data/users/TAs.json");

router.get("/login", (req, res) => {
	//* PKCE Prerequisites
	const base64Digest = crypto
		.createHash("sha256")
		.update(code_verifier)
		.digest("base64");
	const code_challenge = base64url.fromBase64(base64Digest);

	//* Prepare OAuth 2.0 Flow
	let redirect_uri = `https://login.microsoftonline.com/${
		process.env.AZURE_TENANT_ID
	}/oauth2/v2.0/authorize?${qs.stringify({
		client_id: process.env.AZURE_CLIENT_ID,
		response_type: "code",
		redirect_uri: process.env.AZURE_CALLBACK_URL,
		scope: "openid email",
		state: nanoid(),
		code_challenge,
		code_challenge_method: "S256",
		...(req.session.prompt && { prompt: "consent" }),
	})}`;

	res.redirect(redirect_uri);
});

router.get("/callback", async (req, res) => {
	//* Handle Error
	if (req.query.error) {
		if (req.query.error == "interaction_required") {
			req.session.prompt = true;
			return req.session.save((error: any) => {
				return res.redirect("/auth/login");
			});
		}
		return res.render("error", {
			title: "401 Error",
			message: "401",
			subtitle: "Authentication Error",
			description: req.query.error_description,
		});
	}

	//* Get and authorization_code and email
	try {
		//* Configuration
		const postBody: any = {
			grant_type: "authorization_code",
			client_id: process.env.AZURE_CLIENT_ID,
			scope: "openid email",
			code: req.query.code,
			redirect_uri: process.env.AZURE_CALLBACK_URL,
			code_verifier: code_verifier,
			client_secret: process.env.AZURE_CLIENT_SECRET,
		};
		const config = {
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		};

		//* Request
		const signInResponse: AxiosResponse = await axios.post(
			`https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
			qs.stringify(postBody),
			config
		);
		if (signInResponse.data.error) {
			return res.render("error", {
				title: "401 Error",
				message: "401",
				subtitle: "Authentication Error",
				description: signInResponse.data.error_description,
			});
		}

		//* Get email of user
		const mailResponse = await axios.get(
			"https://graph.microsoft.com/v1.0/me",
			{
				headers: {
					Authorization: `Bearer ${signInResponse.data.access_token}`,
				},
			}
		);

		//* Sign a JWT and send it in a cookie
		const jwt = jsonwebtoken.sign(
			{ mail: mailResponse.data.mail, level: 0 },
			process.env.JWT_KEY || "",
			{
				expiresIn: "1h",
			}
		);

		res.cookie("BUSFS_JWT", jwt, {
			path: "/",
			secure: true,
			httpOnly: true,
		});
		return res.redirect("/serve");
	} catch (error: AxiosError | any) {
		console.error(error);
		return res.render("error", {
			title: "500 Error",
			message: "500",
			subtitle: "Internal Server Error",
			description:
				"Sorry to see you here, please report us what happend so that we can help you",
		});
	}
});

const isAuthenticated = (req: Request, res: Response, next: any) => {
	const jwt = req.cookies["BUSFS_JWT"];
	try {
		const decoded: any = jsonwebtoken.verify(
			jwt,
			process.env.JWT_KEY || ""
		);
		req.user = {
			mail: decoded.mail,
			level: decoded.level,
			id: null,
		};
		return next();
	} catch (error) {
		return res.redirect("/auth/login");
	}
};

const isValidUser = (req: Request, res: Response, next: any) => {
	const user = list
		.concat(listTA)
		.find((el: any) => el.email === req.user.mail);
	if (user) {
		req.user.id = user.id;
		return next();
	} else {
		return res.render("index", {
			title: "BUS File Service",
			message: `${req.user.mail} is not enrolled to this course.`,
			serve: false,
		});
	}
};

export default router;
export { isAuthenticated, isValidUser };
