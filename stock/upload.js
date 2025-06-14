const multer = require("multer");
const path = require("path");
const { spawn } = require("child_process");

// ✅ multer 저장 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // 업로드 파일 저장 경로
  },
  filename: function (req, file, cb) {
    const uniqueName = `excel_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ✅ /stock/upload POST 라우터 (엑셀 업로드 처리)
router.post("/upload", upload.single("excelFile"), (req, res) => {
  const filePath = path.resolve(req.file.path); // 실제 저장된 경로
  const dbName = "forum";
  const collectionName = "stock";

  const python = spawn("python", [
    "scripts/excel_to_mongo.py",
    filePath,
    dbName,
    collectionName,
  ]);

  // stdout 로그 확인 (성공 메시지 등)
  python.stdout.on("data", (data) => {
    console.log(`📤 Python STDOUT: ${data}`);
  });

  // stderr 로그 확인 (에러 추적용)
  python.stderr.on("data", (data) => {
    console.error(`⚠️ Python STDERR: ${data}`);
  });

  // 프로세스 종료 후 응답 처리
  python.on("close", (code) => {
    if (code === 0) {
      if (req.flash)
        req.flash("성공메시지", "✅ 엑셀 업로드가 완료되었습니다.");
      res.redirect("/stock");
    } else {
      res.status(500).send("❌ 엑셀 처리 중 오류가 발생했습니다.");
    }
  });
});
