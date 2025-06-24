$(function () {
  if (!$('#coupangTable').length) return;

  const url = new URL(window.location.href);
  const showReorderOnly = url.searchParams.get('shortage') === '1';

  // ✅ DataTable 초기화
  const table = createDataTable('#coupangTable', {
    ordering: true,
    columnDefs: [
      { targets: '_all', className: 'text-center' },
      // 텍스트 색상을 기본값으로 돌려 가독성을 높인다
      { targets: 1, className: 'text-start' },
      { targets: 2, className: 'text-start' }
    ],
    paging: false,
    searching: false,
    info: false,
    language: { emptyTable: '📭 재고가 없습니다.' }
  });

  // ✅ 입고필요 필터 버튼
  if (showReorderOnly) {
    $('#btn-filter-reorder').text('전체 보기');
  }

  $('#btn-filter-reorder').on('click', function () {
    const url = new URL(window.location.href);
    if (showReorderOnly) {
      url.searchParams.delete('shortage');
    } else {
      url.searchParams.set('shortage', '1');
    }
    url.searchParams.set('page', '1');
    window.location.href = url.toString();
  });

  // ✅ 정렬 버튼 클릭 → URL 쿼리 갱신
  $('#coupangTable thead').on('click', 'th.sortable', function () {
    const field = $(this).data('field');
    if (!field) return;

    const url = new URL(window.location.href);
    const currentSort = url.searchParams.get('sort') || 'Product name';
    const currentOrder = url.searchParams.get('order') || 'asc';
    const nextOrder = (currentSort === field && currentOrder === 'asc') ? 'desc' : 'asc';

    url.searchParams.set('sort', field);
    url.searchParams.set('order', nextOrder);
    url.searchParams.set('page', '1');
    window.location.href = url.toString();
  });

  // ✅ CSV 다운로드 (입고필요 항목만, 전체 컬럼 포함)
  $('#btn-download-csv').on('click', function () {
    const rows = [];
    $('#coupangTable tbody tr').each(function () {
      const shortage = Number($(this).data('shortage') || '0');
      if (shortage > 0) {
        const cols = $(this).find('td').map(function () {
          return $(this).text().trim().replace(/,/g, '');
        }).get(); // 모든 컬럼 포함
        rows.push(cols.join(','));
      }
    });

    if (!rows.length) {
      alert('입고 필요 항목이 없습니다.');
      return;
    }

    const csv = '\ufeff' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'reorder.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // ✅ 검색 처리
  $('.search-send').on('click', function () {
    const brand = $('#search-brand').val();
    const keyword = $('#search-keyword').val().trim();
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (brand) params.append('brand', brand);
    window.location.href = '/coupang/search?' + params.toString();
  });

  $('#search-keyword').on('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      $('.search-send').click();
    }
  });

  // ✅ 엑셀 업로드 (AJAX)
  $('#uploadForm').on('submit', function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    $.ajax({
      url: '/coupang/upload',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      success: function () {
        alert('업로드 성공!');
        window.location.reload();
      },
      error: function (xhr) {
        alert('업로드 실패: ' + xhr.responseText);
      }
    });
  });

  // ✅ 데이터 초기화
  $('#resetForm').on('submit', function (e) {
    e.preventDefault();
    if (!confirm('정말 모든 데이터를 삭제하시겠습니까?')) return;
    $.ajax({
      url: '/coupang/delete-all',
      type: 'POST',
      success: function () {
        alert('데이터가 초기화되었습니다.');
        window.location.reload();
      },
      error: function (xhr) {
        alert('삭제 실패: ' + xhr.responseText);
      }
    });
  });
});
