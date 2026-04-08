"use client";

import { useCallback, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export interface OptionData {
  value: number | string;
  name: string;
  count?: number;
  disabled?: boolean;
}

export interface Options {
  types: OptionData[];
  zones: OptionData[];
  hospitals: OptionData[];
  groups: OptionData[];
  referstatus: OptionData[];
  referstatus_detail: OptionData[];
  referpoint: OptionData[];
  docterbranch: OptionData[];
  roles: any[];
}

export interface FetchParams {
  zone?: number | null;
  subType?: number | null;
  hospital?: number | null;
  statusType?: string | null;
  useFor?: string;
  [key: string]: any;
}

const emptyOptions: Options = {
  types: [],
  zones: [],
  hospitals: [],
  groups: [],
  referstatus: [],
  referstatus_detail: [],
  referpoint: [],
  docterbranch: [],
  roles: [],
};

const transformOptions = (arr: any[]): OptionData[] => {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => ({
    value: item.id,
    name: item.name,
    count: item.hospitalCount,
    ...(item.disabled !== undefined ? { disabled: item.disabled } : {}),
  }));
};

const apiGet = async (url: string, params?: any) => {
  const res = await api.get(url, { params });
  return res.data;
};

/**
 * Next.js port of Nuxt's useHospitalFormOptionsAll composable.
 * Mirrors the same role-aware param-building for superAdmin/superAdminZone/superAdminHospital
 * and exposes identical fetch methods.
 */
