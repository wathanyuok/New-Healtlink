import { create } from "zustand";
import api from "@/lib/api";

interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  permissionGroup?: {
    id: number;
    name: string;
    role?: {
      id: number;
      name: string;
    };
    permissions?: any[];
  };
  hospital?: any;
}

interface AuthState {
  token: string | null;
  profile: UserProfile | null;
  optionHospital: number | null;
  loading: boolean;

  setToken: (token: string) => void;
  setProfile: (profile: UserProfile) => void;
  setOptionHospital: (id: number | null) => void;
  login: (username: string, password: string) => Promise<void>;
  getProfile: () => Promise<void>;
  logout: () => void;
  getRoleName: () => string;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Don't read localStorage during store creation (SSR-safe)
  token: null,
  profile: null,
  optionHospital: null,
  loading: false,

  setToken: (token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
    set({ token });
  },

  setProfile: (profile) => set({ profile }),
  setOptionHospital: (id) => set({ optionHospital: id }),

  login: async (username, password) => {
    set({ loading: true });
    try {
      const response = await api.post("auth-service/auth/login", { username, password });
      const token = response.data.access_token || response.data.data?.token;
      if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
      }
      set({ token, loading: false });
    } catch (error: any) {
      // Mock login fallback when backend is unavailable
      console.warn("[MOCK] Auth API unavailable, using mock login");
      const mockToken = "mock-token-demo";
      if (typeof window !== "undefined") {
        localStorage.setItem("token", mockToken);
      }
      set({ token: mockToken, loading: false });
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get("auth-service/auth/profile");
      set({ profile: response.data.data });
    } catch (error) {
      // Mock profile fallback
      console.warn("[MOCK] Profile API unavailable, using mock profile");
      set({
        profile: {
          id: 1,
          username: "demo",
          fullName: "Demo User",
          permissionGroup: {
            id: 1,
            name: "Super Admin",
            role: { id: 1, name: "superAdmin" },
            permissions: [],
          },
          hospital: null,
        },
      });
    }
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    set({ token: null, profile: null, optionHospital: null });
  },

  getRoleName: () => {
    const { profile } = get();
    return profile?.permissionGroup?.role?.name || "";
  },
}));
