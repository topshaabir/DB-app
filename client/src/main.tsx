import React from 'react';
import ReactDOM from 'react-dom/client';
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { TopicsPage } from './pages/TopicsPage';
import { TopicDetailPage } from './pages/TopicDetailPage';
import { TestPage } from './pages/TestPage';
import { ProfilePage } from './pages/ProfilePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { PreferencesProvider } from './services/preferences';
import './styles/global.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/topics" replace /> },
      { path: 'topics', element: <TopicsPage /> },
      { path: 'topics/:id', element: <TopicDetailPage /> },
      { path: 'test', element: <TestPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'leaderboard', element: <LeaderboardPage /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PreferencesProvider>
      <RouterProvider router={router} />
    </PreferencesProvider>
  </React.StrictMode>
);
