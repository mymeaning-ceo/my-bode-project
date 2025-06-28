// controllers/stockController.js
const path = require("path");
const multer = require("multer");
const { spawn } = require("child_process");
const asyncHandler = require("../middlewares/asyncHandler"); // ★ 상단에 한 번만

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, `excel_${Date.now()}${path.extname(file.originalname)}`),
});
exports.upload = multer({ storage }).single("excelFile");

// Render stock page
exports.renderStockPage = asyncHandler(async (req, res) => {
  res.render("stock");
});

// DataTables API (server-side pagination)
exports.getStockData = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  // DataTables parameters
  const start = parseInt(req.query.start, 10) || 0;
  const length = parseInt(req.query.length, 10) || 50;
  const draw = parseInt(req.query.draw, 10) || 1;

  // 검색 파라미터
  const itemCode = req.query.item_code || "";
  const color = req.query.color || "";
  const size = req.query.size || "";

  const query = {};
  if (itemCode) query.item_code = { $regex: itemCode, $options: "i" };
  if (color) query.color = { $regex: color, $options: "i" };
  if (size) query.size = { $regex: size, $options: "i" };

  // 정렬 파라미터
  const columns = {
    1: "item_code",
    2: "item_name",
    3: "color",
    4: "size",
    5: "qty",
    6: "allocation",
    7: "uploadedBy",
    8: "createdAt",
  };
  const orderCol = columns[req.query["order[0][column]"]] || "item_code";
  const orderDir = req.query["order[0][dir]"] === "desc" ? -1 : 1;
  const sortOption = { [orderCol]: orderDir };

  const [rows, total] = await Promise.all([
    db
      .collection("stock")
      .find(query)
      .sort(sortOption)
      .skip(start)
      .limit(length)
      .toArray(),
    db.collection("stock").countDocuments(query),
  ]);

  res.json({
    draw,
    recordsTotal: total,
    recordsFiltered: total,
    data: rows,
  });
});

// Excel upload API
exports.uploadExcel = asyncHandler(async (req, res) => {
  console.log("✅ POST /stock/upload controller");

  if (!req.file) {
    console.log("❌ 파일이 업로드되지 않았습니다.");
    return res.status(400).send("❌ 파일이 없습니다.");
  }

  const filePath = path.resolve(req.file.path);
  const dbName = process.env.DB_NAME || "forum";
  const collectionName = "stock";
  const PY_SCRIPT = path.join(__dirname, "../scripts/excel_to_mongo.py");

  const python = spawn(
    "python",
    ["-u", PY_SCRIPT, filePath, dbName, collectionName],
    {
      shell: true,
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
        MONGO_URI: process.env.MONGO_URI,
      },
    },
  );

  python.stdout.on("data", (data) =>
    console.log(`📤 Python STDOUT: ${data.toString()}`),
  );
  python.stderr.on("data", (data) =>
    console.error(`⚠️ Python STDERR: ${data.toString()}`),
  );

  python.on("error", (err) => {
    console.error("🚨 Python 실행 실패:", err);
    if (!res.headersSent) res.status(500).send("❌ Python 실행 실패");
  });

  python.on("close", async (code) => {
    console.log(`📦 Python 프로세스 종료 코드: ${code}`);
    if (res.headersSent) return;

    if (code === 0) {
      try {
        const db = req.app.locals.db;
        if (db) {
          await db.collection(collectionName).updateMany(
            {},
            {
              $set: {
                createdAt: new Date(),
                uploadedBy: req.user ? req.user.username : "알 수 없음",
              },
            },
          );
        }
        if (req.flash)
          req.flash("성공메시지", "✅ 엑셀 업로드가 완료되었습니다.");
        res.redirect("/stock");
      } catch (err) {
        console.error("❌ 업로드 후 처리 실패:", err);
        res.status(500).send("❌ 업로드 후 처리 실패");
      }
    } else {
      res.status(500).send("❌ 엑셀 처리 중 오류 발생");
    }
  });

  // 60초 타임아웃
  const timeout = setTimeout(() => {
    if (!python.killed) {
      python.kill("SIGTERM");
      console.error("⏱️ Python 실행 시간 초과로 종료");
      if (!res.headersSent) res.status(500).send("❌ Python 실행 시간 초과");
    }
  }, 60000);

  python.on("close", () => clearTimeout(timeout));
});

