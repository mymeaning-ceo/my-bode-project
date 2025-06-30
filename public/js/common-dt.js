// limit pagination to show at most 10 page buttons
$.fn.DataTable.ext.pager.numbers_length = 10;

function createDataTable(selector, opts = {}) {
  const $table = $(selector);
  const orderCol = Number($table.data('order-col'));
  const orderDir = $table.data('order-dir') || 'asc';

  const options = {
    lengthChange: false,
    pagingType: 'simple_numbers',
    responsive: true,
    fixedHeader: true,
    language: {
      paginate: { previous: '이전', next: '다음' },
      info: '총 _TOTAL_건 중 _START_ ~ _END_',
      infoEmpty: '데이터가 없습니다',
      emptyTable: '데이터가 없습니다.'
    }
  };

  if (!isNaN(orderCol)) {
    options.order = [[orderCol, orderDir]];
  }

  return $table.DataTable(Object.assign(options, opts));
}
