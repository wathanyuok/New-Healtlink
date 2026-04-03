"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Paper, Box, Typography, Button, Card, CardContent,
  Skeleton, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
} from "@mui/material";
import { Download as DownloadIcon } from "@mui/icons-material";
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { useDashboardStore } from "@/stores/dashboardStore";
import FilterSection from "./FilterSection";
import type { DashboardType, Filters } from "@/types/dashboard";

interface Props {
  role: string;
  dashboardType: DashboardType;
}

const GRADIENT = "linear-gradient(135deg, #46bee8 0%, #24d89d 100%)";

// TODO: Remove mock data when API is ready
const MOCK_ZONE_MATRIX = [
  [0, 187, 414, 411, 306, 302, 218, 290],
  [326, 0, 83, 379, 455, 427, 139, 414],
  [120, 373, 0, 440, 335, 332, 348, 227],
  [356, 465, 328, 0, 452, 460, 52, 78],
  [331, 431, 203, 217, 0, 265, 95, 208],
  [449, 166, 106, 54, 144, 0, 348, 159],
  [239, 429, 341, 353, 85, 427, 0, 187],
  [150, 372, 365, 118, 398, 230, 146, 0],
];

export default function StatisticCharts({ role, dashboardType }: Props) {
  const {
    getReportStatusStatistics, getStaticsAndDetails, exportReportStatusStatistics,
    globalStartDate, globalEndDate, globalFilters, setGlobalFilters,
  } = useDashboardStore();

  const [apiData, setApiData] = useState<any>(null);
  const [staticData, setStaticData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const filters = globalFilters;
  const setFilters = (f: Filters | ((prev: Filters) => Filters)) => {
    const newFilters = typeof f === "function" ? f(globalFilters) : f;
    setGlobalFilters(newFilters);
  };

  // Base params without referralKind (for staticsAndDetails, matching Nuxt behavior)
  const baseParams = useMemo(() => {
    const p: any = {};
    p.startDate = globalStartDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    p.endDate = globalEndDate || new Date().toISOString().split("T")[0];
    if (filters.zone) p.hospitalZoneId = filters.zone;
    if (filters.type) p.hospitalSubTypeId = filters.type;
    if (filters.name) p.hospitalId = filters.name;
    if (filters.region) p.affiliation = filters.region;
    if (filters.level) p.serviceLevel = filters.level;
    return p;
  }, [globalStartDate, globalEndDate, filters]);

  // Params for reportStatusStatistics (same as baseParams, backend doesn't use referralKind)
  const params = useMemo(() => {
    return { ...baseParams };
  }, [baseParams]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [report, statics] = await Promise.all([
        getReportStatusStatistics(params),
        getStaticsAndDetails(baseParams),
      ]);
      // API may return { data: {...} } or the data directly
      setApiData(report?.data || report || null);
      setStaticData(statics?.data || statics || null);
    } catch (err) { console.error("StatisticCharts error:", err); }
    finally { setLoading(false); }
  }, [params, baseParams, getReportStatusStatistics, getStaticsAndDetails]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Computed chart data ── */
  const chartService = useMemo(() => {
    const r = staticData?.referralTypes;
    if (!r) return [];
    return [
      { key: "opd", label: "ผู้ป่วยนอก (OPD)", color: "#8b5cf6" },
      { key: "ipd", label: "ผู้ป่วยใน (IPD)", color: "#3b82f6" },
      { key: "emergency", label: "ผู้ป่วยฉุกเฉิน (Emergency)", color: "#ef4444" },
    ].map(s => {
      const item = r[s.key];
      const total = item?.total || 0;
      const referIn = item?.referIn || 0;
      const referOut = item?.referOut || 0;
      // Filter by dashboardType: show only referIn or referOut count
      const displayValue = dashboardType === "refer-in" ? referIn
        : dashboardType === "refer-out" ? referOut
        : total;
      return {
        name: s.label,
        value: displayValue,
        color: s.color,
        breakdown: {
          referIn,
          referOut,
          referInPercentage: total > 0 ? ((referIn / total) * 100).toFixed(2) + "%" : "0.00%",
          referOutPercentage: total > 0 ? ((referOut / total) * 100).toFixed(2) + "%" : "0.00%",
        },
      };
    }).filter(d => d.value > 0);
  }, [staticData, dashboardType]);

  const chartRefer = useMemo(() => {
    const d = apiData?.charts?.referralType?.data;
    if (!d?.length) return [];
    const cm: Record<string, string> = { out: "#f59e0b", "ส่งออก": "#f59e0b", in: "#22c55e", "รับเข้า": "#22c55e", back: "#a855f7", "ส่งกลับ": "#a855f7", receive: "#3b82f6", "รับกลับ": "#3b82f6" };
    return d.map((i: any) => ({ name: i.name, value: i.value || 0, color: getColor(i.name, cm) }));
  }, [apiData]);

  const chartStatus = useMemo(() => {
    const s = staticData?.statusStatistics;
    if (!s) return [];
    return [
      { key: "accept", name: "รับเข้า", color: "#22c55e" },
      { key: "reject", name: "ปฏิเสธ", color: "#ef4444" },
      { key: "waiting", name: "รอดำเนินการ", color: "#f59e0b" },
    ].map(st => {
      if (!s[st.key]) return null;
      const item = s[st.key];
      const total = item.total || 0;
      const opd = item.opd || 0;
      const ipd = item.ipd || 0;
      const emergency = item.emergency || 0;
      return {
        name: st.name,
        value: total,
        color: st.color,
        breakdown: {
          opd,
          ipd,
          emergency,
          opdPercentage: total > 0 ? ((opd / total) * 100).toFixed(2) + "%" : "0.00%",
          ipdPercentage: total > 0 ? ((ipd / total) * 100).toFixed(2) + "%" : "0.00%",
          emergencyPercentage: total > 0 ? ((emergency / total) * 100).toFixed(2) + "%" : "0.00%",
        },
      };
    }).filter(Boolean) as any[];
  }, [staticData]);

  const chartGender = useMemo(() => {
    const d = apiData?.charts?.gender?.data;
    if (!d?.length) return [];
    const cm: Record<string, string> = { male: "#3B82F6", "ชาย": "#3B82F6", female: "#EC4899", "หญิง": "#EC4899" };
    return d.map((i: any) => ({ name: i.name, value: i.value || 0, color: getColor(i.name, cm) }));
  }, [apiData]);

  const ageData = useMemo(() => {
    const d = apiData?.charts?.ageGroups?.data;
    if (!d?.length) return [];
    const colors = ["#8b5cf6", "#3b82f6", "#22c55e", "#eab308", "#f97316", "#ef4444"];
    return d.map((i: any, idx: number) => ({ name: i.name + " ปี", value: i.value || 0, percentage: parseFloat(i.percentage) || 0, color: colors[idx % colors.length] }));
  }, [apiData]);

  const diseaseData = useMemo(() => {
    const d = apiData?.charts?.departments?.data;
    if (!d?.length) return [];
    const colors = ["#f97316", "#22c55e", "#14b8a6", "#3b82f6", "#a855f7", "#ef4444", "#eab308"];
    return d.map((i: any, idx: number) => ({ name: `${i.name}`, hospital: i.hospitalName || "", value: parseFloat(i.value || i.percentage) || 0, color: colors[idx % colors.length] }));
  }, [apiData]);

  const tableData = useMemo(() => {
    const res = apiData?.tables?.rejectedDepartments?.data;
    if (!res?.length) return [];
    return res.map((i: any) => ({ department: i.name || "", hospital: i.hospitalName || "", referIn: i.rejectedCount || 0, rate: (i.rejectionRate || 0) + "%" }));
  }, [apiData]);

  const clearFilters = () => setFilters({ zone: null, type: null, name: null, region: null, level: null });

  /* ── Excel export: main button (API) ── */
  const downloadExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const response = await exportReportStatusStatistics(params);
      const exportData = response?.data || response;
      if (!exportData || !exportData.sheets) { alert("ไม่มีข้อมูลสำหรับการส่งออก"); return; }

      const wb = XLSX.utils.book_new();
      const createSheet = (sheetInfo: any) => {
        if (!sheetInfo?.data?.length) return null;
        const rows: any[][] = [];
        rows.push([sheetInfo.title || ""]);
        rows.push([]);
        const hdrMap: Record<string, string> = {
          type: "ประเภท", count: "จำนวน", percentage: "เปอร์เซ็นต์", kind: "กลุ่มการพยาบาล",
          status: "สถานะ", department: "แผนก/สาขา", hospitalName: "โรงพยาบาล", gender: "เพศ",
          ageGroup: "ช่วงอายุ", rejectedCount: "จำนวนที่ปฏิเสธ", totalReferIn: "Refer In ทั้งหมด",
          rejectionRate: "อัตราการปฏิเสธ",
        };
        const keys = Object.keys(sheetInfo.data[0]).filter(k => k !== "percentage");
        rows.push(keys.map(k => hdrMap[k] || k));
        sheetInfo.data.forEach((item: any) => rows.push(keys.map(k => item[k] || 0)));
        return rows;
      };

      const summary: any[][] = [];
      summary.push([exportData.reportTitle || "รายงานสถิติรูปแบบสถานะ"]);
      if (exportData.dateRange) summary.push([`ช่วงวันที่: ${exportData.dateRange.startDate} - ${exportData.dateRange.endDate}`]);
      if (exportData.exportMetadata) {
        summary.push([`ส่งออกเมื่อ: ${exportData.exportMetadata.exportedAt}`]);
        summary.push([`ส่งออกโดย: ${exportData.exportMetadata.exportedBy}`]);
        summary.push([`โรงพยาบาล: ${exportData.exportMetadata.hospitalName}`]);
        summary.push([`เขต: ${exportData.exportMetadata.zone || "ทุกเขต"}`]);
      }
      summary.push([], ["สรุปข้อมูลภาพรวม"], []);

      const sections = [
        { key: "referralTypeSheet", title: "สถิติประเภทการส่งต่อ" },
        { key: "referralKindSheet", title: "สถิติกลุ่มการพยาบาล" },
        { key: "statusSheet", title: "สถิติสถานะการรักษา" },
        { key: "genderSheet", title: "สถิติเพศ" },
        { key: "ageGroupSheet", title: "สถิติช่วงอายุ" },
        { key: "departmentSheet", title: "สถิติแผนก/สาขา" },
        { key: "rejectedDepartmentSheet", title: "สาขาที่ถูกปฏิเสธสำหรับการรักษา" },
      ];
      sections.forEach(s => {
        const d = createSheet(exportData.sheets[s.key]);
        if (d) { summary.push(...d); summary.push([]); }
      });

      const ws = XLSX.utils.aoa_to_sheet(summary);
      const cw = summary.reduce((a: number[], r: any[]) => { r.forEach((c, i) => { const l = (c?.toString() || "").length; if (!a[i] || a[i] < l) a[i] = l; }); return a; }, []);
      ws["!cols"] = cw.map((w: number) => ({ wch: Math.min(w + 2, 50) }));
      XLSX.utils.book_append_sheet(wb, ws, "สรุปรายงาน");
      XLSX.writeFile(wb, `รายงานสถิติรูปแบบสถานะ_${Date.now()}.xlsx`);
    } catch (err: any) {
      console.error("Export error:", err);
      alert(`เกิดข้อผิดพลาดในการส่งออก: ${err.message || "ไม่สามารถดาวน์โหลดได้"}`);
    }
  };

  /* ── Excel export: per-chart ── */
  const exportChart = async (chartType: string) => {
    try {
      const XLSX = await import("xlsx");
      let data: any[] = [];
      let filename = "";
      let headers: string[] = [];

      switch (chartType) {
        case "service": data = chartService; filename = "รูปแบบการให้บริการ"; headers = ["รูปแบบการให้บริการ", "จำนวน"]; break;
        case "refer": data = chartRefer; filename = "รูปแบบการรับส่งต่อ"; headers = ["รูปแบบการรับส่งต่อ", "จำนวน"]; break;
        case "status": data = chartStatus; filename = "สถานะการส่งตัว"; headers = ["สถานะ", "จำนวน"]; break;
        case "gender": data = chartGender; filename = "การแจกแจงตามเพศ"; headers = ["เพศ", "จำนวน"]; break;
        case "age": data = ageData; filename = "การแจกแจงตามช่วงอายุ"; headers = ["ช่วงอายุ", "จำนวน", "เปอร์เซ็นต์"]; break;
        case "disease": data = diseaseData; filename = "แผนกสาขาที่ถูกรับเข้ารักษา"; headers = ["แผนก/สาขา", "สถานพยาบาล", dashboardType === "refer-out" ? "จำนวนรับเข้าRefer Out" : "จำนวนรับเข้าRefer In", "อัตรารับเข้า"]; break;
        case "table": data = tableData; filename = "แผนกสาขาที่ถูกปฏิเสธ"; headers = ["แผนก/สาขา", "สถานพยาบาล", dashboardType === "refer-out" ? "จำนวนปฏิเสธ Refer Out" : "จำนวนปฏิเสธ Refer In", "อัตราปฏิเสธ"]; break;
        case "zoneMatrix": {
          const zones = ["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Zone 7", "Zone 8"];
          const matrixData = apiData?.charts?.zoneMatrix?.data || apiData?.zoneMatrix || MOCK_ZONE_MATRIX;
          const wb = XLSX.utils.book_new();
          const rows: any[][] = [["การส่งตัวข้ามโซนสุขภาพ กทม."], [], ["", ...zones]];
          zones.forEach((z, ri) => {
            const row = [z];
            zones.forEach((_, ci) => {
              const val = matrixData?.[ri]?.[ci] ?? (matrixData && typeof matrixData === "object" ? matrixData[`zone${ri+1}`]?.[`zone${ci+1}`] || 0 : 0);
              row.push(val);
            });
            rows.push(row);
          });
          const ws = XLSX.utils.aoa_to_sheet(rows);
          ws["!cols"] = [{ wch: 10 }, ...zones.map(() => ({ wch: 10 }))];
          XLSX.utils.book_append_sheet(wb, ws, "Zone Matrix");
          XLSX.writeFile(wb, `การส่งตัวข้ามโซนสุขภาพ_${Date.now()}.xlsx`);
          return;
        }
        default: return;
      }
      if (!data?.length) { alert("ไม่มีข้อมูลสำหรับการส่งออก"); return; }

      const wb = XLSX.utils.book_new();
      const rows: any[][] = [headers];
      data.forEach((item: any) => {
        if (chartType === "table") rows.push([item.department || "", item.hospital || "", item.referIn || 0, item.rate || "0.00"]);
        else if (chartType === "age") rows.push([item.name || "", item.value || 0, typeof item.percentage === "number" ? `${item.percentage.toFixed(2)}%` : item.percentage || "0.00%"]);
        else rows.push([item.name || "", item.value || 0]);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const cw = rows.reduce((a: number[], r: any[]) => { r.forEach((c, i) => { const l = (c?.toString() || "").length; if (!a[i] || a[i] < l) a[i] = l; }); return a; }, []);
      ws["!cols"] = cw.map((w: number) => ({ wch: Math.min(w + 2, 50) }));
      XLSX.utils.book_append_sheet(wb, ws, filename.substring(0, 31));
      XLSX.writeFile(wb, `${filename}_${Date.now()}.xlsx`);
    } catch (err: any) {
      console.error("Export chart error:", err);
      alert(`เกิดข้อผิดพลาดในการส่งออก: ${err.message}`);
    }
  };

  if (loading) {
    return <Paper sx={{ p: 3, borderRadius: 3 }}><Skeleton variant="rounded" height={56} sx={{ mb: 2 }} /><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 3 }}>{[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={280} />)}</Box></Paper>;
  }

  return (
    <Paper sx={{ overflow: "hidden", borderRadius: 3 }}>
      {/* ── Header ── */}
      <Box sx={{ background: GRADIENT, px: 3, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: 20 }}>สถิติรายงานรูปแบบสถานะ</Typography>
        <Button size="small" variant="contained" startIcon={<DownloadIcon />} onClick={downloadExcel}
          sx={{ bgcolor: "#fff", color: "#036246", fontWeight: 500, "&:hover": { bgcolor: "#f5f5f5" }, boxShadow: "none" }}>
          ดาวน์โหลดเป็น Excel
        </Button>
      </Box>

      {/* ── Filters ── */}
      <FilterSection filters={filters} onFilterChange={setFilters} onClear={clearFilters} role={role} />

      {/* ── Row 1: Pie Charts (hide รูปแบบการรับส่งต่อ when filtered by refer-in/refer-out) ── */}
      {dashboardType === "all" ? (
        <Box sx={{ px: 3, pb: 3, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 3 }}>
          <ChartCard title="รูปแบบการให้บริการ" data={chartService} type="pie" onExport={() => exportChart("service")} />
          <ChartCard title="รูปแบบการรับส่งต่อ" data={chartRefer} type="donut" onExport={() => exportChart("refer")} />
          <ChartCard title="สถานะการส่งตัว" data={chartStatus} type="donut" onExport={() => exportChart("status")} />
        </Box>
      ) : (
        <Box sx={{ px: 3, pb: 3, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
          <ChartCard title="รูปแบบการให้บริการ" data={chartService} type="pie" onExport={() => exportChart("service")} />
          <ChartCard title="สถานะการส่งตัว" data={chartStatus} type="donut" onExport={() => exportChart("status")} />
        </Box>
      )}

      {/* ── Row 2: Accepted dept table + Rejected dept table ── */}
      <Box sx={{ px: 3, pb: 3, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
        {/* แผนกสาขาที่ถูกรับเข้ารักษา (ซ้าย) */}
        <Card variant="outlined" sx={{ borderRadius: 3, height: "100%" }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>แผนกสาขาที่ถูกรับเข้ารักษา</Typography>
              <Button size="small" startIcon={<DownloadIcon sx={{ fontSize: 14 }} />} onClick={() => exportChart("disease")} sx={{ fontSize: 12, color: "text.secondary" }}>Excel</Button>
            </Box>
            {diseaseData.length > 0 ? (
              <TableContainer sx={{ overflowX: "auto" }}>
                <Table size="small" sx={{ "& td, & th": { whiteSpace: "nowrap", fontSize: 13 } }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f9fafb" }}>
                      <TableCell sx={{ fontWeight: 600 }}>แผนก/สาขา</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>สถานพยาบาล</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">
                        {dashboardType === "refer-out" ? "จำนวนรับเข้าRefer Out" : "จำนวนรับเข้าRefer In"}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">อัตรารับเข้า</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {diseaseData.map((row: any, i: number) => {
                      const totalDisease = diseaseData.reduce((s: number, d: any) => s + (d.value || 0), 0);
                      const pct = totalDisease > 0 ? ((row.value / totalDisease) * 100).toFixed(2) : "0";
                      return (
                        <TableRow key={i} hover>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.hospital}</TableCell>
                          <TableCell align="center">{row.value}</TableCell>
                          <TableCell align="center">{pct}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : <EmptyState />}
          </CardContent>
        </Card>

        {/* แผนกสาขาที่ถูกปฏิเสธ (ขวา) */}
        <Card variant="outlined" sx={{ borderRadius: 3, height: "100%" }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>แผนกสาขาที่ถูกปฏิเสธ</Typography>
              <Button size="small" startIcon={<DownloadIcon sx={{ fontSize: 14 }} />} onClick={() => exportChart("table")} sx={{ fontSize: 12, color: "text.secondary" }}>Excel</Button>
            </Box>
            {tableData.length > 0 ? (
              <TableContainer sx={{ overflowX: "auto" }}>
                <Table size="small" sx={{ "& td, & th": { whiteSpace: "nowrap", fontSize: 13 } }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f9fafb" }}>
                      <TableCell sx={{ fontWeight: 600 }}>แผนก/สาขา</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>สถานพยาบาล</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">
                        {dashboardType === "refer-out" ? "จำนวนปฏิเสธ Refer Out" : "จำนวนปฏิเสธ Refer In"}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">อัตราปฏิเสธ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableData.map((row: any, i: number) => (
                      <TableRow key={i} hover>
                        <TableCell>{row.department}</TableCell>
                        <TableCell>{row.hospital}</TableCell>
                        <TableCell align="center">{row.referIn}</TableCell>
                        <TableCell align="center">{row.rate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : <EmptyState />}
          </CardContent>
        </Card>
      </Box>

      {/* ── Row 3: Zone Heatmap Matrix + Age Bar Chart (vertical) ── */}
      {dashboardType === "all" && <Box sx={{ px: 3, pb: 3, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, alignItems: "stretch" }}>
        {/* Zone Heatmap Matrix */}
        <Card variant="outlined" sx={{ borderRadius: 3, display: "flex", flexDirection: "column" }}>
          <CardContent sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>การส่งตัวข้ามโซนสุขภาพ กทม.</Typography>
              <Button size="small" startIcon={<DownloadIcon sx={{ fontSize: 14 }} />} onClick={() => exportChart("zoneMatrix")} sx={{ fontSize: 12, color: "text.secondary" }}>Excel</Button>
            </Box>
            <ZoneHeatmapMatrix data={apiData?.charts?.zoneMatrix?.data || apiData?.zoneMatrix || MOCK_ZONE_MATRIX} />
          </CardContent>
        </Card>

        {/* Age Bar Chart (vertical) */}
        <Card variant="outlined" sx={{ borderRadius: 3, display: "flex", flexDirection: "column" }}>
          <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>การแสดงจำนวนผู้ป่วยตามอายุ</Typography>
              <Button size="small" startIcon={<DownloadIcon sx={{ fontSize: 14 }} />} onClick={() => exportChart("age")} sx={{ fontSize: 12, color: "text.secondary" }}>Excel</Button>
            </Box>
            {ageData.length > 0 ? (
              <Box sx={{ flex: 1, minHeight: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageData} margin={{ top: 30, right: 10, bottom: 5, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#e0e0e0" }} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#e0e0e0" }} />
                    <Tooltip
                      cursor={false}
                      content={({ active, payload }: any) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        const pct = d?.percentage ?? 0;
                        return (
                          <Box sx={{ bgcolor: "rgba(0,0,0,0.85)", borderRadius: 1, px: 1.5, py: 1, minWidth: 80 }}>
                            <Typography sx={{ color: "#fff", fontSize: 12, fontWeight: 600, mb: 0.5 }}>
                              {d.name}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                              <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: d.color, flexShrink: 0 }} />
                              <Typography sx={{ color: "#fff", fontSize: 12 }}>
                                {d.value} ({typeof pct === "number" ? pct.toFixed(1) : pct}%)
                              </Typography>
                            </Box>
                          </Box>
                        );
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={72} label={{ position: "top", fontSize: 11, fill: "#555", formatter: (v: number) => { const item = ageData.find((d: any) => d.value === v); const pct = item?.percentage ?? 0; return `${v} (${typeof pct === "number" ? pct.toFixed(1) : pct}%)`; } }}>
                      {ageData.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : <EmptyState />}
          </CardContent>
        </Card>
      </Box>}
    </Paper>
  );
}

/* ═══ Sub-components ═══ */

function CustomChartTooltip({ active, payload, totalVal }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0]?.payload;
  if (!entry) return null;
  const pct = totalVal > 0 ? ((entry.value / totalVal) * 100).toFixed(2) : "0.00";
  const bd = entry.breakdown;
  return (
    <Box sx={{ bgcolor: "rgba(0,0,0,0.85)", color: "#fff", borderRadius: 1.5, px: 2, py: 1.5, minWidth: 180 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: entry.color, flexShrink: 0 }} />
        <Typography sx={{ fontWeight: 600, fontSize: 13, color: "#fff" }}>
          {entry.name}: {entry.value} ({pct}%)
        </Typography>
      </Box>
      {bd && bd.referIn !== undefined && (
        <Box sx={{ mt: 0.5 }}>
          <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>รายละเอียด:</Typography>
          <Typography sx={{ fontSize: 12, color: "#fff" }}>Refer In: {bd.referIn} ({bd.referInPercentage})</Typography>
          <Typography sx={{ fontSize: 12, color: "#fff" }}>Refer Out: {bd.referOut} ({bd.referOutPercentage})</Typography>
        </Box>
      )}
      {bd && bd.opd !== undefined && (
        <Box sx={{ mt: 0.5 }}>
          <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>รายละเอียด:</Typography>
          <Typography sx={{ fontSize: 12, color: "#fff" }}>OPD: {bd.opd} ({bd.opdPercentage})</Typography>
          <Typography sx={{ fontSize: 12, color: "#fff" }}>IPD: {bd.ipd} ({bd.ipdPercentage})</Typography>
          <Typography sx={{ fontSize: 12, color: "#fff" }}>Emergency: {bd.emergency} ({bd.emergencyPercentage})</Typography>
        </Box>
      )}
    </Box>
  );
}

function ChartCard({ title, data, type, onExport }: { title: string; data: any[]; type: "pie" | "donut"; onExport?: () => void }) {
  const total = data.reduce((s: number, d: any) => s + (d.value || 0), 0);
  const innerR = type === "donut" ? 40 : 0;
  const outerR = 110;

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, percent }: any) => {
    if (percent < 0.03) return null;
    const RADIAN = Math.PI / 180;
    const mid = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + mid * Math.cos(-midAngle * RADIAN);
    const y = cy + mid * Math.sin(-midAngle * RADIAN);
    const pctStr = `(${(percent * 100).toFixed(2)}%)`;
    return (
      <g>
        <text x={x} y={y - 7} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700}>
          {value}
        </text>
        <text x={x} y={y + 9} fill="rgba(255,255,255,0.9)" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={500}>
          {pctStr}
        </text>
      </g>
    );
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 3, height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>{title}</Typography>
          <Button size="small" startIcon={<DownloadIcon sx={{ fontSize: 14 }} />} onClick={onExport} sx={{ fontSize: 12, color: "text.secondary" }}>Excel</Button>
        </Box>
        {data.length > 0 && total > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%" cy="50%"
                  innerRadius={innerR}
                  outerRadius={outerR}
                  paddingAngle={2}
                  dataKey="value"
                  label={renderLabel}
                  labelLine={false}
                  isAnimationActive={false}
                >
                  {data.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomChartTooltip totalVal={total} />} />
              </PieChart>
            </ResponsiveContainer>
            <Stack direction="row" flexWrap="wrap" gap={1.5} justifyContent="center" sx={{ mt: 1 }}>
              {data.map((d: any, idx: number) => (
                <Stack key={`${d.name}-${idx}`} direction="row" alignItems="center" spacing={0.5}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: d.color }} />
                  <Typography variant="caption" color="text.secondary">{d.name}</Typography>
                  <Typography variant="caption" fontWeight={700}>{d.value}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        ) : <EmptyState />}
      </CardContent>
    </Card>
  );
}

function ZoneHeatmapMatrix({ data }: { data?: any }) {
  const zones = ["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Zone 7", "Zone 8"];

  // Parse matrix data from API or use empty matrix
  const matrix: number[][] = (() => {
    if (data && Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === "object" && !Array.isArray(data)) {
      return zones.map((_, ri) => zones.map((_, ci) => {
        const key1 = `zone${ri + 1}`;
        const key2 = `zone${ci + 1}`;
        return data[key1]?.[key2] || 0;
      }));
    }
    return zones.map(() => zones.map(() => 0));
  })();

  const allValues = matrix.flat();
  const maxVal = Math.max(...allValues, 1);

  const getCellColor = (value: number) => {
    if (value === 0) return "#f0f4f8";
    const ratio = value / maxVal;
    // Light yellow → dark blue gradient
    if (ratio < 0.15) return "#f7fcf0";
    if (ratio < 0.3) return "#d9f0d3";
    if (ratio < 0.45) return "#a8ddb5";
    if (ratio < 0.6) return "#7bccc4";
    if (ratio < 0.75) return "#43a2ca";
    if (ratio < 0.9) return "#0868ac";
    return "#084081";
  };

  const hasData = allValues.some(v => v > 0);

  if (!hasData) return <EmptyState />;

  return (
    <Box sx={{ position: "relative", pl: 2, pr: 9 }}>
      <Typography sx={{ display: "block", textAlign: "center", mb: 1, fontWeight: 600, fontSize: 13, color: "#777" }}>
        Patient Referral Matrix between 8 Health Zones in Bangkok
      </Typography>

      {/* Y-axis label (สถานพยาบาลปลายทาง) */}
      <Typography sx={{
        fontSize: 12, color: "#666", fontWeight: 700, position: "absolute", left: -56, top: "50%",
        transform: "rotate(-90deg)", transformOrigin: "center", whiteSpace: "nowrap",
      }}>
        สถานพยาบาลปลายทาง
      </Typography>

      {/* Grid */}
      <Box sx={{ display: "grid", gridTemplateColumns: `48px repeat(${zones.length}, 1fr)`, gap: 0.25, minWidth: 400 }}>
        {/* Header row */}
        <Box />
        {zones.map(z => (
          <Box key={`h-${z}`} sx={{ textAlign: "center", py: 0.5 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#444" }}>{z}</Typography>
          </Box>
        ))}
        {/* Data rows */}
        {matrix.map((row, ri) => (
          <Box key={`row-${ri}`} sx={{ display: "contents" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", pr: 0.5 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#444" }}>{zones[ri]}</Typography>
            </Box>
            {row.map((val, ci) => (
              <Box
                key={`cell-${ri}-${ci}`}
                sx={{
                  bgcolor: getCellColor(val),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  aspectRatio: "1", borderRadius: 0.5, minHeight: 32,
                  transition: "transform 0.1s", "&:hover": { transform: "scale(1.05)", zIndex: 1, boxShadow: 2 },
                }}
              >
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: val > maxVal * 0.5 ? "#fff" : "#666" }}>
                  {val}
                </Typography>
              </Box>
            ))}
          </Box>
        ))}
      </Box>

      {/* X-axis label (สถานพยาบาลต้นทาง) */}
      <Typography sx={{ fontSize: 12, color: "#666", fontWeight: 700, textAlign: "center", mt: 1 }}>สถานพยาบาลต้นทาง</Typography>

      {/* Color scale legend (right side) — aligned top/bottom with zones */}
      <Box sx={{ position: "absolute", right: 4, top: 52, bottom: 28, display: "flex", alignItems: "stretch", gap: 0.5 }}>
        {/* Gradient bar */}
        <Box sx={{ width: 14, background: "linear-gradient(to bottom, #084081, #0868ac, #43a2ca, #7bccc4, #a8ddb5, #d9f0d3, #f7fcf0)", borderRadius: 0.5 }} />
        {/* Scale numbers — dynamic step to keep ~5-6 ticks */}
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          {(() => {
            const step = maxVal <= 500 ? 100 : maxVal <= 1000 ? 200 : maxVal <= 2500 ? 500 : 1000;
            const top = Math.ceil(maxVal / step) * step;
            const steps: number[] = [];
            for (let v = top; v >= 0; v -= step) steps.push(v);
            return steps.map((v, i) => (
              <Typography key={i} sx={{ fontSize: 11, color: "#666", fontWeight: 600, lineHeight: 1 }}>{v}</Typography>
            ));
          })()}
        </Box>
        {/* จำนวนคนไข้ label */}
        <Typography sx={{
          fontSize: 12, color: "#666", fontWeight: 700, writingMode: "vertical-rl", textOrientation: "mixed",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          จำนวนคนไข้
        </Typography>
      </Box>
    </Box>
  );
}

function EmptyState() {
  return (
    <Box sx={{ py: 6, textAlign: "center" }}>
      <Typography color="text.secondary">ไม่มีข้อมูล</Typography>
    </Box>
  );
}

function getColor(name: string, map: Record<string, string>, def = "#8b5cf6"): string {
  const l = name.toLowerCase();
  for (const [k, c] of Object.entries(map)) { if (l.includes(k.toLowerCase())) return c; }
  return def;
}
