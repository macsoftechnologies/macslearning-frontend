import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { NAV, ROLE_LABEL } from './navConfig';
import { BookMarked } from 'lucide-react';
import * as organizationsApi from '../../api/organizations';
import './Sidebar.css';

export default function Sidebar({ role, user, open, onNavigate }) {
  const location = useLocation();
  const allItems = NAV[role] || [];
  const [counts, setCounts] = useState({ pendingCount: 0, expiringCount: 0 });

  useEffect(() => {
    if (role === 'SUPER_ADMIN') {
      organizationsApi.getCounts().then(res => {
        if (res.data) setCounts(res.data);
      }).catch(() => {});
    }
  }, [role]);
  
  const items = allItems.filter(item => {
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) return true;
    
    // If it's a SUPER_ADMIN and they have NO modulePermissions set, they are the root admin
    if (role === 'SUPER_ADMIN' && (!user.permissions || user.permissions.length === 0)) {
      return true;
    }

    if (!user || !user.permissions) return false;
    // Check if user has at least one of the required permissions
    return item.requiredPermissions.some(perm => user.permissions.includes(perm));
  });

  const brandName = role === 'SUPER_ADMIN' 
    ? 'MacsLearn' 
    : (user?.organizationName || user?.organizationId?.name || ' LMS');

  return (
    <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
      <div className="sidebar__brand">
        <span className="sidebar__brand-mark">
          <BookMarked size={18} />
        </span>
        <div>
          <span className="sidebar__brand-name">{brandName}</span>
          <span className="sidebar__brand-role">{ROLE_LABEL[role]}</span>
        </div>
      </div>

      <nav className="sidebar__nav">
        {items.map((item) => {
          const [path, search] = item.to.split('?');
          const isActive = location.pathname === path && (search ? location.search.includes(search) : !location.search || !location.search.includes('filter'));
          
          let badge = null;
          if (item.to.includes('filter=pending') && counts.pendingCount > 0) badge = counts.pendingCount;
          if (item.to.includes('filter=expiring') && counts.expiringCount > 0) badge = counts.expiringCount;

          return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
          >
            <item.icon size={17} strokeWidth={2} />
            <span style={{ flex: 1 }}>{item.label}</span>
            {badge !== null && (
              <span style={{ 
                background: 'var(--brand)', 
                color: 'white', 
                fontSize: '11px', 
                fontWeight: 'bold', 
                padding: '2px 8px', 
                borderRadius: '12px' 
              }}>
                {badge}
              </span>
            )}
          </NavLink>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <p> LMS v1.0</p>
      </div>
    </aside>
  );
}
