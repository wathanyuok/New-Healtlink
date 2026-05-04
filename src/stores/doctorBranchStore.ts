import { create } from "zustand";
import api from "@/lib/api";

interface DoctorBranchStore {
  findAndCountDoctorBranch: (params: any) => Promise<any>;
  createDoctorBranch: (data: any) => Promise<any>;
  updateDoctorBranch: (id: number, data: any) => Promise<any>;
  deleteDoctorBranch: (id: number) => Promise<any>;
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

export const useDoctorBranchStore = create<DoctorBranchStore>(() => ({
  findAndCountDoctorBranch: async (params: any) => {
    return apiGet("main-service/doctor/branch/findAndCount", params);
  },

  createDoctorBranch: async (data: any) => {
    return apiPost("main-service/doctor/branch/create", data);
  },

  updateDoctorBranch: async (id: number, data: any) => {
    return apiPut(`main-service/doctor/branch/update/${id}`, data);
  },

  deleteDoctorBranch: async (id: number) => {
    return apiDelete(`main-service/doctor/branch/delete/${id}`);
  },
}));
