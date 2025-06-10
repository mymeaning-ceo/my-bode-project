# My Bode Project

This project requires several environment variables to run:

- `DB_URL` – MongoDB connection string
- `S3_KEY` – AWS S3 access key
- `S3_SECRET` – AWS S3 secret key
- `S3_BUCKET_NAME` – Name of the S3 bucket used for uploads. If the bucket does
  not exist it will be created automatically when the server starts (your AWS
  credentials must allow bucket creation).

Create a `.env` file in the project root and define these values before starting
the server. Make sure the file is saved as **UTF-8 without BOM** so that
`dotenv` can read it correctly.


## Python scripts

Some features convert Excel files to CSV using Python. Install the Python dependencies before running the server:

```bash
pip install -r requirements.txt
```

The `requirements.txt` file lists the minimal packages (`pandas` and `openpyxl`) needed to parse Excel files.
