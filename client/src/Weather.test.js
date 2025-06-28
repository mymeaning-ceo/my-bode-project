import { render, screen, waitFor } from '@testing-library/react';
import Weather from './Weather';

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        temperature: '20',
        sky: '1',
        precipitationType: '0',
      }),
    })
  );
});

afterEach(() => {
  jest.resetAllMocks();
});

test('renders weather data from api', async () => {
  render(<Weather />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  expect(global.fetch).toHaveBeenCalledWith('/api/weather/daily?nx=60&ny=127');
  await waitFor(() => screen.getByText('맑음'));
  expect(screen.getByRole('heading', { name: '서울의 날씨 정보' })).toBeInTheDocument();
  expect(screen.getByText('맑음')).toBeInTheDocument();
  expect(screen.getByText('20')).toBeInTheDocument();
  expect(screen.getByText('없음')).toBeInTheDocument();
});
