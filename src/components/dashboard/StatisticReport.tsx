"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Paper, Box, Typography, Button, Card, CardContent,
  Chip, Skeleton, Divider, Stack,
} from "@mui/material";
import { Download as DownloadIcon } from "@mui/icons-material";
import { useDashboardStore } from "@/stores/dashboardStore";
import FilterSection from "./FilterSection";
import type { DashboardType, Filters } from "@/types/dashboard";
import Image from "next/image";

interface Props {
  role: string;
  dashboardType: DashboardType;
}

const GRADIENT = "linear-gradient(135deg, #46bee8 0%, #24d89d 100%)";
const GRADIENT_BADGE = "linear-gradient(180deg, #24d89d 0%, #46bee8 100%)";

export default function StatisticReport({ role, dashboardType }: Props) {
  const {
    getStaticsAndDetails, exportStaticsAndDetails, globalStartDate, globalEndDate,
    globalFilters, setGlobalFilters,
  } = useDashboardStore();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const filters = globalFilters;
  const setFilters = (f: Filters | ((prev: Filters) => Filters)) => {
    const newFilters = typeof f === "function" ? f(globalFilters) : f;
    setGlobalFilters(newFilters);
  };

  const params = useMemo(() => {
    const p: any = {};
    p.startDate = globalStartDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    p.endDate = globalEndDate || new Date().toISOString().split("T")[0];
    if (filters.zone) p.hospitalZoneId = filters.zone;
    if (filters.type) p.hospitalSubTypeId = filters.type;
    if (filters.name) p.hospitalId = filters.name;
    if (filters.region) p.affiliation = filters.region;
    if (filters.level) p.serviceLevel = filters.level;
    return p;
  }, [globalStartDate, globalEndDate, filters, dashboardType]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getStaticsAndDetails(params);
      // API may return { data: {...} } or the data directly
      setData(result?.data || result || null);
    } catch (err) { console.error("StatisticReport fetch error:", err); }
    finally { setLoading(false); }
  }, [params, getStaticsAndDetails]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const departments = useMemo(() => {
    const types = data?.referralTypes;
    const def = [
      { name: "OPD", icon: "/images/IconOPD.svg", total: 0, referIn: 0, referOut: 0 },
      { name: "IPD", icon: "/images/IconIPD.svg", total: 0, referIn: 0, referOut: 0 },
      { name: "ER", icon: "/images/IconER.svg", total: 0, referIn: 0, referOut: 0 },
    ];
    if (!types) return def;
    const getDisplayTotal = (item: any) => {
      if (dashboardType === "refer-in") return item?.referIn || 0;
      if (dashboardType === "refer-out") return item?.referOut || 0;
      return item?.total || 0;
    };
    return [
      { name: "OPD", icon: "/images/IconOPD.svg", total: getDisplayTotal(types.opd), referIn: types.opd?.referIn || 0, referOut: types.opd?.referOut || 0 },
      { name: "IPD", icon: "/images/IconIPD.svg", total: getDisplayTotal(types.ipd), referIn: types.ipd?.referIn || 0, referOut: types.ipd?.referOut || 0 },
      { name: "ER", icon: "/images/IconER.svg", total: getDisplayTotal(types.emergency), referIn: types.emergency?.referIn || 0, referOut: types.emergency?.referOut || 0 },
    ];
  }, [data, dashboardType]);

  const statusCards = useMemo(() => {
    const s = data?.statusStatistics;
    if (!s || typeof s !== "object") return [];
    const titleMap: Record<string, string> = { accept: "รับเข้ารักษา", reject: "ปฏิเสธรักษา", waiting: "รอตอบรับ" };
    const iconMap: Record<string, string> = { accept: "/images/IconAdmit.svg", reject: "/images/IconRF.svg", waiting: "/images/IconPENDING.svg" };
    return Object.entries(s).map(([key, item]: [string, any]) => ({
      titleKey: key, title: titleMap[key] || key, icon: iconMap[key],
      total: item.total, percent: item.percentage || "100.00%",
      referIn: { value: item.referIn, percent: item.referInPercentage },
      referOut: { value: item.referOut, percent: item.referOutPercentage },
      breakdown: [
        { name: "OPD", value: item.breakdown?.opd || 0, percent: item.breakdown?.opdPercentage || "0.00%" },
        { name: "IPD", value: item.breakdown?.ipd || 0, percent: item.breakdown?.ipdPercentage || "0.00%" },
        { name: "ER", value: item.breakdown?.emergency || 0, percent: item.breakdown?.emergencyPercentage || "0.00%" },
      ],
    }));
  }, [data]);

  const clearFilters = () => setFilters({ zone: null, type: null, name: null, region: null, level: null });

  const downloadExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const response = await exportStaticsAndDetails(params);
      const exportData = response?.data || response;
      if (!exportData || !exportData.summary) { alert("ไม่มีข้อมูลสำหรับการส่งออก"); return; }

      const wb = XLSX.utils.book_new();
      const rows: any[][] = [];

      rows.push([exportData.reportTitle || "รายงานสถิติและรายละเอียดการส่งต่อผู้ป่วย"]);
      if (exportData.dateRange) rows.push([`ช่วงวันที่: ${exportData.dateRange.startDate} - ${exportData.dateRange.endDate}`]);
      rows.push([]);

      const referralTypeData = exportData.summary.filter((item: any) => item.category === "ประเภทการส่งต่อ");
      const statusData = exportData.summary.filter((item: any) => item.category === "สถานะการส่งต่อ");

      rows.push(["ประเภทการส่งต่อ"]);
      rows.push(["ประเภท", "Refer Out", "Refer In", "รวม"]);
      referralTypeData.forEach((item: any) => rows.push([item.type || "", item.referOut || 0, item.referIn || 0, item.total || 0]));
      rows.push([]);

      rows.push(["สถานะการส่งต่อ"]);
      rows.push(["สถานะ", "Refer Out", "Refer In", "รวม"]);
      statusData.forEach((item: any) => rows.push([item.type || "", item.referOut || 0, item.referIn || 0, item.total || 0]));

      if (exportData.exportMetadata) {
        rows.push([]);
        rows.push([`ส่งออกเมื่อ: ${exportData.exportMetadata.exportedAt}`]);
        rows.push([`ส่งออกโดย: ${exportData.exportMetadata.exportedBy}`]);
        rows.push([`โรงพยาบาล: ${exportData.exportMetadata.hospitalName}`]);
      }

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const cw = rows.reduce((a: number[], r: any[]) => { r.forEach((c, i) => { const l = (c?.toString() || "").length; if (!a[i] || a[i] < l) a[i] = l; }); return a; }, []);
      ws["!cols"] = cw.map((w: number) => ({ wch: Math.min(w + 2, 50) }));
      XLSX.utils.book_append_sheet(wb, ws, "สถิติและรายละเอียด");
      XLSX.writeFile(wb, `รายงานสถิติและรายละเอียดการส่งต่อผู้ป่วย_${Date.now()}.xlsx`);
    } catch (err: any) {
      console.error("Export error:", err);
      alert(`เกิดข้อผิดพลาดในการส่งออก: ${err.message || "ไม่สามารถดาวน์โหลดได้"}`);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Skeleton variant="rounded" height={56} sx={{ mb: 2 }} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2 }}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rounded" height={160} />)}
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ overflow: "hidden", borderRadius: 3 }}>
      {/* ── Gradient Header ── */}
      <Box sx={{ background: GRADIENT, px: 3, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: 20 }}>
          สถิติรายงานประเภทและสถานะ
        </Typography>
        <Button size="small" variant="contained" startIcon={<DownloadIcon />} onClick={downloadExcel}
          sx={{ bgcolor: "#fff", color: "#036246", fontWeight: 500, "&:hover": { bgcolor: "#f5f5f5" }, boxShadow: "none" }}>
          ดาวน์โหลดเป็น Excel
        </Button>
      </Box>

      {/* ── Filters ── */}
      <FilterSection filters={filters} onFilterChange={setFilters} onClear={clearFilters} role={role} />

      {/* ── ประเภทการส่งตัว ── */}
      <Box sx={{ px: 2, pb: 2, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2 }}>
        {/* Section Header Card with doctor illustration */}
        <Box sx={{
          background: GRADIENT, borderRadius: 3, p: 3,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          minHeight: 130,
        }}>
          <Box>
            <Typography sx={{ color: "#1a1a1a", fontSize: 20, fontWeight: 600 }}>ประเภท</Typography>
            <Typography sx={{ color: "#fff", fontSize: 24, fontWeight: 600 }}>การส่งตัว</Typography>
          </Box>
          <Box sx={{ width: 140, height: 140, position: "relative", flexShrink: 0 }}>
            <Image src="/images/IconDoctor.svg" alt="Doctor" fill style={{ objectFit: "contain" }} />
          </Box>
        </Box>

        {/* Department Cards (OPD / IPD / ER) */}
        {departments.map(dept => (
          <Card variant="outlined" sx={{ borderRadius: 3, display: "flex", flexDirection: "column" }} key={dept.name}>
            <CardContent sx={{ display: "flex", flexDirection: "column", flex: 1, "&:last-child": { pb: 2 } }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Box sx={{ width: 32, height: 32, position: "relative" }}>
                  <Image src={dept.icon} alt={dept.name} fill style={{ objectFit: "contain" }} />
                </Box>
                <Typography sx={{ color: "#036245", fontSize: 22, fontWeight: 700 }}>{dept.name}</Typography>
                <Typography sx={{ ml: "auto", fontSize: 24, fontWeight: 700 }}>{dept.total}</Typography>
              </Box>
              <Divider />
              <Stack direction="row" justifyContent="space-between" sx={{ mt: "auto", pt: 1.5 }}>
                <Box>
                  <Typography variant="h6" fontWeight={600} color="text.secondary">{dept.referIn}</Typography>
                  <Typography variant="caption" color="text.secondary">Refer In</Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="h6" fontWeight={600} color="text.secondary">{dept.referOut}</Typography>
                  <Typography variant="caption" color="text.secondary">Refer Out</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* ── สถานะการส่งตัว ── */}
      <Box sx={{ px: 2, pb: 3, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2 }}>
        {/* Section Header Card with doctor 2 illustration */}
        <Box sx={{
          background: GRADIENT, borderRadius: 3, p: 3,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          minHeight: 220,
        }}>
          <Box>
            <Typography sx={{ color: "#1a1a1a", fontSize: 20, fontWeight: 600 }}>สถานะ</Typography>
            <Typography sx={{ color: "#fff", fontSize: 24, fontWeight: 600 }}>การส่งตัว</Typography>
          </Box>
          <Box sx={{ width: 120, height: 140, position: "relative", flexShrink: 0 }}>
            <Image src="/images/IconDoctor2.svg" alt="Doctor" fill style={{ objectFit: "contain" }} />
          </Box>
        </Box>

        {/* Status Cards */}
        {statusCards.map(card => (
          <Card variant="outlined" sx={{ borderRadius: 3 }} key={card.titleKey}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Box sx={{ width: 28, height: 28, position: "relative" }}>
                  <Image src={card.icon} alt={card.title} fill style={{ objectFit: "contain" }} />
                </Box>
                <Typography sx={{ color: "#036245", fontSize: 18, fontWeight: 700 }}>{card.title}</Typography>
              </Box>

              {/* Refer In / Out with gradient badges */}
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                {/* Refer In - left */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Refer In</Typography>
                    <Typography fontWeight={700}>{card.referIn?.value ?? 0}</Typography>
                  </Box>
                  <Box sx={{
                    background: GRADIENT_BADGE, borderRadius: 2,
                    width: 44, height: 44,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Typography sx={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>
                      {parsePercent(card.referIn?.percent)}%
                    </Typography>
                  </Box>
                </Box>
                {/* Refer Out - right */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary">Refer Out</Typography>
                    <Typography fontWeight={700}>{card.referOut?.value ?? 0}</Typography>
                  </Box>
                  <Box sx={{
                    background: GRADIENT_BADGE, borderRadius: 2,
                    width: 44, height: 44,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Typography sx={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>
                      {parsePercent(card.referOut?.percent)}%
                    </Typography>
                  </Box>
                </Box>
              </Stack>

              {/* Breakdown OPD/IPD/ER */}
              <Stack direction="row" spacing={1}>
                {card.breakdown.map(item => (
                  <Box key={item.name} sx={{
                    flex: 1, border: "1px solid #00B894", borderRadius: 2, p: 1,
                    textAlign: "center",
                  }}>
                    <Typography variant="caption" color="text.secondary">{item.name}</Typography>
                    <Typography fontWeight={700} fontSize={16}>{item.value}</Typography>
                    <Chip
                      label={`${parsePercent(item.percent)}%`}
                      size="small"
                      sx={{ bgcolor: "#d0fbe4", fontSize: 11, fontWeight: 600, height: 22, mt: 0.5 }}
                    />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        ))}

        {statusCards.length === 0 && [0, 1, 2].map(i => (
          <Card variant="outlined" sx={{ borderRadius: 3, minHeight: 220, display: "flex", alignItems: "center", justifyContent: "center" }} key={i}>
            <Typography color="text.secondary">ไม่มีข้อมูล</Typography>
          </Card>
        ))}
      </Box>
    </Paper>
  );
}

function parsePercent(percentStr?: string): number {
  if (!percentStr) return 0;
  const parsed = Number(parseFloat(percentStr.replace("%", "")).toFixed(0));
  return isNaN(parsed) ? 0 : parsed;
}
