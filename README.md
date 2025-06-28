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
const axios = require('axios');

const getProduct = async (id) => {
  const { data } = await axios.get(`http://localhost:3000/api/coupang-open/product/${id}`);
  console.log(data);
};

getProduct('1234');
```

## RocketGross product creation

Enable the **RocketGross** API in WING and copy the issued token to
`CP_RG_AUTH_TOKEN`.
Then you can register a product through `/api/coupang-open/product/create`:

```js
const axios = require('axios');

const createProduct = async (body) => {
  const { data } = await axios.post('http://localhost:3000/api/coupang-open/product/create', body);
  console.log(data);
};

createProduct({ name: 'Sample' });
```

=======


## Weather integration

The project exposes `/api/weather/daily` which fetches forecast data from the
Korean Meteorological Administration using `WEATHER_API_KEY`. An accompanying
`/weather` page displays the information via AJAX.


Server-side requests use `node-fetch`, which is listed in `package.json`.
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
    ny: "127"
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

### Board API

Each brand has its own board managed through `/api/board/:name`. Supported
names are `내의미`, `TRY`, `BYC`, `제임스딘`, `쿠팡` and `네이버`. Posts can be read
with a GET request and created with a POST request:

```bash
curl http://localhost:3000/api/board/TRY/posts

curl -X POST http://localhost:3000/api/board/TRY/posts \
  -H 'Content-Type: application/json' \
  -d '{"title":"hello","content":"world"}'
```


