import { render, screen } from '@testing-library/react';
import App from './App';


test('renders home heading', () => {
  render(<App />);
  const heading = screen.getByText(/내의미 업무용 웹앱/i);
  expect(heading).toBeInTheDocument();
});
