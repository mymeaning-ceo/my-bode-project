router.post('/upload', checkLogin, upload.single('excelFile'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).send('❌ 파일이 업로드되지 않았습니다.');
  
      const filePath = req.file.path;
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
      if (!data[0] || typeof data[0] !== 'object') {
        return res.status(400).send('❌ 엑셀 첫 줄에 필드명(헤더)이 없습니다.');
      }
      
      // ✅ 기존 stock 컬렉션 데이터 전체 삭제
      await db.collection('stock').deleteMany({});
  
      // ✅ 새 데이터 삽입
      await db.collection('stock').insertMany(data);
  
      // ✅ 업로드된 엑셀 파일 삭제
      fs.unlink(filePath, err => {
        if (err) console.error('파일 삭제 실패:', err);
      });
  
      res.redirect('/stock');
    } catch (err) {
      
      console.error('엑셀 업로드 오류:', err);
      res.status(500).send('❌ 업로드 실패');
    }
  });
  