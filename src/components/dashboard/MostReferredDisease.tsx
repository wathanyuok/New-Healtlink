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
    if (dashboardType === "refer-in") return "โรคที่ขอส่งตัวเข้ามารักษามากที่สุด";
    if (dashboardType === "refer-out") return "โรคที่ขอส่งตัวออกมากที่สุด";
    return "Top 10 โรคที่ส่งต่อมากที่สุด";
  }, [dashboardType]);

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
      opdCount: dashboardType === "refer-in" ? (item.opdCountIn || 0)
        : dashboardType === "refer-out" ? (item.opdCountOut || 0)
        : (item.opdCount || 0),
      ipdCount: dashboardType === "refer-in" ? (item.ipdCountIn || 0)
        : dashboardType === "refer-out" ? (item.ipdCountOut || 0)
        : (item.ipdCount || 0),
      emergencyCount: dashboardType === "refer-in" ? (item.emergencyCountIn || 0)
        : dashboardType === "refer-out" ? (item.emergencyCountOut || 0)
        : (item.emergencyCount || 0),
      referInCount: item.referInCount || 0,
      referOutCount: item.referOutCount || 0,
    }));
  }, [apiData, dashboardType]);

  const downloadExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const response = await store.exportTop10MostReferredDiseases(params);
      const exportData = response?.data || response;
      if (!exportData?.data) { alert("ไม่มีข้อมูลสำหรับการส่งออก"); return; }

      const wb = XLSX.utils.book_new();
      const sheetData: any[][] = [];

      if (dashboardType === "all") {
        sheetData.push([exportData.reportTitle || "รายงาน Top 10 โรคที่ถูกส่งต่อมากที่สุด"]);
        if (exportData.dateRange) sheetData.push([`ช่วงวันที่: ${exportData.dateRange.startDate} - ${exportData.dateRange.endDate}`]);
        sheetData.push([]);
        sheetData.push(["อันดับ", "รหัส ICD-10", "ชื่อโรค", "จำนวนส่งต่อทั้งหมด", "จำนวนที่รับ", "จำนวนที่ปฏิเสธ", "อัตราการรับ", "เปอร์เซ็นต์ของทั้งหมด"]);
        exportData.data.forEach((item: any) => {
          sheetData.push([item.rank || "", item.icd10_code || "", item.disease_name || "", item.total_referrals || 0, item.accepted_referrals || 0, item.rejected_referrals || 0, item.acceptance_rate || "0%", item.percentage_of_total || "0%"]);
        });
      } else {
        const title = dashboardType === "refer-in" ? "รายงานโรคที่ขอส่งตัวเข้ามารักษามากที่สุด" : "รายงานโรคที่ขอส่งตัวออกมากที่สุด";
        sheetData.push([title]);
        if (exportData.dateRange) sheetData.push([`ช่วงวันที่: ${exportData.dateRange.startDate} - ${exportData.dateRange.endDate}`]);
        sheetData.push([]);
        sheetData.push(["อันดับ", "รหัส ICD-10", "ชื่อโรค", "ประเภทการส่งตัว OPD", "ประเภทการส่งตัว IPD", "ประเภทการส่งตัว ER", "รวม"]);
        exportData.data.forEach((item: any) => {
          const opd = dashboardType === "refer-in" ? (item.opdCountIn || 0)
            : dashboardType === "refer-out" ? (item.opdCountOut || 0) : (item.opdCount || 0);
          const ipd = dashboardType === "refer-in" ? (item.ipdCountIn || 0)
            : dashboardType === "refer-out" ? (item.ipdCountOut || 0) : (item.ipdCount || 0);
          const er = dashboardType === "refer-in" ? (item.emergencyCountIn || 0)
            : dashboardType === "refer-out" ? (item.emergencyCountOut || 0) : (item.emergencyCount || 0);
          sheetData.push([item.rank || "", item.icd10_code || "", item.disease_name || "", opd, ipd, er, opd + ipd + er]);
        });
      }

      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      ws["!cols"] = sheetData.reduce((acc: any[], row: any[]) => {
        row.forEach((cell, i) => { const l = (cell?.toString() || "").length; if (!acc[i] || acc[i] < l) acc[i] = l; });
        return acc;
      }, []).map((w: number) => ({ wch: Math.min(w + 2, 50) }));
      const sheetName = dashboardType === "all"
        ? "Top10 โรคส่งต่อมากที่สุด"
        : dashboardType === "refer-in" ? "โรคที่ขอส่งตัวเข้ามารักษา" : "โรคที่ขอส่งตัวออกมากที่สุด";
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      const fileName = dashboardType === "all"
        ? `Top_10_โรคที่ส่งต่อมากที่สุด_${Date.now()}.xlsx`
        : dashboardType === "refer-in"
          ? `โรคที่ขอส่งตัวเข้ามารักษามากที่สุด_${Date.now()}.xlsx`
          : `โรคที่ขอส่งตัวออกมากที่สุด_${Date.now()}.xlsx`;
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

      <FilterSection filters={filters} onFilterChange={setFilters} onClear={clearFilters} role={role} />

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
                    <TableCell align="center" sx={{ color: "#fff", fontWeight: 600 }}>รหัส ICD-10</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>ชื่อโรค</TableCell>
                    <TableCell align="center" sx={{ color: "#fff", fontWeight: 600 }}>จำนวนครั้ง</TableCell>
                    <TableCell align="center" sx={{ color: "#fff", fontWeight: 600 }}>ร้อยละ</TableCell>
                    <TableCell align="center" sx={{ color: "#fff", fontWeight: 600 }}>สถานะการรับ</TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell align="center" sx={{ color: "#fff", fontWeight: 600 }}>ลำดับ</TableCell>
                    <TableCell align="center" sx={{ color: "#fff", fontWeight: 600 }}>รหัส ICD-10</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>ชื่อโรค</TableCell>
                    <TableCell align="center" sx={{ color: "#fff", fontWeight: 600, whiteSpace: "nowrap" }}>ประเภทการส่งตัว OPD</TableCell>
                    <TableCell align="center" sx={{ color: "#fff", fontWeight: 600, whiteSpace: "nowrap" }}>ประเภทการส่งตัว IPD</TableCell>
                    <TableCell align="center" sx={{ color: "#fff", fontWeight: 600, whiteSpace: "nowrap" }}>ประเภทการส่งตัว ER</TableCell>
                    <TableCell align="center" sx={{ color: "#fff", fontWeight: 600 }}>รวม</TableCell>
                  </TableRow>
                )}
              </TableHead>
              <TableBody>
                {tableData.map((row, idx) => (
                  dashboardType === "all" ? (
                    <TableRow key={`disease-${idx}`} hover>
                      <TableCell align="center">{idx + 1}</TableCell>
                      <TableCell align="center">{row.icd}</TableCell>
                      <TableCell>{row.disease}</TableCell>
                      <TableCell align="center">{row.count}</TableCell>
                      <TableCell align="center">{row.percent}%</TableCell>
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
                  ) : (
                    <TableRow key={`disease-${idx}`} hover>
                      <TableCell align="center">{idx + 1}</TableCell>
                      <TableCell align="center">{row.icd}</TableCell>
                      <TableCell>{row.disease}</TableCell>
                      <TableCell align="center">{row.opdCount}</TableCell>
                      <TableCell align="center">{row.ipdCount}</TableCell>
                      <TableCell align="center">{row.emergencyCount}</TableCell>
                      <TableCell align="center">{row.opdCount + row.ipdCount + row.emergencyCount}</TableCell>
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
