$(function () {
  const mode = typeof pageMode !== 'undefined' ? pageMode : 'detail';
  const $table = $('#coupangAddTable');
  let table;

  if ($table.length && mode === 'detail') {
    table = createDataTable('#coupangAddTable', {
    serverSide: true,
    processing: true,
    paging: true,
    searching: false,
    info: true,
    pageLength: 50,
    columnDefs: [
      { targets: '_all', className: 'text-center' },
      // 텍스트 컬러는 기본 색상 사용
      { targets: 1, className: 'text-start' },
      { targets: 2, className: 'text-start' },
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
    ]
  });

  $('#uploadForm').on('submit', function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    $('#uploadProgress').removeClass('d-none');
    $('#uploadProgress .progress-bar').css('width', '0%').text('0%');
    $.ajax({
      url: '/coupang/add/upload',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      xhr: function () {
        const xhr = new window.XMLHttpRequest();
        xhr.upload.addEventListener('progress', function (evt) {
          if (evt.lengthComputable) {
            const percent = Math.round((evt.loaded / evt.total) * 100);
            $('#uploadProgress .progress-bar')
              .css('width', percent + '%')
              .text(percent + '%');
          }
        });
        return xhr;
      },
      success: () => {
        $('#uploadProgress .progress-bar').text('100%');
        alert('업로드 성공!');
        table.ajax.reload(null, false);
      },
      error: (xhr) => {
        alert('업로드 실패: ' + xhr.responseText);
        $('#uploadProgress').addClass('d-none');
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

    if (table && mode === 'detail') {
      pageSearch = keyword;
      pageBrand = brand;
      table.ajax.reload();
      return;
    }

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
