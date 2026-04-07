import { create } from "zustand";
import api from "@/lib/api";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface HospitalOption {
  id: string | number;
  name: string;
  phone?: string;
  zone?: { id?: number; name?: string };
  subType?: { id?: number; name?: string };
  image?: string;
}

export interface SelectedHospital extends HospitalOption {
  selectedBranches?: DoctorBranchOption[];
}

export interface DoctorBranchOption {
  value: string | number;
  name: string;
  phone?: string;
  phoneExtension?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  appointment?: number; // 1 = ระบุวัน/เวลา, 2 = ไม่ระบุ
  remark?: string;
}

export interface DeliveryPointOption {
  id: number;
  name: string;
  phone?: string;
}

export interface ReferralCauseOption {
  id: number;
  name: string;
}

export interface DoctorUserOption {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
}

export interface FormDataType {
  [key: string]: any;
}

/* ------------------------------------------------------------------ */
/*  API helpers                                                        */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Store interface                                                    */
/* ------------------------------------------------------------------ */

interface ReferralCreateState {
  // Loading
  loading: boolean;
  setLoading: (v: boolean) => void;

  // Hospital list for selector
  hospitals: HospitalOption[];
  hospitalTotalCount: number;
  hospitalZones: { name: string; value: string }[];
  hospitalTypes: { id: string | number; name: string }[];

  // Selected hospitals (step 1)
  selectedHospitals: SelectedHospital[];
  setSelectedHospitals: (h: SelectedHospital[]) => void;
  addSelectedHospital: (h: HospitalOption) => void;
  removeSelectedHospital: (index: number) => void;
  clearSelectedHospitals: () => void;

  // Branch options per hospital
  hospitalBranchOptionsMap: Record<string, DoctorBranchOption[]>;

  // Delivery points
  deliveryPoints: DeliveryPointOption[];

  // Doctor branches for OPD/IPD
  doctorBranches: DoctorBranchOption[];

  // Referral cause options (from API)
  referralCauses: ReferralCauseOption[];

  // Doctor/user options for prescribing doctor dropdown (from API)
  doctorUsers: DoctorUserOption[];

  // Form data
  formData: FormDataType;
  setFormData: (data: FormDataType) => void;
  updateFormData: (partial: Partial<FormDataType>) => void;
  resetFormData: () => void;

  // Referral info (for draft editing)
  referInfo: any;
  setReferInfo: (info: any) => void;

  // API actions
  fetchHospitals: (params: {
    offset: number;
    limit: number;
    search?: string;
    zone?: string | null;
    subType?: string | null;
  }) => Promise<void>;
  fetchHospitalFilters: () => Promise<void>;
  fetchDoctorBranches: (hospitalIds: (string | number)[], isEr?: boolean) => Promise<void>;
  fetchDeliveryPoints: (params: any) => Promise<any>;
  fetchDoctorBranchList: (params: any) => Promise<any>;
  fetchReferralCauses: (params: { hospital?: string | number; referralType?: string; isOpd?: string }) => Promise<any>;
  fetchDoctorUsers: (params: { hospital?: string | number; search?: string; limit?: number; offset?: number }) => Promise<any>;
  createReferralDocument: (data: any) => Promise<any>;
  updateReferralDocument: (id: number, data: any) => Promise<any>;
  findOneReferral: (id: string) => Promise<any>;
  findGroupCase: (groupCase: string) => Promise<any>;

  // ICD-10 / Medicine lookups
  findAndCountIcd10: (params: any) => Promise<any>;
  findAndCountMedicine: (params: any) => Promise<any>;

  // Patient history
  getPatientHistory: (data: any) => Promise<any>;
}

/* ------------------------------------------------------------------ */
/*  Default form data                                                  */
/* ------------------------------------------------------------------ */

