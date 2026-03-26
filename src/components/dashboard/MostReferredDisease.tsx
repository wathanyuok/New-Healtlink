"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Skeleton,
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

export default function MostReferredDisease({ role, dashboardType }: Props) {
  const store = useDashboardStore();
  const [apiData, setApiData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const filters = store.globalFilters;
  const setFilters = (f: Filters | ((prev: Filters) => Filters)) => {
    const newFilters = typeof f === "function" ? f(store.globalFilters) : f;
    store.setGlobalFilters(newFilters);
  };

  const pageTitle = useMemo(() => {
    return "Top 10 โรคที่ส่งต่อมากที่สุด";
  }, [role]);

  const params = useMemo(() => ({
    startDate: store.globalStartDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: store.globalEndDate || new Date().toISOString(),
    hospitalZoneId: filters.zone,
    hospitalSubTypeId: filters.type,
    hospitalId: filters.name,
    affiliation: filters.region,
    serviceLevel: filters.level,
    dashboardType,
  }), [store.globalStartDate, store.globalEndDate, filters, dashboardType]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await store.getTop10MostReferredDiseases(params);
      setApiData(response?.top10MostReferredDiseases || response?.data?.top10MostReferredDiseases || response?.data || response || null);
    } catch (error) {
      console.error("Error fetching top10 diseases:", error);
    } finally {
      setLoading(false);
    }
  }, [params, store]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    useDashboardStore.setState({ top10MostReferredDiseasesFilters: filters });
  }, [filters]);

  const tableData = useMemo(() => {
    if (!apiData || !Array.isArray(apiData)) return [];
    return apiData.map((item: any) => ({
      icd: item.icd10_code || item.icd || "",
      disease: item.disease_name || item.name || "",
      count: item.count || item.referIn || 0,
      percent: parseFloat(item.percentage || item.rate || "0.00"),
      acceptRate: parseFloat(item.acceptance_rate || "0"),
    }));
  }, [apiData]);

  const downloadExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const response = await store.exportTop10MostReferredDiseases(params);
      const exportData = response?.data || response;
      if (!exportData?.data) { alert("ไม่มีข้อมูลสำหรับการส่งออก"); return; }

      const wb = XLSX.utils.book_new();
      const sheetData: any[][] = [];
      sheetData.push([exportData.reportTitle || "รายงาน Top 10 โรคที่ถูกส่งต่อมากที่สุด"]);
      if (exportData.dateRange) sheetData.push([`ช่วงวันที่: ${exportData.dateRange.startDate} - ${exportData.dateRange.endDate}`]);
      sheetData.push([]);
      sheetData.push(["อันดับ", "รหัส ICD-10", "ชื่อโรค", "จำนวนส่งต่อทั้งหมด", "จำนวนที่รับ", "จำนวนที่ปฏิเสธ", "อัตราการรับ", "เปอร์เซ็นต์ของทั้งหมด"]);
      exportData.data.forEach((item: any) => {
        sheetData.push([item.rank || "", item.icd10_code || "", item.disease_name || "", item.total_referrals || 0, item.accepted_referrals || 0, item.rejected_referrals || 0, item.acceptance_rate || "0%", item.percentage_of_total || "0%"]);
      });
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      ws["!cols"] = sheetData.reduce((acc: any[], row: any[]) => {
        row.forEach((cell, i) => { const l = (cell?.toString() || "").length; if (!acc[i] || acc[i] < l) acc[i] = l; });
        return acc;
      }, []).map((w: number) => ({ wch: Math.min(w + 2, 50) }));
      const sheetName = role === "superAdminHospital" ? "Top10 โรคส่งต่อมากที่สุด" : "Top10 โรคส่งต่อแต่ละโซน";
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      const fileName = `Top_10_โรคที่ส่งต่อมากที่สุด_${Date.now()}.xlsx`;
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
        <Typography variant="h6" fontWeight={600}>{pageTitle}</Typography>
        <Button variant="contained" size="small" startIcon={<DownloadIcon />} onClick={downloadExcel}
          sx={{ bgcolor: "#fff", color: "#036246", "&:hover": { bgcolor: "#f0f0f0" }, whiteSpace: "nowrap" }}>
          ดาวน์โหลดเป็น Excel
        </Button>
      </Box>

      <FilterSection filters={filters} onFilterChange={setFilters} onClear={clearFilters} />

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
                  <TableCell sx={{ color: "#fff", fontWeight: 600 }}>ลำดับ</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 600 }}>รหัส ICD-10</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 600 }}>ชื่อโรค</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 600 }}>จำนวนครั้ง</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 600 }}>ร้อยละ</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 600 }}>สถานะการรับ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.map((row, idx) => (
                  <TableRow key={`disease-${idx}`} hover>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{row.icd}</TableCell>
                    <TableCell>{row.disease}</TableCell>
                    <TableCell>{row.count}</TableCell>
                    <TableCell>{row.percent}%</TableCell>
                    <TableCell>
                      <Chip
                        label={`รับ ${row.acceptRate}%`}
                        size="small"
                        sx={{
                          borderWidth: 1,
                          borderStyle: "solid",
                          borderColor: row.acceptRate >= 80 ? "#22C55E" : "#EF4444",
                          bgcolor: row.acceptRate >= 80 ? "#F0FDF4" : "#FEF2F2",
                          color: row.acceptRate >= 80 ? "#22C55E" : "#EF4444",
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
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
