# bus-fs

# Building

-   Change directory to `webapp/server` and run `npm ci`
-   Run `npm run pack`
-   Copy `dist/server-linux` to the VM (Azure or AWS)
-   On the VM python must be installed
-   From now on we are working on the VM
-   Execute the following command on the directory where the `server-linux` is `chmod +x server-linux`
-   `key.pem`, `cert.pem`, `auth.json`, and `.env` must be in the same directory as the `server-linux`
    -   `key.pem` is the private key of the server certificate\*
    -   `cert.pem` is the public key of the server certificate\*
    -   `auth.json` is the authentication file for the server. This must be updated according to Azure OAuth settings
    -   `.env` is the environment file for the server. The contents of this file is given in the last section.

> \* The server certificate should be generated using [Let's Encrypt](https://letsencrypt.org/). Check [here](https://certbot.eff.org/instructions?ws=other&os=ubuntufocal) for instructions.

> `auth.json` is given here in this repository but for safety reasons roll new keys and update the JSON file accordingly.

### Notes

-   ORIGIN_HOST should be changed according to the environment.
-   Azure OAuth must be reconfigured according to the environment. That is, the redirect URI must be changed.
-   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME should be modified if the bucket has changed hands.

### .env file

-   SESSION_KEY: This is used to encrypt the session cookie.
-   FALLBACK_TYPE: This is the type of the fallback file served to users in case cookies didn't worked.
-   AWS_ACCESS_KEY_ID: This is the access key for the AWS S3 bucket.
-   AWS_SECRET_ACCESS_KEY: This is the secret key for the AWS S3 bucket.
-   S3_BUCKET_NAME: This is the name of the AWS S3 bucket.
-   ORIGIN_HOST: This is the host of the server. (i.e. https://denizugur.dev)
-   REDIS_URL\*: This is the redis URL. (i.e. redis://host:port)

> \* These are optional. Just enter a random string if using the packaged version.

Example .env file:

```
SESSION_KEY=randomstring
FALLBACK_TYPE=hw1
...
```
