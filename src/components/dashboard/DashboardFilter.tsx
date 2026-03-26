"use client";

import { useMemo } from "react";
import {
  Paper, Box, Button, FormControl, InputLabel, Select, MenuItem,
  TextField, Stack, Typography, Chip,
} from "@mui/material";
import { FilterAltOff as ClearIcon } from "@mui/icons-material";
import { useDashboardStore } from "@/stores/dashboardStore";
import type { DashboardType, Filters } from "@/types/dashboard";

interface Props {
  dashboardType: DashboardType;
}

const rangeOptions = [
  { value: "7_days", label: "7 วัน" },
  { value: "30_days", label: "30 วัน" },
  { value: "90_days", label: "90 วัน" },
  { value: "custom", label: "กำหนดเอง" },
];

export default function DashboardFilter({ dashboardType }: Props) {
  const {
    selectedRange, globalStartDate, globalEndDate, setSelectedRange, setGlobalDates, resetAllFilters,
    exportSummaryExcel,
    staticsAndDetailsFilters, reportStatusStatisticsFilters,
    top5CauseFilters, top5CommonReasonsFilters,
    top5HighestAcceptingHospitalsFilters, top10MostReferredDiseasesFilters,
  } = useDashboardStore();

  const title = useMemo(() => {
    switch (dashboardType) {
      case "refer-in": return "Refer In - รับผู้ป่วยเข้า";
      case "refer-out": return "Refer Out - ส่งตัวผู้ป่วยออก";
      default: return "แดชบอร์ดรวม";
    }
  }, [dashboardType]);

  const handleRangeChange = (range: string) => {
    setSelectedRange(range);
    if (range === "custom") return;
    const now = new Date();
    const start = new Date();
    now.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);
    const days = range === "7_days" ? 6 : range === "30_days" ? 29 : 89;
    start.setDate(now.getDate() - days);
    setGlobalDates(start.toISOString().split("T")[0], now.toISOString().split("T")[0]);
  };

  const handleClear = () => {
    resetAllFilters();
    handleRangeChange("30_days");
  };

  const exportPDF = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const { sarabunBase64 } = await import("@/lib/sarabunFont");

      // Fetch same data as Excel
      const param = {
        startDate: globalStartDate, endDate: globalEndDate, range: selectedRange,
        staticsAndDetailsParams: buildFilterParams(staticsAndDetailsFilters),
        reportStatusStatisticsParams: buildFilterParams(reportStatusStatisticsFilters),
        top5CauseParams: buildFilterParams(top5CauseFilters),
        top5CommonReasonsParams: buildFilterParams(top5CommonReasonsFilters),
        top5HighestAcceptingHospitalsParams: buildFilterParams(top5HighestAcceptingHospitalsFilters),
        top10MostReferredDiseasesParams: buildFilterParams(top10MostReferredDiseasesFilters),
      };
      const response = await exportSummaryExcel(param);
      const exportData = response?.data || response;
      if (!exportData || !exportData.sections) { alert("ไม่มีข้อมูลสำหรับการส่งออก"); return; }

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      // Register Thai font
      doc.addFileToVFS("Sarabun-Regular.ttf", sarabunBase64);
      doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
      doc.setFont("Sarabun");

      // Title
      doc.setFontSize(16);
      doc.text(exportData.reportTitle || "รายงานสรุปข้อมูลแดชบอร์ดรวม", 14, 15);
      doc.setFontSize(10);
      doc.text(`ช่วงเวลา: ${exportData.dateRange || ""}`, 14, 22);

      let startY = 28;

      // Process each section
      exportData.sections.forEach((section: any) => {
        if (startY > 170) { doc.addPage(); startY = 15; }

        doc.setFontSize(12);
        doc.setFont("Sarabun", "normal");
        doc.text(section.sectionTitle || "", 14, startY);
        startY += 4;

        if (section.data?.length) {
          const first = section.data[0];
          let head: string[][] = [];
          let body: string[][] = [];

          if (first.icd10Code !== undefined) {
            head = [["อันดับ", "ICD-10", "รายละเอียด", "จำนวน", "รับเข้า", "ปฏิเสธ", "อัตราการยอมรับ", "%"]];
            body = section.data.map((i: any) => [String(i.rank || ""), i.icd10Code || "", i.icd10Description || "", String(i.totalCount || 0), String(i.acceptedReferrals || 0), String(i.rejectedReferrals || 0), i.acceptanceRate || "0%", i.percentage || "0%"]);
          } else if (first.hospitalSubType !== undefined) {
            head = [["อันดับ", "โรงพยาบาล", "ประเภท", "ระดับ", "สังกัด", "อัตรา", "In", "Out", "Back", "รวม"]];
            body = section.data.map((i: any) => [String(i.rank || ""), i.hospitalName || "", i.hospitalSubType || "", i.serviceLevel || "", i.hospitalAffiliation || "", i.acceptanceRate || "0%", String(i.referIn || 0), String(i.referOut || 0), String(i.referBack || 0), String(i.total || 0)]);
          } else if (first.reason !== undefined) {
            head = [["อันดับ", "โรงพยาบาล", "เหตุผล", "ประเภท", "จำนวน", "%"]];
            body = section.data.map((i: any) => [String(i.rank || ""), i.hospitalName || "", i.reason || "", i.referralType || "", String(i.count || 0), i.percentage || "0%"]);
          } else if (first.cause !== undefined) {
            head = [["อันดับ", "โรงพยาบาล", "สาเหตุ", "ประเภท", "จำนวน", "%"]];
            body = section.data.map((i: any) => [String(i.rank || ""), i.hospitalName || "", i.cause || "", i.referralType || "", String(i.count || 0), i.percentage || "0%"]);
          } else if (first.type !== undefined && first.referOut !== undefined) {
            head = [["ประเภท", "Refer Out", "Refer In", "รวม"]];
            body = section.data.map((i: any) => [i.type || "", String(i.referOut || 0), String(i.referIn || 0), String(i.total || 0)]);
          } else if (first.name !== undefined) {
            head = [["รายการ", "จำนวน", "%"]];
            body = section.data.map((i: any) => [i.name || i.department || "", String(i.count || i.rejectedCount || 0), i.percentage || i.rejectionRate || "0%"]);
          }

          if (head.length && body.length) {
            autoTable(doc, {
              head, body, startY,
              styles: { font: "Sarabun", fontSize: 9, cellPadding: 2 },
              headStyles: { fillColor: [0, 184, 148], textColor: 255, fontStyle: "normal" },
              margin: { left: 14, right: 14 },
              didDrawPage: (data: any) => { startY = data.cursor?.y || startY; },
            });
            startY = (doc as any).lastAutoTable?.finalY + 6 || startY + 20;
          }
        }
        startY += 4;
      });

      // Metadata
      if (exportData.exportMetadata) {
        if (startY > 170) { doc.addPage(); startY = 15; }
        doc.setFontSize(8);
        doc.text(`ส่งออกเมื่อ: ${exportData.exportMetadata.exportedAt}`, 14, startY);
        doc.text(`ส่งออกโดย: ${exportData.exportMetadata.exportedBy}`, 14, startY + 4);
      }

      doc.save(`รายงานสรุปแดชบอร์ด_${Date.now()}.pdf`);
    } catch (err: any) {
      console.error("PDF export error:", err);
      alert(`เกิดข้อผิดพลาด: ${err.message || "ไม่สามารถส่งออก PDF ได้"}`);
    }
  };

  const buildFilterParams = (f: Filters) => ({
    hospitalZoneId: f.zone, hospitalSubTypeId: f.type, hospitalId: f.name, affiliation: f.region, serviceLevel: f.level,
  });

  const exportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const param = {
        startDate: globalStartDate, endDate: globalEndDate, range: selectedRange,
        staticsAndDetailsParams: buildFilterParams(staticsAndDetailsFilters),
        reportStatusStatisticsParams: buildFilterParams(reportStatusStatisticsFilters),
        top5CauseParams: buildFilterParams(top5CauseFilters),
        top5CommonReasonsParams: buildFilterParams(top5CommonReasonsFilters),
        top5HighestAcceptingHospitalsParams: buildFilterParams(top5HighestAcceptingHospitalsFilters),
        top10MostReferredDiseasesParams: buildFilterParams(top10MostReferredDiseasesFilters),
      };
      const response = await exportSummaryExcel(param);
      const exportData = response?.data || response;
      if (!exportData || !exportData.sections) { alert("ไม่มีข้อมูลสำหรับการส่งออก"); return; }

      const wb = XLSX.utils.book_new();
      const rows: any[][] = [];
      rows.push([exportData.reportTitle || "รายงานสรุปข้อมูลแดชบอร์ดรวม"]);
      rows.push([`ช่วงเวลา: ${exportData.dateRange}`]);
      rows.push([]);

      exportData.sections.forEach((section: any) => {
        rows.push([section.sectionTitle]);
        if (section.data?.length) {
          const first = section.data[0];
          if (first.icd10Code !== undefined) {
            rows.push(["อันดับ", "รหัส ICD-10", "รายละเอียด", "จำนวนทั้งหมด", "รับเข้ารักษา", "ปฏิเสธ", "อัตราการยอมรับ", "เปอร์เซ็นต์"]);
            section.data.forEach((i: any) => rows.push([i.rank || "", i.icd10Code || "", i.icd10Description || "", i.totalCount || 0, i.acceptedReferrals || 0, i.rejectedReferrals || 0, i.acceptanceRate || "0%", i.percentage || "0%"]));
          } else if (first.hospitalSubType !== undefined) {
            rows.push(["อันดับ", "โรงพยาบาล", "ประเภท", "ระดับบริการ", "สังกัด", "อัตราการยอมรับ", "Refer In", "Refer Out", "Refer Back", "รวม"]);
            section.data.forEach((i: any) => rows.push([i.rank || "", i.hospitalName || "", i.hospitalSubType || "", i.serviceLevel || "", i.hospitalAffiliation || "", i.acceptanceRate || "0%", i.referIn || 0, i.referOut || 0, i.referBack || 0, i.total || 0]));
          } else if (first.reason !== undefined) {
            rows.push(["อันดับ", "โรงพยาบาล", "เหตุผล", "ประเภทการส่งต่อ", "จำนวน", "เปอร์เซ็นต์"]);
            section.data.forEach((i: any) => rows.push([i.rank || "", i.hospitalName || "", i.reason || "", i.referralType || "", i.count || 0, i.percentage || "0%"]));
          } else if (first.cause !== undefined) {
            rows.push(["อันดับ", "โรงพยาบาล", "สาเหตุ", "ประเภทการส่งต่อ", "จำนวน", "เปอร์เซ็นต์"]);
            section.data.forEach((i: any) => rows.push([i.rank || "", i.hospitalName || "", i.cause || "", i.referralType || "", i.count || 0, i.percentage || "0%"]));
          } else if (first.type !== undefined && first.referOut !== undefined) {
            const grouped: Record<string, any[]> = {};
            section.data.forEach((i: any) => { const c = i.category || "อื่นๆ"; (grouped[c] ??= []).push(i); });
            Object.entries(grouped).forEach(([cat, items]) => {
              rows.push([cat]);
              rows.push(["ประเภท", "ส่งออก (Refer Out)", "รับเข้า (Refer In)", "รวม"]);
              items.forEach((i: any) => rows.push([i.type || "", i.referOut || 0, i.referIn || 0, i.total || 0]));
              rows.push([]);
            });
          } else if (first.name !== undefined && first.category !== undefined) {
            const grouped: Record<string, any[]> = {};
            section.data.forEach((i: any) => { const c = i.category || "อื่นๆ"; (grouped[c] ??= []).push(i); });
            Object.entries(grouped).forEach(([cat, items]) => {
              rows.push([cat]);
              if (cat === "แผนก/สาขา") {
                rows.push(["รายการ", "จำนวนการรับเข้ารักษา", "เปอร์เซ็นต์"]);
                items.forEach((i: any) => rows.push([(i.department + " - " + i.hospitalName) || "", i.count || 0, i.percentage || "0%"]));
              } else if (cat === "สาขาที่ถูกปฏิเสธ") {
                rows.push(["รายการ", "จำนวนการปฏิเสธ", "เปอร์เซ็นต์"]);
                items.forEach((i: any) => rows.push([(i.department + " - " + i.hospitalName) || "", i.rejectedCount || 0, i.rejectionRate || "0%"]));
              } else {
                rows.push(["รายการ", "จำนวน", "เปอร์เซ็นต์"]);
                items.forEach((i: any) => rows.push([i.name || "", i.count || 0, i.percentage || "0%"]));
              }
              rows.push([]);
            });
          }
        }
        rows.push([]);
      });

      if (exportData.summary?.length) {
        rows.push(["สรุปรายงาน"]);
        exportData.summary.forEach((i: any) => rows.push([i.metric || "", i.value || ""]));
        rows.push([]);
      }
      if (exportData.exportMetadata) {
        rows.push([`ส่งออกเมื่อ: ${exportData.exportMetadata.exportedAt}`]);
        rows.push([`ส่งออกโดย: ${exportData.exportMetadata.exportedBy}`]);
        rows.push([`จำนวนส่วนทั้งหมด: ${exportData.exportMetadata.totalSections}`]);
      }

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const cw = rows.reduce((a: number[], r: any[]) => { r.forEach((c, i) => { const l = (c?.toString() || "").length; if (!a[i] || a[i] < l) a[i] = l; }); return a; }, []);
      ws["!cols"] = cw.map((w: number) => ({ wch: Math.min(w + 2, 50) }));
      XLSX.utils.book_append_sheet(wb, ws, "รายงานสรุปแดชบอร์ด");
      XLSX.writeFile(wb, `รายงานสรุปแดชบอร์ด_${Date.now()}.xlsx`);
    } catch (err: any) {
      console.error("Excel export error:", err);
      alert(`เกิดข้อผิดพลาด: ${err.message || "ไม่สามารถส่งออกได้"}`);
    }
  };

  return (
    <Paper sx={{ p: 2.5, mb: 2, borderRadius: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h5" fontWeight={700}>{title}</Typography>
        <Chip label={`ช่วงเวลา: ${rangeOptions.find(r => r.value === selectedRange)?.label || ""}`} color="primary" variant="outlined" />
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 2, flexWrap: "wrap" }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-end" flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>ช่วงเวลา</InputLabel>
            <Select value={selectedRange} label="ช่วงเวลา" onChange={(e) => handleRangeChange(e.target.value)}>
              {rangeOptions.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField type="date" size="small" label="เริ่มต้น" disabled={selectedRange !== "custom"}
            value={globalStartDate || ""} onChange={(e) => setGlobalDates(e.target.value, globalEndDate)}
            InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
          <TextField type="date" size="small" label="สิ้นสุด" disabled={selectedRange !== "custom"}
            value={globalEndDate || ""} onChange={(e) => setGlobalDates(globalStartDate, e.target.value)}
            InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={exportPDF} size="small"
            sx={{ borderColor: "#00B894", color: "#00B894", fontWeight: 500, whiteSpace: "nowrap", "&:hover": { borderColor: "#009B7D", bgcolor: "rgba(0,184,148,0.04)" } }}>
            ส่งออกเป็นPDF
          </Button>
          <Button variant="outlined" onClick={exportExcel} size="small"
            sx={{ borderColor: "#00B894", color: "#00B894", fontWeight: 500, whiteSpace: "nowrap", "&:hover": { borderColor: "#009B7D", bgcolor: "rgba(0,184,148,0.04)" } }}>
            ส่งออกเป็น Excel
          </Button>
          <Button variant="outlined" color="inherit" startIcon={<ClearIcon />} onClick={handleClear} size="small"
            sx={{ fontWeight: 500, whiteSpace: "nowrap" }}>
            ล้างตัวกรอง
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
