import { create } from "zustand";
import api from "@/lib/api";

export interface DeliveryPointItem {
  id: number;
  name: string;
  phone: string;
  phone2: string;
  useFor: string;
  isOpd: boolean;
  isIpd: boolean;
  isEr: boolean;
  isActive: boolean;
  isDelete: boolean;
  createdAt: string;
  updatedAt: string;
  hospital?: {
    id: number;
    name: string;
    zone?: { id: number; name: string };
    subType?: { id: number; name: string };
  };
}

interface FindAndCountParams {
  offset: number;
  limit: number;
  search?: string;
  zone?: string;
  subType?: string;
  hospital?: string;
  useFor?: string;
  isOpd?: boolean;
  isIpd?: boolean;
  isEr?: boolean;
}

interface DeliveryPointStore {
  findAndCountReferPoint: (params: FindAndCountParams) => Promise<any>;
  createReferPoint: (data: any) => Promise<any>;
  updateReferPoint: (id: number, data: any) => Promise<any>;
  deleteReferPoint: (id: number) => Promise<any>;
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

export const useDeliveryPointStore = create<DeliveryPointStore>(() => ({
  findAndCountReferPoint: async (params: FindAndCountParams) => {
    return apiGet(
      "main-service/referral/deliveryPointTypeStart/findAndCount",
      params
    );
  },

  createReferPoint: async (data: any) => {
    return apiPost(
      "main-service/referral/deliveryPointTypeStart/create",
      data
    );
  },

  updateReferPoint: async (id: number, data: any) => {
    return apiPut(
      `main-service/referral/deliveryPointTypeStart/update/${id}`,
      data
    );
  },

  deleteReferPoint: async (id: number) => {
    return apiDelete(
      `main-service/referral/deliveryPointTypeStart/delete/${id}`
    );
  },
}));
