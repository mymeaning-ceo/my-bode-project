import { render, screen } from '@testing-library/react';
import App from './App';

test('renders weather header', () => {
  render(<App />);
  const heading = screen.getByText('날씨 정보');
  expect(heading).toBeInTheDocument();
});
