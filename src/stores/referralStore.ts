import { create } from "zustand";
import api from "@/lib/api";

const apiGet = async (url: string, params?: any) => {
  const res = await api.get(url, { params });
  return res.data;
};

const apiPost = async (url: string, data?: any) => {
  const res = await api.post(url, data);
  return res.data;
};

const apiPut = async (url: string, data?: any) => {
  const res = await api.put(url, data);
  return res.data;
};

const apiDelete = async (url: string) => {
  const res = await api.delete(url);
  return res.data;
};

interface ReferralState {
  loading: boolean;

  // Referral document queries
  findAndCountReferral: (params: any) => Promise<any>;
  findOneReferral: (id: string, printReferral?: boolean) => Promise<any>;
  findReferralByFilter: (params: any) => Promise<any>;
  findGroupCase: (groupCase: string) => Promise<any>;

  // Referral document mutations
  createReferral: (data: any) => Promise<any>;
  updateReferral: (id: number, data: any) => Promise<any>;
  updateReadReferral: (id: number) => Promise<any>;

  // Referral status
  findAndCountStatus: (params: any) => Promise<any>;
  findStatus: (params: any) => Promise<any>;
  findOneStatus: (id: string) => Promise<any>;
  findStatusDetail: (params: any) => Promise<any>;
  createStatus: (data: any) => Promise<any>;
  updateStatus: (id: number, data: any) => Promise<any>;

  // Referral cause
  findAndCountCause: (params: any) => Promise<any>;
  findCause: (params: any) => Promise<any>;
  findOneCause: (id: string) => Promise<any>;
  createCause: (data: any) => Promise<any>;
  updateCause: (id: number, data: any) => Promise<any>;
  deleteCause: (id: number) => Promise<any>;

  // Patient history
  getPatientHistory: (data: any) => Promise<any>;

  // Referral history log
  findAndCountReferralHistory: (params: any) => Promise<any>;

  // ICD-10 / Medicine
  findAndCountIcd10: (params: any) => Promise<any>;
  findAndCountMedicine: (params: any) => Promise<any>;

  // Delivery point & Doctor branch
  checkReferPointHospital: (params: any) => Promise<any>;
  checkDoctorBranch: (params: any) => Promise<any>;
}

export const useReferralStore = create<ReferralState>(() => ({
  loading: false,

  // Referral documents
  findAndCountReferral: (params) =>
    apiGet("main-service/referral/document/findAndCount", params),
  findOneReferral: (id, printReferral = false) =>
    apiGet(`main-service/referral/document/findOne?id=${id}&printReferral=${printReferral}`),
  findReferralByFilter: (params) =>
    apiGet("main-service/referral/document/find", params),
  findGroupCase: (groupCase) =>
    apiGet(`main-service/referral/document/find?groupCase=${groupCase}`),

  createReferral: (data) =>
    apiPost("main-service/referral/document/create", data),
  updateReferral: (id, data) =>
    apiPut(`main-service/referral/document/update/${id}`, data),
  updateReadReferral: (id) =>
    apiPut(`main-service/referral/document/updateRead/${id}`),

  // Referral status
  findAndCountStatus: (params) =>
    apiGet("main-service/referral/status/detail/findAndCount", params),
  findStatus: (params) =>
    apiGet("main-service/referral/status/find", params),
  findOneStatus: (id) =>
    apiGet(`main-service/referral/status/detail/findOne?id=${id}`),
  findStatusDetail: (params) =>
    apiGet("main-service/referral/status/detail/find", params),
  createStatus: (data) =>
    apiPost("main-service/referral/status/detail/create", data),
  updateStatus: (id, data) =>
    apiPut(`main-service/referral/status/detail/update/${id}`, data),

  // Referral cause
  findAndCountCause: (params) =>
    apiGet("main-service/referral/cause/findAndCount", params),
  findCause: (params) =>
    apiGet("main-service/referral/cause/find", params),
  findOneCause: (id) =>
    apiGet(`main-service/referral/cause/findOne?id=${id}`),
  createCause: (data) =>
    apiPost("main-service/referral/cause/create", data),
  updateCause: (id, data) =>
    apiPut(`main-service/referral/cause/update/${id}`, data),
  deleteCause: (id) =>
    apiDelete(`main-service/referral/cause/delete/${id}`),

  // Patient history
  getPatientHistory: (data) =>
    apiPost("main-service/referral/document/getPatientHistory", data),

  // Referral history log
  findAndCountReferralHistory: (params) =>
    apiGet("main-service/log/referralDocumentLocal/findAndCount", params),

  // ICD-10 / Medicine
  findAndCountIcd10: (params) =>
    apiGet("main-service/icd10/findAndCount", params),
  findAndCountMedicine: (params) =>
    apiGet("main-service/medicine/findAndCount", params),

  // Delivery point & Doctor branch
  checkReferPointHospital: async (params) => {
    const res = await apiGet("main-service/referral/deliveryPointTypeStart/find", params);
    // Unwrap: API returns { status, referralDeliveryPointTypeStarts: [...] }
    if (res && Array.isArray(res.referralDeliveryPointTypeStarts)) {
      return res.referralDeliveryPointTypeStarts;
    }
    return [];
  },
  checkDoctorBranch: (params) =>
    apiGet("main-service/doctor/branch/find", params),
}));
