$(function () {
  const table = '#dailyTable';
  if (!$(table).length) return;
  createDataTable(table, {
    ordering: true,
    order: [[0, 'asc']],
    paging: false,
    searching: false,
    info: false,
    lengthChange: false,
    responsive: true,
    columnDefs: [{ targets: '_all', className: 'text-center' }],
  });
});
