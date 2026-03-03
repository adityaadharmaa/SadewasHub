import { create } from "zustand";

interface Profile {
  full_name: string;
  nik: string;
  phone_number: string;
  avatar_url?: string;
  is_verified: boolean;
}

interface User {
  id: string;
  email: string;
  roles: string[];
  permissions?: string[];
  profile?: Profile;
  verification: {
    status: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("token"),

  setAuth: (user, token) => {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },
}));
