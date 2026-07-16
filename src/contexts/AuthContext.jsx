import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setTokens, clearTokens, getRefreshToken } from '../utils/tokenStorage';
import * as authApi from '../api/auth';
import * as usersApi from '../api/users';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

const ROLE_HOME = {
  SUPER_ADMIN: '/super-admin/dashboard',
  ORG_USER: '/admin/dashboard',
  FACULTY: '/faculty/dashboard',
  STUDENT: '/student/dashboard',
  FINANCE: '/finance/dashboard',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyAuth = useCallback((data) => {
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    setUser(data.user);
    setRole(data.user.userType);
    if (data.user.organizationSlug) {
      localStorage.setItem('orgSlug', data.user.organizationSlug);
    }
    if (data.user.organizationName) {
      localStorage.setItem('orgName', data.user.organizationName);
    } else if (data.user.userType === 'SUPER_ADMIN') {
      localStorage.setItem('orgName', 'MacsLearn');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const rt = getRefreshToken();
    if (!rt) {
      setLoading(false);
      return;
    }
    authApi
      .refresh(rt)
      .then(async (res) => {
        const data = res.data.data;
        if (!data.user) {
          let decoded = null;
          try {
            const base64 = data.accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            decoded = JSON.parse(jsonPayload);
          } catch (e) {}

          setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
          
          if (decoded && (decoded.userType === 'SUPER_ADMIN' || decoded.role === 'SUPER_ADMIN')) {
            data.user = { 
              id: decoded.id || decoded._id, 
              userType: 'SUPER_ADMIN', 
              email: decoded.email,
              fullName: decoded.fullName,
              permissions: decoded.permissions 
            };
          } else {
            try {
              const userRes = await usersApi.getMe();
              data.user = userRes.data.data;
            } catch (err) {
              if (decoded) {
                data.user = { id: decoded.id || decoded._id, userType: decoded.userType || decoded.role, email: decoded.email };
              } else {
                throw err;
              }
            }
          }
        }
        applyAuth(data);
      })
      .catch(() => {
        clearTokens();
        setLoading(false);
      });
  }, [applyAuth]);

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials);
    applyAuth(data.data);
    return data.data.user.userType;
  };

  const superAdminLogin = async (credentials) => {
    const { data } = await authApi.superAdminLogin(credentials);
    applyAuth(data.data);
    return data.data.user.userType;
  };

  const logout = async () => {
    let logoutUrl = '/login';
    const slug = localStorage.getItem('orgSlug');
    if (role === 'SUPER_ADMIN') {
      logoutUrl = '/super-admin/login';
    } else if (slug) {
      logoutUrl = `/${slug}/login`;
    }

    try {
      await authApi.logout(getRefreshToken());
    } catch {
      /* ignore */
    }
    clearTokens();
    localStorage.removeItem('orgSlug');
    localStorage.removeItem('orgName');
    setUser(null);
    setRole(null);
    // window.location.href = logoutUrl;
    window.location.href = `/macslearnfrontend${logoutUrl}`;
  };

  const updateUser = (patch) => setUser((prev) => ({ ...prev, ...patch }));

  return (
    <AuthContext.Provider
      value={{ user, role, loading, login, superAdminLogin, logout, updateUser, homeFor: (r) => ROLE_HOME[r] || '/login' }}
    >
      {children}
    </AuthContext.Provider>
  );
}
