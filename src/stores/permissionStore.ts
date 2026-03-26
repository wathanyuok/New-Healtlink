import { create } from "zustand";
import api from "@/lib/api";

interface PermissionGroup {
  id: number;
  name: string;
  role?: string;
  userCount?: number;
  permissions?: string[];
}

interface FindAndCountResponse {
  count: number;
  rows: PermissionGroup[];
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

interface PermissionStore {
  // Permission Group CRUD
  getDataPermissionGroup: (param: any) => Promise<FindAndCountResponse>;
  getDataPermissionGroupById: (id: any) => Promise<PermissionGroup>;
  createPermissionGroup: (data: any) => Promise<PermissionGroup>;
  updatePermissionGroup: (id: any, data: any) => Promise<PermissionGroup>;
  deletePermissionGroup: (id: any) => Promise<any>;
  findPermissionGroups: (param?: any) => Promise<PermissionGroup[]>;
}

export const usePermissionStore = create<PermissionStore>((set, get) => ({
  // Permission Group CRUD
  getDataPermissionGroup: async (param: any) => {
    return apiGet("auth-service/permission/group/findAndCount", param);
  },

  getDataPermissionGroupById: async (id: any) => {
    return apiGet("auth-service/permission/group/findOne", { id });
  },

  createPermissionGroup: async (data: any) => {
    return apiPost("auth-service/permission/group/create", data);
  },

  updatePermissionGroup: async (id: any, data: any) => {
    return apiPut(`auth-service/permission/group/update/${id}`, data);
  },

  deletePermissionGroup: async (id: any) => {
    return apiDelete(`auth-service/permission/group/delete/${id}`);
  },

  findPermissionGroups: async (param?: any) => {
    return apiGet("auth-service/permission/group/find", param);
  },
}));
