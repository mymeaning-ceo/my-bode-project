# My Bode Project

This project requires several environment variables to run:

- `DB_URL` – MongoDB connection string
- `S3_KEY` – AWS S3 access key
- `S3_SECRET` – AWS S3 secret key
- `S3_BUCKET_NAME` – Name of the S3 bucket used for uploads. If the bucket does
  not exist it will be created automatically when the server starts (your AWS
  credentials must allow bucket creation).

Create a `.env` file in the project root and define these values before starting
the server.

