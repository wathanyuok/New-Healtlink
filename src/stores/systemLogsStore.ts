import { create } from "zustand";
import api from "@/lib/api";

interface SystemLogsStore {
  findAndCountSystemLogs: (params?: any) => Promise<any>;
}

const apiGet = async (url: string, params?: any) => {
  const res = await api.get(url, { params });
  return res.data;
};

export const useSystemLogsStore = create<SystemLogsStore>(() => ({
  findAndCountSystemLogs: async (params?: any) => {
    return apiGet("auth-service/log/user/login/findAndCount", params);
  },
}));
