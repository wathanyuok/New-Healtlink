"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Pagination,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useHospitalStore } from "@/stores/hospitalStore";
import { useAuthStore } from "@/stores/authStore";

/* ── Shared select styling (Nuxt border match) ── */
const selectSx = {
  bgcolor: "#F8FFFE",
  borderRadius: 1,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#00AF75" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#00AF75" },
};

/* ── Action icon SVGs matching Nuxt ── */
const ReadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <circle cx="11" cy="14" r="3" />
    <path d="m21 21-1.9-1.9" />
  </svg>
);
const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

/* ── Count badge color helper (matches Nuxt countThresholds: low=5, medium=20, high=50) ── */
const getCountBadgeSx = (count: number) => {
  if (count >= 50) return { bgcolor: "#dcfce7", color: "#166534", borderRadius: "9999px", px: 1, py: 0.25, fontSize: "0.75rem", fontWeight: 500, whiteSpace: "nowrap" };
  if (count >= 20) return { bgcolor: "#fef9c3", color: "#4b5563", borderRadius: "9999px", px: 1, py: 0.25, fontSize: "0.75rem", fontWeight: 500, whiteSpace: "nowrap" };
  if (count >= 5)  return { bgcolor: "#dbeafe", color: "#1d4ed8", borderRadius: "9999px", px: 1, py: 0.25, fontSize: "0.75rem", fontWeight: 500, whiteSpace: "nowrap" };
  return { bgcolor: "#f3f4f6", color: "#4b5563", borderRadius: "9999px", px: 1, py: 0.25, fontSize: "0.75rem", fontWeight: 500, whiteSpace: "nowrap" };
};

/* ── Dropdown MenuProps for consistent max-height (matches Nuxt max-h-60 = 240px) ── */
const dropdownMenuProps = {
  PaperProps: {
    sx: { maxHeight: 240 },
  },
};

/* ── Service level & affiliation options (hardcoded like Nuxt) ── */
const SERVICE_LEVEL_OPTIONS = ["ปฐมภูมิ", "ทุติยภูมิ", "ตติยภูมิ"];
const AFFILIATION_OPTIONS = [
  "สำนักการแพทย์",
  "โรงพยาบาลมหาลัย",
  "สำนักอนามัย",
  "คลินิกชุมชนอบอุ่น",
  "กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม",
];

