"use client";

import { useEffect } from "react";
import { Box } from "@mui/material";
import { useAuthStore } from "@/stores/authStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import DashboardFilter from "./DashboardFilter";
import StatisticReport from "./StatisticReport";
import StatisticCharts from "./StatisticCharts";
import ReferralReasons from "./ReferralReasons";
import FrequentReasons from "./FrequentReasons";
import TopAdmissionRateHospital from "./TopAdmissionRateHospital";
import MostReferredDisease from "./MostReferredDisease";
import type { DashboardType } from "@/types/dashboard";
import api from "@/lib/api";

interface Props {
  dashboardType: DashboardType;
}

export default function DashboardPage({ dashboardType }: Props) {
  const { getRoleName } = useAuthStore();
  const roleName = getRoleName();
  const { setHospitalOptions, globalStartDate, setGlobalDates, setSelectedRange } = useDashboardStore();

  // Load hospital filter options + initialize default date range
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        // Match original: 3 separate API calls in parallel
        const [zoneRes, typeRes, hospitalRes] = await Promise.all([
          api.get("main-service/hospitalZone/findAndCount", {
            params: { offset: 1, limit: 10000 },
          }),
          api.get("main-service/hospital/Subtype/findAndCount", {
            params: { offset: 1, limit: 10000 },
          }),
          api.get("main-service/hospital/find", {
            params: { offset: 1, limit: 10000 },
          }),
        ]);

        const hospitalZones = zoneRes.data?.hospitalZones || [];
        const hospitalSubTypes = typeRes.data?.hospitalSubTypes || [];
        const hospitals = hospitalRes.data?.hospitals || [];

        // Extract unique affiliations and service levels from hospitals
        const affiliationSet = new Set<string>();
        const levelSet = new Set<string>();
        hospitals.forEach((h: any) => {
          if (h.affiliation) affiliationSet.add(h.affiliation);
          if (h.serviceLevel) levelSet.add(h.serviceLevel);
        });

        setHospitalOptions({
          hospitalData: hospitals,
          hospitalZone: hospitalZones.map((z: any) => ({ value: z.id, name: z.name })),
          hospitalSubType: hospitalSubTypes.map((t: any) => ({ value: t.id, name: t.name })),
          hospitalAffiliation: Array.from(affiliationSet).map((v) => ({ value: v, name: v })),
          hospitalServiceLevel: Array.from(levelSet).map((v) => ({ value: v, name: v })),
        });
      } catch (err) {
        console.error("Failed to load hospital options:", err);
      }
    };

    loadFilterOptions();

    if (!globalStartDate) {
      const now = new Date();
      const start = new Date();
      start.setDate(now.getDate() - 29);
      setGlobalDates(start.toISOString().split("T")[0], now.toISOString().split("T")[0]);
      setSelectedRange("30_days");
    }
  }, [setHospitalOptions, globalStartDate, setGlobalDates, setSelectedRange]);

  return (
    <Box id="dashboard-content" sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <DashboardFilter dashboardType={dashboardType} />
      <StatisticReport role={roleName} dashboardType={dashboardType} />
      <StatisticCharts role={roleName} dashboardType={dashboardType} />
      <TopAdmissionRateHospital role={roleName} dashboardType={dashboardType} />
      <MostReferredDisease role={roleName} dashboardType={dashboardType} />
      <ReferralReasons role={roleName} dashboardType={dashboardType} />
      <FrequentReasons role={roleName} dashboardType={dashboardType} />
    </Box>
  );
}
