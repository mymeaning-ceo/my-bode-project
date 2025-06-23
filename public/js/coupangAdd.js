$(function () {
  const $table = $('#coupangAddTable');
  if (!$table.length || $table.data('mode') !== 'detail') return;

  const table = $table.DataTable({
    serverSide: true,
    processing: true,
    paging: true,
    pagingType: 'simple_numbers',
    searching: false,
    info: true,
    pageLength: 50,
    lengthChange: false,
    order: [[0, 'asc']],
    columnDefs: [
      { targets: '_all', className: 'text-center' },
      { targets: [3, 4, 5], render: $.fn.dataTable.render.number(',', '.', 0) },
      { targets: 6, render: (data) => parseFloat(data).toFixed(2) },
    ],
    ajax: {
      url: '/api/coupang-add',
      type: 'GET',
      data: function (d) {
        if (typeof pageSearch !== 'undefined') {
          d.search = pageSearch;
        }
        if (typeof pageBrand !== 'undefined') {
          d.brand = pageBrand;
        }
      },
      dataSrc: 'data',
    },
    columns: [
      { data: '날짜' },
      { data: '광고집행 옵션ID' },
      { data: '광고집행 상품명' },
      { data: '노출수' },
      { data: '클릭수' },
      { data: '광고비' },
      { data: '클릭률' },
    ],
    language: {
      paginate: { previous: '이전', next: '다음' },
      info: '총 _TOTAL_건 중 _START_ ~ _END_',
      infoEmpty: '데이터가 없습니다'
    }
  });

  $('#uploadForm').on('submit', function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    $.ajax({
      url: '/coupang/add/upload',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      success: () => {
        alert('업로드 성공!');
        table.ajax.reload(null, false);
      },
      error: (xhr) => {
        alert('업로드 실패: ' + xhr.responseText);
      }
    });
  });
});
