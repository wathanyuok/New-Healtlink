"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Skeleton, Card, CardContent, FormControl, InputLabel, Select, MenuItem,
} from "@mui/material";
import { Download as DownloadIcon } from "@mui/icons-material";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useDashboardStore } from "@/stores/dashboardStore";
import { isDashboardSectionVisible } from "@/utils/dashboard";
import FilterSection from "./FilterSection";
import type { Filters, DashboardType } from "@/types/dashboard";

interface Props {
  role: string;
  dashboardType: DashboardType;
}

const GRADIENT = "linear-gradient(90deg, #46bee8 0%, #24d89d 100%)";
const BAR_COLORS = ["#FF8C00", "#FFD700", "#22C55E", "#3B82F6", "#8B5CF6"];

export default function FrequentReasons({ role, dashboardType }: Props) {
  const store = useDashboardStore();
  const [apiData, setApiData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReasons, setSelectedReasons] = useState<Set<string>>(new Set());
  const [selectedReason, setSelectedReason] = useState<string>("");
  const filters = store.globalFilters;
  const setFilters = (f: Filters | ((prev: Filters) => Filters)) => {
    const newFilters = typeof f === "function" ? f(store.globalFilters) : f;
    store.setGlobalFilters(newFilters);
  };

  const sectionTitle = useMemo(() => {
    if (dashboardType === "refer-in") return "Top 5 เหตุผลปฏิเสธการรับเข้า";
    if (dashboardType === "refer-out") return "Top 5 เหตุผลปฏิเสธการส่งออก";
    return "Top 5 เหตุผลปฏิเสธการรักษา";
  }, [dashboardType]);

  const params = useMemo(() => ({
    startDate: store.globalStartDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: store.globalEndDate || new Date().toISOString(),
    hospitalZoneId: filters.zone,
    hospitalSubTypeId: filters.type,
    hospitalId: filters.name,
    affiliation: filters.region,
    serviceLevel: filters.level,
    ...(dashboardType !== "all" && { dashboardType }),
  }), [store.globalStartDate, store.globalEndDate, filters, dashboardType]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await store.getTop5CommonReasons(params);
      setApiData(response?.top5CommonReasons || response?.data?.top5CommonReasons || response?.data || response || null);
    } catch (error) {
      console.error("Error fetching top5 common reasons:", error);
    } finally {
      setLoading(false);
    }
  }, [params, store]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    useDashboardStore.setState({ top5CommonReasonsFilters: filters });
  }, [filters]);

  // Unique reason options for dropdown filter
  const reasonOptions = useMemo(() => {
    if (!apiData || !Array.isArray(apiData)) return [];
    const set = new Set<string>();
    apiData.forEach((item: any) => {
      const reason = item.reason || item.causeName || "ไม่ระบุ";
      set.add(reason);
    });
    return Array.from(set).sort();
  }, [apiData]);

  // Chart data: group by reason, sum counts, filtered by selectedReason
  const chartData = useMemo(() => {
    if (!apiData || !Array.isArray(apiData)) return [];
    const filtered = selectedReason
      ? apiData.filter((item: any) => (item.reason || item.causeName || "ไม่ระบุ") === selectedReason)
      : apiData;
    const map: Record<string, number> = {};
    filtered.forEach((item: any) => {
      const reason = item.reason || item.causeName || "ไม่ระบุ";
      map[reason] = (map[reason] || 0) + (item.count || 1);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [apiData, selectedReason]);

  // Detail table: hospitals for ALL selected reasons
  const detailData = useMemo(() => {
    if (selectedReasons.size === 0 || !apiData || !Array.isArray(apiData)) return [];
    return apiData
      .filter((item: any) => selectedReasons.has(item.reason || item.causeName || "ไม่ระบุ"))
      .map((item: any, idx: number) => ({
        rank: idx + 1,
        hospital: item.hospitalName || "",
        patientType: item.supportedTypes?.join(", ") || "OPD",
        count: item.count || 0,
        percentage: item.percentage || "0%",
        reason: item.reason || item.causeName || "ไม่ระบุ",
      }));
  }, [apiData, selectedReasons]);

  // Export filtered data (respects selectedReason + hospital filters)
  const downloadExcel = async () => {
    try {
      const XLSX = await import("xlsx");

      // Use the currently filtered apiData instead of calling export API
      const filtered = selectedReason
        ? (apiData || []).filter((item: any) => (item.reason || item.causeName || "ไม่ระบุ") === selectedReason)
        : (apiData || []);

      if (filtered.length === 0) { alert("ไม่มีข้อมูลสำหรับการส่งออก"); return; }

      const wb = XLSX.utils.book_new();
      const sheetData: any[][] = [];
      sheetData.push([`รายงาน ${sectionTitle}`]);
      const startDate = store.globalStartDate || "";
      const endDate = store.globalEndDate || "";
      if (startDate || endDate) sheetData.push([`ช่วงวันที่: ${startDate} - ${endDate}`]);
      if (selectedReason) sheetData.push([`เหตุผลที่เลือก: ${selectedReason}`]);
      sheetData.push([]);
      sheetData.push(["อันดับ", "โรงพยาบาล", "เหตุผล", "ประเภทการส่งตัว", "ประเภทบริการ", "จำนวน", "เปอร์เซ็นต์"]);
      filtered.forEach((item: any, idx: number) => {
        sheetData.push([
          idx + 1,
          item.hospitalName || "",
          item.reason || item.causeName || "",
          item.referralType || "",
          item.supportedTypes?.join?.(", ") || item.supportedTypes || "",
          item.count || 0,
          item.percentage || "0%",
        ]);
      });
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      ws["!cols"] = sheetData.reduce((acc: any[], row: any[]) => {
        row.forEach((cell, i) => { const l = (cell?.toString() || "").length; if (!acc[i] || acc[i] < l) acc[i] = l; });
        return acc;
      }, []).map((w: number) => ({ wch: Math.min(w + 2, 50) }));
      XLSX.utils.book_append_sheet(wb, ws, sectionTitle);
      XLSX.writeFile(wb, `${sectionTitle.replace(/ /g, "_")}_${Date.now()}.xlsx`);
    } catch (error: any) {
      console.error("Error exporting Excel:", error);
      alert(`เกิดข้อผิดพลาด: ${error.message || "ไม่สามารถดาวน์โหลดได้"}`);
    }
  };

  const clearFilters = () => setFilters({ zone: null, type: null, name: null, region: null, level: null });

  // Toggle individual bar selection — only deselects when clicking the same bar
  const handleBarClick = (data: any) => {
    if (data?.name) {
      setSelectedReasons(prev => {
        const next = new Set(prev);
        if (next.has(data.name)) {
          next.delete(data.name);
        } else {
          next.add(data.name);
        }
        return next;
      });
    }
  };

  const hasSelection = selectedReasons.size > 0;

  return (
    <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, background: GRADIENT, color: "#fff" }}>
        <Typography variant="h6" fontWeight={600}>{sectionTitle}</Typography>
        <Button variant="contained" size="small" startIcon={<DownloadIcon />} onClick={downloadExcel}
          sx={{ bgcolor: "#fff", color: "#036246", "&:hover": { bgcolor: "#f0f0f0" } }}>
          ดาวน์โหลดเป็น Excel
        </Button>
      </Box>

      {/* Filters */}
      <FilterSection
        filters={filters}
        onFilterChange={setFilters}
        onClear={clearFilters}
        role={role}
        extraFilter={
          <FormControl size="small" fullWidth>
            <InputLabel shrink>เหตุผลปฏิเสธการรักษา</InputLabel>
            <Select
              value={selectedReason}
              label="เหตุผลปฏิเสธการรักษา"
              displayEmpty
              notched
              renderValue={(v) => (v ? String(v) : "ทั้งหมด")}
              onChange={(e) => { setSelectedReason(e.target.value as string); setSelectedReasons(new Set()); }}
              sx={{ "& .MuiSelect-select": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }}
            >
              <MenuItem value="">ทั้งหมด</MenuItem>
              {reasonOptions.map((r) => (
                <MenuItem key={r} value={r} sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>{r}</MenuItem>
              ))}
            </Select>
          </FormControl>
        }
      />

      {/* Chart + Detail Table */}
      <Box sx={{ px: 2, pb: 3 }}>
        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {[...Array(5)].map((_, i) => <Skeleton key={i} variant="rectangular" height={48} sx={{ borderRadius: 1 }} />)}
          </Box>
        ) : chartData.length === 0 ? (
          <Typography textAlign="center" color="text.secondary" py={4}>ไม่พบข้อมูล</Typography>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: hasSelection ? "1fr 1fr" : "1fr" }, gap: 3 }}>
            {/* Left: Bar Chart */}
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, textAlign: "center" }}>
                  {sectionTitle}
                </Typography>
                <ResponsiveContainer width="100%" height={chartData.length * 60 + 40}>
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 40, bottom: 20, left: 10 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={{ stroke: "#e0e0e0" }} tickLine={false}
                      label={{ value: "จำนวนผู้ป่วย (ราย)", position: "insideBottom", offset: -10, fontSize: 11, fill: "#888" }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={160} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={false}
                      content={({ active, payload }: any) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        const idx = chartData.findIndex(c => c.name === d.name);
                        const color = BAR_COLORS[idx % BAR_COLORS.length];
                        return (
                          <Box sx={{ bgcolor: "rgba(0,0,0,0.85)", borderRadius: 1, px: 1.5, py: 1, minWidth: 80 }}>
                            <Typography sx={{ color: "#fff", fontSize: 12, fontWeight: 600, mb: 0.5 }}>{d.name}</Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                              <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: color, flexShrink: 0 }} />
                              <Typography sx={{ color: "#fff", fontSize: 12 }}>{d.value} ราย</Typography>
                            </Box>
                          </Box>
                        );
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28} onClick={handleBarClick} style={{ cursor: "pointer" }}>
                      {chartData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={BAR_COLORS[i % BAR_COLORS.length]}
                          opacity={hasSelection && !selectedReasons.has(entry.name) ? 0.4 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {hasSelection && (
                  <Typography sx={{ textAlign: "center", fontSize: 12, color: "#888", mt: 1 }}>
                    กดแท่งเดิมอีกครั้งเพื่อยกเลิกการเลือก
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Right: Detail Table */}
            {hasSelection && (
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    สถานพยาบาลที่ปฏิเสธด้วยเหตุผล: <span style={{ color: "#036246" }}>{[...selectedReasons].join(", ")}</span>
                  </Typography>
                  {detailData.length === 0 ? (
                    <Typography textAlign="center" color="text.secondary" py={4}>ไม่พบข้อมูลสถานพยาบาล</Typography>
                  ) : (
                    <TableContainer sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: "#036245" }}>
                          <TableRow>
                            <TableCell align="center" sx={{ color: "#fff", fontWeight: 600 }}>ลำดับ</TableCell>
                            <TableCell sx={{ color: "#fff", fontWeight: 600 }}>สถานพยาบาล</TableCell>
                            <TableCell sx={{ color: "#fff", fontWeight: 600 }}>เหตุผล</TableCell>
                            <TableCell align="center" sx={{ color: "#fff", fontWeight: 600, whiteSpace: "nowrap" }}>ใช้สำหรับผู้ป่วยประเภท</TableCell>
                            <TableCell align="center" sx={{ color: "#fff", fontWeight: 600 }}>จำนวน</TableCell>
                            <TableCell align="center" sx={{ color: "#fff", fontWeight: 600 }}>รวม</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {detailData.map((row, idx) => (
                            <TableRow key={idx} hover sx={{ "&:nth-of-type(even)": { bgcolor: "#f9fafb" } }}>
                              <TableCell align="center">{row.rank}</TableCell>
                              <TableCell>{row.hospital}</TableCell>
                              <TableCell>{row.reason}</TableCell>
                              <TableCell align="center">{row.patientType}</TableCell>
                              <TableCell align="center">{row.count}</TableCell>
                              <TableCell align="center">{row.percentage}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
}
