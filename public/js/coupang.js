$(function () {
  if (!$('#coupangTable').length) return;

  // ─────────────────────────────────────────
  // 헤더 선택 저장/복원
  // ─────────────────────────────────────────
  const storedFields = JSON.parse(localStorage.getItem('coupangFields') || '[]');
  const url = new URL(window.location.href);
  const currentFields = url.searchParams.getAll('fields');
  if (storedFields.length > 0 && currentFields.length === 0) {
    storedFields.forEach((f) => url.searchParams.append('fields', f));
    window.location.replace(url.toString());
    return;
  }

  const showReorderOnly = url.searchParams.get('shortage') === '1';

  // ✅ DataTable 초기화
  const table = createDataTable('#coupangTable', {
    ordering: true,
    columnDefs: [
      { targets: '_all', className: 'text-center' },
      // 텍스트 색상을 기본값으로 돌려 가독성을 높인다
      { targets: 1, className: 'text-start' },
      { targets: 2, className: 'text-start' }
    ],
    paging: false,
    searching: false,
    info: false,
    language: { emptyTable: '📭 재고가 없습니다.' }
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

  const fields = $('#coupangTable thead th.sortable')
    .map(function () {
      return $(this).data('field');
    })
    .get();

  function buildRow(row, idx) {
    const shortage = Number(row['Shortage quantity'] || 0);
    const sales30 = Number(row['Sales in the last 30 days'] || 0);
    const stock = Number(row['Orderable quantity (real-time)'] || 0);
    let html =
      `<tr class="text-center" data-shortage="${shortage}" data-sales="${sales30}" data-stock="${stock}">` +
      `<td class="text-center">${idx + 1}</td>`;
    fields.forEach((key) => {
      if (key === 'Option ID') {
        html += `<td class="text-center">${row[key]}</td>`;
      } else {
        const val = row[key];
        const numVal = Number(val);
        const isNum = !isNaN(numVal) && val !== '-' && val !== '';
        html += `<td class="text-center${key === 'Shortage quantity' && shortage > 0 ? ' low-stock' : ''}"`;
        if (isNum) html += ` data-order="${numVal}"`;
        html += '>' + (isNum ? (numVal === 0 ? '-' : numVal.toLocaleString('ko-KR')) : val) + '</td>';
      }
    });
    html += '</tr>';
    return html;
  }

  function updateTable(rows, order) {
    const html = rows.map((r, i) => buildRow(r, i)).join('');
    const $tbody = $('#coupangTable tbody');
    table.clear().draw();
    $tbody.html(html);
    table.rows.add($tbody.find('tr')).draw(false);
    $('#coupangTable thead th.sortable .sort-indicator').text('');
    if (order.field) {
      const indicator = order.dir === 'asc' ? '▲' : '▼';
      $(`#coupangTable thead th.sortable[data-field="${order.field}"] .sort-indicator`).text(indicator);
    }
  }

  // ✅ 정렬 버튼 클릭 → AJAX 로드
  $('#coupangTable thead').on('click', 'th.sortable', function () {
    const $th = $(this);
    const field = $th.data('field');
    if (!field) return;

    const url = new URL(window.location.href);
    const currentSort = url.searchParams.get('sort') || 'Product name';
    const currentOrder = url.searchParams.get('order') || 'asc';
    const nextOrder = currentSort === field && currentOrder === 'asc' ? 'desc' : 'asc';

    url.searchParams.set('sort', field);
    url.searchParams.set('order', nextOrder);
    url.searchParams.set('page', '1');

    $.ajax({
      url: url.pathname + url.search,
      dataType: 'json',
      success: function (res) {
        updateTable(res.rows || [], { field, dir: nextOrder });
        history.replaceState({}, '', url.toString());
      },
      error: function () {
        window.location.href = url.toString();
      },
    });
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

  // ✅ 엑셀 업로드 (AJAX)
  function pollProgress(id) {
    const timer = setInterval(function () {
      $.getJSON('/api/jobs/' + id, function (data) {
        if (data.progress == null) return;
        $('#uploadProgress .progress-bar')
          .css('width', data.progress + '%')
          .text(data.progress + '%');
        if (data.progress >= 100) {
          clearInterval(timer);
          $('#uploadProgress').addClass('d-none');
          alert('업로드 성공!');
          window.location.reload();
        }
      });
    }, 1000);
  }

  $('#uploadForm').on('submit', function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    $('#uploadProgress').removeClass('d-none');
    $('#uploadProgress .progress-bar').css('width', '0%').text('0%');
    $.ajax({
      url: '/coupang/upload',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      success: function (res) {
        if (res.jobId) pollProgress(res.jobId);
      },
      error: function () {
        $('#uploadProgress').addClass('d-none');
      }
    });
  });

  // ✅ 데이터 초기화
  $('#resetForm').on('submit', function (e) {
    e.preventDefault();
    if (!confirm('정말 모든 데이터를 삭제하시겠습니까?')) return;
    $.ajax({
      url: '/coupang/delete-all',
      type: 'POST',
      success: function () {
        alert('데이터가 초기화되었습니다.');
        window.location.reload();
      },
      error: function (xhr) {
        alert('삭제 실패: ' + xhr.responseText);
      }
    });
  });

  // ─────────────────────────────────────────
  // 헤더 선택 이벤트
  // ─────────────────────────────────────────
  if ($('#headerSelectForm').length) {
    if (storedFields.length > 0) {
      $('#headerSelectForm input[name="fields"]').each(function () {
        $(this).prop('checked', storedFields.includes($(this).val()));
      });
    }

    $('#btn-select-all').on('click', function () {
      $('#headerSelectForm input[name="fields"]').prop('checked', true);
    });

    $('#btn-deselect-all').on('click', function () {
      $('#headerSelectForm input[name="fields"]').prop('checked', false);
    });

    $('#headerSelectForm').on('submit', function () {
      const selected = $('#headerSelectForm input[name="fields"]:checked')
        .map(function () {
          return $(this).val();
        })
        .get();
      localStorage.setItem('coupangFields', JSON.stringify(selected));
    });
  }
});
