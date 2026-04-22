import { create } from "zustand";
import api from "@/lib/api";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TabKey = "all" | "refer-opd" | "refer-ipd" | "refer-er";

interface ReferralListFilters {
  selectTime: number | "";
  selectStatus: number | "";
  selectReferralTypeStart: number | "";
  selectReferralTypeEnd: number | "";
  selectDoctorBranch: number | "";
  selectZone: number | "";
  selectSubType: number | "";
  selectHospital: number | "";
  searchPatient: string;
  searchReferNumber: string;
  searchICD: string;
  dateFrom: string;
  dateTo: string;
  activeTab: TabKey;
}

interface ReferralListData {
  referralDocuments: any[];
  totalCount: number;
  offset: number;
  limit: number;
  isLoadingList: boolean;
  loadingItemId: string | number | null;
}

interface ReferralListActions {
  // Filter setters
  setSelectTime: (v: number | "") => void;
  setSelectStatus: (v: number | "") => void;
  setSelectReferralTypeStart: (v: number | "") => void;
  setSelectReferralTypeEnd: (v: number | "") => void;
  setSelectDoctorBranch: (v: number | "") => void;
  setSelectZone: (v: number | "") => void;
  setSelectSubType: (v: number | "") => void;
  setSelectHospital: (v: number | "") => void;
  setSearchPatient: (v: string) => void;
  setSearchReferNumber: (v: string) => void;
  setSearchICD: (v: string) => void;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
  setActiveTab: (v: TabKey) => void;

  // Data setters
  setReferralDocuments: (docs: any[]) => void;
  setTotalCount: (n: number) => void;
  setOffset: (n: number) => void;
  setLimit: (n: number) => void;
  setIsLoadingList: (v: boolean) => void;
  setLoadingItemId: (v: string | number | null) => void;

  // Bulk operations
  resetFilters: () => void;
  resetAll: () => void;
}

export type ReferralListState = ReferralListFilters &
  ReferralListData &
  ReferralListActions;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function minusMonthsStartOfMonth(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/* ------------------------------------------------------------------ */
/*  Default filter values                                              */
/* ------------------------------------------------------------------ */

const defaultFilters: ReferralListFilters = {
  selectTime: "",
  selectStatus: "",
  selectReferralTypeStart: "",
  selectReferralTypeEnd: "",
  selectDoctorBranch: "",
  selectZone: "",
  selectSubType: "",
  selectHospital: "",
  searchPatient: "",
  searchReferNumber: "",
  searchICD: "",
  dateFrom: minusMonthsStartOfMonth(6),
  dateTo: today(),
  activeTab: "all",
};

const defaultData: ReferralListData = {
  referralDocuments: [],
  totalCount: 0,
  offset: 1,
  limit: 10,
  isLoadingList: false,
  loadingItemId: null,
};

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

export const useReferralListStore = create<ReferralListState>((set) => ({
  // Filters
  ...defaultFilters,

  // Data
  ...defaultData,

  // Filter setters
  setSelectTime: (v) => set({ selectTime: v }),
  setSelectStatus: (v) => set({ selectStatus: v }),
  setSelectReferralTypeStart: (v) => set({ selectReferralTypeStart: v }),
  setSelectReferralTypeEnd: (v) => set({ selectReferralTypeEnd: v }),
  setSelectDoctorBranch: (v) => set({ selectDoctorBranch: v }),
  setSelectZone: (v) => set({ selectZone: v, selectSubType: "", selectHospital: "" }),
  setSelectSubType: (v) => set({ selectSubType: v, selectHospital: "" }),
  setSelectHospital: (v) => set({ selectHospital: v }),
  setSearchPatient: (v) => set({ searchPatient: v }),
  setSearchReferNumber: (v) => set({ searchReferNumber: v }),
  setSearchICD: (v) => set({ searchICD: v }),
  setDateFrom: (v) => set({ dateFrom: v }),
  setDateTo: (v) => set({ dateTo: v }),
  setActiveTab: (v) => set({ activeTab: v }),

  // Data setters
  setReferralDocuments: (docs) => set({ referralDocuments: docs }),
  setTotalCount: (n) => set({ totalCount: n }),
  setOffset: (n) => set({ offset: n }),
  setLimit: (n) => set({ limit: n }),
  setIsLoadingList: (v) => set({ isLoadingList: v }),
  setLoadingItemId: (v) => set({ loadingItemId: v }),

  // Bulk operations
  resetFilters: () =>
    set({
      ...defaultFilters,
      dateFrom: minusMonthsStartOfMonth(6),
      dateTo: today(),
    }),
  resetAll: () =>
    set({
      ...defaultFilters,
      ...defaultData,
      dateFrom: minusMonthsStartOfMonth(6),
      dateTo: today(),
    }),
}));
