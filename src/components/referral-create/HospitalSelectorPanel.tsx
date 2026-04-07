"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Chip,
  Stack,
  InputAdornment,
  Avatar,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Clear as ClearIcon,
  Save as SaveIcon,
  ListAlt as ListAltIcon,
} from "@mui/icons-material";
import {
  useReferralCreateStore,
  type HospitalOption,
  type SelectedHospital,
  type DoctorBranchOption,
} from "@/stores/referralCreateStore";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface HospitalSelectorPanelProps {
  kind: string;
  isEr?: boolean;
  onNext: (hospitals: SelectedHospital[]) => void;
  onCancel: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function HospitalSelectorPanel({
  kind,
  isEr = false,
  onNext,
  onCancel,
}: HospitalSelectorPanelProps) {
  const {
    hospitals,
    hospitalTotalCount,
    hospitalZones,
    hospitalTypes,
    selectedHospitals,
    hospitalBranchOptionsMap,
    setSelectedHospitals,
    addSelectedHospital,
    removeSelectedHospital,
    clearSelectedHospitals,
    fetchHospitals,
    fetchHospitalFilters,
    fetchDoctorBranches,
  } = useReferralCreateStore();

  // Local state
  const [search, setSearch] = useState("");
  const [zone, setZone] = useState<string>("");
  const [subType, setSubType] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSelected, setModalSelected] = useState<HospitalOption[]>([]);

  // Branch selections per hospital
  const [selectedBranchesMap, setSelectedBranchesMap] = useState<
    Record<string, DoctorBranchOption[]>
  >({});

  // Load initial data
  useEffect(() => {
    fetchHospitalFilters();
    fetchHospitals({ offset: page, limit, search, zone: zone || null, subType: subType || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload hospitals on filter change
  const reloadHospitals = useCallback(
    (newPage?: number, newSearch?: string, newZone?: string, newSubType?: string) => {
      const p = newPage ?? page;
      const s = newSearch ?? search;
      const z = newZone ?? zone;
      const t = newSubType ?? subType;
      fetchHospitals({ offset: p, limit, search: s, zone: z || null, subType: t || null });
    },
    [page, search, zone, subType, limit, fetchHospitals]
  );

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    reloadHospitals(1, val, zone, subType);
  };

  const handleZoneChange = (val: string) => {
    setZone(val);
    setPage(1);
    reloadHospitals(1, search, val, subType);
  };

  const handleTypeChange = (val: string) => {
    setSubType(val);
    setPage(1);
    reloadHospitals(1, search, zone, val);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
    reloadHospitals(newPage, search, zone, subType);
  };

  // Modal handlers
  const openAddModal = () => {
    setModalSelected([]);
    setModalOpen(true);
  };

  const toggleModalHospital = (h: HospitalOption) => {
    setModalSelected((prev) => {
      const exists = prev.some((x) => String(x.id) === String(h.id));
      if (exists) return prev.filter((x) => String(x.id) !== String(h.id));
      if (prev.length >= 5) return prev;
      return [...prev, h];
    });
  };

  const confirmModalSelection = async () => {
    // Add new hospitals (avoid duplicates)
    const existingIds = new Set(selectedHospitals.map((h) => String(h.id)));
    const newHospitals = modalSelected.filter((h) => !existingIds.has(String(h.id)));
    const updated = [...selectedHospitals, ...newHospitals.map((h) => ({ ...h, selectedBranches: [] }))];
    setSelectedHospitals(updated);
    setModalOpen(false);

    // Fetch branches for all selected hospitals
    const allIds = updated.map((h) => h.id);
    await fetchDoctorBranches(allIds, isEr);
  };

  // Branch selection
  const handleBranchChange = (hospitalId: string, branches: DoctorBranchOption[]) => {
    setSelectedBranchesMap((prev) => ({ ...prev, [hospitalId]: branches }));
  };

  // Next step
  const handleNext = () => {
    // Validate all hospitals have at least one branch
    const hasEmpty = selectedHospitals.some((h) => {
      const branches = selectedBranchesMap[String(h.id)];
      return !branches || branches.length === 0;
    });

    if (hasEmpty) {
      alert("กรุณาเลือกสาขาให้ครบทุกโรงพยาบาล");
      return;
    }

    if (selectedHospitals.length === 0) {
      alert("กรุณาเลือกโรงพยาบาลอย่างน้อย 1 แห่ง");
      return;
    }

    const hospitalsWithBranches = selectedHospitals.map((h) => ({
      ...h,
      selectedBranches: selectedBranchesMap[String(h.id)] || [],
    }));

    onNext(hospitalsWithBranches);
  };

  const totalPages = Math.ceil(hospitalTotalCount / limit);

  return (
    <Box sx={{ mt: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#036245" }}>
          กำหนดสถานพยาบาลปลายทาง
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            จำกัดสูงสุดได้ 5 รายการ
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={openAddModal}
            disabled={selectedHospitals.length >= 5}
            sx={{
              borderColor: "#00AF75",
              color: "#036245",
              "&:hover": { borderColor: "#036245", bgcolor: "#f0fdf4" },
            }}
          >
            เพิ่มสถานพยาบาลปลายทาง
          </Button>
        </Box>
      </Box>

      {/* Selected Hospitals Table — always visible like Nuxt original */}
      <TableContainer component={Paper} sx={{ mb: 2, boxShadow: "none", border: "1px solid #e5e7eb" }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#036245" }}>
              <TableCell sx={{ fontWeight: 600, width: 80, color: "#fff", textAlign: "center" }}>ลำดับ</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100, color: "#fff", textAlign: "center" }}>รูปภาพ</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#fff", textAlign: "center" }}>สถานพยาบาล</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#fff", textAlign: "center" }}>เบอร์โทรศัพท์</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#fff", textAlign: "center" }}>สาขา/แผนกปลายทาง</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 80, color: "#fff", textAlign: "center" }}>ลบ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {selectedHospitals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        bgcolor: "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 1,
                      }}
                    >
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="#d1d5db" />
                      </svg>
                    </Box>
                    <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                      ไม่มีรายการที่เลือก
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              selectedHospitals.map((hospital, index) => {
                const branchOptions = hospitalBranchOptionsMap[String(hospital.id)] || [];
                const selectedBranches = selectedBranchesMap[String(hospital.id)] || [];

                return (
                  <TableRow key={hospital.id}>
                    <TableCell align="center">{index + 1}</TableCell>
                    <TableCell align="center">
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "#e5e7eb", mx: "auto" }}>
                        {hospital.name?.charAt(0) || "H"}
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {hospital.name}
                      </Typography>
                      {hospital.zone?.name && (
                        <Typography variant="caption" sx={{ color: "#6b7280" }}>
                          {hospital.zone.name}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">{hospital.phone || "-"}</TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 200 }}>
                        <Select
                          multiple
                          value={selectedBranches.map((b) => String(b.value))}
                          onChange={(e) => {
                            const vals = e.target.value as string[];
                            const branches = vals
                              .map((v) => branchOptions.find((b) => String(b.value) === v))
                              .filter(Boolean) as DoctorBranchOption[];
                            handleBranchChange(String(hospital.id), branches);
                          }}
                          displayEmpty
                          renderValue={(selected) => {
                            if (selected.length === 0) return <em>เลือกสาขา</em>;
                            return selected
                              .map((v) => branchOptions.find((b) => String(b.value) === v)?.name)
                              .filter(Boolean)
                              .join(", ");
                          }}
                          sx={{ fontSize: "0.875rem" }}
                        >
                          {branchOptions.length === 0 && (
                            <MenuItem disabled>ไม่พบสาขา</MenuItem>
                          )}
                          {branchOptions.map((branch) => (
                            <MenuItem key={branch.value} value={String(branch.value)}>
                              <Checkbox
                                checked={selectedBranches.some(
                                  (b) => String(b.value) === String(branch.value)
                                )}
                                size="small"
                              />
                              {branch.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeSelectedHospital(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Bottom actions */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onCancel}
          sx={{ color: "#6b7280", borderColor: "#d1d5db" }}
        >
          ยกเลิก
        </Button>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            เลือกแล้ว ({selectedHospitals.length})
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={clearSelectedHospitals}
            sx={{ color: "#ef4444", borderColor: "#ef4444" }}
          >
            ล้างรายการสถานพยาบาล
          </Button>
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={handleNext}
            sx={{
              bgcolor: "#00AF75",
              "&:hover": { bgcolor: "#036245" },
            }}
          >
            ถัดไป
          </Button>
        </Box>
      </Box>

      {/* ---- Add Hospital Modal ---- */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>เพิ่มสถานพยาบาลปลายทาง</DialogTitle>
        <DialogContent>
          {/* Filters */}
          <Stack direction="row" spacing={2} sx={{ mb: 2, mt: 1 }}>
            <TextField
              size="small"
              placeholder="ค้นหาสถานพยาบาล..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>โซน</InputLabel>
              <Select value={zone} label="โซน" onChange={(e) => handleZoneChange(e.target.value)}>
                <MenuItem value="">ทั้งหมด</MenuItem>
                {hospitalZones.map((z) => (
                  <MenuItem key={z.value} value={z.value}>
                    {z.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>ประเภท</InputLabel>
              <Select
                value={subType}
                label="ประเภท"
                onChange={(e) => handleTypeChange(e.target.value)}
              >
                <MenuItem value="">ทั้งหมด</MenuItem>
                {hospitalTypes.map((t) => (
                  <MenuItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {/* Hospital list */}
          <Box sx={{ display: "flex", gap: 2 }}>
            {/* Left: Available hospitals */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                รายการสถานพยาบาล
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 400, boxShadow: "none", border: "1px solid #e5e7eb" }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 40 }} />
                      <TableCell sx={{ fontWeight: 600 }}>สถานพยาบาล</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>โซน</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>ประเภท</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {hospitals.map((h) => {
                      const isSelected =
                        modalSelected.some((s) => String(s.id) === String(h.id)) ||
                        selectedHospitals.some((s) => String(s.id) === String(h.id));
                      const isAlreadyAdded = selectedHospitals.some(
                        (s) => String(s.id) === String(h.id)
                      );

                      return (
                        <TableRow
                          key={h.id}
                          hover
                          onClick={() => !isAlreadyAdded && toggleModalHospital(h)}
                          sx={{
                            cursor: isAlreadyAdded ? "default" : "pointer",
                            opacity: isAlreadyAdded ? 0.5 : 1,
                          }}
                        >
                          <TableCell>
                            <Checkbox
                              size="small"
                              checked={isSelected}
                              disabled={isAlreadyAdded}
                            />
                          </TableCell>
                          <TableCell>{h.name}</TableCell>
                          <TableCell>{h.zone?.name || "-"}</TableCell>
                          <TableCell>{h.subType?.name || "-"}</TableCell>
                        </TableRow>
                      );
                    })}
                    {hospitals.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="textSecondary">
                            ไม่พบข้อมูลสถานพยาบาล
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {totalPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    size="small"
                    color="primary"
                  />
                </Box>
              )}
            </Box>

            {/* Right: Selected in modal */}
            <Box sx={{ width: 280 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                ที่เลือก ({modalSelected.length}/5)
              </Typography>
              <Paper sx={{ p: 1, minHeight: 200, border: "1px solid #e5e7eb", boxShadow: "none" }}>
                {modalSelected.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" sx={{ p: 2, textAlign: "center" }}>
                    ยังไม่ได้เลือกสถานพยาบาล
                  </Typography>
                ) : (
                  <Stack spacing={0.5}>
                    {modalSelected.map((h) => (
                      <Chip
                        key={h.id}
                        label={h.name}
                        onDelete={() => toggleModalHospital(h)}
                        size="small"
                        sx={{ justifyContent: "space-between" }}
                      />
                    ))}
                  </Stack>
                )}
              </Paper>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModalOpen(false)} sx={{ color: "#6b7280" }}>
            ยกเลิก
          </Button>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={() => setModalSelected([])}
            sx={{ color: "#ef4444", borderColor: "#ef4444" }}
          >
            ล้างรายการ
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={confirmModalSelection}
            sx={{ bgcolor: "#00AF75", "&:hover": { bgcolor: "#036245" } }}
          >
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
