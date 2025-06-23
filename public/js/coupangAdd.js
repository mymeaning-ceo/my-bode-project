$(function () {
  const mode = typeof pageMode !== 'undefined' ? pageMode : 'detail';
  const $table = $('#coupangAddTable');
  let table;

  if ($table.length && mode === 'detail') {
    table = $table.DataTable({
    serverSide: true,
    processing: true,
    paging: true,
    pagingType: 'simple_numbers',
    searching: false,
    info: true,
    pageLength: 50,
    lengthChange: false,
    responsive: true,
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
    alert('업로드 중입니다. 잠시만 기다려주세요.');
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

    $('#resetForm').on('submit', function () {
      if (!confirm('정말 모든 데이터를 삭제하시겠습니까?')) {
        return false;
      }
      alert('데이터 삭제 중입니다. 잠시만 기다려주세요.');
    });
  }

  // ✅ 검색 처리 (summary/detail 공통)
  $('.search-send').on('click', function () {
    const keyword = $('#search-keyword').val().trim();
    const brand = $('#search-brand').val();
    const params = new URLSearchParams();
    if (mode) params.append('mode', mode);
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
