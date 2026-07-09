import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

export default function Layout({ title }) {
  const { role, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar role={role} user={user} open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      {menuOpen && <div className="app-shell__scrim" onClick={() => setMenuOpen(false)} />}
      <div className="app-shell__main">
        <TopBar onMenuClick={() => setMenuOpen((o) => !o)} title={title} />
        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
