$(function () {
  if (!$('#coupangTable').length) return;
  var url = new URL(window.location.href);
  var showReorderOnly = url.searchParams.get('shortage') === '1';
  var table = $('#coupangTable').DataTable({
    ordering: false,
    columnDefs: [
      { targets: '_all', className: 'text-center' },
      { targets: 0, orderable: false }
    ],
    lengthChange: false,
    paging: false,
    searching: false,
    info: false,
    responsive: true,
    language: {
      paginate: { previous: '이전', next: '다음' },
      info: '총 _TOTAL_건 중 _START_ ~ _END_',
      infoEmpty: '데이터가 없습니다'
    }
  });

  if (showReorderOnly) {
    $('#btn-filter-reorder').text('전체 보기');
  }

  $('#btn-filter-reorder').on('click', function () {
    var url = new URL(window.location.href);
    if (showReorderOnly) {
      url.searchParams.delete('shortage');
    } else {
      url.searchParams.set('shortage', '1');
    }
    url.searchParams.set('page', '1');
    window.location.href = url.pathname + '?' + url.searchParams.toString();
  });

  $('#coupangTable thead').on('click', 'th.sortable', function () {
    var field = $(this).data('field');
    if (!field) return;
    var url = new URL(window.location.href);
    var currentSort = url.searchParams.get('sort') || 'Product name';
    var currentOrder = url.searchParams.get('order') || 'asc';
    var order = 'asc';
    if (currentSort === field && currentOrder === 'asc') {
      order = 'desc';
    }
    url.searchParams.set('sort', field);
    url.searchParams.set('order', order);
    url.searchParams.set('page', '1');
    window.location.href = url.pathname + '?' + url.searchParams.toString();
  });

  $('#btn-download-csv').on('click', function () {
    var rows = [];
    $('#coupangTable tbody tr').each(function () {
      var shortage = Number($(this).data('shortage')) || 0;
      if (shortage > 0) {
        var cols = $(this).find('td').map(function () {
          return $(this).text().trim().replace(/,/g, '');
        }).get().slice(1);
        rows.push(cols.join(','));
      }
    });
    if (!rows.length) {
      alert('입고 필요 항목이 없습니다.');
      return;
    }
    var csv = '\ufeff' + rows.join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'reorder.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
});
