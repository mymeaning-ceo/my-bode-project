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
- `WEATHER_API_KEY` – API key from the Korean Meteorological Administration used
  to fetch daily weather data.
- `WEATHER_NX` – Grid X coordinate for weather data (defaults to Cheonan if unset)
- `WEATHER_NY` – Grid Y coordinate for weather data (defaults to Cheonan if unset)
- `CP_ACCESS_KEY` – Coupang Open API access key
- `CP_SECRET_KEY` – Coupang Open API secret key
- `CP_VENDOR_ID` – Vendor ID issued by Coupang
- `CP_API_HOST` – Base URL for the Coupang Open API (optional)
- `CP_RG_AUTH_TOKEN` – Token for RocketGross API calls (enable the feature in WING first)

Copy `.env.example` to `.env` in the project root and define these values before starting the server. Make sure the file is saved as **UTF-8 without BOM** so that `dotenv` can read it correctly.

## Node packages

`node_modules` is excluded from version control. Install the dependencies before running the server or any tests:

```bash
npm ci # or `npm install`
```

After the packages are installed you can run `npm test` or start `server.js`.

## Python scripts

Some features convert Excel files to CSV using Python. Install the Python dependencies before running the server:

```bash
pip install -r requirements.txt
```

The `requirements.txt` file lists the minimal packages (`pandas`, `openpyxl` and `requests`) needed to parse Excel files and access the Coupang API.

### Coupang API helper

The module `scripts/coupang_api.py` signs and sends requests to the Coupang Open API. Set `CP_ACCESS_KEY`, `CP_SECRET_KEY` and `CP_VENDOR_ID` in your environment.

Example:

```bash
python scripts/coupang_api.py GET /v2/providers/openapi/apis/api/v1/marketplace/seller-products/12345
```

### Settlement API helper

`scripts/settlement_api.py` provides a small CLI for Coupang's settlement endpoints. It requires `CP_ACCESS_KEY`, `CP_SECRET_KEY` and `CP_VENDOR_ID` to be set in the environment. `CP_API_HOST` may be used to target a custom host.

Example:

```bash
python scripts/settlement_api.py GET /v2/providers/openapi/apis/api/v1/settlement/summary
```

## Router structure

Routes are organized under the `routes/` directory. `server.js` mounts two routers directly:

- `/api` handled by `routes/api/index.js`
- `/` handled by `routes/web/index.js`

`routes/web/index.js` automatically reads every `.js` file in the same folder and mounts it. Some routes like `post` or `admin` are guarded with an auth check. `routes/api/index.js` currently exposes `/stock` endpoints through `stockApi.js`.

This layout keeps API and web routes separate while avoiding an extra routing layer.

## Coupang product endpoint

`/api/coupang-open/product/:id` fetches product details from the Coupang Open API.
The server must be configured with `CP_ACCESS_KEY`, `CP_SECRET_KEY` and `CP_VENDOR_ID`.
Optionally, `CP_API_HOST` can override the default host.

```js
const axios = require("axios");

const getProduct = async (id) => {
  const { data } = await axios.get(
    `http://localhost:3000/api/coupang-open/product/${id}`,
  );
  console.log(data);
};

getProduct("1234");
```

## RocketGross product creation

Enable the **RocketGross** API in WING and copy the issued token to
`CP_RG_AUTH_TOKEN`.
Then you can register a product through `/api/coupang-open/product/create`:

```js
const axios = require("axios");

const createProduct = async (body) => {
  const { data } = await axios.post(
    "http://localhost:3000/api/coupang-open/product/create",
    body,
  );
  console.log(data);
};

createProduct({ name: "Sample" });
```

## Coupang supply price API

Upload option supply prices and calculate the total stock value. The API exposes
three endpoints under `/api/coupang-supply`:

- `GET /api/coupang-supply` returns the saved prices with the current total
  stock value computed from the Coupang inventory collection.
- `POST /api/coupang-supply/upload` accepts an Excel file containing `Option ID`
  and `Supply Price` columns. Existing records are upserted.
- `GET /api/coupang-supply/download` downloads the saved data as an Excel file.

React admin pages provide a simple interface for uploading or downloading the
Excel file.

=======

## Weather integration

The project exposes `/api/weather/daily` which fetches forecast data from the
Korean Meteorological Administration using `WEATHER_API_KEY`. An accompanying
`/weather` page displays the information via AJAX.

Server-side requests use `node-fetch`, which is listed in `package.json`.

### Initializing sample weather data

Run the script below once to create the `weather` collection with an example
document. The script respects `MONGO_URI` and `DB_NAME` environment variables:

```bash
node scripts/init_weather.js
```

This inserts a document for `2025-06-25` so the weather API endpoints return
data even before the daily cron job populates the database.
=======

## Weather API details

The weather data is sourced from the [Korean Meteorological Administration (기상청) 초단기예보 API](https://data.go.kr/iim/api/selectAPIAcountView.do#).

### API Endpoint

https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0

### Authentication Keys

Two versions of the API key are provided:

- **Encoding key**: Use this version when placing the key directly into the URL.
- **Decoding key**: Use this when passing via `params` or using a library that handles encoding.

> Your actual key values can be found in the developer portal at https://data.go.kr

### Example usage with axios

```js
const axios = require("axios");
const qs = require("qs");

