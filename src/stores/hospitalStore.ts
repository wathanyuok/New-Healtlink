import { create } from "zustand";
import api from "@/lib/api";

interface Hospital {
  id: number;
  name: string;
  code: string;
  type?: string;
  zone?: string;
  affiliation?: string;
  serviceLevel?: string;
}

interface HospitalZone {
  id: number;
  name: string;
}

interface HospitalType {
  id: number;
  name: string;
}

interface FindAndCountResponse {
  count: number;
  rows: Hospital[];
}

const apiGet = async (url: string, params?: any) => {
  const res = await api.get(url, { params });
  return res.data;
};

const apiPost = async (url: string, data: any) => {
  const res = await api.post(url, data);
  return res.data;
};

const apiPut = async (url: string, data: any, id?: any) => {
  const res = await api.put(url, data);
  return res.data;
};

const apiDelete = async (url: string) => {
  const res = await api.delete(url);
  return res.data;
};

interface HospitalStore {
  // Hospital CRUD
  getDataHos: (param: any) => Promise<FindAndCountResponse>;
  getDataHosById: (id: any) => Promise<Hospital>;
  createHospital: (data: any) => Promise<Hospital>;
  updateHospital: (id: any, data: any) => Promise<Hospital>;
  deleteHospital: (id: any) => Promise<any>;

  // Zone Management
  findCountZone: (param: any) => Promise<any>;
  createZoneHospital: (data: any) => Promise<HospitalZone>;
  updateZoneHospital: (data: any, id: any) => Promise<HospitalZone>;
  deleteZoneHospital: (id: any) => Promise<any>;
  getOptionHosZone: (param?: any) => Promise<HospitalZone[]>;

  // Type Management
  findCountType: (param: any) => Promise<any>;
  createTypeHospital: (data: any) => Promise<HospitalType>;
  updateTypeHospital: (data: any, id: any) => Promise<HospitalType>;
  deleteTypeHospital: (id: any) => Promise<any>;
  getOptionHosType: (param?: any) => Promise<any>;

  // Options
  getOptionHospital: (param?: any) => Promise<any>;
  getOptionAffiliation: (param?: any) => Promise<string[]>;
  getOptionServiceLevel: (param?: any) => Promise<string[]>;
  getOptionRole: () => Promise<any>;
  getOptionGroupPer: (param?: any) => Promise<any>;
  findUserHospital: (params: any) => Promise<any>;

  // File Upload
  uploadFile: (file: File) => Promise<any>;
}

export const useHospitalStore = create<HospitalStore>((set, get) => ({
  // Hospital CRUD
  getDataHos: async (param: any) => {
    return apiGet("main-service/hospital/findAndCount", param);
  },

  getDataHosById: async (id: any) => {
    return apiGet(`main-service/hospital/findOne`, { id });
  },

  createHospital: async (data: any) => {
    return apiPost("main-service/hospital/create", data);
  },

  updateHospital: async (id: any, data: any) => {
    return apiPut(`main-service/hospital/update/${id}`, data);
  },

  deleteHospital: async (id: any) => {
    return apiDelete(`main-service/hospital/delete/${id}`);
  },

  // Zone Management
  findCountZone: async (param: any) => {
    return apiGet("main-service/hospitalZone/findAndCount", param);
  },

  createZoneHospital: async (data: any) => {
    return apiPost("main-service/hospitalZone/create", data);
  },

  updateZoneHospital: async (data: any, id: any) => {
    return apiPut(`main-service/hospitalZone/update/${id}`, data);
  },

  deleteZoneHospital: async (id: any) => {
    return apiDelete(`main-service/hospitalZone/delete/${id}`);
  },

  getOptionHosZone: async (param?: any) => {
    return apiGet("main-service/hospitalZone/find", param);
  },

  // Type Management
  findCountType: async (param: any) => {
    return apiGet("main-service/hospital/Subtype/findAndCount", param);
  },

  createTypeHospital: async (data: any) => {
    return apiPost("main-service/hospital/subType/create", data);
  },

  updateTypeHospital: async (data: any, id: any) => {
    return apiPut(`main-service/hospital/subType/update/${id}`, data);
  },

  deleteTypeHospital: async (id: any) => {
    return apiDelete(`main-service/hospital/subType/delete/${id}`);
  },

  getOptionHosType: async (param?: any) => {
    return apiGet("main-service/hospital/subType/findWithHospitals", param);
  },

  // Options
  getOptionHospital: async (param?: any) => {
    return apiGet("main-service/hospital/find", param);
  },

  getOptionAffiliation: async (param?: any) => {
    const data = await apiGet("main-service/hospital/find", param);
    return Array.from(
      new Set(data?.hospitals?.map((item: Hospital) => item.affiliation) || [])
    );
  },

  getOptionServiceLevel: async (param?: any) => {
    const data = await apiGet("main-service/hospital/find", param);
    return Array.from(
      new Set(data?.hospitals?.map((item: Hospital) => item.serviceLevel) || [])
    );
  },

  getOptionRole: async (param?: any) => {
    return apiGet("auth-service/role/find", param);
  },

  getOptionGroupPer: async (param?: any) => {
    return apiGet("auth-service/permission/group/find", param);
  },

  findUserHospital: async (params: any) => {
    return apiGet("auth-service/user/find", params);
  },

  // File Upload
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("auth-service/file/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
}));
