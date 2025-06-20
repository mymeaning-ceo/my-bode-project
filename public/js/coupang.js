$(function () {
  if (!$('#coupangTable').length) return;
  $('#coupangTable').DataTable({
    ordering: true,
    order: [[1, 'asc']],
    columnDefs: [{ targets: 0, orderable: false }],
    lengthChange: false,
    paging: true,
    pageLength: 50,
    pagingType: 'numbers',
    searching: false,
    info: true,
    language: {
      paginate: { previous: '이전', next: '다음' },
      info: '총 _TOTAL_건 중 _START_ ~ _END_',
      infoEmpty: '데이터가 없습니다'
    }
  });
});
