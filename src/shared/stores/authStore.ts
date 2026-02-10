'use client';

import { create } from 'zustand';
import { createClient } from '@/shared/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  initialize: () => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  initialize: () => {
    if (get().initialized) return;
    set({ initialized: true });

    const supabase = createClient();

    // onAuthStateChange만 사용 (getUser() API 호출 없음)
    // INITIAL_SESSION: 로컬 세션에서 복원 (네트워크 호출 X)
    // SIGNED_IN: 로그인 시
    // TOKEN_REFRESHED: 토큰 갱신 시
    // SIGNED_OUT: 로그아웃 시
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        set({ user: null, loading: false });
        return;
      }
      if (session?.user) {
        set({ user: session.user, loading: false });
      } else {
        set({ loading: false });
      }
    });
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  },
}));
