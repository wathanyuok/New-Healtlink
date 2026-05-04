import { create } from "zustand";
import api from "@/lib/api";

interface ReferralReasonStore {
  findAndCountReferralReason: (params: any) => Promise<any>;
  createReferralReason: (data: any) => Promise<any>;
  updateReferralReason: (id: number, data: any) => Promise<any>;
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

export const useReferralReasonStore = create<ReferralReasonStore>(() => ({
  findAndCountReferralReason: async (params: any) => {
    return apiGet(
      "main-service/referral/status/detail/findAndCount",
      params
    );
  },

  createReferralReason: async (data: any) => {
    return apiPost(
      "main-service/referral/status/detail/create",
      data
    );
  },

  updateReferralReason: async (id: number, data: any) => {
    return apiPut(
      `main-service/referral/status/detail/update/${id}`,
      data
    );
  },
}));
