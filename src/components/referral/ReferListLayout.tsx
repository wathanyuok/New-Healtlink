"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box, Paper, Typography, Tabs, Tab, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Pagination, Skeleton,
  InputAdornment, Stack, Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  FilterAltOff as ClearIcon,
} from "@mui/icons-material";
import { useReferralStore } from "@/stores/referralStore";
import { useAuthStore } from "@/stores/authStore";

type ReferralType = "referIn" | "referOut" | "referReceive" | "referBack" | "requestReferOut" | "requestReferBack";

interface Props {
  pageName: string;
  referralType: ReferralType;
}

const TABS = [
  { label: "ทั้งหมด", value: "all" },
  { label: "OPD", value: "OPD" },
  { label: "IPD", value: "IPD" },
  { label: "ER", value: "EMERGENCY" },
];

const STATUS_OPTIONS = [
  { value: "", label: "ทุกสถานะ" },
  { value: "pending", label: "รอดำเนินการ" },
  { value: "accepted", label: "รับเข้ารักษา" },
  { value: "rejected", label: "ปฏิเสธ" },
  { value: "appointment", label: "นัดหมาย" },
  { value: "completed", label: "สำเร็จ" },
  { value: "cancelled", label: "ยกเลิก" },
];

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  pending: { bg: "#FFF7ED", color: "#F97316", border: "#F97316" },
  accepted: { bg: "#F0FDF4", color: "#22C55E", border: "#22C55E" },
  rejected: { bg: "#FEF2F2", color: "#EF4444", border: "#EF4444" },
  appointment: { bg: "#EFF6FF", color: "#3B82F6", border: "#3B82F6" },
  completed: { bg: "#F0FDF4", color: "#16A34A", border: "#16A34A" },
  cancelled: { bg: "#F5F5F5", color: "#6B7280", border: "#6B7280" },
  draft: { bg: "#FFFBEB", color: "#D97706", border: "#D97706" },
};

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "รอดำเนินการ",
    accepted: "รับเข้ารักษา",
    rejected: "ปฏิเสธ",
    appointment: "นัดหมาย",
    completed: "สำเร็จ",
    cancelled: "ยกเลิก",
    draft: "ร่าง",
  };
  return map[status] || status || "-";
}

function formatThaiDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function ReferListLayout({ pageName, referralType }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { findAndCountReferral } = useReferralStore();
  const { profile } = useAuthStore();

  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Map referral type to API kind param
  const kindParam = useMemo(() => {
    const map: Record<ReferralType, string> = {
      referIn: "referIn",
      referOut: "referOut",
      referReceive: "referReceive",
      referBack: "referBack",
      requestReferOut: "requestReferOut",
      requestReferBack: "requestReferBack",
    };
    return map[referralType] || "referIn";
  }, [referralType]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const tabValue = TABS[activeTab]?.value;
      const params: any = {
        offset: (page - 1) * limit,
        limit,
        kind: kindParam,
        startDate,
        endDate,
      };
      if (tabValue && tabValue !== "all") params.serviceType = tabValue;
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (profile?.hospital?.id) params.hospitalId = profile.hospital.id;

      const result = await findAndCountReferral(params);
      setData(result?.referralDocuments || []);
      setTotalCount(result?.totalCount || 0);
    } catch (err) {
      console.error("Error loading referrals:", err);
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, limit, kindParam, search, statusFilter, startDate, endDate, findAndCountReferral, profile]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(totalCount / limit);

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    setStartDate(d.toISOString().split("T")[0]);
    setEndDate(new Date().toISOString().split("T")[0]);
    setPage(1);
  };

  const navigateToDetail = (id: number) => {
    const basePath = referralType.replace(/([A-Z])/g, "-$1").toLowerCase();
    router.push(`/${basePath}/in?id=${id}`);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Title */}
      <Paper sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>{pageName}</Typography>

        {/* Filters row */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "2fr 1fr 1fr 1fr auto" }, gap: 1.5, alignItems: "end", mb: 2 }}>
          <TextField size="small" placeholder="ค้นหาชื่อผู้ป่วย, เลขที่ส่งตัว..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
          <FormControl size="small">
            <InputLabel>สถานะ</InputLabel>
            <Select value={statusFilter} label="สถานะ" onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              {STATUS_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField type="date" size="small" label="เริ่มต้น" value={startDate}
            onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField type="date" size="small" label="สิ้นสุด" value={endDate}
            onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          <Button variant="outlined" color="inherit" startIcon={<ClearIcon />} onClick={handleClearFilters} sx={{ height: 40 }}>
            ล้าง
          </Button>
        </Box>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(_, v) => { setActiveTab(v); setPage(1); }}
          sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          {TABS.map((t, i) => <Tab key={t.value} label={t.label} />)}
        </Tabs>

        {/* Results count */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            พบ {totalCount} รายการ
          </Typography>
        </Box>

        {/* Table */}
        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {[...Array(5)].map((_, i) => <Skeleton key={i} variant="rectangular" height={52} sx={{ borderRadius: 1 }} />)}
          </Box>
        ) : data.length === 0 ? (
          <Typography textAlign="center" color="text.secondary" py={6}>ไม่พบข้อมูล</Typography>
        ) : (
          <TableContainer sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#036245" }}>
                <TableRow>
                  <TableCell sx={{ color: "#fff", fontWeight: 600, width: 60 }}>ลำดับ</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 600 }}>เลขที่ส่งตัว</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 600 }}>ชื่อ-สกุล ผู้ป่วย</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 600 }}>ประเภทบริการ</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 600 }}>สถานพยาบาลต้นทาง</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 600 }}>สถานพยาบาลปลายทาง</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 600 }}>วันที่ส่งตัว</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 600 }}>สถานะ</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 600, width: 120 }}>จัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row: any, idx: number) => {
                  const status = row.latestStatus?.status || row.status || "pending";
                  const statusStyle = STATUS_COLORS[status] || STATUS_COLORS.pending;
                  return (
                    <TableRow key={row.id || idx} hover sx={{ cursor: "pointer" }}
                      onClick={() => navigateToDetail(row.id)}>
                      <TableCell>{(page - 1) * limit + idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{row.referralNumber || row.id || "-"}</TableCell>
                      <TableCell>
                        {row.patient ? `${row.patient.firstName || ""} ${row.patient.lastName || ""}`.trim() : "-"}
                      </TableCell>
                      <TableCell>
                        <Chip label={row.serviceType || "OPD"} size="small"
                          sx={{ bgcolor: "#E8F8F5", color: "#036245", fontWeight: 500 }} />
                      </TableCell>
                      <TableCell>{row.fromHospital?.name || row.originHospital?.name || "-"}</TableCell>
                      <TableCell>{row.toHospital?.name || row.destinationHospital?.name || "-"}</TableCell>
                      <TableCell>{formatThaiDate(row.referralDate || row.createdAt)}</TableCell>
                      <TableCell>
                        <Chip label={getStatusLabel(status)} size="small"
                          sx={{ bgcolor: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, fontWeight: 500 }} />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="ดูรายละเอียด">
                            <IconButton size="small" color="primary" onClick={() => navigateToDetail(row.id)}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="แก้ไข">
                            <IconButton size="small" color="warning"
                              onClick={() => router.push(`/${referralType.replace(/([A-Z])/g, "-$1").toLowerCase()}/edit?id=${row.id}`)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
          </Box>
        )}
      </Paper>
    </Box>
  );
}
