$(async function () {
  try {
    const res = await fetch('/api/weather/daily');
    const data = await res.json();
    const skyMap = { '1': '맑음', '3': '구름많음', '4': '흐림' };
    const ptyMap = { '0': '없음', '1': '비', '2': '비/눈', '3': '눈', '4': '소나기' };
    $('#weatherBody').html(
      `<tr><td>${data.temperature ?? '-'}</td><td>${skyMap[data.sky] ?? data.sky ?? '-'}</td><td>${ptyMap[data.precipitationType] ?? data.precipitationType ?? '-'}</td></tr>`
    );
  } catch (e) {
    $('#weatherBody').html('<tr><td colspan="3">데이터 없음</td></tr>');
  }
});
