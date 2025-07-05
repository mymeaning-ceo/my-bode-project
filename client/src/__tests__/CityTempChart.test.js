import { render, screen, waitFor } from '@testing-library/react';
import CityTempChart from '../components/CityTempChart';

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
          { city: 'seoul', time: '2024-06-01T10:00', temperature: 25 },
        ]),
    })
  );

  render(<CityTempChart />);

  await waitFor(() => screen.getByTestId('bar-props'));

  expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/city-temp', {
    credentials: 'include',
  });

  const data = JSON.parse(screen.getByTestId('bar-props').textContent);
  expect(data.labels).toEqual(['서울']);
  expect(data.datasets[0].data).toEqual([25]);
});

test('shows error message on fetch failure', async () => {
  global.fetch = jest.fn(() => Promise.reject(new Error('fail')));

  render(<CityTempChart />);

  await waitFor(() => screen.getByRole('alert'));
  expect(screen.getByRole('alert')).toHaveTextContent(
    '데이터를 불러오지 못했습니다.'
  );
});