// Excel upload API (JSON response)
exports.uploadExcelApi = asyncHandler(async (req, res) => {
  console.log("✅ POST /api/stock/upload controller");

  if (!req.file) {
    console.log("❌ 파일이 업로드되지 않았습니다.");
    return res
      .status(400)
      .json({ status: "error", message: "파일이 없습니다." });
  }

  const filePath = path.resolve(req.file.path);
  const dbName = process.env.DB_NAME || "forum";
  const collectionName = "stock";
  const PY_SCRIPT = path.join(__dirname, "../scripts/excel_to_mongo.py");

  const python = spawn(
    "python",
    ["-u", PY_SCRIPT, filePath, dbName, collectionName],
    {
      shell: true,
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
        MONGO_URI: process.env.MONGO_URI,
      },
    },
  );

  python.stdout.on("data", (data) =>
    console.log(`📤 Python STDOUT: ${data.toString()}`),
  );
  python.stderr.on("data", (data) =>
    console.error(`⚠️ Python STDERR: ${data.toString()}`),
  );

  python.on("error", (err) => {
    console.error("🚨 Python 실행 실패:", err);
    if (!res.headersSent)
      res.status(500).json({ status: "error", message: "Python 실행 실패" });
  });

  python.on("close", async (code) => {
    console.log(`📦 Python 프로세스 종료 코드: ${code}`);
    if (res.headersSent) return;

    if (code === 0) {
      try {
        const db = req.app.locals.db;
        if (db) {
          await db.collection(collectionName).updateMany(
            {},
            {
              $set: {
                createdAt: new Date(),
                uploadedBy: req.user ? req.user.username : "알 수 없음",
              },
            },
          );
        }
        res.json({ status: "success" });
      } catch (err) {
        console.error("❌ 업로드 후 처리 실패:", err);
        res
          .status(500)
          .json({ status: "error", message: "업로드 후 처리 실패" });
      }
    } else {
      res
        .status(500)
        .json({ status: "error", message: "엑셀 처리 중 오류 발생" });
    }
  });

  // 60초 타임아웃
  const timeout = setTimeout(() => {
    if (!python.killed) {
      python.kill("SIGTERM");
      console.error("⏱️ Python 실행 시간 초과로 종료");
      if (!res.headersSent)
        res
          .status(500)
          .json({ status: "error", message: "Python 실행 시간 초과" });
    }
  }, 60000);

  python.on("close", () => clearTimeout(timeout));
});

// 단일 재고 조회
exports.getStockItem = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const { ObjectId } = require("mongodb");
  const id = req.params.id;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const item = await db.collection("stock").findOne({ _id: new ObjectId(id) });
  if (!item) return res.status(404).json({ message: "Not found" });
  res.json(item);
});

// 재고 추가
exports.addStockItem = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const doc = {
    item_code: req.body.item_code,
    item_name: req.body.item_name,
    color: req.body.color,
    size: req.body.size,
    qty: Number(req.body.qty) || 0,
    allocation: Number(req.body.allocation) || 0,
    uploadedBy: req.user ? req.user.username : "api",
    createdAt: new Date(),
  };

  const result = await db.collection("stock").insertOne(doc);
  res.json({ insertedId: result.insertedId });
});

// 재고 수정
exports.updateStockItem = asyncHandler(async (req, res) => {
  const db = req.app.locals.db;
  const { ObjectId } = require("mongodb");
  const id = req.params.id;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const update = { ...req.body };
  delete update._id;

  await db
    .collection("stock")
    .updateOne({ _id: new ObjectId(id) }, { $set: update });

  res.json({ message: "updated" });
});
