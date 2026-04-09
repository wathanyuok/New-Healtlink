"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
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
  Snackbar,
} from "@mui/material";
import {
  Add as AddIcon,
  AddCircle as AddCircleIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ErrorOutline as ErrorOutlineIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Clear as ClearIcon,
  Save as SaveIcon,
  ListAlt as ListAltIcon,
  Close as CloseIcon,
  KeyboardDoubleArrowRight as KeyboardDoubleArrowRightIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  PlaylistRemove as PlaylistRemoveIcon,
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
  const [limit, setLimit] = useState(5);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorToast, setErrorToast] = useState<{
    open: boolean;
    title: string;
    message: string;
  }>({ open: false, title: "", message: "" });
  // Staging list inside the modal (maps to Nuxt's selectReferIPDHospitals)
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

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    fetchHospitals({
      offset: 1,
      limit: newLimit,
      search,
      zone: zone || null,
      subType: subType || null,
    });
  };

  const handlePageJump = (newPage: number) => {
    setPage(newPage);
    reloadHospitals(newPage, search, zone, subType);
  };

  // Modal handlers
  const openAddModal = () => {
    setModalSelected([]);
    setModalOpen(true);
  };

  // Nuxt behavior: green "+" button on a row appends to the staging list
  const addModalHospital = (h: HospitalOption) => {
    setModalSelected((prev) => {
      if (prev.some((x) => String(x.id) === String(h.id))) return prev;
      if (prev.length >= 5) return prev;
      return [...prev, h];
    });
  };

  const removeModalHospital = (idx: number) => {
    setModalSelected((prev) => prev.filter((_, i) => i !== idx));
  };

  const isHospitalInStaging = (id: string | number) =>
    modalSelected.some((x) => String(x.id) === String(id));

  const isHospitalAlreadyConfirmed = (id: string | number) =>
    selectedHospitals.some((x) => String(x.id) === String(id));

  // Build page numbers for modal pagination (1 2 3 4 5 ... N)
  const modalPageNumbers = useMemo(() => {
    const tp = Math.max(1, Math.ceil(hospitalTotalCount / limit));
    const pages: (number | "...")[] = [];
    if (tp <= 7) {
      for (let i = 1; i <= tp; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(tp - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < tp - 2) pages.push("...");
      pages.push(tp);
    }
    return pages;
  }, [page, limit, hospitalTotalCount]);

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
    if (selectedHospitals.length === 0) {
      setErrorToast({
        open: true,
        title: "ข้อมูลไม่ครบถ้วน",
        message: "กรุณาเลือกโรงพยาบาลอย่างน้อย 1 แห่ง",
      });
      return;
    }

    // Validate all hospitals have at least one branch (check both map and object)
    const hasEmpty = selectedHospitals.some((h) => {
      const fromMap = selectedBranchesMap[String(h.id)];
      const fromObj = (h as SelectedHospital).selectedBranches;
      const branches =
        fromMap && fromMap.length > 0
          ? fromMap
          : fromObj && fromObj.length > 0
            ? fromObj
            : [];
      return branches.length === 0;
    });

    if (hasEmpty) {
      setErrorToast({
        open: true,
        title: "ข้อมูลไม่ครบถ้วน",
        message: "กรุณาเลือกสาขาให้ครบทุกโรงพยาบาล",
      });
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
            disabled={selectedHospitals.length > 0}
            sx={{
              borderColor: "#00AF75",
              color: "#036245",
              "&:hover": { borderColor: "#036245", bgcolor: "#f0fdf4" },
              "&.Mui-disabled": {
                borderColor: "#d1d5db",
                color: "#9ca3af",
              },
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
                    <TableCell align="center">
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
                    <TableCell align="center">
                      <FormControl
                        size="small"
                        sx={{ minWidth: 220, mx: "auto", position: "relative" }}
                      >
                        <Select
                          multiple
                          value={selectedBranches.map((b) => String(b.value))}
                          onChange={(e) => {
                            const vals = e.target.value as string[];
                            // handle select-all sentinel
                            if (vals.includes("__SELECT_ALL__")) {
                              const allSelected =
                                selectedBranches.length === branchOptions.length;
                              handleBranchChange(
                                String(hospital.id),
                                allSelected ? [] : [...branchOptions],
                              );
                              return;
                            }
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
                          sx={{
                            fontSize: "0.875rem",
                            "& .MuiSelect-select": {
                              pr:
                                selectedBranches.length > 0
                                  ? "64px !important"
                                  : "32px !important",
                            },
                          }}
                          MenuProps={{
                            PaperProps: { sx: { maxHeight: 360 } },
                          }}
                        >
                          {branchOptions.length === 0 && (
                            <MenuItem disabled>ไม่พบสาขา</MenuItem>
                          )}
                          {branchOptions.length > 0 && (
                            <MenuItem
                              value="__SELECT_ALL__"
                              sx={{
                                fontWeight: 600,
                                borderBottom: "1px solid #e5e7eb",
                                justifyContent: "center",
                              }}
                            >
                              <Checkbox
                                checked={
                                  selectedBranches.length === branchOptions.length
                                }
                                indeterminate={
                                  selectedBranches.length > 0 &&
                                  selectedBranches.length < branchOptions.length
                                }
                                size="small"
                              />
                              เลือกทั้งหมด
                            </MenuItem>
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
                          {branchOptions.length > 0 && (
                            <MenuItem
                              disabled
                              sx={{
                                opacity: "1 !important",
                                bgcolor: "#e5e7eb",
                                borderTop: "1px solid #d1d5db",
                                justifyContent: "center",
                                fontSize: "0.8125rem",
                                color: "#374151 !important",
                                mt: 0.5,
                                "&.Mui-disabled": {
                                  opacity: "1 !important",
                                  color: "#374151",
                                },
                              }}
                            >
                              • เลือกแล้ว {selectedBranches.length} รายการ
                            </MenuItem>
                          )}
                        </Select>
                        {selectedBranches.length > 0 && (
                          <IconButton
                            size="small"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBranchChange(String(hospital.id), []);
                            }}
                            sx={{
                              position: "absolute",
                              right: 32,
                              top: "50%",
                              transform: "translateY(-50%)",
                              p: 0,
                              width: 18,
                              height: 18,
                              bgcolor: "#9ca3af",
                              color: "#fff",
                              "&:hover": { bgcolor: "#6b7280" },
                              zIndex: 1,
                            }}
                          >
                            <CloseIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        )}
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

      {/* ---- Add Hospital Modal (Nuxt parity) ---- */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "12px", overflow: "hidden" },
        }}
      >
        {/* Green header bar */}
        <Box
          sx={{
            bgcolor: "#00AF75",
            color: "#fff",
            px: 3,
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            sx={{
              fontFamily: "Sarabun, sans-serif",
              fontWeight: 700,
              fontSize: "1.1rem",
            }}
          >
            เพิ่มสถานพยาบาลปลายทาง
          </Typography>
          <IconButton
            size="small"
            onClick={() => setModalOpen(false)}
            sx={{ color: "#fff" }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 48px 1fr" },
              gap: 2,
              alignItems: "start",
            }}
          >
            {/* -------- LEFT: Available hospitals -------- */}
            <Box>
              <Typography
                sx={{
                  fontFamily: "Sarabun, sans-serif",
                  fontWeight: 700,
                  color: "#036245",
                  fontSize: "1rem",
                  mb: 2,
                }}
              >
                รายการสถานพยาบาลปลายทางทั้งหมด
              </Typography>

              {/* Search box */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ mb: 0.5, color: "#374151", fontWeight: 500 }}
                >
                  ค้นหาสถานพยาบาล
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="ค้นหาสถานพยาบาล"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" sx={{ color: "#9ca3af" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Zone + Type row */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ mb: 0.5, color: "#374151", fontWeight: 500 }}
                  >
                    โซน <span style={{ color: "#ef4444" }}>*</span>
                  </Typography>
                  <FormControl
                    size="small"
                    fullWidth
                    sx={{ position: "relative" }}
                  >
                    <Select
                      value={zone}
                      displayEmpty
                      onChange={(e) => handleZoneChange(e.target.value)}
                      MenuProps={{
                        PaperProps: { sx: { maxHeight: 320 } },
                      }}
                      sx={{
                        "& .MuiSelect-select": {
                          pr: zone
                            ? "64px !important"
                            : "32px !important",
                        },
                      }}
                      renderValue={(v) => {
                        if (!v)
                          return (
                            <span style={{ color: "#9ca3af" }}>
                              เลือกสาขาปลายทาง
                            </span>
                          );
                        return (
                          hospitalZones.find((z) => z.value === v)?.name || v
                        );
                      }}
                    >
                      <MenuItem value="">ทั้งหมด</MenuItem>
                      {hospitalZones.map((z) => (
                        <MenuItem key={z.value} value={z.value}>
                          {z.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {zone && (
                      <IconButton
                        size="small"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleZoneChange("");
                        }}
                        sx={{
                          position: "absolute",
                          right: 32,
                          top: "50%",
                          transform: "translateY(-50%)",
                          p: 0,
                          width: 18,
                          height: 18,
                          bgcolor: "#9ca3af",
                          color: "#fff",
                          "&:hover": { bgcolor: "#6b7280" },
                          zIndex: 1,
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    )}
                  </FormControl>
                </Box>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ mb: 0.5, color: "#374151", fontWeight: 500 }}
                  >
                    ประเภท <span style={{ color: "#ef4444" }}>*</span>
                  </Typography>
                  <FormControl
                    size="small"
                    fullWidth
                    sx={{ position: "relative" }}
                  >
                    <Select
                      value={subType}
                      displayEmpty
                      onChange={(e) => handleTypeChange(e.target.value)}
                      MenuProps={{
                        PaperProps: { sx: { maxHeight: 320 } },
                      }}
                      sx={{
                        "& .MuiSelect-select": {
                          pr: subType
                            ? "64px !important"
                            : "32px !important",
                        },
                      }}
                      renderValue={(v) => {
                        if (!v)
                          return (
                            <span style={{ color: "#9ca3af" }}>
                              เลือกประเภทสถานพยาบาล
                            </span>
                          );
                        return (
                          hospitalTypes.find((t) => String(t.id) === v)?.name ||
                          v
                        );
                      }}
                    >
                      <MenuItem value="">ทั้งหมด</MenuItem>
                      {hospitalTypes.map((t) => (
                        <MenuItem key={t.id} value={String(t.id)}>
                          {t.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {subType && (
                      <IconButton
                        size="small"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTypeChange("");
                        }}
                        sx={{
                          position: "absolute",
                          right: 32,
                          top: "50%",
                          transform: "translateY(-50%)",
                          p: 0,
                          width: 18,
                          height: 18,
                          bgcolor: "#9ca3af",
                          color: "#fff",
                          "&:hover": { bgcolor: "#6b7280" },
                          zIndex: 1,
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    )}
                  </FormControl>
                </Box>
              </Box>

              {/* Available hospitals table */}
              <TableContainer
                component={Paper}
                sx={{
                  boxShadow: "none",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#036245" }}>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: "#fff",
                          fontFamily: "Sarabun, sans-serif",
                        }}
                      >
                        ชื่อสถานพยาบาล
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 600,
                          color: "#fff",
                          width: 100,
                          fontFamily: "Sarabun, sans-serif",
                        }}
                      >
                        เลือก
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {hospitals.map((h) => {
                      // Nuxt parity: disable ONLY when in staging list or limit reached.
                      // Do NOT check "already confirmed" — Nuxt allows re-picking; dedup on confirm.
                      const staged = isHospitalInStaging(h.id);
                      const limitReached = modalSelected.length >= 5;
                      const disabled = staged || limitReached;

                      return (
                        <TableRow
                          key={h.id}
                          sx={{
                            "&:hover": { bgcolor: "#f9fafb" },
                            borderBottom: "1px solid #f3f4f6",
                          }}
                        >
                          <TableCell
                            sx={{ fontFamily: "Sarabun, sans-serif" }}
                          >
                            {h.name}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              disabled={disabled}
                              onClick={() => addModalHospital(h)}
                              sx={{
                                // Nuxt uses bg-green-200 (#bbf7d0) as default — pale green
                                bgcolor: disabled ? "#9ca3af" : "#bbf7d0",
                                color: "#fff",
                                width: 32,
                                height: 32,
                                "&:hover": {
                                  bgcolor: disabled ? "#9ca3af" : "#86efac",
                                },
                                "&.Mui-disabled": {
                                  bgcolor: "#9ca3af",
                                  color: "#fff",
                                },
                              }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {hospitals.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="textSecondary">
                            ไม่พบข้อมูลสถานพยาบาล
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mt: 2,
                  gap: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" sx={{ color: "#6b7280" }}>
                    แถวต่อหน้า
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 70 }}>
                    <Select
                      value={limit}
                      onChange={(e) =>
                        handleLimitChange(Number(e.target.value))
                      }
                      sx={{ fontSize: "0.875rem", height: 32 }}
                    >
                      <MenuItem value={5}>5</MenuItem>
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={20}>20</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="body2" sx={{ color: "#6b7280" }}>
                    ทั้งหมด {hospitalTotalCount} รายการ
                  </Typography>
                </Box>

                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <Button
                    size="small"
                    disabled={page <= 1}
                    onClick={() => handlePageJump(page - 1)}
                    sx={{ minWidth: 32, p: 0.5, color: "#6b7280" }}
                  >
                    <PrevIcon fontSize="small" />
                  </Button>
                  {modalPageNumbers.map((p: number | "...", idx: number) =>
                    p === "..." ? (
                      <Typography
                        key={`ms-dots-${idx}`}
                        variant="body2"
                        sx={{ px: 0.5, color: "#6b7280" }}
                      >
                        ...
                      </Typography>
                    ) : (
                      <Button
                        key={`ms-${p}`}
                        size="small"
                        onClick={() => handlePageJump(p as number)}
                        sx={{
                          minWidth: 32,
                          height: 32,
                          p: 0,
                          borderRadius: "6px",
                          fontWeight: page === p ? 700 : 400,
                          bgcolor: page === p ? "#00AF75" : "transparent",
                          color: page === p ? "#fff" : "#374151",
                          "&:hover": {
                            bgcolor: page === p ? "#036245" : "#f3f4f6",
                          },
                        }}
                      >
                        {p}
                      </Button>
                    )
                  )}
                  <Button
                    size="small"
                    disabled={page >= totalPages}
                    onClick={() => handlePageJump(page + 1)}
                    sx={{ minWidth: 32, p: 0.5, color: "#6b7280" }}
                  >
                    <NextIcon fontSize="small" />
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* -------- CENTER arrow -------- */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                pt: 10,
              }}
            >
              <KeyboardDoubleArrowRightIcon
                sx={{ fontSize: 40, color: "#111827" }}
              />
            </Box>

            {/* -------- RIGHT: Selected staging list -------- */}
            <Box>
              <Typography
                sx={{
                  fontFamily: "Sarabun, sans-serif",
                  fontWeight: 700,
                  color: "#036245",
                  fontSize: "1rem",
                  mb: 2,
                }}
              >
                รายการที่เลือกทั้งหมด ( {modalSelected.length} / 5 )
              </Typography>
              <TableContainer
                component={Paper}
                sx={{
                  boxShadow: "none",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#036245" }}>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 600,
                          color: "#fff",
                          width: 60,
                          fontFamily: "Sarabun, sans-serif",
                        }}
                      >
                        ลบ
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: "#fff",
                          fontFamily: "Sarabun, sans-serif",
                        }}
                      >
                        ชื่อสถานพยาบาล
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: "#fff",
                          fontFamily: "Sarabun, sans-serif",
                        }}
                      >
                        โซน
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: "#fff",
                          fontFamily: "Sarabun, sans-serif",
                        }}
                      >
                        ประเภท
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {modalSelected.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          align="center"
                          sx={{
                            py: 6,
                            color: "#9ca3af",
                            fontFamily: "Sarabun, sans-serif",
                            fontSize: "0.9rem",
                            border: "none",
                          }}
                        >
                          ยังไม่ได้เลือกสถานพยาบาล
                        </TableCell>
                      </TableRow>
                    ) : (
                      modalSelected.map((h, idx) => (
                        <TableRow
                          key={h.id}
                          sx={{ borderBottom: "1px solid #f3f4f6" }}
                        >
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => removeModalHospital(idx)}
                              sx={{
                                bgcolor: "#ef4444",
                                color: "#fff",
                                width: 32,
                                height: 32,
                                "&:hover": { bgcolor: "#dc2626" },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                          <TableCell
                            sx={{ fontFamily: "Sarabun, sans-serif" }}
                          >
                            {h.name}
                          </TableCell>
                          <TableCell
                            sx={{ fontFamily: "Sarabun, sans-serif" }}
                          >
                            {h.zone?.name || "-"}
                          </TableCell>
                          <TableCell
                            sx={{ fontFamily: "Sarabun, sans-serif" }}
                          >
                            {h.subType?.name || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        </DialogContent>

        {/* Footer: ยกเลิก | (ล้างรายการ + บันทึก) */}
        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            pt: 1,
            justifyContent: "space-between",
            borderTop: "1px solid #f3f4f6",
          }}
        >
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => setModalOpen(false)}
            sx={{
              textTransform: "none",
              fontFamily: "Sarabun, sans-serif",
              borderColor: "#d1d5db",
              color: "#374151",
              "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" },
            }}
          >
            ยกเลิก
          </Button>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<PlaylistRemoveIcon />}
              onClick={() => setModalSelected([])}
              sx={{
                textTransform: "none",
                fontFamily: "Sarabun, sans-serif",
                borderColor: "#ef4444",
                color: "#ef4444",
                "&:hover": {
                  borderColor: "#dc2626",
                  bgcolor: "#fef2f2",
                },
              }}
            >
              ล้างรายการสถานพยาบาล
            </Button>
            <Button
              variant="contained"
              disableElevation
              startIcon={<SaveIcon />}
              onClick={confirmModalSelection}
              sx={{
                textTransform: "none",
                fontFamily: "Sarabun, sans-serif",
                bgcolor: "#00AF75",
                color: "#fff",
                boxShadow: "none",
                "&:hover": { bgcolor: "#036245", boxShadow: "none" },
              }}
            >
              บันทึก
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Error Toast */}
      <Snackbar
        open={errorToast.open}
        autoHideDuration={4000}
        onClose={() => setErrorToast((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ mt: 2, zIndex: (t) => t.zIndex.modal + 100 }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
            bgcolor: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            px: 2.5,
            py: 2,
            minWidth: 320,
            maxWidth: 420,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            fontFamily: "Sarabun, sans-serif",
          }}
        >
          <ErrorOutlineIcon
            sx={{ color: "#dc2626", fontSize: 26, mt: 0.25, flexShrink: 0 }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                color: "#dc2626",
                fontWeight: 700,
                fontSize: "1rem",
                fontFamily: "Sarabun, sans-serif",
                lineHeight: 1.3,
              }}
            >
              {errorToast.title}
            </Typography>
            <Typography
              sx={{
                color: "#374151",
                fontSize: "0.875rem",
                mt: 0.5,
                fontFamily: "Sarabun, sans-serif",
                lineHeight: 1.5,
              }}
            >
              {errorToast.message}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() =>
              setErrorToast((s) => ({ ...s, open: false }))
            }
            sx={{ color: "#9ca3af", p: 0.5, mt: -0.5, mr: -0.5 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Snackbar>
    </Box>
  );
}
