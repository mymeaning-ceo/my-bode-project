// public/js/stock.js

function getStockIcon(qty) {
  if (qty < 5) return '🔴';
  else if (qty < 20) return '🟡';
  return '🟢';
}

function getBrandBadge(code) {
  if (typeof code === 'string' && code.startsWith('TD')) {
    return '<span class="badge badge-try">TRY</span>';
  }
  return '';
}

$(document).ready(function () {
  // DataTable 초기화
  const table = $("#stockTable").DataTable({
    serverSide: true,
    processing: true,
    paging: true,
    pagingType: 'simple_numbers',
    searching: false,
    info: true,
    pageLength: 50,
    lengthChange: false,
    responsive: true,
    columnDefs: [
      { targets: '_all', className: 'text-center' },
      {
        targets: 0,
        render: function (data, type, row, meta) {
          return meta.row + meta.settings._iDisplayStart + 1;
        }
      },
      {
        targets: 1,
        render: function (data) {
          return data + ' ' + getBrandBadge(data);
        }
      },
      {
        targets: 5,
        createdCell: function (td, cellData) {
          $(td).addClass(cellData < 10 ? 'low-stock' : 'high-stock');
        },
        render: function (data) {
          return getStockIcon(data) + ' ' + data;
        }
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
        }
      }
    ],
    language: {
      paginate: { previous: '이전', next: '다음' },
      info: '총 _TOTAL_건 중 _START_ ~ _END_',
      infoEmpty: '데이터가 없습니다'
    },
    ajax: {
      url: "/api/stock",
      type: "GET",
      dataSrc: "data",
    },
    columns: [
      { data: null },
      { data: "item_code" },
      { data: "item_name" },
      { data: "color" },
      { data: "size" },
      { data: "qty" },
      { data: "allocation" },
      { data: "uploadedBy" },
      { data: "createdAt" },
    ],
  });

  // 검색 버튼
  $("#btnSearch").on("click", function () {
    const keyword = $("#keyword").val().trim();
    table.search(keyword).draw();
  });

  // 새로고침 버튼
  $("#btnRefresh").on("click", function () {
    $("#keyword").val("");
    table.search("").draw();
  });


  // 엑셀 업로드
  $("#uploadForm").on("submit", function (e) {
    e.preventDefault();
    const formData = new FormData(this);

    $.ajax({
      url: "/stock/upload",   // 서버 라우터와 일치
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      success: () => {
        alert("업로드 성공!");
        table.ajax.reload(null, false); // 페이지 유지한 채 데이터만 갱신
      },
      error: (xhr) => {
        alert("업로드 실패: " + xhr.responseText);
      },
    });
  });
});
