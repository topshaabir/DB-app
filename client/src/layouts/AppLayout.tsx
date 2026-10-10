import { BookOpen, ClipboardCheck, Trophy, UserRound } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { AppControls } from '../components/AppControls';
import { usePreferences } from '../services/preferences';

export function AppLayout() {
  const { t } = usePreferences();
  const navItems = [
    { to: '/topics', label: t('topics'), icon: BookOpen },
    { to: '/test', label: t('test'), icon: ClipboardCheck },
    { to: '/profile', label: t('profile'), icon: UserRound },
    { to: '/leaderboard', label: t('leaderboard'), icon: Trophy }
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <Link to="/topics" className="brand" aria-label="Fluffy home">
          <img className="brand-mark" src="/images/fluffy-loading.png" alt="" width={52} height={52} />
          <div>
            <strong>Fluffy</strong>
            <span>{t('appSubtitle')}</span>
          </div>
        </Link>
        <nav className="nav-list">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <item.icon size={20} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <Link to="/topics" className="brand mobile-brand" aria-label="Fluffy home">
            <img className="brand-mark" src="/images/fluffy-loading.png" alt="" width={52} height={52} />
            <strong>Fluffy</strong>
          </Link>
          <AppControls />
        </div>
        <Outlet />
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <item.icon size={21} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
