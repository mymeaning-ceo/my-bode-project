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
});
