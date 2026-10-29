import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const TOKEN_KEY = 'interviewace_token';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(null);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadUser() {
      try {
        const data = await api('/api/auth/me', { token });
        if (!cancelled) {
          setUser(data.user);
          setAiConfigured(Boolean(data.aiConfigured));
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        if (!cancelled) {
          setToken('');
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      aiConfigured,
      async register(payload) {
        const data = await api('/api/auth/register', { method: 'POST', body: payload });
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
        setAiConfigured(Boolean(data.aiConfigured));
        return data;
      },
      async login(payload) {
        const data = await api('/api/auth/login', { method: 'POST', body: payload });
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
        setAiConfigured(Boolean(data.aiConfigured));
        return data;
      },
      async updateProfile(payload) {
        const data = await api('/api/users/profile', { method: 'PATCH', token, body: payload });
        setUser(data.profile);
        return data;
      },
      logout() {
        localStorage.removeItem(TOKEN_KEY);
        setToken('');
        setUser(null);
      },
    }),
    [token, user, loading, aiConfigured]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
