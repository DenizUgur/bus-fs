# bus-fs

### Notes

-   ORIGIN_HOST should be changed according to the environment.
-   Azure OAuth must be reconfigured according to the environment. That is, the redirect URI must be changed.
-   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME should be modified if the bucket has changed hands.

### .env file

-   SESSION_KEY: nanoid random string
-   FALLBACK_TYPE: string
-   AWS_ACCESS_KEY_ID
-   AWS_SECRET_ACCESS_KEY
-   S3_BUCKET_NAME
-   ORIGIN_HOST: string
-   DATABASE_URL: string
-   REDIS_URL: string
