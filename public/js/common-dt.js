function createDataTable(selector, opts = {}) {
  const options = Object.assign(
    {
      lengthChange: false,
      pagingType: 'simple_numbers',
      responsive: true,
      fixedHeader: true,
      ordering: true,
      language: {
        paginate: { previous: '이전', next: '다음' },
        info: '총 _TOTAL_건 중 _START_ ~ _END_',
        infoEmpty: '데이터가 없습니다',
        emptyTable: '데이터가 없습니다.'
      }
    },
    opts
  );

  const table = $(selector).DataTable(options);

  // ─────────────────────────────────────────────
  // Row details toggle
  // ─────────────────────────────────────────────
  const headers = $(selector + ' thead th')
    .map(function () {
      return $(this).text().trim();
    })
    .get();

  function formatRow(data) {
    const cols = table.settings()[0].aoColumns;
    const isArray = Array.isArray(data);
    let html = '<table class="table table-sm mb-0">';
    for (let i = 0; i < cols.length; i++) {
      const title = headers[i] || $(cols[i].nTh).text();
      const key = cols[i].data;
      const value = isArray ? data[i] : data[key];
      html += `<tr><th>${title}</th><td>${value ?? ''}</td></tr>`;
    }
    html += '</table>';
    return html;
  }

  $(selector + ' tbody').on('click', 'tr', function (e) {
    // ignore clicks on interactive elements
    if (
      $(e.target).closest('a, button, input, label, textarea, select').length
    ) {
      return;
    }
    const row = table.row(this);
    if (row.child.isShown()) {
      row.child.hide();
      $(this).removeClass('shown');
    } else {
      row.child(formatRow(row.data())).show();
      $(this).addClass('shown');
    }
  });

  return table;
}
