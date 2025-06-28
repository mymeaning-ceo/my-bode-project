import { render, screen, waitFor } from '@testing-library/react';
import Header from './Header';

beforeEach(() => {
  global.fetch = jest.fn((url) => {
    if (url.includes('/api/auth/user')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: { name: 'Tester' } }),
      });
    }
    if (url.includes('/api/weather/daily')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            temperature: '20',
            sky: '1',
            precipitationType: '0',
          }),
      });
    }
    return Promise.reject(new Error('Unknown endpoint'));
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

test('displays weather info in header', async () => {
  render(<Header onToggleSidebar={() => {}} />);
  await waitFor(() => screen.getByText(/맑음/));
  expect(screen.getByText('맑음')).toBeInTheDocument();
  expect(screen.getByText('20℃ 맑음 없음')).toBeInTheDocument();
});
