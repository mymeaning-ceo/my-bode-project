import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  ChartDataLabels,
);

function SalesAdSummaryChart({ data }) {
  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: '매출',
        data: data.map((d) => d.sales),
        backgroundColor: 'rgba(153,102,255,0.6)',
        yAxisID: 'y',
      },
      {
        label: '광고비',
        data: data.map((d) => d.adCost),
        backgroundColor: 'rgba(75,192,192,0.6)',
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true },
      y1: { position: 'right', grid: { drawOnChartArea: false } },
    },
    plugins: {
      datalabels: {
        anchor: 'end',
        align: 'end',
        formatter: (v) => v.toLocaleString(),
      },
    },
  };

  return (
    <div style={{ height: '300px' }}>
      <Bar options={options} data={chartData} />
    </div>
  );
}

export default SalesAdSummaryChart;
