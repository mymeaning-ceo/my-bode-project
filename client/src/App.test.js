import { render, screen } from '@testing-library/react';
import App from './App';


test('renders home heading', () => {
  render(<App />);
  const heading = screen.getByText('재고관리 시스템');
  expect(heading).toBeInTheDocument();
});
