import { create } from "zustand";
import api from "@/lib/api";
import type { FilterOption, Filters } from "@/types/dashboard";
import {
  MOCK_STATICS_AND_DETAILS,
  MOCK_REPORT_STATUS_STATISTICS,
  MOCK_TOP5_HOSPITALS,
  MOCK_TOP10_DISEASES,
  MOCK_TOP5_CAUSE,
  MOCK_TOP5_COMMON_REASONS,
  MOCK_EXPORT_STATICS_AND_DETAILS,
  MOCK_EXPORT_REPORT_STATUS_STATISTICS,
  MOCK_EXPORT_TOP5_HOSPITALS,
  MOCK_EXPORT_TOP10_DISEASES,
  MOCK_EXPORT_TOP5_CAUSE,
  MOCK_EXPORT_TOP5_COMMON_REASONS,
} from "@/mocks/dashboardMock";

const API = {
  MONITOR_REFERRAL: "main-service/dashboard/monitorReferral",
  STATICS_AND_DETAILS: "main-service/dashboard/staticsAndDetails",
  REPORT_STATUS_STATISTICS: "main-service/dashboard/reportStatusStatistics",
  TOP_5_CAUSE: "main-service/dashboard/top5Cause",
  TOP_5_COMMON_REASONS: "main-service/dashboard/top5CommonReasons",
  TOP_5_HIGHEST_ACCEPTING_HOSPITALS: "main-service/dashboard/top5HighestAcceptingHospitals",
  TOP_5_HIGHEST_REFER_OUT_HOSPITALS: "main-service/dashboard/top5HighestReferOutHospitals",
  TOP_5_HIGHEST_REFER_IN_HOSPITALS: "main-service/dashboard/top5HighestReferInHospitals",
  TOP_10_MOST_REFERRED_DISEASES: "main-service/dashboard/top10MostReferredDiseases",
  SUMMARY_EXPORT_EXCEL: "main-service/dashboard/summaryExportExcel",
  STATICS_AND_DETAILS_EXPORT: "main-service/dashboard/staticsAndDetailsExportExcel",
  REPORT_STATUS_STATISTICS_EXPORT: "main-service/dashboard/reportStatusStatisticsExportExcel",
  TOP_5_CAUSE_EXPORT: "main-service/dashboard/top5CauseExportExcel",
  TOP_5_COMMON_REASONS_EXPORT: "main-service/dashboard/top5CommonReasonsExportExcel",
  TOP_5_HIGHEST_ACCEPTING_HOSPITALS_EXPORT: "main-service/dashboard/top5HighestAcceptingHospitalsExportExcel",
  TOP_10_MOST_REFERRED_DISEASES_EXPORT: "main-service/dashboard/top10MostReferredDiseasesExportExcel",
} as const;

const defaultFilters = (): Filters => ({
  zone: null,
  type: null,
  name: null,
  region: null,
  level: null,
});

interface DashboardState {
  // Filter options
  hospital: FilterOption[];
  hospitalZone: FilterOption[];
  hospitalSubType: FilterOption[];
  hospitalAffiliation: FilterOption[];
  hospitalServiceLevel: FilterOption[];
  hospitalData: any[];

  // Global date range
  globalStartDate: string;
  globalEndDate: string;
  selectedRange: string;

  // Global filters (shared across all sections)
  globalFilters: Filters;

  // Section filters (legacy — kept for backward compatibility)
  staticsAndDetailsFilters: Filters;
  reportStatusStatisticsFilters: Filters;
  top5CauseFilters: Filters;
  top5CommonReasonsFilters: Filters;
  top5HighestAcceptingHospitalsFilters: Filters;
  top10MostReferredDiseasesFilters: Filters;

  // Loading
  loading: boolean;

  // Actions
  setGlobalDates: (start: string, end: string) => void;
  setSelectedRange: (range: string) => void;
  setGlobalFilters: (filters: Partial<Filters>) => void;
  setHospitalOptions: (data: {
    hospital?: FilterOption[];
    hospitalZone?: FilterOption[];
    hospitalSubType?: FilterOption[];
    hospitalAffiliation?: FilterOption[];
    hospitalServiceLevel?: FilterOption[];
    hospitalData?: any[];
  }) => void;
  updateAllFiltersHospital: (hospitalId: number | null) => void;
  resetAllFilters: () => void;

  // API calls
  getReferMonitor: (params: any) => Promise<any>;
  getStaticsAndDetails: (params: any) => Promise<any>;
  getReportStatusStatistics: (params: any) => Promise<any>;
  getTop5Cause: (params: any) => Promise<any>;
  getTop5CommonReasons: (params: any) => Promise<any>;
  getTop5HighestAcceptingHospitals: (params: any) => Promise<any>;
  getTop5HighestReferOutHospitals: (params: any) => Promise<any>;
  getTop5HighestReferInHospitals: (params: any) => Promise<any>;
  getTop10MostReferredDiseases: (params: any) => Promise<any>;

  // Export
  exportSummaryExcel: (params: any) => Promise<any>;
  exportStaticsAndDetails: (params: any) => Promise<any>;
  exportReportStatusStatistics: (params: any) => Promise<any>;
  exportTop5Cause: (params: any) => Promise<any>;
  exportTop5CommonReasons: (params: any) => Promise<any>;
  exportTop5HighestAcceptingHospitals: (params: any) => Promise<any>;
  exportTop10MostReferredDiseases: (params: any) => Promise<any>;
}

