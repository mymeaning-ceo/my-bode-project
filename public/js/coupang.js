$(function () {
  if (!$('#coupangTable').length) return;

  $('#btn-filter-reorder').on('click', function () {
    var url = new URL(window.location.href);
    var show = url.searchParams.get('shortage') === '1';
    if (show) url.searchParams.delete('shortage');
    else url.searchParams.set('shortage', '1');
    url.searchParams.set('page', '1');
    window.location.href = url.toString();
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
