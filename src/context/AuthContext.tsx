import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User, UserGroup, PermissionMap, SystemSettings } from '../types';
import {
  canUseRemoteDataStore,
  deleteUserRecord,
  loadUsers,
  upsertUser,
  loadUserGroups,
  upsertUserGroup,
  deleteUserGroup,
} from '../services/dataStore';

const DEFAULT_PERMISSIONS: PermissionMap = {
  lost_report: true,
  found_report: true,
  search_match: true,
  property_management: true,
  reports: true,
  admin: false,
};

const ADMIN_PERMISSIONS: PermissionMap = {
  lost_report: true,
  found_report: true,
  search_match: true,
  property_management: true,
  reports: true,
  admin: true,
};

const MOCK_GROUPS: UserGroup[] = [
  { id: 'g1', name: 'ผู้ดูแลระบบ', permissions: ADMIN_PERMISSIONS },
  { id: 'g2', name: 'เจ้าหน้าที่', permissions: DEFAULT_PERMISSIONS },
  { id: 'g3', name: 'ผู้ชม', permissions: { ...DEFAULT_PERMISSIONS, lost_report: false, found_report: false, admin: false } },
];

const MOCK_USERS: (User & { password: string })[] = [
  {
    id: 'u1',
    username: 'admin',
    password: 'admin123',
    fullName: 'ผู้ดูแลระบบ',
    role: 'admin',
    groupId: 'g1',
    permissions: ADMIN_PERMISSIONS,
    isActive: true,
    createdAt: '2024-01-01',
  },
  {
    id: 'u2',
    username: 'staff01',
    password: 'staff123',
    fullName: 'สมชาย ใจดี',
    role: 'staff',
    groupId: 'g2',
    permissions: DEFAULT_PERMISSIONS,
    isActive: true,
    createdAt: '2024-01-15',
  },
  {
    id: 'u3',
    username: 'viewer01',
    password: 'view123',
    fullName: 'สมหญิง รักดี',
    role: 'viewer',
    groupId: 'g3',
    permissions: { ...DEFAULT_PERMISSIONS, lost_report: false, found_report: false },
    isActive: true,
    createdAt: '2024-02-01',
  },
];

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  settings: SystemSettings;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateSettings: (s: Partial<SystemSettings>) => void;
  getUsers: () => User[];
  updateUser: (user: User) => void;
  addUser: (user: User & { password: string }) => void;
  deleteUser: (id: string) => void;
  getGroups: () => UserGroup[];
  addGroup: (group: UserGroup) => void;
  updateGroup: (group: UserGroup) => void;
  deleteGroup: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('cni_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [users, setUsers] = useState<(User & { password: string })[]>(MOCK_USERS);
  const [groups, setGroups] = useState<UserGroup[]>(MOCK_GROUPS);
  const [settings, setSettings] = useState<SystemSettings>({
    sessionTimeoutMinutes: 30,
    organizationName: 'ClickNext Innovation',
    logoUrl: '',
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── sync groups with Supabase ─────────────────────────────────────────────
  useEffect(() => {
    if (!canUseRemoteDataStore) return;
    loadUserGroups().then(remoteGroups => {
      if (!remoteGroups) return;
      if (remoteGroups.length > 0) {
        setGroups(remoteGroups);
      } else {
        MOCK_GROUPS.forEach(g => {
          void upsertUserGroup(g).catch(err => console.error('Failed to seed group', err));
        });
      }
    }).catch(err => console.error('Failed to load groups from Supabase', err));
  }, []);

  // ── sync users with Supabase ──────────────────────────────────────────────
  useEffect(() => {
    if (!canUseRemoteDataStore) return;
    loadUsers().then(remoteUsers => {
      if (!remoteUsers) return;
      if (remoteUsers.length > 0) {
        setUsers(remoteUsers);
      } else {
        // first run: seed Supabase with default users
        MOCK_USERS.forEach(u => {
          void upsertUser(u).catch(err => console.error('Failed to seed user', err));
        });
      }
    }).catch(err => console.error('Failed to load users from Supabase', err));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('cni_user');
    window.location.href = '/login';
  }, []);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (user) {
      timeoutRef.current = setTimeout(() => {
        logout();
      }, settings.sessionTimeoutMinutes * 60 * 1000);
    }
  }, [user, settings.sessionTimeoutMinutes, logout]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [resetTimer]);

  const login = async (username: string, password: string): Promise<boolean> => {
    const found = users.find(u => u.username === username && u.password === password && u.isActive);
    if (found) {
      const { password: _pw, ...userObj } = found;
      setUser(userObj);
      localStorage.setItem('cni_user', JSON.stringify(userObj));
      return true;
    }
    return false;
  };

  const updateSettings = (s: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...s }));
  };

  const getUsers = () => users.map(({ password: _pw, ...u }) => u);

  const updateUser = (updated: User) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== updated.id) return u;
      const merged = { ...u, ...updated };
      void upsertUser(merged).catch(err => console.error('Failed to sync user update', err));
      return merged;
    }));
    if (user?.id === updated.id) {
      setUser(updated);
      localStorage.setItem('cni_user', JSON.stringify(updated));
    }
  };

  const addUser = (newUser: User & { password: string }) => {
    setUsers(prev => [...prev, newUser]);
    void upsertUser(newUser).catch(err => console.error('Failed to sync new user', err));
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    void deleteUserRecord(id).catch(err => console.error('Failed to delete user', err));
  };

  const getGroups = () => groups;

  const addGroup = (group: UserGroup) => {
    setGroups(prev => [...prev, group]);
    void upsertUserGroup(group).catch(err => console.error('Failed to sync group', err));
  };

  const updateGroup = (group: UserGroup) => {
    setGroups(prev => prev.map(g => g.id === group.id ? group : g));
    void upsertUserGroup(group).catch(err => console.error('Failed to sync group', err));
  };

  const deleteGroup = (id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
    void deleteUserGroup(id).catch(err => console.error('Failed to delete group', err));
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      settings,
      login,
      logout,
      updateSettings,
      getUsers,
      updateUser,
      addUser,
      deleteUser,
      getGroups,
      addGroup,
      updateGroup,
      deleteGroup,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
