exports.creds = {
	// Required
	identityMetadata:
		"https://login.microsoftonline.com/81052e1c-8804-4f86-b20e-fe8e0b82cbf4/v2.0/.well-known/openid-configuration",

	// Required, the client ID of your app in AAD
	clientID: "09f8ea2e-61df-4ea3-a55f-9bfdbdc65100",

	// Required, must be 'code', 'code id_token', 'id_token code' or 'id_token'
	// If you want to get access_token, you must use 'code', 'code id_token' or 'id_token code'
	responseType: "code",

	// Required
	responseMode: "form_post",

	// Required, the reply URL registered in AAD for your app
	redirectUrl: "https://bus-fs.herokuapp.com/auth/openid/return",

	// Required if we use http for redirectUrl
	allowHttpForRedirectUrl: false,

	// Required if `responseType` is 'code', 'id_token code' or 'code id_token'.
	// If app key contains '\', replace it with '\\'.
	clientSecret: "Dj7~tOp59r-P2r1QQR..n28WTqE1k-6aP8",

	// Required to set to false if you don't want to validate issuer
	validateIssuer: false,

	// Required if you want to provide the issuer(s) you want to validate instead of using the issuer from metadata
	// issuer could be a string or an array of strings of the following form: 'https://sts.windows.net/<tenant_guid>/v2.0'
	issuer: null,

	// Required to set to true if the `verify` function has 'req' as the first parameter
	passReqToCallback: false,

	// Recommended to set to true. By default we save state in express session, if this option is set to true, then
	// we encrypt state and save it in cookie instead. This option together with { session: false } allows your app
	// to be completely express session free.
	useCookieInsteadOfSession: true,

	// Required if `useCookieInsteadOfSession` is set to true. You can provide multiple set of key/iv pairs for key
	// rollover purpose. We always use the first set of key/iv pair to encrypt cookie, but we will try every set of
	// key/iv pair to decrypt cookie. Key can be any string of length 32, and iv can be any string of length 12.
	cookieEncryptionKeys: [
		{ key: "p6YUmGz0w1oNo7GkNzEJdMmUMVyDuCEL", iv: "yoLAJCU8xIQi" },
	],

	// The additional scopes we want besides 'openid'.
	// 'profile' scope is required, the rest scopes are optional.
	scope: ["openid", "email", "profile"],

	// Optional, 'error', 'warn' or 'info'
	loggingLevel: "info",

	// Optional. The lifetime of nonce in session or cookie, the default value is 3600 (seconds).
	nonceLifetime: null,

	// Optional. The max amount of nonce saved in session or cookie, the default value is 10.
	nonceMaxAmount: 5,

	// Optional. The clock skew allowed in token validation, the default value is 300 seconds.
	clockSkew: null,
};
