document.addEventListener('DOMContentLoaded', () => {
  if (!window.metrics) return;
  const labels = metrics.map(m => m.optionId);
  const ctr = metrics.map(m => m.ctr);
  const cpc = metrics.map(m => m.cpc);
  const ctx = document.getElementById('adChart');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'CTR (%)',
          data: ctr,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          yAxisID: 'y',
        },
        {
          label: 'CPC',
          data: cpc,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y1: {
          position: 'right',
          grid: { drawOnChartArea: false },
        },
      },
    },
  });
});
