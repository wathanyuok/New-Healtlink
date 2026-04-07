"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Skeleton,
} from "@mui/material";
import { Download as DownloadIcon } from "@mui/icons-material";
import { useDashboardStore } from "@/stores/dashboardStore";
import FilterSection from "./FilterSection";
import type { Filters, DashboardType } from "@/types/dashboard";

interface Props {
  role: string;
  dashboardType: DashboardType;
}

const GRADIENT = "linear-gradient(90deg, #46bee8 0%, #24d89d 100%)";

export default function TopReferOutHospital({ role, dashboardType }: Props) {
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
  }), [store.globalStartDate, store.globalEndDate, filters]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await store.getTop5HighestReferOutHospitals(params);
      setApiData(response?.top5HighestAcceptingHospitals || response?.data?.top5HighestAcceptingHospitals || response?.data || response || null);
    } catch (error) {
      console.error("Error fetching top5 refer out hospitals:", error);
    } finally {
      setLoading(false);
    }
  }, [params, store]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tableData = useMemo(() => {
    if (!apiData || !Array.isArray(apiData)) return [];
    return apiData.map((item: any) => ({
      hospital: item.hospitalName || "",
      type: item.hospitalSubType || "",
      level: item.serviceLevel || "",
      affiliation: item.hospitalAffiliation || "",
      referOutRate: (item.referOutRate || "0").toString().replace("%", ""),
      referOut: item.referOut || 0,
    }));
  }, [apiData]);

  const downloadExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();
      const sheetData: any[][] = [];
      sheetData.push(["รายงาน Top 5 สถานพยาบาลปลายทางที่ส่งออกมากที่สุด"]);
      sheetData.push([]);
      sheetData.push(["อันดับ", "สถานพยาบาล", "ประเภทสถานพยาบาล", "ระดับบริการ", "สังกัดสถานพยาบาล", "อัตราการส่งออก", "Refer Out"]);
      tableData.forEach((row, idx) => {
        sheetData.push([idx + 1, row.hospital, row.type, row.level, row.affiliation, row.referOutRate + "%", row.referOut]);
      });
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      ws["!cols"] = sheetData.reduce((acc: any[], row: any[]) => {
        row.forEach((cell, i) => { const l = (cell?.toString() || "").length; if (!acc[i] || acc[i] < l) acc[i] = l; });
        return acc;
      }, []).map((w: number) => ({ wch: Math.min(w + 2, 50) }));
      XLSX.utils.book_append_sheet(wb, ws, "Top5 สถานพยาบาลส่งออก");
      XLSX.writeFile(wb, `Top5_สถานพยาบาลปลายทางที่ส่งออกมากที่สุด_${Date.now()}.xlsx`);
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
          Top 5 สถานพยาบาลปลายทางที่ส่งออกมากที่สุด
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
                <TableRow>
                  <TableCell align="center" sx={{ color: "#fff", fontWeight: 600 }}>ลำดับ</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 600 }}>สถานพยาบาล</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 600 }}>ประเภทสถานพยาบาล</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 600 }}>ระดับบริการ</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 600 }}>สังกัดสถานพยาบาล</TableCell>
                  <TableCell align="center" sx={{ color: "#fff", fontWeight: 600 }}>อัตราการส่งออก</TableCell>
                  <TableCell align="center" sx={{ color: "#fff", fontWeight: 600 }}>Refer Out</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.map((row, idx) => (
                  <TableRow key={`refout-${idx}`} hover>
                    <TableCell align="center">{idx + 1}</TableCell>
                    <TableCell>{row.hospital}</TableCell>
                    <TableCell>{row.type}</TableCell>
                    <TableCell>{row.level}</TableCell>
                    <TableCell>{row.affiliation}</TableCell>
                    <TableCell align="center">{row.referOutRate}%</TableCell>
                    <TableCell align="center">{row.referOut}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Paper>
  );
}
