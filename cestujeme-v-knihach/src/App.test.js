import { render, screen } from '@testing-library/react';
import App from './App';
import { onAuthChange } from './firebase/auth';
import { getAllBooks } from './firebase/firestore';

jest.mock('./components/MapPage', () => () => <div>Map Page</div>);
jest.mock('./components/SearchPage', () => () => <div>Search Page</div>);
jest.mock('./components/ProfilePage', () => () => <div>Profile Page</div>);
jest.mock('./components/AdminPage', () => () => <div>Admin Page</div>);
jest.mock('./components/LeaderboardPage', () => () => <div>Leaderboard Page</div>);
jest.mock('./components/Header', () => () => <header>Header</header>);
jest.mock('./components/LoginForm', () => () => <div>Login Form</div>);

jest.mock('./firebase/auth', () => ({
  onAuthChange: jest.fn(),
  logoutUser: jest.fn()
}));

jest.mock('./firebase/firestore', () => ({
  getAllBooks: jest.fn()
}));

test('renders app with map page after loading', async () => {
  onAuthChange.mockImplementation((callback) => {
    callback(null);
    return jest.fn();
  });

  getAllBooks.mockResolvedValue({ success: true, books: [] });

  render(<App />);

  const mapPage = await screen.findByText('Map Page');
  expect(mapPage).toBeInTheDocument();
});
