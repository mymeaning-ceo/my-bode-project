$(function () {
  if (!$('#coupangTable').length) return;

  const url = new URL(window.location.href);
  const showReorderOnly = url.searchParams.get('shortage') === '1';

  // ✅ DataTable 초기화
  const table = $('#coupangTable').DataTable({
    ordering: true,
    columnDefs: [
      { targets: '_all', className: 'text-center' }
    ],
    lengthChange: false,
    paging: false,
    searching: false,
    info: false,
    responsive: true,
    language: {
      paginate: { previous: '이전', next: '다음' },
      info: '총 _TOTAL_건 중 _START_ ~ _END_',
      infoEmpty: '데이터가 없습니다'
    }
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
});
