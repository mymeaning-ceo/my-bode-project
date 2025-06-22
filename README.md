# My Bode Project

This project requires several environment variables to run:

- `MONGO_URI` – MongoDB connection string
- `DB_NAME`  – MongoDB database name
- `S3_KEY` – AWS S3 access key
- `S3_SECRET` – AWS S3 secret key
- `S3_REGION` – AWS S3 region where the bucket resides
- `S3_BUCKET_NAME` – Name of the S3 bucket used for uploads. The server will
  automatically create this bucket if it does not exist (your AWS credentials
  must allow bucket creation).

Create a `.env` file in the project root and define these values before starting
the server. Make sure the file is saved as **UTF-8 without BOM** so that
`dotenv` can read it correctly.

> **Note**: The application always loads variables from `.env` in the project
> root. Additional files such as `.env.dev` or `.env.empal` are ignored.

Create a `.env` file containing values similar to the following:

```bash
MONGO_URI=mongodb://localhost:27017/mydb
DB_NAME=forum
S3_KEY=YOUR_ACCESS_KEY
S3_SECRET=YOUR_SECRET_KEY
S3_REGION=YOUR_REGION
S3_BUCKET_NAME=your-bucket-name
SESSION_SECRET=your-session-secret
```

## Python scripts

Some features convert Excel files to CSV using Python. Install the Python dependencies before running the server:

```bash
pip install -r requirements.txt
```

The `requirements.txt` file lists the minimal packages (`pandas` and `openpyxl`) needed to parse Excel files.