const defaultFormData: FormDataType = {
  patient_pid: "",
  patient_prefix: "",
  patient_firstname: "",
  patient_lastname: "",
  patient_birthday: "",
  certificationPeriod: "",
  startDate: "",
  startTime: "",
  referralCreationPoint: "",
  prescribingDoctor: "",
  referralCause: "",
  levelOfUrgency: "",
  icuLevel: "",
  visit_primary_symptom_main_symptom: "",
  visit_primary_symptom_current_illness: "",
  pe: "",
  Imp: "",
  deliveryPeriod: [],
  treatment: "",
  icd10: [],
};

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

export const useReferralCreateStore = create<ReferralCreateState>((set, get) => ({
  loading: false,
  setLoading: (v) => set({ loading: v }),

  hospitals: [],
  hospitalTotalCount: 0,
  hospitalZones: [],
  hospitalTypes: [],

  selectedHospitals: [],
  setSelectedHospitals: (h) => set({ selectedHospitals: h }),
  addSelectedHospital: (h) => {
    const current = get().selectedHospitals;
    if (current.length >= 5) return;
    if (current.some((x) => String(x.id) === String(h.id))) return;
    set({ selectedHospitals: [...current, { ...h, selectedBranches: [] }] });
  },
  removeSelectedHospital: (index) => {
    const current = [...get().selectedHospitals];
    current.splice(index, 1);
    set({ selectedHospitals: current });
  },
  clearSelectedHospitals: () => set({ selectedHospitals: [] }),

  hospitalBranchOptionsMap: {},

  deliveryPoints: [],
  doctorBranches: [],
  referralCauses: [],
  doctorUsers: [],

  formData: { ...defaultFormData },
  setFormData: (data) => set({ formData: data }),
  updateFormData: (partial) => set({ formData: { ...get().formData, ...partial } }),
  resetFormData: () => set({ formData: { ...defaultFormData } }),

  referInfo: null,
  setReferInfo: (info) => set({ referInfo: info }),

  /* ---- API: Hospital list ---- */
  fetchHospitals: async (params) => {
    try {
      set({ loading: true });
      const res = await apiGet("main-service/hospital/findAndCount", params);
      if (res) {
        // Get current user's hospital ID to exclude
        let excludeId: number | null = null;
        try {
          const authStr = typeof window !== "undefined" ? localStorage.getItem("auth_profile") : null;
          if (authStr) {
            const auth = JSON.parse(authStr);
            excludeId = auth?.permissionGroup?.hospital?.id ?? null;
          }
        } catch { /* ignore */ }

        const filtered = (res.hospitals || [])
          .filter((h: any) => (excludeId ? h.id !== excludeId : true))
          .map((h: any) => ({
            id: String(h.id),
            name: h.name,
            phone: h.phone || "",
            image: h.image || "",
            zone: h.zone ? { id: h.zone.id, name: String(h.zone.name ?? "") } : {},
            subType: h.subType ? { id: h.subType.id, name: String(h.subType.name ?? "") } : {},
          }));

        set({
          hospitals: filtered,
          hospitalTotalCount: res.totalCount || 0,
          loading: false,
        });
      }
    } catch (err) {
      console.error("fetchHospitals error:", err);
      set({ loading: false });
    }
  },

  fetchHospitalFilters: async () => {
    try {
      const [typeRes, zoneRes] = await Promise.all([
        apiGet("main-service/hospital/Subtype/findAndCount", { offset: 1, limit: 50 }),
        apiGet("main-service/hospitalZone/findAndCount", { offset: 1, limit: 50 }),
      ]);

      set({
        hospitalTypes: (typeRes?.hospitalSubTypes || []).map((t: any) => ({
          id: t.id,
          name: t.name,
        })),
        hospitalZones: (zoneRes?.hospitalZones || []).map((z: any) => ({
          name: z.name,
          value: String(z.id),
        })),
      });
    } catch (err) {
      console.error("fetchHospitalFilters error:", err);
    }
  },

  /* ---- API: Doctor branches per hospital ---- */
  fetchDoctorBranches: async (hospitalIds, isEr = false) => {
    try {
      const results = await Promise.all(
        hospitalIds.map(async (id) => {
          const res = await apiGet("main-service/doctor/branch/find", {
            offset: 1,
            limit: 50,
            hospital: String(id),
            ...(isEr ? { isEr: "true" } : {}),
          });
          return {
            id: String(id),
            branches: (res?.doctorBranches || []).map((b: any) => ({
              value: b.id,
              name: b.name,
            })),
          };
        })
      );

      const map: Record<string, DoctorBranchOption[]> = {};
      results.forEach((r) => {
        map[r.id] = r.branches;
      });
      set({ hospitalBranchOptionsMap: map });
    } catch (err) {
      console.error("fetchDoctorBranches error:", err);
    }
  },

  /* ---- API: Delivery points ---- */
  fetchDeliveryPoints: async (params) => {
    // Match Nuxt params: hospital, useFor, isOpd, isActive
    // useFor is passed by caller: "จุดรับใบส่งตัว" (referOut) or "จุดสร้างใบส่งตัว" (referBack)
    const fullParams = {
      ...params,
      isOpd: params.isOpd ?? true,
      isActive: params.isActive ?? true,
    };
    const res = await apiGet("main-service/referral/deliveryPointTypeStart/find", fullParams);
    const points = res?.referralDeliveryPointTypeStarts || [];
    set({ deliveryPoints: points });
    return points;
  },

  /* ---- API: Doctor branch list (for OPD step) ---- */
  fetchDoctorBranchList: async (params) => {
    // Match Nuxt: uses findAndCount with limit=0 to get ALL branches
    // Params: isOpd, isActive, hospital (optional, based on role)
    const res = await apiGet("main-service/doctor/branch/findAndCount", params);
    const branches = (res?.doctorBranches || []).map((b: any) => ({
      value: b.id,
      name: b.name,
      phone: b.phone || "",
      phoneExtension: b.phoneExtension || "",
    }));
    set({ doctorBranches: branches });
    return branches;
  },

  /* ---- API: Referral causes ---- */
  fetchReferralCauses: async (params) => {
    try {
      const res = await apiGet("main-service/referral/cause/find", params);
      const causes = (res?.referralCauses || []).map((c: any) => ({
        id: c.id,
        name: c.name,
      }));
      set({ referralCauses: causes });
      return causes;
    } catch (err) {
      console.error("fetchReferralCauses error:", err);
      return [];
    }
  },

  /* ---- API: Doctor users (for prescribing doctor dropdown) ---- */
  fetchDoctorUsers: async (params) => {
    try {
      const res = await apiGet("auth-service/user/find", {
        ...params,
        limit: params.limit ?? 50,
        offset: params.offset ?? 1,
      });
      const users = (res?.users || []).map((u: any) => ({
        id: u.id,
        name: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim(),
        email: u.email || "",
        phone: u.phone || "",
        licenseNumber: u.licenseNumber || u.doctorCode || "",
      }));
      set({ doctorUsers: users });
      return users;
    } catch (err) {
      console.error("fetchDoctorUsers error:", err);
      return [];
    }
  },

  /* ---- API: Referral CRUD ---- */
  createReferralDocument: (data) =>
    apiPost("main-service/referral/document/create", data),

  updateReferralDocument: (id, data) =>
    apiPut(`main-service/referral/document/update/${id}`, data),

  findOneReferral: (id) =>
    apiGet(`main-service/referral/document/findOne?id=${id}`),

  findGroupCase: (groupCase) =>
    apiGet(`main-service/referral/document/find?groupCase=${groupCase}`),

  /* ---- API: ICD-10 / Medicine ---- */
  findAndCountIcd10: (params) =>
    apiGet("main-service/icd10/findAndCount", params),

  findAndCountMedicine: (params) =>
    apiGet("main-service/medicine/findAndCount", params),

  /* ---- API: Patient history ---- */
  getPatientHistory: (data) =>
    apiPost("main-service/referral/document/getPatientHistory", data),
}));
