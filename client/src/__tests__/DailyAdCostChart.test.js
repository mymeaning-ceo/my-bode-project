import { render, screen, waitFor } from '@testing-library/react';
import DailyAdCostChart from '../components/DailyAdCostChart';

jest.mock('react-chartjs-2', () => ({
  Bar: ({ data }) => <div data-testid="bar-props">{JSON.stringify(data)}</div>,
}));

afterEach(() => {
  jest.resetAllMocks();
});

test('renders bar chart with fetched data', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve([
          { date: '2023-01-01', totalCost: 100 },
        ]),
    })
  );

  render(<DailyAdCostChart />);

  await waitFor(() => screen.getByTestId('bar-props'));

  expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/ad-cost-daily', {
    credentials: 'include',
  });

  const data = JSON.parse(screen.getByTestId('bar-props').textContent);
  expect(data.labels).toEqual(['2023-01-01']);
  expect(data.datasets[0].data).toEqual([100]);
});

test('shows error message on fetch failure', async () => {
  global.fetch = jest.fn(() => Promise.reject(new Error('fail')));

  render(<DailyAdCostChart />);

  await waitFor(() => screen.getByRole('alert'));
  expect(screen.getByRole('alert')).toHaveTextContent('데이터를 불러오지 못했습니다.');
});
