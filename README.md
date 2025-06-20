# My Bode Project

This project requires several environment variables to run:

- `MONGO_URI` – MongoDB connection string
- `DB_NAME` – MongoDB database name used by the application
- `SESSION_SECRET` – Secret string used to sign session cookies
- `S3_KEY` – AWS S3 access key
- `S3_SECRET` – AWS S3 secret key
- `S3_REGION` – AWS S3 region where the bucket resides
- `S3_BUCKET_NAME` – Name of the S3 bucket used for uploads. The server will
  automatically create this bucket if it does not exist (your AWS credentials
  must allow bucket creation).

Copy `.env.example` to `.env` in the project root and define these values before starting the server. Make sure the file is saved as **UTF-8 without BOM** so that `dotenv` can read it correctly.

## Python scripts

Some features convert Excel files to CSV using Python. Install the Python dependencies before running the server:

```bash
pip install -r requirements.txt
```

The `requirements.txt` file lists the minimal packages (`pandas` and `openpyxl`) needed to parse Excel files.

## Router structure

Routes are organized under the `routes/` directory. `server.js` mounts two routers directly:

- `/api` handled by `routes/api/index.js`
- `/` handled by `routes/web/index.js`

`routes/web/index.js` automatically reads every `.js` file in the same folder and mounts it. Some routes like `post` or `admin` are guarded with an auth check. `routes/api/index.js` currently exposes `/stock` endpoints through `stockApi.js`.

This layout keeps API and web routes separate while avoiding an extra routing layer.


## Order quantity calculator

The script `scripts/calc_order_qty.js` merges ad and inventory Excel files to
calculate recommended order quantities. Usage:

```bash
node scripts/calc_order_qty.js <ad_excel> <inventory_excel> [output.xlsx]
```

The algorithm derives average daily sales from recent conversions, applies an
ad spend multiplier, and subtracts current stock to determine how many units
to reorder.
