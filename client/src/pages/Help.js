import React from 'react';
import './Help.css';

function Help() {
  return (
    <div className="container my-5">
      <h2 className="mb-4 fw-bold">❓ 사용 방법</h2>
      <ul>
        <li>재고 또는 쿠팡 재고 페이지에서 엑셀 파일을 업로드해 데이터를 등록합니다.</li>
        <li>테이블 헤더를 클릭하거나 헤더 위에 있는 셀렉트 박스로 각 컬럼을 오름차순 또는 내림차순으로 정렬할 수 있습니다.</li>
      </ul>
    </div>
  );
}

export default Help;