const apiGet = async (endpoint: string, params: any, mockFallback?: any) => {
  try {
    const response = await api.get(endpoint, { params });
    return response.data;
  } catch (err) {
    if (mockFallback) {
      console.warn(`[MOCK] API ${endpoint} unavailable, using mock data`);
      return mockFallback;
    }
    throw err;
  }
};

export const useDashboardStore = create<DashboardState>((set) => ({
  // Filter options
  hospital: [],
  hospitalZone: [],
  hospitalSubType: [],
  hospitalAffiliation: [],
  hospitalServiceLevel: [],
  hospitalData: [],

  // Global date range
  globalStartDate: "",
  globalEndDate: "",
  selectedRange: "30_days",

  // Global filters
  globalFilters: defaultFilters(),

  // Section filters
  staticsAndDetailsFilters: defaultFilters(),
  reportStatusStatisticsFilters: defaultFilters(),
  top5CauseFilters: defaultFilters(),
  top5CommonReasonsFilters: defaultFilters(),
  top5HighestAcceptingHospitalsFilters: defaultFilters(),
  top10MostReferredDiseasesFilters: defaultFilters(),

  // Loading
  loading: false,

  // Actions
  setGlobalDates: (start, end) => set({ globalStartDate: start, globalEndDate: end }),
  setSelectedRange: (range) => set({ selectedRange: range }),
  setGlobalFilters: (filters) => set((state) => ({ globalFilters: { ...state.globalFilters, ...filters } })),

  setHospitalOptions: (data) => set((state) => ({ ...state, ...data })),

  updateAllFiltersHospital: (hospitalId) =>
    set((state) => ({
      staticsAndDetailsFilters: { ...state.staticsAndDetailsFilters, name: hospitalId },
      reportStatusStatisticsFilters: { ...state.reportStatusStatisticsFilters, name: hospitalId },
      top5CauseFilters: { ...state.top5CauseFilters, name: hospitalId },
      top5CommonReasonsFilters: { ...state.top5CommonReasonsFilters, name: hospitalId },
      top5HighestAcceptingHospitalsFilters: { ...state.top5HighestAcceptingHospitalsFilters, name: hospitalId },
      top10MostReferredDiseasesFilters: { ...state.top10MostReferredDiseasesFilters, name: hospitalId },
    })),

  resetAllFilters: () =>
    set({
      globalFilters: defaultFilters(),
      staticsAndDetailsFilters: defaultFilters(),
      reportStatusStatisticsFilters: defaultFilters(),
      top5CauseFilters: defaultFilters(),
      top5CommonReasonsFilters: defaultFilters(),
      top5HighestAcceptingHospitalsFilters: defaultFilters(),
      top10MostReferredDiseasesFilters: defaultFilters(),
    }),

  // API calls (with mock fallback when backend is unavailable)
  getReferMonitor: (params) => apiGet(API.MONITOR_REFERRAL, params),
  getStaticsAndDetails: (params) => apiGet(API.STATICS_AND_DETAILS, params, MOCK_STATICS_AND_DETAILS),
  getReportStatusStatistics: (params) => apiGet(API.REPORT_STATUS_STATISTICS, params, MOCK_REPORT_STATUS_STATISTICS),
  getTop5Cause: (params) => apiGet(API.TOP_5_CAUSE, params, MOCK_TOP5_CAUSE),
  getTop5CommonReasons: (params) => apiGet(API.TOP_5_COMMON_REASONS, params, MOCK_TOP5_COMMON_REASONS),
  getTop5HighestAcceptingHospitals: (params) => apiGet(API.TOP_5_HIGHEST_ACCEPTING_HOSPITALS, params, MOCK_TOP5_HOSPITALS),
  getTop5HighestReferOutHospitals: (params) => apiGet(API.TOP_5_HIGHEST_REFER_OUT_HOSPITALS, params, MOCK_TOP5_HOSPITALS),
  getTop5HighestReferInHospitals: (params) => apiGet(API.TOP_5_HIGHEST_REFER_IN_HOSPITALS, params, MOCK_TOP5_HOSPITALS),
  getTop10MostReferredDiseases: (params) => apiGet(API.TOP_10_MOST_REFERRED_DISEASES, params, MOCK_TOP10_DISEASES),

  // Export (with mock fallback when backend is unavailable)
  exportSummaryExcel: (params) => apiGet(API.SUMMARY_EXPORT_EXCEL, params, MOCK_EXPORT_STATICS_AND_DETAILS),
  exportStaticsAndDetails: (params) => apiGet(API.STATICS_AND_DETAILS_EXPORT, params, MOCK_EXPORT_STATICS_AND_DETAILS),
  exportReportStatusStatistics: (params) => apiGet(API.REPORT_STATUS_STATISTICS_EXPORT, params, MOCK_EXPORT_REPORT_STATUS_STATISTICS),
  exportTop5Cause: (params) => apiGet(API.TOP_5_CAUSE_EXPORT, params, MOCK_EXPORT_TOP5_CAUSE),
  exportTop5CommonReasons: (params) => apiGet(API.TOP_5_COMMON_REASONS_EXPORT, params, MOCK_EXPORT_TOP5_COMMON_REASONS),
  exportTop5HighestAcceptingHospitals: (params) => apiGet(API.TOP_5_HIGHEST_ACCEPTING_HOSPITALS_EXPORT, params, MOCK_EXPORT_TOP5_HOSPITALS),
  exportTop10MostReferredDiseases: (params) => apiGet(API.TOP_10_MOST_REFERRED_DISEASES_EXPORT, params, MOCK_EXPORT_TOP10_DISEASES),
}));