export function useHospitalFormOptionsAll() {
  const [isLoading, setIsLoading] = useState(false);
  const [adminhospital, setAdminHospital] = useState(false);
  const [options, setOptions] = useState<Options>(emptyOptions);

  const updateOptions = (patch: Partial<Options>) =>
    setOptions((prev) => ({ ...prev, ...patch }));

  const buildParams = useCallback(
    (additionalParams?: Partial<FetchParams>): FetchParams => {
      const state = useAuthStore.getState();
      const profile: any = state.profile;
      const roleName: string = profile?.permissionGroup?.role?.name || "";

      const params: FetchParams = {
        zone: null,
        subType: null,
        hospital: null,
        statusType: null,
      };

      if (roleName === "superAdmin") {
        setAdminHospital(false);
      }

      if (roleName === "superAdminHospital") {
        const hospitalId = profile?.permissionGroup?.hospital?.id;
        params.hospital = hospitalId || null;
      }

      if (roleName === "superAdminZone") {
        const hospitalId = profile?.permissionGroup?.hospital?.id;
        params.hospital = hospitalId || null;
      }

      return { ...params, ...additionalParams };
    },
    []
  );

  const fetchTypes = useCallback(
    async (additionalParams?: Partial<FetchParams>) => {
      setIsLoading(true);
      try {
        const params = buildParams(additionalParams);
        const res = await apiGet(
          "main-service/hospital/subType/findWithHospitals",
          params
        );
        updateOptions({ types: transformOptions(res.hospitalSubTypes) });
      } catch (err) {
        console.error("Error fetching hospital types:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [buildParams]
  );

  const fetchZones = useCallback(
    async (additionalParams?: Partial<FetchParams>) => {
      setIsLoading(true);
      try {
        const state = useAuthStore.getState();
        const profile: any = state.profile;
        const roleName: string = profile?.permissionGroup?.role?.name || "";

        let params: FetchParams;
        if (
          roleName === "superAdminZone" ||
          roleName === "superAdminHospital"
        ) {
          const zoneId = profile?.permissionGroup?.zone?.id;
          params = {
            zone: zoneId || null,
            subType: null,
            hospital: null,
            statusType: null,
            ...additionalParams,
          };
        } else {
          params = buildParams(additionalParams);
        }
        const res = await apiGet("main-service/hospitalZone/find", params);
        updateOptions({ zones: transformOptions(res.hospitalZones) });
      } catch (err) {
        console.error("Error fetching hospital zones:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [buildParams]
  );

  const fetchHospitals = useCallback(
    async (additionalParams?: Partial<FetchParams>) => {
      setIsLoading(true);
      try {
        const state = useAuthStore.getState();
        const profile: any = state.profile;
        const roleName: string = profile?.permissionGroup?.role?.name || "";

        let params: FetchParams;
        if (
          roleName === "superAdminZone" ||
          roleName === "superAdminHospital"
        ) {
          params = {
            zone: null,
            subType: null,
            hospital: null,
            statusType: null,
            ...additionalParams,
          };
        } else {
          params = buildParams(additionalParams);
        }

        const res = await apiGet("main-service/hospital/find", params);
        let hospitals = transformOptions(res.hospitals);

        const excludeHospitalId = profile?.permissionGroup?.hospital?.id;
        let excludeOptionHospital: any = state.optionHospital;
        if (
          excludeOptionHospital !== undefined &&
          excludeOptionHospital !== null &&
          excludeOptionHospital !== ""
        ) {
          const num = Number(excludeOptionHospital);
          if (!isNaN(num)) excludeOptionHospital = num;
        }

        if (
          excludeHospitalId !== undefined ||
          excludeOptionHospital !== undefined
        ) {
          hospitals = hospitals.filter(
            (h) =>
              h.value !== excludeHospitalId &&
              h.value !== excludeOptionHospital
          );
        }

        updateOptions({ hospitals });
      } catch (err) {
        console.error("Error fetching hospitals:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [buildParams]
  );

  const fetchReferralStatusDetail = useCallback(
    async (additionalParams?: Partial<FetchParams>) => {
      setIsLoading(true);
      try {
        const params = buildParams(additionalParams);
        const res = await apiGet(
          "main-service/referral/status/detail/find",
          params
        );
        updateOptions({
          referstatus_detail: transformOptions(res.referralStatusDetails),
        });
      } catch (err) {
        console.error("Error fetching referral status detail:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [buildParams]
  );

  const fetchReferralStatus = useCallback(
    async (additionalParams?: Partial<FetchParams>) => {
      setIsLoading(true);
      try {
        const state = useAuthStore.getState();
        const profile: any = state.profile;
        const roleName: string = profile?.permissionGroup?.role?.name || "";

        let params: FetchParams;
        if (
          roleName === "superAdminZone" ||
          roleName === "superAdminHospital"
        ) {
          params = {
            zone: null,
            subType: null,
            hospital: null,
            statusType: null,
            ...additionalParams,
          };
        } else {
          params = buildParams(additionalParams);
        }
        const res = await apiGet("main-service/referral/status/find", params);
        updateOptions({ referstatus: transformOptions(res.referralStatus) });
      } catch (err) {
        console.error("Error fetching referral status:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [buildParams]
  );

  const fetchReferralPoint = useCallback(
    async (additionalParams?: Partial<FetchParams>) => {
      setIsLoading(true);
      try {
        const state = useAuthStore.getState();
        const profile: any = state.profile;
        const roleName: string = profile?.permissionGroup?.role?.name || "";

        let params: FetchParams;
        if (
          roleName === "superAdminZone" ||
          roleName === "superAdminHospital"
        ) {
          const zoneId = profile?.permissionGroup?.zone?.id;
          params = {
            zone: zoneId || null,
            subType: null,
            hospital: null,
            statusType: null,
            ...additionalParams,
          };
        } else {
          params = buildParams(additionalParams);
        }

        const res = await apiGet(
          "main-service/referral/deliveryPointTypeStart/find",
          params
        );
        updateOptions({
          referpoint: transformOptions(
            res.referralDeliveryPointTypeStarts || []
          ),
        });
      } catch (err) {
        console.error("Error fetching referral point:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [buildParams]
  );

  const fetchDoctorBranch = useCallback(
    async (additionalParams?: Partial<FetchParams>) => {
      setIsLoading(true);
      try {
        const state = useAuthStore.getState();
        const profile: any = state.profile;
        const roleName: string = profile?.permissionGroup?.role?.name || "";

        let params: FetchParams;
        if (
          roleName === "superAdminZone" ||
          roleName === "superAdminHospital"
        ) {
          const zoneId = profile?.permissionGroup?.zone?.id;
          params = {
            zone: zoneId || null,
            subType: null,
            hospital: null,
            statusType: null,
            ...additionalParams,
          };
        } else {
          params = buildParams(additionalParams);
        }

        const res = await apiGet("main-service/doctor/branch/find", params);
        const branches = Array.isArray(res?.doctorBranches)
          ? res.doctorBranches
          : [];
        updateOptions({ docterbranch: transformOptions(branches) });
      } catch (err) {
        console.error("Error fetching doctor branches:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [buildParams]
  );

  const resetOptions = useCallback(() => setOptions(emptyOptions), []);

  return {
    isLoading,
    adminhospital,
    options,
    fetchTypes,
    fetchZones,
    fetchHospitals,
    fetchReferralStatusDetail,
    fetchReferralStatus,
    fetchReferralPoint,
    fetchDoctorBranch,
    resetOptions,
    buildParams,
  };
}
