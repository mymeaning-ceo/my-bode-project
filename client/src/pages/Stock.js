import React, { useEffect, useRef, useState } from 'react';
import './Stock.css';

function Stock() {
  const itemCodeRef = useRef(null);
  const itemNameRef = useRef(null);
  const colorRef = useRef(null);
  const sizeRef = useRef(null);
  const qtyRef = useRef(null);
  const allocationRef = useRef(null);
  const searchItemCodeRef = useRef(null);
  const searchColorRef = useRef(null);
  const searchSizeRef = useRef(null);
  const excelFormRef = useRef(null);
  const manageFormRef = useRef(null);
  const tableRef = useRef(null);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const $ = window.$;
    const table = $('#stockTable').DataTable({
      serverSide: true,
      processing: true,
      ordering: true,
      paging: true,
      searching: false,
      dom: 'Brtip',
      buttons: ['excel'],
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
          d.item_code = searchItemCodeRef.current.value.trim();
          d.color = searchColorRef.current.value.trim();
          d.size = searchSizeRef.current.value.trim();
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
      ],
      createdRow: function (row, data) {
        if (data.qty < 10) {
          $(row).addClass('table-danger');
        }
      },
    });
    tableRef.current = table;

    $('#btnSearch').on('click', function () {
      table.ajax.reload();
    });

    $('#btnRefresh').on('click', function () {
      searchItemCodeRef.current.value = '';
      searchColorRef.current.value = '';
      searchSizeRef.current.value = '';
      table.ajax.reload();
    });

    $(excelFormRef.current).on('submit', function (e) {
      e.preventDefault();
      const formData = new FormData(excelFormRef.current);
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

    $('#stockTable tbody').on('click', 'tr', function () {
      const data = table.row(this).data();
      if (data) {
        setEditing(data);
        itemCodeRef.current.value = data.item_code || '';
        itemNameRef.current.value = data.item_name || '';
        colorRef.current.value = data.color || '';
        sizeRef.current.value = data.size || '';
        qtyRef.current.value = data.qty || 0;
        allocationRef.current.value = data.allocation || 0;
      }
    });

    return () => {
      $('#stockTable tbody').off('click');
      table.destroy();
    };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const body = {
      item_code: itemCodeRef.current.value.trim(),
      item_name: itemNameRef.current.value.trim(),
      color: colorRef.current.value.trim(),
      size: sizeRef.current.value.trim(),
      qty: Number(qtyRef.current.value) || 0,
      allocation: Number(allocationRef.current.value) || 0,
    };
    const url = editing ? `/api/stock/${editing._id}` : '/api/stock';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    if (res.ok && tableRef.current) {
      tableRef.current.ajax.reload(null, false);
    }
    manageFormRef.current.reset();
    setEditing(null);
  };

  const handleCancel = () => {
    manageFormRef.current.reset();
    setEditing(null);
  };

  return (
    <div className="container my-5">
      <h2 className="fw-bold mb-4">재고 관리</h2>

      <div className="action-form mb-4">
        <form ref={excelFormRef} className="d-flex gap-2 flex-nowrap" encType="multipart/form-data">
          <input type="file" name="excelFile" accept=".xlsx,.xls" className="form-control" required />
          <button type="submit" className="btn btn-success btn-upload">엑셀 업로드</button>
        </form>
        <button id="btnRefresh" className="btn btn-danger btn-reset ms-2">데이터 초기화</button>
      </div>

      <form ref={manageFormRef} className="row g-2 mb-4 stock-actions" onSubmit={handleSave}>
        <div className="col-sm">
          <input ref={itemCodeRef} className="form-control" placeholder="품번" required />
        </div>
        <div className="col-sm">
          <input ref={itemNameRef} className="form-control" placeholder="품명" required />
        </div>
        <div className="col-sm">
          <input ref={colorRef} className="form-control" placeholder="색상" />
        </div>
        <div className="col-sm">
          <input ref={sizeRef} className="form-control" placeholder="사이즈" />
        </div>
        <div className="col-sm">
          <input ref={qtyRef} type="number" className="form-control" placeholder="수량" />
        </div>
        <div className="col-sm">
          <input ref={allocationRef} type="number" className="form-control" placeholder="할당" />
        </div>
        <div className="col-auto">
          <button type="submit" className="btn btn-primary">
            {editing ? '수정' : '추가'}
          </button>
        </div>
        {editing && (
          <div className="col-auto">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>취소</button>
          </div>
        )}
      </form>

      <div className="row g-3 align-items-end mb-4 stock-search">
        <div className="col-md-3">
          <label htmlFor="itemCode" className="form-label">품번</label>
          <input ref={searchItemCodeRef} type="text" id="itemCode" className="form-control" placeholder="품번 입력" />
        </div>
        <div className="col-md-3">
          <label htmlFor="color" className="form-label">색상</label>
          <input ref={searchColorRef} type="text" id="color" className="form-control" placeholder="색상 입력" />
        </div>
        <div className="col-md-3">
          <label htmlFor="size" className="form-label">사이즈</label>
          <input ref={searchSizeRef} type="text" id="size" className="form-control" placeholder="사이즈 입력" />
        </div>
        <div className="col-md-3 d-flex gap-2">
          <button id="btnSearch" className="btn btn-outline-primary">검색</button>
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
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  );
}

export default Stock;
