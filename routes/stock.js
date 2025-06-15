const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { spawn } = require("child_process");

// ───────────────────────────────────────────
// 1. Multer 설정
// ───────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, `excel_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

// ───────────────────────────────────────────
// 3. /stock/upload (엑셀 업로드)
// ───────────────────────────────────────────
router.post("/upload", upload.single("excelFile"), async (req, res) => {
  try {
    console.log("✅ POST /stock/upload 라우터 진입");

    if (!req.file) {
      console.log("❌ 파일이 업로드되지 않았습니다.");
      return res.status(400).send("❌ 파일이 없습니다.");
    }

    const filePath = path.resolve(req.file.path);
    const dbName = process.env.DB_NAME || "forum";       // ← DB 이름
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
          MONGO_URI: process.env.MONGO_URI,              // ← URI 전달
        },
      }
    );

    python.stdout.on("data", (data) =>
      console.log(`📤 Python STDOUT: ${data.toString()}`)
    );
    python.stderr.on("data", (data) =>
      console.error(`⚠️ Python STDERR: ${data.toString()}`)
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
              }
            );
          }
          if (req.flash) req.flash("성공메시지", "✅ 엑셀 업로드가 완료되었습니다.");
          return res.redirect("/stock");
        } catch (err) {
          console.error("❌ 업로드 후 처리 실패:", err);
          return res.status(500).send("❌ 업로드 후 처리 실패");
        }
      } else {
        return res.status(500).send("❌ 엑셀 처리 중 오류 발생");
      }
    });

    // 60초 타임아웃
    setTimeout(() => {
      if (!python.killed) {
        python.kill("SIGTERM");
        console.error("⏱️ Python 실행 시간 초과로 종료");
        if (!res.headersSent) res.status(500).send("❌ Python 실행 시간 초과");
      }
    }, 60000);
  } catch (err) {
    console.error("❌ 업로드 처리 중 예외 발생:", err);
    res.status(500).send("서버 오류");
  }
});

module.exports = router;