// public/js/stock.js

// 심플한 테이블 디자인을 위해 불필요한 장식 요소 제거

$(document).ready(function () {
  // DataTable 초기화
  const table = createDataTable('#stockTable', {
    serverSide: true,
    processing: true,
    ordering: true,
    paging: true,
    searching: false,
    dom: 'lrtip',
    info: true,
    pageLength: 50,
    columnDefs: [
      { targets: "_all", className: "text-center" },
      {
        targets: 0,
        render: function (data, type, row, meta) {
          return meta.row + meta.settings._iDisplayStart + 1;
        },
      },
      {
        targets: 1,
        render: function (data) {
          // 품번 옆 배지를 제거하여 보다 깔끔한 출력
          return data;
        },
      },
      {
        targets: 5,
        createdCell: function (td, cellData) {
          $(td).addClass(cellData < 10 ? "low-stock" : "high-stock");
        },
        render: function (data) {
          // 이모지 대신 수량만 표시
          return data;
        },
      },
      {
        targets: 8,
        render: function (data) {
          if (!data) return "";
          const d = new Date(data);
          return d.toLocaleString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        },
      },
    ],
    language: {
      paginate: { previous: "이전", next: "다음" },
      info: "총 _TOTAL_건 중 _START_ ~ _END_",
      infoEmpty: "데이터가 없습니다",
    },
    ajax: {
      url: "/api/stock",
      type: "GET",
      data: function (d) {
        d.item_code = $("#itemCode").val().trim();
        d.color = $("#color").val().trim();
        d.size = $("#size").val().trim();
      },
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
    createdRow: function (row, data) {
      if (data.qty < 10) {
        $(row).addClass("table-danger");
      }
    },
  });

  // 검색 버튼
  $("#btnSearch").on("click", function () {
    table.ajax.reload();
  });

  // 새로고침 버튼
  $("#btnRefresh").on("click", function () {
    $("#itemCode").val("");
    $("#color").val("");
    $("#size").val("");
    table.ajax.reload();
  });

  // 엑셀 업로드
  $("#uploadForm").on("submit", function (e) {
    e.preventDefault();
    const formData = new FormData(this);

    $.ajax({
      url: "/stock/upload", // 서버 라우터와 일치
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
