import { create } from "zustand";
import api from "@/lib/api";

interface PatientLogsStore {
  findAndCountPatientLogs: (params: any) => Promise<any>;
}

const apiGet = async (url: string, params?: any) => {
  const res = await api.get(url, { params });
  return res.data;
};

export const usePatientLogsStore = create<PatientLogsStore>(() => ({
  findAndCountPatientLogs: async (params: any) => {
    return apiGet(
      "main-service/log/user/patientHistoryView/findAndCount",
      params
    );
  },
}));
