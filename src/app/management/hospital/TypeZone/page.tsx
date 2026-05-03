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
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  InputAdornment,
  Pagination,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import SaveIcon from "@mui/icons-material/Save";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useRouter } from "next/navigation";
import { useHospitalStore } from "@/stores/hospitalStore";

/* ── Section card header (green gradient like Nuxt) ── */
const SectionHeader = ({ title, tooltip }: { title: string; tooltip?: string }) => (
  <Box
    sx={{
      background: "linear-gradient(135deg, #c6f6d5 0%, #e6fffa 100%)",
      borderRadius: "8px 8px 0 0",
      px: 3,
      py: 1.5,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <Typography sx={{ fontWeight: 600, fontSize: "1.1rem", color: "#111827" }}>{title}</Typography>
    {tooltip && <HelpOutlineIcon sx={{ color: "#6B7280", fontSize: 22 }} />}
  </Box>
);

/* ── Shared select styling ── */
const selectSx = {
  bgcolor: "#F8FFFE",
  borderRadius: 1,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#00AF75" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#00AF75" },
};

/* ── Action icon SVGs ── */
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

/* ── Thai date formatter (พ.ศ.) ── */
const formatThaiDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    const day = String(d.getDate()).padStart(2, "0");
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const month = months[d.getMonth()];
    const year = d.getFullYear() + 543;
    const hour = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${year} ${hour}:${min} น.`;
  } catch {
    return "-";
  }
};

export default function TypeZonePage() {
  const router = useRouter();
  const hospitalStore = useHospitalStore();

  /* ── Tab state ── */
  const [activeTab, setActiveTab] = useState<"zone" | "type">("zone");

  /* ── Data state ── */
  const [items, setItems] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Modal state ── */
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [modalName, setModalName] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  /* Zone Admin fields */
  const [zoneUsername, setZoneUsername] = useState("");
  const [zoneEmail, setZoneEmail] = useState("");
  const [zonePassword, setZonePassword] = useState("");
  const [zoneConfirmPassword, setZoneConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /* Debounce ref */
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  /* ── Fetch data ── */
  const doFetch = async (tab: "zone" | "type", p: number, limit: number, searchVal: string) => {
    try {
      setLoading(true);
      setError(null);
      const params = { offset: p, limit, search: searchVal || undefined };

      if (tab === "zone") {
        const res = await hospitalStore.findCountZone(params);
        setItems(res?.hospitalZones || []);
        setTotalCount(res?.totalCount ?? 0);
      } else {
        const res = await hospitalStore.findCountType(params);
        setItems(res?.hospitalSubTypes || []);
        setTotalCount(res?.totalCount ?? 0);
      }
    } catch (err) {
      setError("ไม่สามารถโหลดข้อมูลได้");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Effects ── */
  useEffect(() => {
    setPage(1);
    setSearch("");
    doFetch(activeTab, 1, rowsPerPage, "");
  }, [activeTab]);

  useEffect(() => {
    doFetch(activeTab, page, rowsPerPage, search);
  }, [page, rowsPerPage]);

  /* ── Debounced search ── */
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      doFetch(activeTab, 1, rowsPerPage, value);
    }, 800);
  };

  /* ── CRUD handlers ── */
  const handleAdd = () => {
    setModalName("");
    setZoneUsername("");
    setZoneEmail("");
    setZonePassword("");
    setZoneConfirmPassword("");
    setShowPassword(false);
    setAddModalOpen(true);
  };

  const handleAddSave = async () => {
    if (!modalName.trim()) return;
    try {
      setModalLoading(true);
      if (activeTab === "zone") {
        const data: any = {
          name: modalName.trim(),
          superAdmin: {
            username: zoneUsername.trim(),
            password: zonePassword,
            email: zoneEmail.trim(),
          },
        };
        await hospitalStore.createZoneHospital(data);
      } else {
        await hospitalStore.createTypeHospital({ name: modalName.trim() });
      }
      setAddModalOpen(false);
      setModalName("");
      setPage(1);
      doFetch(activeTab, 1, rowsPerPage, search);
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || "";
      if (msg.includes("already exists")) {
        setError(msg);
      } else {
        setError(activeTab === "zone" ? "ไม่สามารถเพิ่มโซนได้" : "ไม่สามารถเพิ่มประเภทได้");
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setModalName(item.name || "");
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingItem || !modalName.trim()) return;
    try {
      setModalLoading(true);
      if (activeTab === "zone") {
        await hospitalStore.updateZoneHospital({ name: modalName.trim() }, editingItem.id);
      } else {
        await hospitalStore.updateTypeHospital({ name: modalName.trim() }, editingItem.id);
      }
      setEditModalOpen(false);
      setEditingItem(null);
      setModalName("");
      doFetch(activeTab, page, rowsPerPage, search);
    } catch (err) {
      console.error(err);
      setError("ไม่สามารถแก้ไขได้");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      setModalLoading(true);
      if (activeTab === "zone") {
        await hospitalStore.deleteZoneHospital(deletingItem.id);
      } else {
        await hospitalStore.deleteTypeHospital(deletingItem.id);
      }
      setDeleteModalOpen(false);
      setDeletingItem(null);
      doFetch(activeTab, page, rowsPerPage, search);
    } catch (err) {
      console.error(err);
      setError("ไม่สามารถลบได้");
    } finally {
      setModalLoading(false);
    }
  };

  /* ── Derived ── */
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const isZone = activeTab === "zone";
  const headers = isZone
    ? ["ลำดับ", "ชื่อโซนสถานพยาบาล", "สร้างเมื่อ", "อัพเดตล่าสุด", "จัดการข้อมูล"]
    : ["ลำดับ", "ชื่อประเภทสถานพยาบาล", "สร้างเมื่อ", "อัพเดตล่าสุด", "จัดการข้อมูล"];

  return (
    <Box sx={{ width: "100%", p: 0 }}>
      {/* ── Header with back button ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <IconButton
          onClick={() => router.push("/management/hospital")}
          sx={{
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            p: 1,
            "&:hover": { bgcolor: "#f3f4f6" },
          }}
        >
          <ArrowBackIcon sx={{ color: "#111827" }} />
        </IconButton>
        <Typography sx={{ fontWeight: 700, fontSize: "1.75rem", color: "#036245" }}>
          จัดการประเภท/โซนสถานพยาบาล
        </Typography>
      </Box>

      {/* ── Breadcrumb ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <Typography
          sx={{ fontSize: "0.875rem", color: "#036245", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
          onClick={() => router.push("/management/hospital")}
        >
          ตั้งค่าสถานพยาบาล
        </Typography>
        <Typography sx={{ fontSize: "0.875rem", color: "#9CA3AF" }}>&gt;</Typography>
        <Typography sx={{ fontSize: "0.875rem", color: "#6B7280" }}>
          จัดการประเภท/โซนสถานพยาบาล
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Tabs ── */}
      <Box sx={{ display: "flex", borderBottom: "1px solid #d1d5db", bgcolor: "#fff" }}>
        <Box
          onClick={() => setActiveTab("zone")}
          sx={{
            width: 192,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 2,
            py: 1.5,
            cursor: "pointer",
            borderTopLeftRadius: "8px",
            borderTopRightRadius: "8px",
            border: isZone ? "1px solid #d1d5db" : "1px solid rgba(209,213,219,0.3)",
            borderBottom: isZone ? "none" : "1px solid #d1d5db",
            bgcolor: isZone ? "#fff" : "#f9fafb",
            mb: isZone ? "-1px" : 0,
            transition: "all 0.2s",
            "&:hover": { bgcolor: isZone ? "#fff" : "#e5e7eb" },
          }}
        >
          <Typography
            sx={{
              fontSize: "1rem",
              fontWeight: isZone ? 600 : 500,
              color: isZone ? "#036245" : "#374151",
              fontFamily: "Sarabun, sans-serif",
            }}
          >
            โซนสถานพยาบาล
          </Typography>
        </Box>
        <Box
          onClick={() => setActiveTab("type")}
          sx={{
            width: 192,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 2,
            py: 1.5,
            cursor: "pointer",
            borderTopLeftRadius: "8px",
            borderTopRightRadius: "8px",
            border: !isZone ? "1px solid #d1d5db" : "1px solid rgba(209,213,219,0.3)",
            borderBottom: !isZone ? "none" : "1px solid #d1d5db",
            bgcolor: !isZone ? "#fff" : "#f9fafb",
            mb: !isZone ? "-1px" : 0,
            transition: "all 0.2s",
            "&:hover": { bgcolor: !isZone ? "#fff" : "#e5e7eb" },
          }}
        >
          <Typography
            sx={{
              fontSize: "1rem",
              fontWeight: !isZone ? 600 : 500,
              color: !isZone ? "#036245" : "#374151",
              fontFamily: "Sarabun, sans-serif",
            }}
          >
            ประเภทสถานพยาบาล
          </Typography>
        </Box>
      </Box>

      {/* ── Panel content ── */}
      <Box sx={{ border: "1px solid #E5E7EB", borderTop: "none", borderRadius: "0 0 8px 8px", p: 3, bgcolor: "#fff" }}>
        {/* Search label */}
        <Typography sx={{ fontSize: "0.875rem", fontWeight: 500, mb: 0.5, ml: 1 }}>ค้นหา</Typography>

        {/* Search + Add button row */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
          <TextField
            placeholder={isZone ? "ค้นหาโซนสถานพยาบาล" : "ค้นหาประเภทสถานพยาบาล"}
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
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleAdd}
            sx={{
              bgcolor: "#036245",
              textTransform: "none",
              fontWeight: 500,
              fontSize: "1rem",
              borderRadius: "8px",
              px: 3,
              py: 1,
              whiteSpace: "nowrap",
              "&:hover": { bgcolor: "#024d36" },
            }}
          >
            {isZone ? "เพิ่มโซน" : "เพิ่มประเภท"}
          </Button>
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
                    {headers.map((header) => (
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
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: "center", py: 4, color: "#9CA3AF" }}>
                        ไม่พบข้อมูล
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item: any, index: number) => (
                      <TableRow
                        key={item.id}
                        sx={{ "&:hover": { bgcolor: "#f9fafb" }, borderBottom: "1px solid #E5E7EB" }}
                      >
                        {/* ลำดับ */}
                        <TableCell sx={{ textAlign: "center", fontFamily: "Sarabun, sans-serif", fontSize: "0.95rem" }}>
                          {(page - 1) * rowsPerPage + index + 1}
                        </TableCell>

                        {/* ชื่อ */}
                        <TableCell sx={{ fontFamily: "Sarabun, sans-serif", fontSize: "0.95rem", fontWeight: 500, textAlign: "center" }}>
                          {item.name || "-"}
                        </TableCell>

                        {/* สร้างเมื่อ */}
                        <TableCell sx={{ fontFamily: "Sarabun, sans-serif", fontSize: "0.95rem", textAlign: "center" }}>
                          {formatThaiDate(item.createdAt)}
                        </TableCell>

                        {/* อัพเดตล่าสุด */}
                        <TableCell sx={{ fontFamily: "Sarabun, sans-serif", fontSize: "0.95rem", textAlign: "center" }}>
                          {formatThaiDate(item.updatedAt)}
                        </TableCell>

                        {/* จัดการข้อมูล */}
                        <TableCell sx={{ textAlign: "center" }}>
                          <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                            {/* Edit (yellow) */}
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(item)}
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
                              onClick={() => { setDeletingItem(item); setDeleteModalOpen(true); }}
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
      </Box>

      {/* ── Add Modal (Nuxt style) ── */}
      <Dialog
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "12px", overflow: "hidden" } }}
      >
        {/* Green header */}
        <Box sx={{ bgcolor: "#036245", px: 3, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1.25rem" }}>
            {isZone ? "เพิ่มโซนใหม่" : "เพิ่มประเภทใหม่"}
          </Typography>
          <IconButton onClick={() => setAddModalOpen(false)} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          {/* Section: ข้อมูลโซน / ข้อมูลประเภท */}
          <Box sx={{ border: "1px solid #E5E7EB", borderRadius: "8px", overflow: "hidden", mb: isZone ? 3 : 0 }}>
            <SectionHeader title={isZone ? "ข้อมูลโซน" : "ข้อมูลประเภท"} />
            <Box sx={{ p: 3 }}>
              <Typography sx={{ fontSize: "0.875rem", fontWeight: 500, mb: 0.5 }}>
                {isZone ? "ชื่อโซน" : "ชื่อประเภท"} <Typography component="span" sx={{ color: "#EF4444" }}>*</Typography>
              </Typography>
              <TextField
                autoFocus
                fullWidth
                size="small"
                placeholder={isZone ? "ตั้งชื่อโซน" : "ตั้งชื่อประเภท"}
                value={modalName}
                onChange={(e) => setModalName(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#d1d5db" },
                    "&:hover fieldset": { borderColor: "#00AF75" },
                    "&.Mui-focused fieldset": { borderColor: "#00AF75" },
                  },
                }}
              />
            </Box>
          </Box>

          {/* Section: Zone Admin (only for zone) */}
          {isZone && (
            <Box sx={{ border: "1px solid #E5E7EB", borderRadius: "8px", overflow: "hidden" }}>
              <SectionHeader title="ข้อมูลบัญชีผู้ใช้ (Zone Admin)" tooltip="info" />
              <Box sx={{ p: 3, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                {/* Username */}
                <Box>
                  <Typography sx={{ fontSize: "0.875rem", fontWeight: 500, mb: 0.5 }}>
                    Username <Typography component="span" sx={{ color: "#EF4444" }}>*</Typography>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="กรุณากรอก Username"
                    value={zoneUsername}
                    onChange={(e) => setZoneUsername(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "#d1d5db" },
                        "&:hover fieldset": { borderColor: "#00AF75" },
                        "&.Mui-focused fieldset": { borderColor: "#00AF75" },
                      },
                    }}
                  />
                </Box>

                {/* Email */}
                <Box>
                  <Typography sx={{ fontSize: "0.875rem", fontWeight: 500, mb: 0.5 }}>
                    Email <Typography component="span" sx={{ color: "#EF4444" }}>*</Typography>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="กรุณากรอกอีเมล"
                    value={zoneEmail}
                    onChange={(e) => setZoneEmail(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "#d1d5db" },
                        "&:hover fieldset": { borderColor: "#00AF75" },
                        "&.Mui-focused fieldset": { borderColor: "#00AF75" },
                      },
                    }}
                  />
                </Box>

                {/* Password */}
                <Box>
                  <Typography sx={{ fontSize: "0.875rem", fontWeight: 500, mb: 0.5 }}>
                    รหัสผ่านใหม่ <Typography component="span" sx={{ color: "#EF4444" }}>*</Typography>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type={showPassword ? "text" : "password"}
                    placeholder="รหัสผ่านใหม่"
                    value={zonePassword}
                    onChange={(e) => setZonePassword(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <VisibilityOffIcon sx={{ fontSize: 20 }} /> : <VisibilityIcon sx={{ fontSize: 20 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "#d1d5db" },
                        "&:hover fieldset": { borderColor: "#00AF75" },
                        "&.Mui-focused fieldset": { borderColor: "#00AF75" },
                      },
                    }}
                  />
                </Box>

                {/* Confirm Password */}
                <Box>
                  <Typography sx={{ fontSize: "0.875rem", fontWeight: 500, mb: 0.5 }}>
                    ยืนยันรหัสผ่านใหม่ <Typography component="span" sx={{ color: "#EF4444" }}>*</Typography>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type={showPassword ? "text" : "password"}
                    placeholder="ยืนยันรหัสผ่านใหม่"
                    value={zoneConfirmPassword}
                    onChange={(e) => setZoneConfirmPassword(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <VisibilityOffIcon sx={{ fontSize: 20 }} /> : <VisibilityIcon sx={{ fontSize: 20 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "#d1d5db" },
                        "&:hover fieldset": { borderColor: "#00AF75" },
                        "&.Mui-focused fieldset": { borderColor: "#00AF75" },
                      },
                    }}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        {/* Footer */}
        <Box sx={{ display: "flex", justifyContent: "space-between", px: 3, py: 2, borderTop: "1px solid #E5E7EB" }}>
          <Button
            onClick={() => setAddModalOpen(false)}
            variant="outlined"
            startIcon={<ArrowBackIosNewIcon sx={{ fontSize: 16 }} />}
            sx={{
              borderColor: "#036245",
              color: "#036245",
              textTransform: "none",
              fontWeight: 500,
              borderRadius: "8px",
              "&:hover": { bgcolor: "#f0fdf4", borderColor: "#036245" },
            }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleAddSave}
            variant="contained"
            disabled={modalLoading || !modalName.trim()}
            startIcon={modalLoading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : <SaveIcon />}
            sx={{
              bgcolor: "#036245",
              textTransform: "none",
              fontWeight: 500,
              borderRadius: "8px",
              "&:hover": { bgcolor: "#024d36" },
            }}
          >
            บันทึกข้อมูล
          </Button>
        </Box>
      </Dialog>

      {/* ── Edit Modal (Nuxt style) ── */}
      <Dialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "12px", overflow: "hidden" } }}
      >
        {/* Green header */}
        <Box sx={{ bgcolor: "#036245", px: 3, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1.25rem" }}>
            {isZone ? "แก้ไขโซนสถานพยาบาล" : "แก้ไขประเภทสถานพยาบาล"}
          </Typography>
          <IconButton onClick={() => setEditModalOpen(false)} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ border: "1px solid #E5E7EB", borderRadius: "8px", overflow: "hidden" }}>
            <SectionHeader title={isZone ? "ข้อมูลโซน" : "ข้อมูลประเภท"} />
            <Box sx={{ p: 3 }}>
              <Typography sx={{ fontSize: "0.875rem", fontWeight: 500, mb: 0.5 }}>
                {isZone ? "ชื่อโซน" : "ชื่อประเภท"} <Typography component="span" sx={{ color: "#EF4444" }}>*</Typography>
              </Typography>
              <TextField
                autoFocus
                fullWidth
                size="small"
                placeholder={isZone ? "ตั้งชื่อโซน" : "ตั้งชื่อประเภท"}
                value={modalName}
                onChange={(e) => setModalName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleEditSave(); }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#d1d5db" },
                    "&:hover fieldset": { borderColor: "#00AF75" },
                    "&.Mui-focused fieldset": { borderColor: "#00AF75" },
                  },
                }}
              />
            </Box>
          </Box>
        </DialogContent>

        {/* Footer */}
        <Box sx={{ display: "flex", justifyContent: "space-between", px: 3, py: 2, borderTop: "1px solid #E5E7EB" }}>
          <Button
            onClick={() => setEditModalOpen(false)}
            variant="outlined"
            startIcon={<ArrowBackIosNewIcon sx={{ fontSize: 16 }} />}
            sx={{
              borderColor: "#036245",
              color: "#036245",
              textTransform: "none",
              fontWeight: 500,
              borderRadius: "8px",
              "&:hover": { bgcolor: "#f0fdf4", borderColor: "#036245" },
            }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            disabled={modalLoading || !modalName.trim()}
            startIcon={modalLoading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : <SaveIcon />}
            sx={{
              bgcolor: "#036245",
              textTransform: "none",
              fontWeight: 500,
              borderRadius: "8px",
              "&:hover": { bgcolor: "#024d36" },
            }}
          >
            บันทึกข้อมูล
          </Button>
        </Box>
      </Dialog>

      {/* ── Delete confirmation modal ── */}
      <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: "#EF4444" }}>
          ยืนยันการลบ
        </DialogTitle>
        <DialogContent>
          <Typography>
            คุณต้องการลบ &quot;{deletingItem?.name}&quot; ใช่หรือไม่?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteModalOpen(false)} sx={{ color: "#6B7280", textTransform: "none" }}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            disabled={modalLoading}
            sx={{ bgcolor: "#EF4444", textTransform: "none", "&:hover": { bgcolor: "#DC2626" } }}
          >
            {modalLoading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "ลบ"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
