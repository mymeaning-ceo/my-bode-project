function createDataTable(selector, opts = {}) {
  return $(selector).DataTable(
    Object.assign(
      {
        lengthChange: false,
        pagingType: 'simple_numbers',
        responsive: true,
        language: {
          paginate: { previous: '이전', next: '다음' },
          info: '총 _TOTAL_건 중 _START_ ~ _END_',
          infoEmpty: '데이터가 없습니다',
          emptyTable: '데이터가 없습니다.'
        }
      },
      opts
    )
  );
}
