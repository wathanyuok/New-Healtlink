"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
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
  DialogActions,
  InputAdornment,
  Pagination,
  Switch,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useDoctorBranchStore } from "@/stores/doctorBranchStore";
import { useHospitalStore } from "@/stores/hospitalStore";

/* ── Section card header (green gradient like Nuxt) ── */
const SectionHeader = ({ title }: { title: string }) => (
  <Box
    sx={{
      background: "linear-gradient(135deg, #c6f6d5 0%, #e6fffa 100%)",
      borderRadius: "8px 8px 0 0",
      px: 3,
      py: 1.5,
      display: "flex",
      alignItems: "center",
    }}
  >
    <Typography sx={{ fontWeight: 600, fontSize: "1.1rem", color: "#111827" }}>{title}</Typography>
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

/* ── Count badge colors matching Nuxt thresholds ── */
const getCountBadgeSx = (count: number) => {
  const base = { borderRadius: "9999px", px: 1.2, py: 0.2, fontSize: "0.8rem", fontWeight: 500, whiteSpace: "nowrap" as const };
  if (count >= 50) return { ...base, bgcolor: "#dcfce7", color: "#166534" };
  if (count >= 20) return { ...base, bgcolor: "#fef9c3", color: "#4b5563" };
  if (count >= 5) return { ...base, bgcolor: "#dbeafe", color: "#1d4ed8" };
  return { ...base, bgcolor: "#f3f4f6", color: "#4b5563" };
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

/* ── Patient status icons (green checkmark / gray dash) ── */
const PatientStatusIcons = ({ isOpd, isIpd, isEr }: { isOpd: boolean; isIpd: boolean; isEr: boolean }) => (
  <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
    {[
      { label: "OPD", active: isOpd },
      { label: "IPD", active: isIpd },
      { label: "ER", active: isEr },
    ].map((p) => (
      <Box key={p.label} sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
        {p.active ? (
          <CheckCircleIcon sx={{ color: "#22c55e", fontSize: 18 }} />
        ) : (
          <Box sx={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Box sx={{ width: 10, height: 2, bgcolor: "#d1d5db", borderRadius: 1 }} />
          </Box>
        )}
        <Typography variant="caption" sx={{ color: p.active ? "#111827" : "#9ca3af", fontSize: "0.8rem" }}>
          {p.label}
        </Typography>
      </Box>
    ))}
  </Box>
);

/* ── Dropdown MenuProps ── */
const dropdownMenuProps = { PaperProps: { sx: { maxHeight: 240 } } };

/* ── Patient options for filter & form checkboxes ── */
const patientOptions = [
  { value: "OPD", label: "OPD" },
  { value: "IPD", label: "IPD" },
  { value: "ER", label: "ER" },
];

export default function DocterBranchPage() {
  const branchStore = useDoctorBranchStore();
  const hospitalStore = useHospitalStore();

  /* ── Data state ── */
  const [items, setItems] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Filter state ── */
  const [search, setSearch] = useState("");
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedHospital, setSelectedHospital] = useState<string>("");
  const [patientFilters, setPatientFilters] = useState<string[]>([]);

  /* ── Options state ── */
  const [zoneOptions, setZoneOptions] = useState<any[]>([]);
  const [typeOptions, setTypeOptions] = useState<any[]>([]);
  const [hospitalOptions, setHospitalOptions] = useState<any[]>([]);

  /* ── Modal state: Add ── */
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "", phone: "", phone2: "",
    isOpd: false, isIpd: false, isEr: false,
    zoneId: "", subTypeId: "", hospitalId: "",
  });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});

  /* ── Modal state: Edit ── */
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  /* ── Modal state: Delete ── */
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<any>(null);

  const [modalLoading, setModalLoading] = useState(false);

  /* ── Modal options ── */
  const [modalZoneOptions, setModalZoneOptions] = useState<any[]>([]);
  const [modalTypeOptions, setModalTypeOptions] = useState<any[]>([]);
  const [modalHospitalOptions, setModalHospitalOptions] = useState<any[]>([]);

  /* Debounce ref */
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  /* ── Fetch filter options ── */
  const fetchFilterOptions = useCallback(async () => {
    try {
      const [zonesRes, typesRes, hospitalsRes] = await Promise.all([
        hospitalStore.getOptionHosZone(),
        hospitalStore.getOptionHosType(),
        hospitalStore.getOptionHospital(),
      ]);
      setZoneOptions((zonesRes as any)?.hospitalZones || zonesRes || []);
      setTypeOptions(typesRes?.hospitalSubTypes || []);
      setHospitalOptions(hospitalsRes?.hospitals || []);
    } catch (err) {
      console.error("Error fetching options:", err);
    }
  }, []);

  const fetchFilteredHospitals = useCallback(async (zone?: string, subType?: string) => {
    try {
      const params: any = {};
      if (zone) params.zone = zone;
      if (subType) params.subType = subType;
      const res = await hospitalStore.getOptionHospital(params);
      setHospitalOptions(res?.hospitals || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  /* ── Fetch main data ── */
  const doFetch = useCallback(async (
    p: number, limit: number, searchVal: string,
    zone: string, subType: string, hospital: string, patients: string[]
  ) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { offset: p, limit, search: searchVal || undefined };
      if (zone) params.zone = zone;
      if (subType) params.subType = subType;
      if (hospital) params.hospital = hospital;
      if (patients.includes("OPD")) params.isOpd = true;
      if (patients.includes("IPD")) params.isIpd = true;
      if (patients.includes("ER")) params.isEr = true;

      const res = await branchStore.findAndCountDoctorBranch(params);
      setItems(res?.doctorBranches || []);
      setTotalCount(res?.totalCount ?? 0);
    } catch (err) {
      setError("ไม่สามารถโหลดข้อมูลสาขาที่ส่งต่อได้");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Initial load ── */
  useEffect(() => {
    fetchFilterOptions();
    doFetch(1, rowsPerPage, "", "", "", "", []);
  }, []);

  /* ── Refetch ── */
  const refetch = useCallback(() => {
    doFetch(page, rowsPerPage, search, selectedZone, selectedType, selectedHospital, patientFilters);
  }, [page, rowsPerPage, search, selectedZone, selectedType, selectedHospital, patientFilters]);

  useEffect(() => { refetch(); }, [page, rowsPerPage, selectedZone, selectedType, selectedHospital, patientFilters]);

  /* ── Debounced search ── */
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      doFetch(1, rowsPerPage, value, selectedZone, selectedType, selectedHospital, patientFilters);
    }, 800);
  };

  /* ── Zone cascades ── */
  const handleZoneFilterChange = (val: string) => {
    setSelectedZone(val); setSelectedType(""); setSelectedHospital(""); setPage(1);
    fetchFilteredHospitals(val, "");
  };
  const handleTypeFilterChange = (val: string) => {
    setSelectedType(val); setSelectedHospital(""); setPage(1);
    fetchFilteredHospitals(selectedZone, val);
  };

  /* ── Reset filters ── */
  const resetFilters = () => {
    setSelectedZone(""); setSelectedType(""); setSelectedHospital("");
    setPatientFilters([]); setSearch(""); setPage(1);
    doFetch(1, rowsPerPage, "", "", "", "", []);
    fetchFilterOptions();
  };

  const togglePatientFilter = (val: string) => {
    setPatientFilters((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
    setPage(1);
  };

  /* ── Toggle isActive ── */
  const handleToggleActive = async (item: any) => {
    // Optimistic update — flip locally first so the UI doesn't jump
    setItems((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, isActive: !row.isActive } : row))
    );
    try {
      await branchStore.updateDoctorBranch(item.id, { isActive: !item.isActive });
    } catch (err) {
      console.error(err);
      // Revert on failure
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, isActive: item.isActive } : row))
      );
    }
  };

  const getDisplayNo = (index: number) => (page - 1) * rowsPerPage + index + 1;
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  /* ════════════════════════════════════════
     MODAL OPTIONS
     ════════════════════════════════════════ */
  const fetchModalOptions = async () => {
    try {
      const [z, t, h] = await Promise.all([
        hospitalStore.getOptionHosZone(),
        hospitalStore.getOptionHosType(),
        hospitalStore.getOptionHospital(),
      ]);
      setModalZoneOptions((z as any)?.hospitalZones || z || []);
      setModalTypeOptions(t?.hospitalSubTypes || []);
      setModalHospitalOptions(h?.hospitals || []);
    } catch (e) { console.error(e); }
  };

  /* ════════════════════════════════════════
     ADD MODAL
     ════════════════════════════════════════ */
  const handleOpenAdd = () => {
    setAddForm({ name: "", phone: "", phone2: "", isOpd: false, isIpd: false, isEr: false, zoneId: "", subTypeId: "", hospitalId: "" });
    setAddErrors({});
    fetchModalOptions();
    setAddModalOpen(true);
  };

  const handleAddZoneChange = async (val: string) => {
    setAddForm((p) => ({ ...p, zoneId: val, subTypeId: "", hospitalId: "" }));
    try {
      const t = await hospitalStore.getOptionHosType({ zone: val || undefined });
      setModalTypeOptions(t?.hospitalSubTypes || []);
      setModalHospitalOptions([]);
    } catch (e) { console.error(e); }
  };

  const handleAddTypeChange = async (val: string) => {
    setAddForm((p) => ({ ...p, subTypeId: val, hospitalId: "" }));
    try {
      const h = await hospitalStore.getOptionHospital({ zone: addForm.zoneId || undefined, subType: val || undefined });
      setModalHospitalOptions(h?.hospitals || []);
    } catch (e) { console.error(e); }
  };

  const validateForm = (form: any) => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "กรุณากรอกชื่อสาขา/แผนก";
    if (!form.phone.trim()) errs.phone = "กรุณากรอกเบอร์โทรศัพท์";
    if (!form.isOpd && !form.isIpd && !form.isEr) errs.patients = "กรุณาเลือกประเภทผู้ป่วยอย่างน้อย 1 ประเภท";
    return errs;
  };

  const handleAddSave = async () => {
    const errs = validateForm(addForm);
    setAddErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      setModalLoading(true);
      const data: any = {
        name: addForm.name.trim(),
        phone: addForm.phone.trim(),
        phone2: addForm.phone2.trim() || "ไม่ระบุ",
        isOpd: addForm.isOpd, isIpd: addForm.isIpd, isEr: addForm.isEr,
      };
      if (addForm.zoneId) data.zone = Number(addForm.zoneId);
      if (addForm.subTypeId) data.subtype = Number(addForm.subTypeId);
      if (addForm.hospitalId) data.hospital = Number(addForm.hospitalId);
      await branchStore.createDoctorBranch(data);
      setAddModalOpen(false);
      refetch();
    } catch (err) { console.error(err); }
    finally { setModalLoading(false); }
  };

  /* ════════════════════════════════════════
     EDIT MODAL
     ════════════════════════════════════════ */
  const handleOpenEdit = (item: any) => {
    setEditForm({
      id: item.id,
      name: item.name || "",
      phone: item.phone || "",
      phone2: item.phone2 || "",
      isOpd: !!item.isOpd, isIpd: !!item.isIpd, isEr: !!item.isEr,
      zoneId: item.hospital?.zone?.id ? String(item.hospital.zone.id) : "",
      subTypeId: item.hospital?.subType?.id ? String(item.hospital.subType.id) : "",
      hospitalId: item.hospital?.id ? String(item.hospital.id) : "",
    });
    setEditErrors({});
    fetchModalOptions();
    setEditModalOpen(true);
  };

  const handleEditZoneChange = async (val: string) => {
    setEditForm((p: any) => ({ ...p, zoneId: val, subTypeId: "", hospitalId: "" }));
    try {
      const t = await hospitalStore.getOptionHosType({ zone: val || undefined });
      setModalTypeOptions(t?.hospitalSubTypes || []);
      setModalHospitalOptions([]);
    } catch (e) { console.error(e); }
  };

  const handleEditTypeChange = async (val: string) => {
    setEditForm((p: any) => ({ ...p, subTypeId: val, hospitalId: "" }));
    try {
      const h = await hospitalStore.getOptionHospital({ zone: editForm?.zoneId || undefined, subType: val || undefined });
      setModalHospitalOptions(h?.hospitals || []);
    } catch (e) { console.error(e); }
  };

  const handleEditSave = async () => {
    if (!editForm) return;
    const errs = validateForm(editForm);
    setEditErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      setModalLoading(true);
      const data: any = {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        phone2: editForm.phone2.trim() || "ไม่ระบุ",
        isOpd: editForm.isOpd, isIpd: editForm.isIpd, isEr: editForm.isEr,
      };
      if (editForm.zoneId) data.zone = Number(editForm.zoneId);
      if (editForm.subTypeId) data.subtype = Number(editForm.subTypeId);
      if (editForm.hospitalId) data.hospital = Number(editForm.hospitalId);
      await branchStore.updateDoctorBranch(editForm.id, data);
      setEditModalOpen(false);
      refetch();
    } catch (err) { console.error(err); }
    finally { setModalLoading(false); }
  };

  /* ════════════════════════════════════════
     DELETE MODAL
     ════════════════════════════════════════ */
  const handleOpenDelete = (item: any) => { setDeletingItem(item); setDeleteModalOpen(true); };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      setModalLoading(true);
      await branchStore.deleteDoctorBranch(deletingItem.id);
      setDeleteModalOpen(false); setDeletingItem(null);
      refetch();
    } catch (err) { console.error(err); }
    finally { setModalLoading(false); }
  };

  /* ════════════════════════════════════════
     SHARED FORM FIELDS (Add / Edit)
     ════════════════════════════════════════ */
  const renderBranchFormFields = (
    form: any,
    setForm: (fn: (prev: any) => any) => void,
    errors: Record<string, string>,
    onZoneChange: (val: string) => void,
    onTypeChange: (val: string) => void
  ) => (
    <>
      {/* Section: ข้อมูลเบื้องต้น (zone/type/hospital) */}
      <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 2, mb: 2 }}>
        <SectionHeader title="ข้อมูลเบื้องต้น" />
        <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>โซนพยาบาล</Typography>
              <Select fullWidth size="small" displayEmpty value={form.zoneId} onChange={(e) => onZoneChange(e.target.value)} sx={selectSx} MenuProps={dropdownMenuProps}>
                <MenuItem value=""><em style={{ color: "#9ca3af" }}>เลือกโซนพยาบาล</em></MenuItem>
                {modalZoneOptions.map((z: any) => (<MenuItem key={z.id} value={String(z.id)}>{z.name}</MenuItem>))}
              </Select>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>ประเภทสถานพยาบาล</Typography>
              <Select fullWidth size="small" displayEmpty value={form.subTypeId} onChange={(e) => onTypeChange(e.target.value)} disabled={!form.zoneId} sx={selectSx} MenuProps={dropdownMenuProps}>
                <MenuItem value=""><em style={{ color: "#9ca3af" }}>เลือกประเภทสถานพยาบาล</em></MenuItem>
                {modalTypeOptions.map((t: any) => (
                  <MenuItem key={t.id} value={String(t.id)} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{t.name}</span>
                    {t.hospitalCount !== undefined && (<Box component="span" sx={getCountBadgeSx(t.hospitalCount)}>{t.hospitalCount} สถานพยาบาล</Box>)}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>สถานพยาบาล</Typography>
            <Select fullWidth size="small" displayEmpty value={form.hospitalId} onChange={(e) => setForm((p: any) => ({ ...p, hospitalId: e.target.value }))} disabled={!form.subTypeId} sx={selectSx} MenuProps={dropdownMenuProps}>
              <MenuItem value=""><em style={{ color: "#9ca3af" }}>เลือกสถานพยาบาล</em></MenuItem>
              {modalHospitalOptions.map((h: any) => (<MenuItem key={h.id} value={String(h.id)}>{h.name}</MenuItem>))}
            </Select>
          </Box>
        </Box>
      </Box>

      {/* Section: ข้อมูลสาขา/แผนก */}
      <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 2 }}>
        <SectionHeader title="ข้อมูลเบื้องต้น" />
        <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "3fr 2fr 1fr" }, gap: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>ชื่อสาขา/แผนกที่ส่งต่อ <span style={{ color: "red" }}>*</span></Typography>
              <TextField fullWidth size="small" placeholder="ตั้งชื่อ" value={form.name} onChange={(e) => setForm((p: any) => ({ ...p, name: e.target.value }))} error={!!errors.name} helperText={errors.name} />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>เบอร์โทรศัพท์ <span style={{ color: "red" }}>*</span></Typography>
              <TextField fullWidth size="small" placeholder="เบอร์โทรศัพท์ติดต่อ" value={form.phone} onChange={(e) => setForm((p: any) => ({ ...p, phone: e.target.value }))} error={!!errors.phone} helperText={errors.phone} />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>ต่อ</Typography>
              <TextField fullWidth size="small" placeholder="ถ้ามี" value={form.phone2} onChange={(e) => setForm((p: any) => ({ ...p, phone2: e.target.value }))} />
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>ใช้สำหรับผู้ป่วย <span style={{ color: "red" }}>*</span></Typography>
            <FormGroup row>
              <FormControlLabel control={<Checkbox checked={form.isOpd} onChange={(e) => setForm((p: any) => ({ ...p, isOpd: e.target.checked }))} size="small" sx={{ "&.Mui-checked": { color: "#00AF75" } }} />} label="OPD" />
              <FormControlLabel control={<Checkbox checked={form.isIpd} onChange={(e) => setForm((p: any) => ({ ...p, isIpd: e.target.checked }))} size="small" sx={{ "&.Mui-checked": { color: "#00AF75" } }} />} label="IPD" />
              <FormControlLabel control={<Checkbox checked={form.isEr} onChange={(e) => setForm((p: any) => ({ ...p, isEr: e.target.checked }))} size="small" sx={{ "&.Mui-checked": { color: "#00AF75" } }} />} label="ER" />
            </FormGroup>
            {errors.patients && <Typography color="error" variant="caption">{errors.patients}</Typography>}
          </Box>
        </Box>
      </Box>
    </>
  );

  /* ════════════════════════════════════════
     RENDER — Main Page
     ════════════════════════════════════════ */
  return (
    <Box sx={{ width: "100%" }}>
      {/* ── Title bar ── */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#036245" }}>
          จัดการข้อมูลสาขาที่ส่งต่อ
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AddCircleOutlineIcon />}
          onClick={handleOpenAdd}
          sx={{ borderColor: "#00AF75", color: "#00AF75", fontWeight: 600, "&:hover": { borderColor: "#009966", bgcolor: "#f0fdf4" } }}
        >
          เพิ่มข้อมูล
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Filter panel ── */}
      <Box sx={{ bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: 2, p: 2.5 }}>
        {/* Filters grid: search + zone + type + hospital */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr 1fr" }, gap: 2, mb: 2 }}>
          {/* Search */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>ค้นหา</Typography>
            <TextField
              fullWidth size="small" placeholder="ค้นหาชื่อ,เบอร์โทร"
              value={search} onChange={(e) => handleSearchChange(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "#9ca3af" }} /></InputAdornment> }}
            />
          </Box>
          {/* Zone */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>โซนสถานพยาบาล</Typography>
            <Select fullWidth size="small" displayEmpty value={selectedZone} onChange={(e) => handleZoneFilterChange(e.target.value)} sx={selectSx} MenuProps={dropdownMenuProps}>
              <MenuItem value=""><em style={{ color: "#9ca3af" }}>เลือกโซนสถานพยาบาล</em></MenuItem>
              {zoneOptions.map((z: any) => (<MenuItem key={z.id} value={String(z.id)}>{z.name}</MenuItem>))}
            </Select>
          </Box>
          {/* Type with count badges */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>ประเภทสถานพยาบาล</Typography>
            <Select fullWidth size="small" displayEmpty value={selectedType} onChange={(e) => handleTypeFilterChange(e.target.value)} sx={selectSx} MenuProps={dropdownMenuProps}>
              <MenuItem value=""><em style={{ color: "#9ca3af" }}>เลือกประเภทสถานพยาบาล</em></MenuItem>
              {typeOptions.map((t: any) => (
                <MenuItem key={t.id} value={String(t.id)} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{t.name}</span>
                  {t.hospitalCount !== undefined && (<Box component="span" sx={getCountBadgeSx(t.hospitalCount)}>{t.hospitalCount} สถานพยาบาล</Box>)}
                </MenuItem>
              ))}
            </Select>
          </Box>
          {/* Hospital */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>สถานพยาบาล</Typography>
            <Select fullWidth size="small" displayEmpty value={selectedHospital} onChange={(e) => { setSelectedHospital(e.target.value); setPage(1); }} sx={selectSx} MenuProps={dropdownMenuProps}>
              <MenuItem value=""><em style={{ color: "#9ca3af" }}>เลือกสถานพยาบาล</em></MenuItem>
              {hospitalOptions.map((h: any) => (<MenuItem key={h.id} value={String(h.id)}>{h.name}</MenuItem>))}
            </Select>
          </Box>
        </Box>

        {/* Patient checkboxes + reset */}
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>ใช้สำหรับผู้ป่วย</Typography>
            <FormGroup row>
              {patientOptions.map((p) => (
                <FormControlLabel
                  key={p.value}
                  control={<Checkbox checked={patientFilters.includes(p.value)} onChange={() => togglePatientFilter(p.value)} size="small" sx={{ "&.Mui-checked": { color: "#00AF75" } }} />}
                  label={p.label}
                />
              ))}
            </FormGroup>
          </Box>
          <Button variant="outlined" size="small" onClick={resetFilters} sx={{ mt: 2.5, borderColor: "#d1d5db", color: "#374151", "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" } }}>
            ล้างตัวกรอง
          </Button>
        </Box>

        {/* ── Table ── */}
        <TableContainer sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#036245" }}>
                {["ลำดับ", "ชื่อสาขาที่ส่งต่อ", "สถานพยาบาล", "เบอร์โทร", "ใช้สำหรับผู้ป่วย", "การใช้งาน", "จัดการข้อมูล"].map((h) => (
                  <TableCell key={h} sx={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap" }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={32} sx={{ color: "#036245" }} /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: "#9ca3af" }}>ไม่พบข้อมูล</TableCell></TableRow>
              ) : (
                items.map((item, idx) => (
                  <TableRow key={item.id} hover sx={{ "&:nth-of-type(even)": { bgcolor: "#f9fafb" } }}>
                    <TableCell sx={{ width: 60 }}>{getDisplayNo(idx)}</TableCell>
                    <TableCell>{item.name || "ไม่ระบุ"}</TableCell>
                    <TableCell>{item.hospital?.name || "-"}</TableCell>
                    <TableCell>{item.phone || "ไม่ระบุ"}</TableCell>
                    <TableCell><PatientStatusIcons isOpd={!!item.isOpd} isIpd={!!item.isIpd} isEr={!!item.isEr} /></TableCell>
                    <TableCell>
                      <Switch
                        checked={!!item.isActive} onChange={() => handleToggleActive(item)} size="small"
                        sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#22c55e" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#22c55e" } }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <IconButton size="small" onClick={() => handleOpenEdit(item)} sx={{ bgcolor: "#f59e0b", color: "#fff", width: 34, height: 34, "&:hover": { bgcolor: "#d97706" } }}><EditIcon /></IconButton>
                        <IconButton size="small" onClick={() => handleOpenDelete(item)} sx={{ bgcolor: "#ef4444", color: "#fff", width: 34, height: 34, "&:hover": { bgcolor: "#dc2626" } }}><TrashIcon /></IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ── Thai Pagination ── */}
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", mt: 2, gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ color: "#374151" }}>แถวต่อหน้า</Typography>
            <Select size="small" value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }} sx={{ ...selectSx, minWidth: 70 }}>
              {[10, 25, 50].map((n) => (<MenuItem key={n} value={n}>{n}</MenuItem>))}
            </Select>
            <Typography variant="body2" sx={{ color: "#6B7280", ml: 1 }}>ทั้งหมด {totalCount} รายการ</Typography>
          </Box>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} shape="rounded" size="small" sx={{ "& .MuiPaginationItem-root.Mui-selected": { bgcolor: "#036245", color: "#fff", "&:hover": { bgcolor: "#024d36" } } }} />
        </Box>
      </Box>

      {/* ════════════════════════════════════════
         ADD MODAL
         ════════════════════════════════════════ */}
      <Dialog open={addModalOpen} onClose={() => setAddModalOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2, overflow: "visible" } }}>
        <Box sx={{ background: "linear-gradient(135deg, #036245 0%, #00AF75 100%)", color: "#fff", px: 3, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>เพิ่มข้อมูลสาขาที่ส่งต่อ</Typography>
          <IconButton size="small" onClick={() => setAddModalOpen(false)} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          {renderBranchFormFields(addForm, setAddForm, addErrors, handleAddZoneChange, handleAddTypeChange)}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
          <Button variant="outlined" startIcon={<ArrowBackIosNewIcon sx={{ fontSize: 16 }} />} onClick={() => setAddModalOpen(false)} sx={{ borderColor: "#d1d5db", color: "#374151" }}>ยกเลิก</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleAddSave} disabled={modalLoading} sx={{ bgcolor: "#00AF75", "&:hover": { bgcolor: "#009966" } }}>
            {modalLoading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "บันทึก"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════════════════════════════════════
         EDIT MODAL
         ════════════════════════════════════════ */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2, overflow: "visible" } }}>
        <Box sx={{ background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)", color: "#fff", px: 3, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>แก้ไขข้อมูลสาขาที่ส่งต่อ</Typography>
          <IconButton size="small" onClick={() => setEditModalOpen(false)} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          {editForm && renderBranchFormFields(editForm, setEditForm, editErrors, handleEditZoneChange, handleEditTypeChange)}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
          <Button variant="outlined" startIcon={<ArrowBackIosNewIcon sx={{ fontSize: 16 }} />} onClick={() => setEditModalOpen(false)} sx={{ borderColor: "#d1d5db", color: "#374151" }}>ยกเลิก</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleEditSave} disabled={modalLoading} sx={{ bgcolor: "#f59e0b", "&:hover": { bgcolor: "#d97706" } }}>
            {modalLoading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "บันทึก"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════════════════════════════════════
         DELETE MODAL
         ════════════════════════════════════════ */}
      <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <Box sx={{ background: "linear-gradient(135deg, #ef4444 0%, #f87171 100%)", color: "#fff", px: 3, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>ยืนยันการลบข้อมูล</Typography>
          <IconButton size="small" onClick={() => setDeleteModalOpen(false)} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
        </Box>
        <DialogContent sx={{ p: 3, textAlign: "center" }}>
          <Typography sx={{ color: "#374151", py: 2 }}>ต้องการลบ &quot;<strong>{deletingItem?.name}</strong>&quot; หรือไม่</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
          <Button variant="outlined" startIcon={<ArrowBackIosNewIcon sx={{ fontSize: 16 }} />} onClick={() => setDeleteModalOpen(false)} sx={{ borderColor: "#d1d5db", color: "#374151" }}>ยกเลิก</Button>
          <Button variant="contained" startIcon={<TrashIcon />} onClick={handleConfirmDelete} disabled={modalLoading} sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" } }}>
            {modalLoading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "ลบข้อมูล"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
