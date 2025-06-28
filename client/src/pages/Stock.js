import React, { useEffect, useRef } from 'react';

function Stock() {
  const itemCodeRef = useRef(null);
  const colorRef = useRef(null);
  const sizeRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    const $ = window.$;
    const table = $('#stockTable').DataTable({
      serverSide: true,
      processing: true,
      ordering: true,
      paging: true,
      searching: false,
      dom: 'Bfrtip',
      buttons: ['copy', 'csv', 'excel', 'pdf', 'print', 'colvis'],
      fixedHeader: true,
      lengthChange: true,
      pageLength: 50,
      columnDefs: [
        { targets: '_all', className: 'text-center' },
        {
          targets: 0,
          render: function (data, type, row, meta) {
            return meta.row + meta.settings._iDisplayStart + 1;
          },
        },
        {
          targets: 5,
          createdCell: function (td, cellData) {
            $(td).addClass(cellData < 10 ? 'low-stock' : 'high-stock');
          },
        },
        {
          targets: 8,
          render: function (data) {
            if (!data) return '';
            const d = new Date(data);
            return d.toLocaleString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            });
          },
        },
      ],
      language: {
        paginate: { previous: '이전', next: '다음' },
        info: '총 _TOTAL_건 중 _START_ ~ _END_',
        infoEmpty: '데이터가 없습니다',
      },
      ajax: {
        url: '/api/stock',
        type: 'GET',
        data: function (d) {
          d.item_code = itemCodeRef.current.value.trim();
          d.color = colorRef.current.value.trim();
          d.size = sizeRef.current.value.trim();
        },
        dataSrc: 'data',
      },
      columns: [
        { data: null },
        { data: 'item_code' },
        { data: 'item_name' },
        { data: 'color' },
        { data: 'size' },
        { data: 'qty' },
        { data: 'allocation' },
        { data: 'uploadedBy' },
        { data: 'createdAt' },
      ],
      createdRow: function (row, data) {
        if (data.qty < 10) {
          $(row).addClass('table-danger');
        }
      },
    });

    $('#btnSearch').on('click', function () {
      table.ajax.reload();
    });

    $('#btnRefresh').on('click', function () {
      itemCodeRef.current.value = '';
      colorRef.current.value = '';
      sizeRef.current.value = '';
      table.ajax.reload();
    });

    $(formRef.current).on('submit', function (e) {
      e.preventDefault();
      const formData = new FormData(formRef.current);
      $.ajax({
        url: '/stock/upload',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: () => {
          alert('업로드 성공!');
          table.ajax.reload(null, false);
        },
        error: (xhr) => {
          alert('업로드 실패: ' + xhr.responseText);
        },
      });
    });

    return () => {
      table.destroy();
    };
  }, []);

  return (
    <div className="container my-5">
      <h2 className="fw-bold mb-4">재고 관리</h2>

      <div className="action-form mb-4">
        <form ref={formRef} className="d-flex gap-2 flex-nowrap" encType="multipart/form-data">
          <input type="file" name="excelFile" accept=".xlsx,.xls" className="form-control" required />
          <button type="submit" className="btn btn-success btn-upload">엑셀 업로드</button>
        </form>
        <button id="btnRefresh" className="btn btn-danger btn-reset ms-2">데이터 초기화</button>
      </div>

      <div className="row g-3 align-items-end mb-4 stock-search">
        <div className="col-md-3">
          <label htmlFor="itemCode" className="form-label">품번</label>
          <input ref={itemCodeRef} type="text" id="itemCode" className="form-control" placeholder="품번 입력" />
        </div>
        <div className="col-md-3">
          <label htmlFor="color" className="form-label">색상</label>
          <input ref={colorRef} type="text" id="color" className="form-control" placeholder="색상 입력" />
        </div>
        <div className="col-md-3">
          <label htmlFor="size" className="form-label">사이즈</label>
          <input ref={sizeRef} type="text" id="size" className="form-control" placeholder="사이즈 입력" />
        </div>
        <div className="col-md-3 d-flex gap-2">
          <button id="btnSearch" className="btn btn-outline-primary w-100">검색</button>
        </div>
      </div>

      <div className="table-responsive table-container">
        <table id="stockTable" data-order-col="1" data-order-dir="asc" className="table table-striped table-hover table-bordered shadow-sm rounded bg-white align-middle text-center auto-width">
          <thead className="table-light">
            <tr>
              <th>번호</th>
              <th>품번</th>
              <th>품명</th>
              <th>색상</th>
              <th>사이즈</th>
              <th>수량</th>
              <th>할당</th>
              <th>업로드 사용자</th>
              <th>업로드 시각</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  );
}

export default Stock;