export default function HospitalPage() {
  const router = useRouter();
  const hospitalStore = useHospitalStore();

  /* ── State ── */
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1); // 1-based like Nuxt
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Filters */
  const [zoneOptions, setZoneOptions] = useState<any[]>([]);
  const [typeOptions, setTypeOptions] = useState<any[]>([]);
  const [filterZone, setFilterZone] = useState<number | "">("");
  const [filterType, setFilterType] = useState<number | "">("");
  const [filterServiceLevel, setFilterServiceLevel] = useState<string>("");
  const [filterAffiliation, setFilterAffiliation] = useState<string>("");

  /* Delete modal */
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingHospital, setDeletingHospital] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* Debounce ref */
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  /* ── Fetch hospitals (direct API call) ── */
  const doFetch = async (p: any) => {
    try {
      setLoading(true);
      setError(null);
      console.log("[HospitalPage] fetching with params:", p);
      const response = await api.get("main-service/hospital/findAndCount", { params: p });
      console.log("[HospitalPage] raw response.data:", response.data);
      const data = response.data;
      // API may return { hospitals, totalCount } or { rows, count }
      const list = data?.hospitals || data?.rows || [];
      const count = data?.totalCount ?? data?.count ?? 0;
      console.log("[HospitalPage] parsed list:", list.length, "count:", count);
      setHospitals(list);
      setTotalCount(count);
    } catch (err) {
      setError("ไม่สามารถโหลดข้อมูลสถานพยาบาลได้");
      console.error("[HospitalPage] fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Fetch filter options ── */
  const fetchOptions = async () => {
    try {
      const [zones, types] = await Promise.all([
        hospitalStore.getOptionHosZone(),
        hospitalStore.getOptionHosType(),
      ]);
      // API returns { status, hospitalZones: [...] } and { status, hospitalSubTypes: [...] }
      const zoneList = Array.isArray(zones) ? zones : zones?.hospitalZones || zones?.rows || [];
      const typeList = Array.isArray(types) ? types : types?.hospitalSubTypes || types?.rows || [];
      console.log("[HospitalPage] zoneList:", zoneList.length, "typeList:", typeList.length);
      setZoneOptions(zoneList);
      setTypeOptions(typeList);
    } catch (err) {
      console.error("[HospitalPage] Failed to load filter options:", err);
    }
  };

  /* ── Single effect for fetching ── */
  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    doFetch({
      offset: page,
      limit: rowsPerPage,
      search: search || undefined,
      zone: filterZone || undefined,
      subType: filterType || undefined,
      serviceLevel: filterServiceLevel || undefined,
      affiliation: filterAffiliation || undefined,
    });
  }, [page, rowsPerPage, filterZone, filterType, filterServiceLevel, filterAffiliation]);

  /* ── Debounced search ── */
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      doFetch({
        offset: 1,
        limit: rowsPerPage,
        search: value || undefined,
        zone: filterZone || undefined,
        subType: filterType || undefined,
        serviceLevel: filterServiceLevel || undefined,
        affiliation: filterAffiliation || undefined,
      });
    }, 800);
  };

  /* ── Clear filters ── */
  const handleClearFilters = () => {
    setSearch("");
    setFilterZone("");
    setFilterType("");
    setFilterServiceLevel("");
    setFilterAffiliation("");
    setPage(1);
    doFetch({
      offset: 1,
      limit: 10,
      search: undefined,
      zone: undefined,
      subType: undefined,
      serviceLevel: undefined,
      affiliation: undefined,
    });
  };

  /* ── Delete ── */
  const handleDeleteConfirm = async () => {
    if (!deletingHospital) return;
    try {
      setDeleteLoading(true);
      await hospitalStore.deleteHospital(deletingHospital.id);
      setDeleteModalOpen(false);
      setDeletingHospital(null);
      doFetch({ offset: page, limit: rowsPerPage });
    } catch (err) {
      setError("ไม่สามารถลบสถานพยาบาลได้");
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ── Pagination ── */
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  return (
    <Box sx={{ width: "100%", p: 0 }}>
      {/* ── Header ── */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "1.75rem", color: "#036245" }}>
          จัดการสถานพยาบาล
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => router.push("/management/hospital/TypeZone")}
            sx={{
              borderColor: "#036245",
              color: "#036245",
              textTransform: "none",
              fontWeight: 500,
              fontSize: "1rem",
              borderRadius: "8px",
              px: 3,
              py: 1,
              "&:hover": { bgcolor: "#f0fdf4", borderColor: "#036245" },
            }}
          >
            จัดการประเภท/โซนสถานพยาบาล
          </Button>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => router.push("/management/hospital/add")}
            sx={{
              bgcolor: "#036245",
              textTransform: "none",
              fontWeight: 500,
              fontSize: "1rem",
              borderRadius: "8px",
              px: 3,
              py: 1,
              "&:hover": { bgcolor: "#024d36" },
            }}
          >
            เพิ่มสถานพยาบาล
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Filters ── */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, mb: 2 }}>
          {/* ค้นหา */}
          <Box>
            <Typography sx={{ fontSize: "0.875rem", fontWeight: 500, mb: 0.5 }}>ค้นหา</Typography>
            <TextField
              placeholder="ค้นหาสถานพยาบาล"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#9CA3AF", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#fff",
                  borderRadius: 1,
                  "& fieldset": { borderColor: "#d1d5db" },
                  "&:hover fieldset": { borderColor: "#00AF75" },
                  "&.Mui-focused fieldset": { borderColor: "#00AF75" },
                },
              }}
            />
          </Box>

          {/* โซนสถานพยาบาล */}
          <Box>
            <Typography sx={{ fontSize: "0.875rem", fontWeight: 500, mb: 0.5 }}>
              โซนสถานพยาบาล <Typography component="span" sx={{ color: "#EF4444" }}>*</Typography>
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filterZone}
                onChange={(e) => { setFilterZone(e.target.value as number | ""); setPage(1); }}
                displayEmpty
                sx={selectSx}
                MenuProps={dropdownMenuProps}
              >
                <MenuItem value=""><em>เลือกโซนสถานพยาบาล</em></MenuItem>
                {zoneOptions.map((z: any) => (
                  <MenuItem key={z.id} value={z.id}>{z.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* ประเภทสถานพยาบาล */}
          <Box>
            <Typography sx={{ fontSize: "0.875rem", fontWeight: 500, mb: 0.5 }}>
              ประเภทสถานพยาบาล <Typography component="span" sx={{ color: "#EF4444" }}>*</Typography>
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value as number | ""); setPage(1); }}
                displayEmpty
                sx={selectSx}
                MenuProps={dropdownMenuProps}
              >
                <MenuItem value=""><em>เลือกประเภทสถานพยาบาล</em></MenuItem>
                {typeOptions.map((t: any) => (
                  <MenuItem key={t.id} value={t.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{t.name}</span>
                    {t.hospitalCount !== undefined && (
                      <Box component="span" sx={getCountBadgeSx(t.hospitalCount)}>
                        {t.hospitalCount} สถานพยาบาล
                      </Box>
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
          {/* ระดับการให้บริการ */}
          <Box>
            <Typography sx={{ fontSize: "0.875rem", fontWeight: 500, mb: 0.5 }}>
              ระดับการให้บริการ <Typography component="span" sx={{ color: "#EF4444" }}>*</Typography>
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filterServiceLevel}
                onChange={(e) => { setFilterServiceLevel(e.target.value); setPage(1); }}
                displayEmpty
                sx={selectSx}
                MenuProps={dropdownMenuProps}
              >
                <MenuItem value=""><em>เลือกระดับการให้บริการ</em></MenuItem>
                {SERVICE_LEVEL_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* สังกัดของสถานพยาบาล */}
          <Box>
            <Typography sx={{ fontSize: "0.875rem", fontWeight: 500, mb: 0.5 }}>
              สังกัดของสถานพยาบาล <Typography component="span" sx={{ color: "#EF4444" }}>*</Typography>
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filterAffiliation}
                onChange={(e) => { setFilterAffiliation(e.target.value); setPage(1); }}
                displayEmpty
                sx={selectSx}
                MenuProps={dropdownMenuProps}
              >
                <MenuItem value=""><em>เลือกสังกัดของสถานพยาบาล</em></MenuItem>
                {AFFILIATION_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* ล้างตัวกรอง */}
          <Box sx={{ display: "flex", alignItems: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={handleClearFilters}
              fullWidth
              sx={{
                borderColor: "#00AF75",
                color: "#00AF75",
                textTransform: "none",
                fontWeight: 500,
                fontSize: "1rem",
                borderRadius: "8px",
                height: 40,
                "&:hover": { bgcolor: "#f0fdf4", borderColor: "#00AF75" },
              }}
            >
              ล้างตัวกรอง
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ── Table ── */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
          <CircularProgress sx={{ color: "#00AF75" }} />
        </Box>
      ) : (
        <>
          <TableContainer sx={{ border: "1px solid #E5E7EB", borderRadius: "8px", overflow: "hidden" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#036245" }}>
                  {["ลำดับ", "รูปภาพ", "ชื่อสถานพยาบาล", "โซน", "ประเภท", "เบอร์โทรศัพท์", "จัดการข้อมูล"].map((header) => (
                    <TableCell
                      key={header}
                      sx={{
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        fontFamily: "Sarabun, sans-serif",
                        borderBottom: "none",
                        py: 1.5,
                        textAlign: header === "ลำดับ" || header === "จัดการข้อมูล" ? "center" : "left",
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {hospitals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: "center", py: 4, color: "#9CA3AF" }}>
                      ไม่พบข้อมูลสถานพยาบาล
                    </TableCell>
                  </TableRow>
                ) : (
                  hospitals.map((item: any, index: number) => (
                    <TableRow
                      key={item.id}
                      sx={{
                        "&:hover": { bgcolor: "#f9fafb" },
                        borderBottom: "1px solid #E5E7EB",
                      }}
                    >
                      {/* ลำดับ */}
                      <TableCell sx={{ textAlign: "center", fontFamily: "Sarabun, sans-serif", fontSize: "0.95rem" }}>
                        {(page - 1) * rowsPerPage + index + 1}
                      </TableCell>

                      {/* รูปภาพ */}
                      <TableCell sx={{ textAlign: "center" }}>
                        {item.image ? (
                          <Box
                            component="img"
                            src={item.image}
                            alt={item.name}
                            sx={{ width: 35, height: 35, borderRadius: "4px", objectFit: "cover" }}
                          />
                        ) : (
                          <Typography sx={{ fontSize: "0.8rem", color: "#9CA3AF" }}>ไม่มีรูปภาพ</Typography>
                        )}
                      </TableCell>

                      {/* ชื่อสถานพยาบาล */}
                      <TableCell sx={{ fontFamily: "Sarabun, sans-serif", fontSize: "0.95rem", fontWeight: 500 }}>
                        {item.name || "-"}
                      </TableCell>

                      {/* โซน */}
                      <TableCell sx={{ fontFamily: "Sarabun, sans-serif", fontSize: "0.95rem" }}>
                        {item.zone?.name || "ไม่มีโซน"}
                      </TableCell>

                      {/* ประเภท */}
                      <TableCell sx={{ fontFamily: "Sarabun, sans-serif", fontSize: "0.95rem" }}>
                        {item.subType?.name || "ไม่มีประเภท"}
                      </TableCell>

                      {/* เบอร์โทรศัพท์ */}
                      <TableCell sx={{ fontFamily: "Sarabun, sans-serif", fontSize: "0.95rem" }}>
                        {item.phone || "ไม่มีเบอร์โทรศัพท์"}
                      </TableCell>

                      {/* จัดการข้อมูล */}
                      <TableCell sx={{ textAlign: "center" }}>
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                          {/* Read (green) */}
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/management/hospital/read/${item.id}`)}
                            sx={{
                              bgcolor: "#00AF75",
                              color: "#fff",
                              width: 36,
                              height: 36,
                              "&:hover": { bgcolor: "#009966" },
                            }}
                          >
                            <ReadIcon />
                          </IconButton>

                          {/* Edit (yellow) */}
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/management/hospital/edit/${item.id}`)}
                            sx={{
                              bgcolor: "#EAB308",
                              color: "#fff",
                              width: 36,
                              height: 36,
                              "&:hover": { bgcolor: "#CA9A06" },
                            }}
                          >
                            <EditIcon />
                          </IconButton>

                          {/* Delete (red) */}
                          <IconButton
                            size="small"
                            onClick={() => {
                              setDeletingHospital(item);
                              setDeleteModalOpen(true);
                            }}
                            sx={{
                              bgcolor: "#EF4444",
                              color: "#fff",
                              width: 36,
                              height: 36,
                              "&:hover": { bgcolor: "#DC2626" },
                            }}
                          >
                            <TrashIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* ── Pagination ── */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2, px: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography sx={{ fontSize: "0.875rem", color: "#6B7280" }}>แถวต่อหน้า</Typography>
              <Select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                size="small"
                sx={{ minWidth: 70, ...selectSx }}
              >
                {[10, 25, 50].map((n) => (
                  <MenuItem key={n} value={n}>{n}</MenuItem>
                ))}
              </Select>
              <Typography sx={{ fontSize: "0.875rem", color: "#6B7280" }}>
                ทั้งหมด {totalCount.toLocaleString()} รายการ
              </Typography>
            </Box>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              shape="rounded"
              sx={{
                "& .MuiPaginationItem-root": {
                  fontFamily: "Sarabun, sans-serif",
                  "&.Mui-selected": { bgcolor: "#00AF75", color: "#fff" },
                },
              }}
            />
          </Box>
        </>
      )}

      {/* ── Delete confirmation modal ── */}
      <Dialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, color: "#EF4444" }}>
          ยืนยันการลบ
        </DialogTitle>
        <DialogContent>
          <Typography>
            คุณต้องการลบสถานพยาบาล &quot;{deletingHospital?.name}&quot; ใช่หรือไม่?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteModalOpen(false)}
            sx={{ color: "#6B7280", textTransform: "none" }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            disabled={deleteLoading}
            sx={{
              bgcolor: "#EF4444",
              textTransform: "none",
              "&:hover": { bgcolor: "#DC2626" },
            }}
          >
            {deleteLoading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "ลบ"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
