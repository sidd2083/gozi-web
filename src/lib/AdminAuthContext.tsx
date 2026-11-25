'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';
import { verifyAdminStatus, AdminAuthResult, signOutAdmin } from './adminAuth';

interface AdminAuthContextType {
  user: FirebaseUser | null;
  adminStatus: AdminAuthResult | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [adminStatus, setAdminStatus] = useState<AdminAuthResult | null>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      setUser(null);
      setAdminStatus(null);
      setLoading(false);
      return;
    }

    setUser(firebaseUser);
    const status = await verifyAdminStatus(firebaseUser.email);
    if (!status.authorized) {
      await signOutAdmin();
      setUser(null);
      setAdminStatus(status);
    } else {
      setAdminStatus(status);
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      checkStatus(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOutAdmin();
    setUser(null);
    setAdminStatus(null);
  };

  const refreshStatus = async () => {
    if (user) {
      setLoading(true);
      await checkStatus(user);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        adminStatus,
        loading,
        logout,
        refreshStatus,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
