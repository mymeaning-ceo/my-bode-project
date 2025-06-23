$(function () {
  const table = $('#summaryTable');
  if (!table.length) return;
  table.DataTable({
    ordering: true,
    order: [[1, 'asc']],
    paging: false,
    searching: false,
    info: false,
    lengthChange: false,
    responsive: true,
    columnDefs: [{ targets: '_all', className: 'text-center' }],
    language: {
      paginate: { previous: '이전', next: '다음' },
      info: '총 _TOTAL_건 중 _START_ ~ _END_',
      infoEmpty: '데이터가 없습니다'
    }
  });

  // 검색 핸들러 (요약 화면)
  $('.search-send').on('click', function () {
    const keyword = $('#search-keyword').val().trim();
    const brand = $('#search-brand').val();
    const params = new URLSearchParams();
    params.append('mode', 'summary');
    if (keyword) params.append('search', keyword);
    if (brand) params.append('brand', brand);
    window.location.href = '/coupang/add?' + params.toString();
  });

  $('#search-keyword').on('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      $('.search-send').click();
    }
  });
});
