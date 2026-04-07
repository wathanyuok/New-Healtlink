"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Stack,
  Typography,
  CircularProgress,
  Alert,
  Switch,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Grid,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterAltOff as ClearFilterIcon,
} from "@mui/icons-material";
import api from "@/lib/api";
import { useHospitalStore } from "@/stores/hospitalStore";

interface DoctorBranch {
  id: number;
  name: string;
  phone: string;
  phone2?: string;
  isOpd: boolean;
  isIpd: boolean;
  isEr: boolean;
  isActive: boolean;
  hospital?: {
    id: number;
    name: string;
    zone?: { id: number; name: string };
    subType?: { id: number; name: string };
  };
}

const PATIENT_TYPES = [
  { label: "OPD", key: "isOpd", color: "#10B981" },
  { label: "IPD", key: "isIpd", color: "#3B82F6" },
  { label: "ER", key: "isEr", color: "#EF4444" },
];

export default function DocterBranchPage() {
  const hospitalStore = useHospitalStore();

  // Data
  const [branches, setBranches] = useState<DoctorBranch[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState<number | "">("");
  const [typeFilter, setTypeFilter] = useState<number | "">("");
  const [hospitalFilter, setHospitalFilter] = useState<number | "">("");

  // Options
  const [zones, setZones] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);

  // Dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    phone2: "",
    isOpd: false,
    isIpd: false,
    isEr: false,
    hospitalId: "" as number | "",
    zoneId: "" as number | "",
    subTypeId: "" as number | "",
  });

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        offset: page,
        limit: rowsPerPage,
        search: search || undefined,
      };
      if (zoneFilter) params.zone = zoneFilter;
      if (typeFilter) params.subType = typeFilter;
      if (hospitalFilter) params.hospital = hospitalFilter;

      const response = await api.get("main-service/doctor/branch/findAndCount", { params });
      setBranches(response.data?.rows || []);
      setTotalCount(response.data?.count || 0);
    } catch (err) {
      setError("ไม่สามารถโหลดข้อมูลสาขาได้");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, zoneFilter, typeFilter, hospitalFilter]);

  const fetchOptions = useCallback(async () => {
    try {
      const [zoneData, typeData, hospitalData] = await Promise.all([
        hospitalStore.getOptionHosZone({ limit: 10000 }),
        hospitalStore.getOptionHosType({ limit: 10000 }),
        hospitalStore.getOptionHospital({ limit: 10000 }),
      ]);
      setZones(Array.isArray(zoneData) ? zoneData : []);
      setTypes(Array.isArray(typeData) ? typeData : typeData?.rows || []);
      setHospitals(Array.isArray(hospitalData) ? hospitalData : hospitalData?.hospitals || []);
    } catch (err) {
      console.error("Failed to load options:", err);
    }
  }, [hospitalStore]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleClearFilters = () => {
    setSearch("");
    setZoneFilter("");
    setTypeFilter("");
    setHospitalFilter("");
    setPage(0);
  };

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({ name: "", phone: "", phone2: "", isOpd: false, isIpd: false, isEr: false, hospitalId: "", zoneId: "", subTypeId: "" });
    setOpenDialog(true);
  };

  const handleEditClick = (branch: DoctorBranch) => {
    setEditingId(branch.id);
    setFormData({
      name: branch.name,
      phone: branch.phone || "",
      phone2: branch.phone2 || "",
      isOpd: branch.isOpd,
      isIpd: branch.isIpd,
      isEr: branch.isEr,
      hospitalId: branch.hospital?.id || "",
      zoneId: branch.hospital?.zone?.id || "",
      subTypeId: branch.hospital?.subType?.id || "",
    });
    setOpenDialog(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      setLoading(true);
      await api.delete(`main-service/doctor/branch/delete/${deleteId}`);
      setDeleteDialogOpen(false);
      setDeleteId(null);
      fetchBranches();
    } catch (err) {
      setError("ไม่สามารถลบข้อมูลได้");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = {
        name: formData.name,
        phone: formData.phone,
        phone2: formData.phone2,
        isOpd: formData.isOpd,
        isIpd: formData.isIpd,
        isEr: formData.isEr,
        hospitalId: formData.hospitalId || undefined,
      };
      if (editingId) {
        await api.put(`main-service/doctor/branch/update/${editingId}`, payload);
      } else {
        await api.post("main-service/doctor/branch/create", payload);
      }
      setOpenDialog(false);
      fetchBranches();
    } catch (err) {
      setError("ไม่สามารถบันทึกข้อมูลได้");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (branch: DoctorBranch) => {
    try {
      await api.put(`main-service/doctor/branch/update/${branch.id}`, {
        isActive: !branch.isActive,
      });
      fetchBranches();
    } catch (err) {
      console.error("Failed to toggle active:", err);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        สาขา/แผนกที่ส่งตัว
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ p: 2, mb: 2 }}>
        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 2 }} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              placeholder="ค้นหาชื่อสาขา, เบอร์โทร"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              size="small"
              fullWidth
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: "grey.400" }} /> }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>โซนสถานพยาบาล</InputLabel>
              <Select
                value={zoneFilter}
                label="โซนสถานพยาบาล"
                onChange={(e) => { setZoneFilter(e.target.value as number); setTypeFilter(""); setHospitalFilter(""); setPage(0); }}
              >
                <MenuItem value="">ทั้งหมด</MenuItem>
                {zones.map((z: any) => (
                  <MenuItem key={z.id} value={z.id}>{z.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>ประเภทสถานพยาบาล</InputLabel>
              <Select
                value={typeFilter}
                label="ประเภทสถานพยาบาล"
                onChange={(e) => { setTypeFilter(e.target.value as number); setHospitalFilter(""); setPage(0); }}
              >
                <MenuItem value="">ทั้งหมด</MenuItem>
                {types.map((t: any) => (
                  <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>สถานพยาบาล</InputLabel>
              <Select
                value={hospitalFilter}
                label="สถานพยาบาล"
                onChange={(e) => { setHospitalFilter(e.target.value as number); setPage(0); }}
              >
                <MenuItem value="">ทั้งหมด</MenuItem>
                {hospitals.map((h: any) => (
                  <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={1.5}>
            <Button
              variant="outlined"
              startIcon={<ClearFilterIcon />}
              onClick={handleClearFilters}
              fullWidth
              size="small"
              sx={{ height: 40 }}
            >
              ล้างตัวกรอง
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={1.5}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddClick}
              fullWidth
              size="small"
              sx={{ height: 40 }}
            >
              เพิ่มข้อมูล
            </Button>
          </Grid>
        </Grid>

        {/* Table */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: "#036245" }}>
                  <TableRow>
                    {["ลำดับ", "ชื่อสาขาที่ส่งต่อ", "สถานพยาบาล", "เบอร์โทร", "ใช้สำหรับผู้ป่วย", "การใช้งาน", "จัดการข้อมูล"].map(
                      (header) => (
                        <TableCell key={header} sx={{ color: "white", fontWeight: 600 }}>
                          {header}
                        </TableCell>
                      )
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {branches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">ไม่พบข้อมูล</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    branches.map((branch, index) => (
                      <TableRow
                        key={branch.id}
                        sx={{ "&:nth-of-type(odd)": { bgcolor: "#f0fdf4" } }}
                      >
                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell>{branch.name}</TableCell>
                        <TableCell>{branch.hospital?.name || "-"}</TableCell>
                        <TableCell>{branch.phone || "-"}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            {PATIENT_TYPES.map((pt) =>
                              (branch as any)[pt.key] ? (
                                <Chip
                                  key={pt.label}
                                  label={pt.label}
                                  size="small"
                                  sx={{
                                    bgcolor: pt.color,
                                    color: "white",
                                    fontWeight: 600,
                                    fontSize: "0.7rem",
                                    height: 24,
                                  }}
                                />
                              ) : null
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={branch.isActive}
                            onChange={() => handleToggleActive(branch)}
                            size="small"
                            color="success"
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            <IconButton size="small" onClick={() => handleEditClick(branch)} color="warning">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDeleteClick(branch.id)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              labelRowsPerPage="แสดง"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count} รายการ`}
            />
          </>
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: "#036245", color: "white" }}>
          {editingId ? "แก้ไขสาขา/แผนกที่ส่งตัว" : "เพิ่มสาขา/แผนกที่ส่งตัว"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="ชื่อสาขา/แผนก *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              size="small"
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="เบอร์โทร *"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                fullWidth
                size="small"
              />
              <TextField
                label="เบอร์ต่อ"
                value={formData.phone2}
                onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                sx={{ width: 120 }}
                size="small"
              />
            </Stack>
            <FormControl size="small" fullWidth>
              <InputLabel>สถานพยาบาล</InputLabel>
              <Select
                value={formData.hospitalId}
                label="สถานพยาบาล"
                onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value as number })}
              >
                {hospitals.map((h: any) => (
                  <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box>
              <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
                ใช้สำหรับผู้ป่วย *
              </Typography>
              <FormGroup row>
                <FormControlLabel
                  control={<Checkbox checked={formData.isOpd} onChange={(e) => setFormData({ ...formData, isOpd: e.target.checked })} />}
                  label="OPD"
                />
                <FormControlLabel
                  control={<Checkbox checked={formData.isIpd} onChange={(e) => setFormData({ ...formData, isIpd: e.target.checked })} />}
                  label="IPD"
                />
                <FormControlLabel
                  control={<Checkbox checked={formData.isEr} onChange={(e) => setFormData({ ...formData, isEr: e.target.checked })} />}
                  label="ER"
                />
              </FormGroup>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>ยกเลิก</Button>
          <Button onClick={handleSave} variant="contained" disabled={!formData.name || !formData.phone}>
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>ยืนยันการลบข้อมูล</DialogTitle>
        <DialogContent>
          <Typography>คุณต้องการลบสาขา/แผนกนี้ใช่หรือไม่?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>ยกเลิก</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            ลบ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
