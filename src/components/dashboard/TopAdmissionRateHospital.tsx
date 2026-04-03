"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Skeleton,
} from "@mui/material";
import { Download as DownloadIcon } from "@mui/icons-material";
import { useDashboardStore } from "@/stores/dashboardStore";
import { isDashboardSectionVisible } from "@/utils/dashboard";
import FilterSection from "./FilterSection";
import type { Filters, DashboardType } from "@/types/dashboard";

interface Props {
  role: string;
  dashboardType: DashboardType;
}

const GRADIENT = "linear-gradient(90deg, #46bee8 0%, #24d89d 100%)";

export default function TopAdmissionRateHospital({ role, dashboardType }: Props) {
  const store = useDashboardStore();
  const [apiData, setApiData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const filters = store.globalFilters;
  const setFilters = (f: Filters | ((prev: Filters) => Filters)) => {
    const newFilters = typeof f === "function" ? f(store.globalFilters) : f;
    store.setGlobalFilters(newFilters);
  };

  const params = useMemo(() => ({
    startDate: store.globalStartDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: store.globalEndDate || new Date().toISOString(),
    hospitalZoneId: filters.zone,
    hospitalSubTypeId: filters.type,
    hospitalId: filters.name,
    affiliation: filters.region,
    serviceLevel: filters.level,
  }), [store.globalStartDate, store.globalEndDate, filters, dashboardType]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const apiFn = dashboardType === "refer-in"
        ? store.getTop5HighestReferInHospitals
        : dashboardType === "refer-out"
          ? store.getTop5HighestReferOutHospitals
          : store.getTop5HighestAcceptingHospitals;
      const response = await apiFn(params);
      setApiData(response?.top5HighestAcceptingHospitals || response?.data?.top5HighestAcceptingHospitals || response?.data || response || null);
    } catch (error) {
      console.error("Error fetching top5 hospitals:", error);
    } finally {
      setLoading(false);
    }
  }, [params, store, dashboardType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    useDashboardStore.setState({ top5HighestAcceptingHospitalsFilters: filters });
  }, [filters]);

  const tableData = useMemo(() => {
    if (!apiData || !Array.isArray(apiData)) return [];
    return apiData.map((item: any) => ({
      hospital: item.hospitalName || "",
      type: item.hospitalSubType || "",
      level: item.serviceLevel || "",
      affiliation: item.hospitalAffiliation || "",
      percentage: (
        dashboardType === "refer-out" ? (item.referOutRate || "0")
          : dashboardType === "refer-in" ? (item.referInRate || "0")
          : (item.acceptanceRate || "0")
      ).toString().replace("%", ""),
      referIn: item.referIn || item.countIn || 0,
      referOut: item.referOut || item.countOut || 0,
      referBack: item.referBack || item.countBack || 0,
      sum: item.sum || item.total || 0,
      opdCount: dashboardType === "refer-out" ? (item.opdCountOut || 0) : (item.opdCount || 0),
      ipdCount: dashboardType === "refer-out" ? (item.ipdCountOut || 0) : (item.ipdCount || 0),
      emergencyCount: dashboardType === "refer-out" ? (item.emergencyCountOut || 0) : (item.emergencyCount || 0),
    }));
  }, [apiData, dashboardType]);

  const showHospital = isDashboardSectionVisible(role, "hospital");

  const downloadExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const exportParams = {
        ...params,
        sortBy: dashboardType === "refer-out" ? "referOut" : dashboardType === "refer-in" ? "referIn" : "acceptanceRate",
      };
      const response = await store.exportTop5HighestAcceptingHospitals(exportParams);
      const exportData = response?.data || response;
      if (!exportData?.data) { alert("ไม่มีข้อมูลสำหรับการส่งออก"); return; }

      const wb = XLSX.utils.book_new();
      const sheetData: any[][] = [];
      const title = dashboardType === "all"
        ? (exportData.reportTitle || "รายงาน Top 5 สถานพยาบาลที่ส่งต่อผู้ป่วยเข้ามารักษามากที่สุด")
        : dashboardType === "refer-in"
          ? "รายงานสถานพยาบาลที่ส่งต่อผู้ป่วยเข้ามารักษามากที่สุด"
          : "รายงานสถานพยาบาลปลายทางที่ส่งออกมากที่สุด";
      sheetData.push([title]);
      if (exportData.dateRange) sheetData.push([`ช่วงวันที่: ${exportData.dateRange}`]);
      sheetData.push([]);
      if (dashboardType === "all") {
        sheetData.push(["อันดับ", "ชื่อโรงพยาบาล", "ประเภทโรงพยาบาล", "ระดับบริการ", "สังกัด", "อัตราการยอมรับ", "Refer In", "Refer Out", "Refer Back", "รวม"]);
        exportData.data.forEach((item: any) => {
          sheetData.push([item.rank || "", item.hospitalName || "", item.hospitalSubType || "", item.serviceLevel || "", item.hospitalAffiliation || "", item.acceptanceRate || "0%", item.referIn || 0, item.referOut || 0, item.referBack || 0, item.total || 0]);
        });
      } else {
        const dirLabel = dashboardType === "refer-in" ? "Refer In" : "Refer Out";
        sheetData.push(["อันดับ", "สถานพยาบาล", "ประเภทการส่งตัว OPD", "ประเภทการส่งตัว IPD", "ประเภทการส่งตัว ER", dirLabel, "รวม"]);
        exportData.data.forEach((item: any) => {
          const opd = dashboardType === "refer-out" ? (item.opdCountOut || 0) : (item.opdCount || 0);
          const ipd = dashboardType === "refer-out" ? (item.ipdCountOut || 0) : (item.ipdCount || 0);
          const er = dashboardType === "refer-out" ? (item.emergencyCountOut || 0) : (item.emergencyCount || 0);
          const rateField = dashboardType === "refer-out" ? (item.referOutRate || "0%")
            : dashboardType === "refer-in" ? (item.referInRate || "0%")
            : (item.acceptanceRate || "0%");
          sheetData.push([item.rank || "", item.hospitalName || "", opd, ipd, er, dashboardType === "refer-in" ? (item.referIn || 0) : (item.referOut || 0), rateField]);
        });
      }
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      ws["!cols"] = sheetData.reduce((acc: any[], row: any[]) => {
        row.forEach((cell, i) => { const l = (cell?.toString() || "").length; if (!acc[i] || acc[i] < l) acc[i] = l; });
        return acc;
      }, []).map((w: number) => ({ wch: Math.min(w + 2, 50) }));
      const sheetName = dashboardType === "all"
        ? "Top5 โรงพยาบาลอันดับสูง"
        : dashboardType === "refer-in" ? "สถานพยาบาลส่งต่อเข้ามา" : "สถานพยาบาลปลายทางส่งออก";
      const fileName = dashboardType === "all"
        ? `Top5_สถานพยาบาลอัตราการรับสูงสุด_${Date.now()}.xlsx`
        : dashboardType === "refer-in"
          ? `สถานพยาบาลที่ส่งต่อผู้ป่วยเข้ามารักษามากที่สุด_${Date.now()}.xlsx`
          : `สถานพยาบาลปลายทางที่ส่งออกมากที่สุด_${Date.now()}.xlsx`;
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, fileName);
    } catch (error: any) {
      console.error("Error exporting Excel:", error);
      alert(`เกิดข้อผิดพลาด: ${error.message || "ไม่สามารถดาวน์โหลดได้"}`);
    }
  };

  const clearFilters = () => setFilters({ zone: null, type: null, name: null, region: null, level: null });

  return (
    <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, background: GRADIENT, color: "#fff" }}>
        <Typography variant="h6" fontWeight={600}>
          {dashboardType === "all"
            ? "Top 5 สถานพยาบาลที่ส่งต่อผู้ป่วยเข้ามารักษามากที่สุด"
            : dashboardType === "refer-in"
              ? "สถานพยาบาลที่ส่งต่อผู้ป่วยเข้ามารักษามากที่สุด"
              : "สถานพยาบาลปลายทางที่ส่งออกมากที่สุด"}
        </Typography>
        <Button variant="contained" size="small" startIcon={<DownloadIcon />} onClick={downloadExcel}
          sx={{ bgcolor: "#fff", color: "#036246", "&:hover": { bgcolor: "#f0f0f0" }, whiteSpace: "nowrap" }}>
          ดาวน์โหลดเป็น Excel
        </Button>
      </Box>

      <FilterSection filters={filters} onFilterChange={setFilters} onClear={clearFilters} hideHospitalFilter role={role} />

      <Box sx={{ px: 2, pb: 3 }}>
        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {[...Array(5)].map((_, i) => <Skeleton key={i} variant="rectangular" height={48} sx={{ borderRadius: 1 }} />)}
          </Box>
        ) : tableData.length === 0 ? (
          <Typography textAlign="center" color="text.secondary" py={4}>ไม่พบข้อมูล</Typography>
        ) : (
          <TableContainer sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#036245" }}>
                {dashboardType === "all" ? (
                  <TableRow>
                    <TableCell align="center" sx={{ color: "#fff", fontWeight: 600 }}>ลำดับ</TableCell>
                    {showHospital && <TableCell sx={{ color: "#fff", fontWeight: 600 }}>สถานพยาบาล</TableCell>}
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>ประเภทสถานพยาบาล</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>ระดับบริการ</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>สังกัดสถานพยาบาล</TableCell>
                    <TableCell align="center" sx={{ color: "#fff", fontWeight: 600 }}>อัตราการรับ</TableCell>
                    <TableCell align="center" sx={{ color: "#fff", fontWeight: 600 }}>Refer In</TableCell>
                    <TableCell align="center" sx={{ color: "#fff", fontWeight: 600 }}>Refer Out</TableCell>
                    <TableCell align="center" sx={{ color: "#fff", fontWeight: 600 }}>Refer Back</TableCell>
                    <TableCell align="center" sx={{ color: "#fff", fontWeight: 600 }}>รวม</TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell align="center" sx={{ color: "#fff", fontWeight: 600 }}>ลำดับ</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>สถานพยาบาล</TableCell>
                    <TableCell align="center" sx={{ color: "#fff", fontWeight: 600, whiteSpace: "nowrap" }}>ประเภทการส่งตัว OPD</TableCell>
                    <TableCell align="center" sx={{ color: "#fff", fontWeight: 600, whiteSpace: "nowrap" }}>ประเภทการส่งตัว IPD</TableCell>
                    <TableCell align="center" sx={{ color: "#fff", fontWeight: 600, whiteSpace: "nowrap" }}>ประเภทการส่งตัว ER</TableCell>
                    <TableCell align="center" sx={{ color: "#fff", fontWeight: 600 }}>{dashboardType === "refer-in" ? "Refer In" : "Refer Out"}</TableCell>
                    <TableCell align="center" sx={{ color: "#fff", fontWeight: 600 }}>รวม</TableCell>
                  </TableRow>
                )}
              </TableHead>
              <TableBody>
                {tableData.map((row, idx) => (
                  dashboardType === "all" ? (
                    <TableRow key={`hosp-${idx}`} hover>
                      <TableCell align="center">{idx + 1}</TableCell>
                      {showHospital && <TableCell>{row.hospital}</TableCell>}
                      <TableCell>{row.type}</TableCell>
                      <TableCell>{row.level}</TableCell>
                      <TableCell>{row.affiliation}</TableCell>
                      <TableCell align="center">{row.percentage}%</TableCell>
                      <TableCell align="center">{row.referIn}</TableCell>
                      <TableCell align="center">{row.referOut}</TableCell>
                      <TableCell align="center">{row.referBack}</TableCell>
                      <TableCell align="center">{row.sum}</TableCell>
                    </TableRow>
                  ) : (
                    <TableRow key={`hosp-${idx}`} hover>
                      <TableCell align="center">{idx + 1}</TableCell>
                      <TableCell>{row.hospital}</TableCell>
                      <TableCell align="center">{row.opdCount}</TableCell>
                      <TableCell align="center">{row.ipdCount}</TableCell>
                      <TableCell align="center">{row.emergencyCount}</TableCell>
                      <TableCell align="center">{dashboardType === "refer-in" ? row.referIn : row.referOut}</TableCell>
                      <TableCell align="center">{row.percentage}%</TableCell>
                    </TableRow>
                  )
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Paper>
  );
}
