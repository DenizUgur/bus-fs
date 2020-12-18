"use strict";
exports.creds = {
    identityMetadata: "https://login.microsoftonline.com/81052e1c-8804-4f86-b20e-fe8e0b82cbf4/v2.0/.well-known/openid-configuration",
    clientID: "09f8ea2e-61df-4ea3-a55f-9bfdbdc65100",
    responseType: "code",
    responseMode: "form_post",
    redirectUrl: "https://bus-fs.herokuapp.com/auth/openid/return",
    allowHttpForRedirectUrl: false,
    clientSecret: "Dj7~tOp59r-P2r1QQR..n28WTqE1k-6aP8",
    validateIssuer: false,
    issuer: null,
    passReqToCallback: false,
    useCookieInsteadOfSession: true,
    cookieEncryptionKeys: [
        { key: "p6YUmGz0w1oNo7GkNzEJdMmUMVyDuCEL", iv: "yoLAJCU8xIQi" },
    ],
    scope: ["openid", "email", "profile"],
    nonceLifetime: 900,
};
//# sourceMappingURL=index.js.map