const fetchWeather = async () => {
  const params = {
    serviceKey: process.env.WEATHER_API_KEY, // must be URL encoded
    pageNo: "1",
    numOfRows: "1000",
    dataType: "JSON",
    base_date: "20240620",
    base_time: "1200",
    nx: "60",
    ny: "127",
  };

  const url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?${qs.stringify(params)}`;

  const { data } = await axios.get(url);
  console.log(data);
};

fetchWeather();
```

=======

## Order quantity calculator

The script `scripts/calc_order_qty.js` merges ad and inventory Excel files to
calculate recommended order quantities. Usage:

```bash
node scripts/calc_order_qty.js <ad_excel> <inventory_excel> [output.xlsx]
```

The algorithm derives average daily sales from recent conversions, applies an
ad spend multiplier, and subtracts current stock to determine how many units
to reorder.

### Updating ad history

Daily advertising costs from the `coupangAdd` collection can be aggregated into
`adHistory` using a helper script. The script respects `MONGO_URI` and `DB_NAME`
and upserts one document per day with `{ date: 'YYYYMMDD', cost: <number> }`.

```bash
# run from the project root so dotenv can load the environment variables
node scripts/update_ad_history.js
```

Schedule this command in `cron` to keep the `adHistory` collection up to date.

## DataTable helper

Client pages use a helper `createDataTable()` located in `public/js/common-dt.js`.
Tables can specify the default sort column via `data-order-col` and
`data-order-dir` attributes:

```html
<table id="stockTable" data-order-col="1" data-order-dir="asc"></table>
```

These values are passed to DataTables when initializing so you can control the
initial ordering without writing extra JavaScript.

## React client

개발 단계에서는 기존 EJS 템플릿 대신 React 클라이언트를 사용합니다.
`client/` 디렉터리에서 의존성을 설치한 뒤 개발 서버를 실행하세요:

```bash
cd client
npm install
npm start
```

The React client relies on `chart.js` and `react-chartjs-2` for visualizations,
so a successful install is required before `npm start` will compile.

If the development server fails with "Module not found" errors, run `npm install`
again inside the `client/` directory. Express uses port `3000`, so start React on
a different port to avoid conflicts:

```bash
PORT=3001 npm start
```

`client/package.json`에는 `"proxy": "http://localhost:3000"`가 포함되어 있어
`/api` 경로의 요청이 자동으로 백엔드로 전달됩니다.

The login page was migrated from an EJS template to a React component. The
client authenticates by sending credentials to the Express endpoint
`/api/auth/login`. In production the server serves `client/public/index.html` for
`/login`, so navigating directly to `/login` loads the React app.
Successful registration redirects to `/register-success`, which is also handled
by the React client.

### 게시판

`/board`와 `/:shop/board` 경로는 React 기반 게시판을 제공합니다. `shop`
파라미터에는 `내의미`, `TRY`, `BYC`, `제임스딘`, `쿠팡`, `네이버` 중 하나가
들어갑니다. 게시글 API는 `board` 값을 사용해 **`post_{slug}`** 형식의
컬렉션을 생성하여 각 브랜드별 게시판 데이터를 독립적으로 관리합니다.

The Help page has also been converted to React and is accessible at `/help`.

### Post pages migrated to React

Legacy EJS templates under `/post` are now served by the React client. Visiting
`/post`, `/post/write` or a detail page loads `client/public/index.html`. CRUD
operations continue to use the `/api/posts` endpoints so the frontend can evolve
independently of Express routes.

### Board management API

Boards are stored in the `board` collection. CRUD operations are available via
`/api/boards`. A simple management page is located at `/admin/boards` in the
React client.
Deleting a board also removes its corresponding `post_{slug}` collection.

### Generic record API

The `records` endpoint provides basic CRUD operations for arbitrary
collections. Use `/api/records/:collection` with POST to insert documents and
`/api/records/:collection/:id` for GET, PUT and DELETE. This makes it easy to
experiment with new MongoDB collections without adding dedicated routes.
