import { create } from "zustand";
import api from "@/lib/api";

interface ReferralCauseStore {
  findAndCountReferralCause: (params: any) => Promise<any>;
  createReferralCause: (data: any) => Promise<any>;
  updateReferralCause: (id: number, data: any) => Promise<any>;
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

export const useReferralCauseStore = create<ReferralCauseStore>(() => ({
  findAndCountReferralCause: async (params: any) => {
    return apiGet(
      "main-service/referral/cause/findAndCount",
      params
    );
  },

  createReferralCause: async (data: any) => {
    return apiPost(
      "main-service/referral/cause/create",
      data
    );
  },

  updateReferralCause: async (id: number, data: any) => {
    return apiPut(
      `main-service/referral/cause/update/${id}`,
      data
    );
  },
}));
