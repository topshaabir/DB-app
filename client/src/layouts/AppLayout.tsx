import { BookOpen, ClipboardCheck, Trophy, UserRound } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/topics', label: 'Topics', icon: BookOpen },
  { to: '/test', label: 'Test', icon: ClipboardCheck },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy }
];

export function AppLayout() {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <Link to="/topics" className="brand" aria-label="Fluffy home">
          <img className="brand-mark" src="/images/fluffy-loading.png" alt="" width={52} height={52} />
          <div>
            <strong>Fluffy</strong>
            <span>English learning</span>
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
        <Link to="/topics" className="brand mobile-brand" aria-label="Fluffy home">
          <img className="brand-mark" src="/images/fluffy-loading.png" alt="" width={52} height={52} />
          <strong>Fluffy</strong>
        </Link>
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
