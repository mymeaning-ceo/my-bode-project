// public/js/stock.js
document.addEventListener('DOMContentLoaded', () => {
    // ──────────────────────────────────────────
    // 1) DataTables 초기화 (서버사이드 모드)
    // ──────────────────────────────────────────
    const table = $('#stockTable').DataTable({
      serverSide: true,
      processing: true,
      pageLength: 50,
      ajax: (data, callback) => {
        const page = data.start / data.length + 1;
        const keyword = document.getElementById('keyword').value;
        fetch(
          `/api/stock?page=${page}&limit=${data.length}&keyword=${encodeURIComponent(
            keyword
          )}`
        )
          .then(res => res.json())
          .then(json => {
            // 재고 부족(10 이하) 색상 표시를 위해 HTML 가공
            const rows = json.data.map(r => [
              r.item_code,
              r.item_name,
              r.color,
              r.size,
              `<span class="${
                r.qty !== null && r.qty <= 10 ? 'low-stock' : ''
              }">${r.qty?.toLocaleString('ko-KR') ?? ''}</span>`,
              r.allocation
            ]);
  
            callback({
              draw: data.draw,
              recordsTotal: json.total,
              recordsFiltered: json.total,
              data: rows
            });
          })
          .catch(() => callback({ data: [], recordsTotal: 0, recordsFiltered: 0 }));
      }
    });
  
    // ──────────────────────────────────────────
    // 2) 검색 / 새로고침
    // ──────────────────────────────────────────
    document.getElementById('btnSearch').addEventListener('click', () => {
      table.ajax.reload();
    });
    document.getElementById('btnRefresh').addEventListener('click', () => {
      document.getElementById('keyword').value = '';
      table.ajax.reload();
    });
  
    // ──────────────────────────────────────────
    // 3) 엑셀 업로드
    // ──────────────────────────────────────────
    document
      .getElementById('uploadForm')
      .addEventListener('submit', async e => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
          const res = await fetch('/api/stock/upload', {
            method: 'POST',
            body: formData
          });
          console.log('status', res.status);          // ← 추가
          console.log('ok?', res.ok);                 // ← 추가
          console.log('content-type', res.headers.get('content-type')); // ← 추가

          if (!res.ok) throw new Error();
          bootstrap.Modal.getInstance(
            document.getElementById('uploadModal')
          ).hide();
          alert('업로드 완료');
          table.ajax.reload();
        } catch {
          alert('업로드 실패');
        }
      });
  
    // ──────────────────────────────────────────
    // 4) 전체 삭제
    // ──────────────────────────────────────────
    document
      .getElementById('btnDeleteAll')
      .addEventListener('click', async () => {
        if (!confirm('정말 모든 데이터를 삭제하시겠습니까?')) return;
        try {
          const res = await fetch('/api/stock', { method: 'DELETE' });
          if (!res.ok) throw new Error();
          alert('삭제 완료');
          table.ajax.reload();
        } catch {
          alert('삭제 실패');
        }
      });
  });