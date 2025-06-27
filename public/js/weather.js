$(async function () {
  try {
    const res = await fetch('/api/weather/daily');
    const data = await res.json();
    const skyMap = { '1': '맑음', '3': '구름많음', '4': '흐림' };
    const ptyMap = { '0': '없음', '1': '비', '2': '비/눈', '3': '눈', '4': '소나기' };
    $('#weatherBody').html(
      `<tr><td>${data.temperature ?? '-'}</td><td>${skyMap[data.sky] ?? data.sky ?? '-'}</td><td>${ptyMap[data.precipitationType] ?? data.precipitationType ?? '-'}</td></tr>`
    );

    // fetch summary
    const sumRes = await fetch('/api/weather/summary');
    if (sumRes.ok) {
      const s = await sumRes.json();
      $('#summaryBody').html(
        `<tr><td>${s.averageMax}</td><td>${s.averageMin}</td><td>${s.averagePop}</td></tr>`
      );
    }

    $('#periodSelect').on('change', function () {
      if (this.value === 'same') {
        $('#yearsGroup').show();
      } else {
        $('#yearsGroup').hide();
      }
    });

    $('#historyForm').on('submit', async function (e) {
      e.preventDefault();
      const date = $('#queryDate').val();
      const period = $('#periodSelect').val();
      let url;
      if (period === 'day') {
        url = `/api/weather/date/${date}`;
      } else if (period === 'same') {
        const years = $('#yearsInput').val() || 1;
        url = `/api/weather/same-day?date=${date}&years=${years}`;
      } else {
        url = `/api/weather/range?date=${date}&period=${period}`;
      }
      const r = await fetch(url);
      if (r.ok) {
        const arr = await r.json();
        const rows = Array.isArray(arr) ? arr : [arr];
        $('#historyBody').html(
          rows
            .map(
              (d) =>
                `<tr><td>${d._id}</td><td>${d.TMX ?? ''}</td><td>${d.TMN ?? ''}</td><td>${d.POP ?? ''}</td><td>${d.PCP ?? ''}</td></tr>`
            )
            .join('') || '<tr><td colspan="5">No data</td></tr>'
        );
      } else {
        $('#historyBody').html('<tr><td colspan="5">No data</td></tr>');
      }
    });
  } catch (e) {
    $('#weatherBody').html('<tr><td colspan="3">데이터 없음</td></tr>');
    $('#summaryBody').html('<tr><td colspan="3">데이터 없음</td></tr>');
  }
});
