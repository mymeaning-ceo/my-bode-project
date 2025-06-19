// public/js/stock.js
$(document).ready(function () {
  // DataTable 초기화
  const table = $("#stockTable").DataTable({
    serverSide: true,
    processing: true,
    paging: true,
    searching: false,
    info: false,
    pageLength: 50,
    lengthChange: false,
    columnDefs: [
      { targets: '_all', className: 'text-center' },
      {
        targets: 0,
        render: function (data, type, row, meta) {
          return meta.row + meta.settings._iDisplayStart + 1;
        }
      },
      {
        targets: 8,
        render: function (data) {
          if (!data) return '';
          const d = new Date(data);
          return d.toLocaleString('ko-KR');
        }
      }
    ],
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