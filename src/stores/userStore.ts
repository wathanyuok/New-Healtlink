import { create } from "zustand";
import api from "@/lib/api";

interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  hospital?: string;
  role?: string;
  permissionGroup?: string;
  status?: string;
}

interface FindAndCountResponse {
  count: number;
  rows: User[];
}

const apiGet = async (url: string, params?: any) => {
  const res = await api.get(url, { params });
  return res.data;
};

const apiPost = async (url: string, data: any) => {
  const res = await api.post(url, data);
  return res.data;
};

const apiPut = async (url: string, data: any) => {
  const res = await api.put(url, data);
  return res.data;
};

const apiDelete = async (url: string) => {
  const res = await api.delete(url);
  return res.data;
};

interface UserStore {
  // User CRUD
  getDataUser: (param: any) => Promise<FindAndCountResponse>;
  getDataUserById: (id: any) => Promise<User>;
  createUser: (data: any) => Promise<User>;
  updateUser: (id: any, data: any) => Promise<User>;
  deleteUser: (id: any) => Promise<any>;

  // Password Management
  resetPassword: (userId: any, newPassword: string) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  // User CRUD
  getDataUser: async (param: any) => {
    return apiGet("auth-service/user/findAndCount", param);
  },

  getDataUserById: async (id: any) => {
    return apiGet("auth-service/user/findOne", { id });
  },

  createUser: async (data: any) => {
    return apiPost("auth-service/user/create", data);
  },

  updateUser: async (id: any, data: any) => {
    return apiPut(`auth-service/user/update/${id}`, data);
  },

  deleteUser: async (id: any) => {
    return apiDelete(`auth-service/user/delete/${id}`);
  },

  // Password Management
  resetPassword: async (userId: any, newPassword: string) => {
    return apiPost("auth-service/auth/resetPassword", {
      userId,
      newPassword,
    });
  },

  forgotPassword: async (email: string) => {
    return apiPost("auth-service/auth/forgotPassword", { email });
  },
}));
