document.addEventListener("DOMContentLoaded", () => {
  const table = $("#stockTable").DataTable({
    serverSide: true,
    processing: true,
    pageLength: 50,
    ajax: (data, cb) => {
      const page = data.start / data.length + 1;
      const keyword = $("#keyword").val();
      fetch(
        `/api/stock?page=${page}&limit=${data.length}&keyword=${encodeURIComponent(keyword)}`,
      )
        .then((r) => r.json())
        .then((json) => {
          const rows = json.data.map((r) => [
            r.item_code,
            r.item_name,
            r.color,
            r.size,
            `<span class="${r.qty <= 10 ? "low-stock" : ""}">${r.qty?.toLocaleString("ko-KR") ?? ""}</span>`,
            r.allocation,
          ]);
          cb({
            data: rows,
            recordsTotal: json.total,
            recordsFiltered: json.total,
          });
        });
    },
  });

  $("#btnSearch").on("click", () => table.ajax.reload());
  $("#btnRefresh").on("click", () => {
    $("#keyword").val("");
    table.ajax.reload();
  });

  $("#uploadForm").on("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const res = await fetch("/api/stock/upload", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      bootstrap.Modal.getInstance("#uploadModal").hide();
      alert("업로드 완료");
      table.ajax.reload();
    } else alert("업로드 실패");
  });

  $("#btnDeleteAll").on("click", async () => {
    if (!confirm("정말 모든 데이터를 삭제하시겠습니까?")) return;
    const res = await fetch("/api/stock", { method: "DELETE" });
    if (res.ok) {
      alert("삭제 완료");
      table.ajax.reload();
    } else alert("삭제 실패");
  });
});
