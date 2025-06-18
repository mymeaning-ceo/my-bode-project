// public/js/stock.js
$(document).ready(function () {
  // DataTable 초기화
  const table = $("#stockTable").DataTable({
    paging: true,
    searching: false,
    info: false,
  });

  // 검색 버튼
  $("#btnSearch").on("click", function () {
    const keyword = $("#keyword").val().trim();
    window.location.href = `/stock/search?keyword=${encodeURIComponent(keyword)}`;
  });

  // 새로고침 버튼
  $("#btnRefresh").on("click", function () {
    window.location.href = "/stock/";
  });

  // 전체 삭제
  $("#btnDeleteAll").on("click", function () {
    if (confirm("정말 전체 삭제하시겠습니까?")) {
      $.ajax({
        url: "/api/stock",
        type: "DELETE",
      })
        .done(() => location.reload())
        .fail((xhr) => alert(xhr.responseText));
    }
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
        location.reload();
      },
      error: (xhr) => {
        alert("업로드 실패: " + xhr.responseText);
      },
    });
  });

  // ─────────────────────────────────────────
  // ARIA 경고 제거: 모달이 열릴 때 aria-hidden 삭제
  // ─────────────────────────────────────────
  $('#uploadModal').on('shown.bs.modal', function () {
    $(this).removeAttr('aria-hidden');
  });
});