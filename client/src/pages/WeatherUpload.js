import React, { useRef } from 'react';

function WeatherUpload() {
  const formRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(formRef.current);
    const res = await fetch('/api/weather/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    if (res.ok) {
      alert('업로드 완료');
      formRef.current.reset();
    } else {
      const err = await res.text();
      alert('업로드 실패: ' + err);
    }
  };

  return (
    <div className="container my-5">
      <h2 className="fw-bold mb-4">월별 날씨 업로드</h2>
      <form ref={formRef} onSubmit={handleSubmit} encType="multipart/form-data" className="d-flex gap-2">
        <input type="file" name="excelFile" accept=".xlsx,.xls" className="form-control" required />
        <button type="submit" className="btn btn-primary">업로드</button>
      </form>
    </div>
  );
}

export default WeatherUpload;
