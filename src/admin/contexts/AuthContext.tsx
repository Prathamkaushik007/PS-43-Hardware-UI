import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../utils/supabaseClient';

export type AdminRole = 'super_admin' | 'admin';
export type AdminApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface AdminProfile {
  id: string;
  user_id: string;
  email: string;
  role: AdminRole;
  approval_status: AdminApprovalStatus;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: AdminProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refetchProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Mock logged in state to bypass authentication
  const mockSession: any = { access_token: 'mock', user: { id: 'mock-user' } };
  const mockProfile: AdminProfile = {
    id: 'mock-id',
    user_id: 'mock-user',
    email: 'admin@local.test',
    role: 'super_admin',
    approval_status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const signOut = async () => {
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ session: mockSession, user: mockSession.user, profile: mockProfile, isLoading: false, signOut, refetchProfile: async () => {} }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
