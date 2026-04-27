"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
  Snackbar,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  AddCircleOutline as AddCircleIcon,
} from "@mui/icons-material";
import { useReferralCreateStore, type DoctorBranchOption } from "@/stores/referralCreateStore";
import { useAuthStore } from "@/stores/authStore";
import { useSearchParams } from "next/navigation";
import ThaiDateInput, { formatThaiDate as sharedFormatThaiDate } from "@/components/shared/ThaiDateInput";

interface DoctorBranchSelectorProps {
  hospitalId: string | number;
  hospitalName?: string;
  kind?: string;
  /** referBack mode: simple checkbox selection, no appointment table */
  isReferBack?: boolean;
  onNext: (branches: DoctorBranchOption[], isChangeDoctorBranch?: boolean) => void;
  onBack: () => void;
}

/* Green plus icon matching Nuxt original */
function GreenPlusIcon() {
  return (
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: "8px",
        bgcolor: "#dcfce7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M5 12h14" stroke="#036245" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </Box>
  );
}

/* Selected department row type */
interface SelectedDept {
  doctorBranch: number | string;
  name: string;
  phone?: string;
  appointment: number; // 1 = specific date/time, 2 = continuous
  appointmentDate: string;
  appointmentTime: string;
  remark: string;
  totalSelect: number;
}

const periodOptions = [
  { value: 1, name: "ระบุวัน/เวลา" },
  { value: 2, name: "รอนัดรักษาต่อเนื่อง" },
];

/* THAI_MONTHS_SHORT moved to shared/ThaiDateInput */

const formatThaiDate = sharedFormatThaiDate;

/** Format time (HH:mm) to Thai display: "14:30 น." */
function formatThaiTime(timeStr: string): string {
  if (!timeStr) return "";
  return `${timeStr} น.`;
}

/**
 * Thai time input:
 * - No value: shows placeholder + native clock icon, click anywhere opens picker
 * - Has value: shows Thai time + X clear button
 */
function ThaiTimeInput({
  value,
  onChange,
  disabled,
  error,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  error?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    if (disabled) return;
    try { ref.current?.showPicker(); } catch { ref.current?.focus(); }
  };

  const borderColor = error ? "#ef4444" : (disabled ? "#e5e7eb" : "#d1d5db");

  /* ---- Has value: show Thai time + X button ---- */
  if (value) {
    return (
      <Box
        onClick={openPicker}
        sx={{
          display: "flex",
          alignItems: "center",
          border: `1px solid ${borderColor}`,
          borderRadius: "8px",
          px: 1.5,
          height: 40,
          bgcolor: "#fff",
          cursor: "pointer",
          minWidth: 150,
          position: "relative",
          "&:hover": { borderColor: "#9ca3af" },
        }}
      >
        <Typography sx={{ flex: 1, fontSize: "0.875rem", color: "#1f2937", pointerEvents: "none" }}>
          {formatThaiTime(value)}
        </Typography>
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); onChange(""); }}
          sx={{ p: 0.25, color: "#9ca3af" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </IconButton>
        {/* Hidden input for showPicker */}
        <input ref={ref} type="time" value={value} onChange={(e) => onChange(e.target.value)}
          style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }} />
      </Box>
    );
  }

  /* ---- No value: native input with placeholder overlay + clock icon ---- */
  return (
    <Box
      onClick={openPicker}
      sx={{ position: "relative", minWidth: 150, cursor: disabled ? "default" : "pointer" }}
    >
      <Typography
        sx={{
          position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
          fontSize: "0.875rem", color: "#9ca3af", pointerEvents: "none", zIndex: 1,
        }}
      >
        เลือกเวลานัดหมาย
      </Typography>
      <input
        ref={ref}
        type="time"
        value=""
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        onClick={(e) => { e.stopPropagation(); openPicker(); }}
        style={{
          width: "100%", height: 40, border: `1px solid ${borderColor}`,
          borderRadius: 8, padding: "6px 12px", fontSize: "0.875rem", color: "transparent",
          backgroundColor: disabled ? "#f9fafb" : "#fff", cursor: disabled ? "default" : "pointer",
          outline: "none", boxSizing: "border-box",
        }}
      />
    </Box>
  );
}

export default function DoctorBranchSelector({
  hospitalId,
  hospitalName,
  kind,
  isReferBack = false,
  onNext,
  onBack,
}: DoctorBranchSelectorProps) {
  const { doctorBranches, fetchDoctorBranchList } = useReferralCreateStore();
  const { profile, optionHospital } = useAuthStore();
  const searchParamsHook = useSearchParams();
  const [selected, setSelected] = useState<SelectedDept[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(1000); // Show 1000 items initially
  const [validationErrors, setValidationErrors] = useState<Record<number, { date?: boolean; time?: boolean }>>({});
  const [errorMsg, setErrorMsg] = useState("");
  const [branchesFetched, setBranchesFetched] = useState(false);
  // referBack mode: toggle for "ไม่อนุญาตให้ปลายทางส่งไปสาขา/แผนกอื่น"
  const [isChangeDoctorBranchDisallowed, setIsChangeDoctorBranchDisallowed] = useState(false);
  // referBack mode: set of selected branch IDs (checkbox toggle)
  const [selectedBranchIds, setSelectedBranchIds] = useState<Set<number | string>>(new Set());

  useEffect(() => {
    // Guard: Nuxt checks route.query.hospitalID exists before calling API
    const urlHospitalID = searchParamsHook.get("hospitalID");
    if (!urlHospitalID) return;

    // Match Nuxt getDocterBranch: param.hospital logic
    // - referBack: always use URL hospitalID (fromHospital that sent the original referral)
    // - other kinds: superAdmin uses optionHospital, others use profile hospital
    const kindParam = searchParamsHook.get("kind");
    const roleName = profile?.permissionGroup?.role?.name;
    const params: any = {
      isOpd: "true",
      isActive: true,
    };

    if (kindParam === "referBack") {
      // referBack: use URL hospitalID (matches Nuxt getDocterBranch using route.query.hospitalID)
      params.hospital = Number(urlHospitalID);
    } else if (roleName === "superAdmin") {
      if (optionHospital !== undefined && optionHospital !== null) {
        params.hospital = Number(optionHospital);
      }
    } else {
      const profileHospitalId = profile?.permissionGroup?.hospital?.id;
      params.hospital = profileHospitalId ? Number(profileHospitalId) : null;
    }

    setBranchesFetched(false);
    fetchDoctorBranchList(params).then(() => {
      setBranchesFetched(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalId, kind, profile, optionHospital]);

  // Auto-skip: match Nuxt watcher on docterBranchData
  // 0 branches → proceed with "ไม่ระบุสาขา"
  // 1 branch → auto-select and proceed to form
  // >1 branches → show selector (no auto-skip)
  const autoSkippedRef = useRef(false);
  useEffect(() => {
    if (!branchesFetched || autoSkippedRef.current) return;
    if (doctorBranches.length === 0) {
      // No branches available — skip with empty marker (matches Nuxt branch_names="ไม่ระบุสาขา")
      autoSkippedRef.current = true;
      onNext([]);
    } else if (doctorBranches.length === 1) {
      // Only 1 branch — auto-select and proceed (matches Nuxt watcher)
      autoSkippedRef.current = true;
      const branch = doctorBranches[0];
      onNext([branch]);
    }
    // >1 branches → do nothing, show selector
  }, [doctorBranches, branchesFetched]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter branches by search query
  const allFilteredBranches = useMemo(() => {
    if (!searchQuery.trim()) return doctorBranches;
    const q = searchQuery.trim().toLowerCase();
    return doctorBranches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.phone && b.phone.includes(q))
    );
  }, [doctorBranches, searchQuery]);

  // Limit visible items to prevent rendering performance issues
  const filteredBranches = useMemo(() => {
    return allFilteredBranches.slice(0, visibleCount);
  }, [allFilteredBranches, visibleCount]);

  const hasMore = allFilteredBranches.length > visibleCount;

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(1000);
  }, [searchQuery]);

  // Count how many times each branch is selected
  const branchSelectCount = useMemo(() => {
    const counts: Record<string, number> = {};
    selected.forEach((s) => {
      const key = String(s.doctorBranch);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [selected]);

  const handleSelectDepartment = (branch: DoctorBranchOption) => {
    setSelected((prev) => [
      ...prev,
      {
        doctorBranch: branch.value,
        name: branch.name,
        phone: branch.phone,
        appointment: 1,
        appointmentDate: "",
        appointmentTime: "",
        remark: "",
        totalSelect: 0,
      },
    ]);
  };

  const handleDeleteDepartment = (index: number) => {
    setSelected((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearSelection = () => {
    setSelected([]);
  };

  const updateField = (index: number, field: keyof SelectedDept, value: any) => {
    setSelected((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // referBack mode: toggle branch selection
  const handleToggleBranch = (branch: DoctorBranchOption) => {
    setSelectedBranchIds((prev) => {
      const next = new Set(prev);
      if (next.has(branch.value)) {
        next.delete(branch.value);
      } else {
        next.add(branch.value);
      }
      return next;
    });
  };

  // referBack mode: clear selection
  const handleClearReferBackSelection = () => {
    setSelectedBranchIds(new Set());
  };

  const handleProceed = () => {
    // referBack mode: simple selection, no appointment validation
    if (isReferBack) {
      const selectedBranches = doctorBranches.filter((b) => selectedBranchIds.has(b.value));
      // Allow proceeding with 0 selections (skip) — matches Nuxt "ยืนยันหรือข้าม"
      onNext(selectedBranches, !isChangeDoctorBranchDisallowed);
      return;
    }

    // Validate: must select at least 1 department
    if (selected.length === 0) {
      setErrorMsg("ต้องเลือกข้อมูล\nกรุณาเลือกแผนกอย่างน้อย 1 รายการ");
      return;
    }

    // Match Nuxt validation: check continuous appointment rules
    const continuousAppointments = selected.filter((dept) => dept.appointment === 2);

    // Rule 1: Cannot select only 1 department with "รอนัดรักษาต่อเนื่อง"
    if (selected.length === 1 && continuousAppointments.length === 1) {
      setErrorMsg("ไม่สามารถเลือก\nเพียงแผนกเดียวได้\nกรุณาเพิ่มแผนกอื่น\nหรือระบุวัน/เวลาของการนัด\nคุณไม่สามารถเลือกแผนกเดียว\nที่ต้องการให้รอนัดรักษาต่อเนื่อง");
      return;
    }

    // Rule 2: If >= 2 departments and none are continuous, at least 1 must have date+time
    if (selected.length >= 2 && continuousAppointments.length === 0) {
      const hasAtLeastOneDateTime = selected.some(
        (dept) => dept.appointment === 1 && dept.appointmentDate && dept.appointmentTime
      );
      if (!hasAtLeastOneDateTime) {
        setErrorMsg("เมื่อเลือกแผนกมากกว่า 2 แผนก\nการนัดหมายต้องมี\nการระบุวัน/เวลา\nอย่างน้อย 1 รายการ");
        return;
      }
    }

    // Rule 3: If >= 2 continuous appointments, at least 1 must have date+time
    if (continuousAppointments.length >= 2) {
      const hasAtLeastOneDateTime = selected.some(
        (dept) => dept.appointment === 1 && dept.appointmentDate && dept.appointmentTime
      );
      if (!hasAtLeastOneDateTime) {
        setErrorMsg("การนัดหมายต่อเนื่อง\nต้องมีการระบุวัน/เวลา\nอย่างน้อย 1 รายการ");
        return;
      }
    }

    // Validate: appointment type 1 requires date and time
    const errors: Record<number, { date?: boolean; time?: boolean }> = {};
    let hasError = false;

    selected.forEach((dept, index) => {
      if (dept.appointment === 1) {
        const err: { date?: boolean; time?: boolean } = {};
        if (!dept.appointmentDate) { err.date = true; hasError = true; }
        if (!dept.appointmentTime) { err.time = true; hasError = true; }
        if (err.date || err.time) errors[index] = err;
      }
    });

    if (hasError) {
      setValidationErrors(errors);
      setErrorMsg("กรุณากรอกวันนัดหมายและเวลานัดหมายให้ครบถ้วน");
      return;
    }

    setValidationErrors({});
    setErrorMsg("");

    // Convert selected departments to DoctorBranchOption[] for onNext
    const branches: DoctorBranchOption[] = selected.map((s) => ({
      value: s.doctorBranch,
      name: s.name,
      phone: s.phone,
      appointmentDate: s.appointmentDate,
      appointmentTime: s.appointmentTime,
      appointment: s.appointment,
      remark: s.remark,
    }));
    onNext(branches);
  };

  return (
    <Box sx={{ mt: 3 }}>
      {/* Header row: hospital code | เลือกแล้ว (N) | ล้างรายการที่เลือก */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1,
          mb: 2,
        }}
      >
        <Typography sx={{ color: "#6b7280", fontWeight: 500 }}>
          {hospitalName || ""}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography sx={{ color: "#6b7280" }}>
            {`เลือกแล้ว (${isReferBack ? selectedBranchIds.size : selected.length})`}
          </Typography>
          <Button
            variant="outlined"
            onClick={isReferBack ? handleClearReferBackSelection : handleClearSelection}
            startIcon={<AddCircleIcon />}
            sx={{
              color: "#ef4444",
              borderColor: "#ef4444",
              textTransform: "none",
              borderRadius: "8px",
              "&:hover": { borderColor: "#dc2626", bgcolor: "#fef2f2" },
            }}
          >
            ล้างรายการที่เลือก
          </Button>
        </Box>
      </Box>

      {/* Search input */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
          ค้นหา
        </Typography>
        <TextField
          size="small"
          fullWidth
          placeholder="ค้นหาชื่อสาขา / แผนก"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "#9ca3af" }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Card grid - 3 columns matching Nuxt */}
      {!branchesFetched ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <Box sx={{ textAlign: "center" }}>
            <CircularProgress sx={{ color: "#00AF75" }} />
            <Typography sx={{ mt: 1.5, color: "#6b7280" }}>กำลังโหลดข้อมูล</Typography>
          </Box>
        </Box>
      ) : filteredBranches.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography color="textSecondary">ไม่พบสาขา/แผนก</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "1fr 1fr 1fr",
            },
            gap: 2,
          }}
        >
          {filteredBranches.map((branch) => {
            const count = branchSelectCount[String(branch.value)] || 0;
            const isChecked = isReferBack ? selectedBranchIds.has(branch.value) : count > 0;
            const isActive = isReferBack ? isChecked : count > 0;
            return (
              <Box
                key={branch.value}
                onClick={() => isReferBack ? handleToggleBranch(branch) : handleSelectDepartment(branch)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.5,
                  px: 2,
                  py: 2.5,
                  bgcolor: "#fff",
                  borderRadius: "16px",
                  boxShadow: isActive
                    ? "0px 10px 20px rgba(34, 197, 94, 0.15), 0px 4px 8px rgba(34, 197, 94, 0.1)"
                    : "0 1px 3px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  border: isActive ? "2px solid #bbf7d0" : "2px solid transparent",
                  transform: isActive ? "scale(1.02)" : "none",
                  "&:hover": {
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    transform: "scale(1.01)",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                  {/* Icon: green map pin style matching Nuxt */}
                  <Box sx={{
                    width: 48, height: 48, borderRadius: "12px",
                    bgcolor: isActive ? "#dcfce7" : "#f3f4f6",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    transition: "all 0.2s",
                  }}>
                    <GreenPlusIcon />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        color: isActive ? "#166534" : "#1f2937",
                        fontSize: "0.95rem",
                        wordBreak: "break-word",
                      }}
                    >
                      {branch.name}
                    </Typography>
                    {(branch.phone || branch.phoneExtension) && (
                      <Typography
                        variant="caption"
                        sx={{ color: isActive ? "#16a34a" : "#9ca3af", display: "block" }}
                      >
                        {branch.phone || ""}{branch.phoneExtension ? ` ต่อ ${branch.phoneExtension}` : ""}
                      </Typography>
                    )}
                  </Box>
                </Box>
                {/* Right: checkmark for referBack, count badge / plus for others */}
                {isReferBack ? (
                  <Box
                    sx={{
                      width: 32, height: 32, borderRadius: "50%",
                      bgcolor: isChecked ? "#22c55e" : "#e5e7eb",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s",
                      opacity: isChecked ? 1 : 0,
                      transform: isChecked ? "scale(1)" : "scale(0.75)",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Box>
                ) : count > 0 ? (
                  <Box
                    sx={{
                      width: 40, height: 40, borderRadius: "50%",
                      bgcolor: "#00AF75", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: "1rem", flexShrink: 0,
                    }}
                  >
                    {count}
                  </Box>
                ) : (
                  <AddCircleIcon sx={{ color: "#00AF75", fontSize: 32, flexShrink: 0 }} />
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {/* Load more button */}
      {hasMore && branchesFetched && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setVisibleCount((prev) => prev + 1000)}
            sx={{
              color: "#00AF75",
              borderColor: "#00AF75",
              textTransform: "none",
              borderRadius: "8px",
              px: 4,
              "&:hover": { borderColor: "#036245", bgcolor: "#f0fdf4" },
            }}
          >
            {`แสดงเพิ่มเติม (${allFilteredBranches.length - visibleCount} รายการ)`}
          </Button>
        </Box>
      )}

      {/* Selected departments table — hidden in referBack mode */}
      {!isReferBack && <TableContainer component={Paper} sx={{ mt: 3, boxShadow: "none", border: "1px solid #e5e7eb", overflow: "visible" }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#036245" }}>
                <TableCell sx={{ color: "#fff", fontWeight: 600 }}>ชื่อสาขาที่ส่งต่อ</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 600 }}>การนัดหมาย</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 600 }}>วันนัดหมาย</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 600 }}>เวลานัดหมาย</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 600 }}>หมายเหตุ</TableCell>
                <TableCell sx={{ color: "#fff", fontWeight: 600, textAlign: "center" }}>ลบ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selected.map((dept, index) => (
                <TableRow key={`${dept.doctorBranch}-${index}`} hover>
                  <TableCell>
                    <Typography variant="body2">{dept.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <RadioGroup
                      value={dept.appointment}
                      onChange={(e) => updateField(index, "appointment", Number(e.target.value))}
                    >
                      {periodOptions.map((opt) => (
                        <FormControlLabel
                          key={opt.value}
                          value={opt.value}
                          control={
                            <Radio
                              size="small"
                              sx={{
                                color: "#00AF75",
                                "&.Mui-checked": { color: "#00AF75" },
                                p: 0.5,
                              }}
                            />
                          }
                          label={
                            <Typography sx={{ fontSize: "0.85rem" }}>
                              {opt.name}
                            </Typography>
                          }
                          sx={{ m: 0, mb: 0.25 }}
                        />
                      ))}
                    </RadioGroup>
                  </TableCell>
                  <TableCell>
                    <ThaiDateInput
                      value={dept.appointmentDate}
                      onChange={(val) => { updateField(index, "appointmentDate", val); setValidationErrors((prev) => { const n = { ...prev }; if (n[index]) { delete n[index].date; if (!n[index].time) delete n[index]; } return n; }); }}
                      disabled={dept.appointment === 2}
                      error={!!validationErrors[index]?.date}
                    />
                  </TableCell>
                  <TableCell>
                    <ThaiTimeInput
                      value={dept.appointmentTime}
                      onChange={(val) => { updateField(index, "appointmentTime", val); setValidationErrors((prev) => { const n = { ...prev }; if (n[index]) { delete n[index].time; if (!n[index].date) delete n[index]; } return n; }); }}
                      disabled={dept.appointment === 2}
                      error={!!validationErrors[index]?.time}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="กรุณากรอกหมายเหตุ"
                      value={dept.remark}
                      onChange={(e) => updateField(index, "remark", e.target.value)}
                      disabled={dept.appointment === 2}
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteDepartment(index)}
                      sx={{ color: "#ef4444" }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>}

      {/* Validation error toast — Nuxt style: white bg, red left border, red icon */}
      <Snackbar
        open={!!errorMsg}
        autoHideDuration={5000}
        onClose={() => setErrorMsg("")}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{
          display: "flex", alignItems: "flex-start", gap: 1.5,
          bgcolor: "#fff", borderRadius: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          borderLeft: "4px solid #ef4444", p: 2, minWidth: 280, maxWidth: 380,
        }}>
          {/* Red X icon */}
          <Box sx={{
            width: 28, height: 28, borderRadius: "50%", bgcolor: "#fef2f2",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.25,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2" />
              <path d="M8 8l8 8M16 8l-8 8" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#991b1b" }}>
              ข้อมูลไม่ครบถ้วน
            </Typography>
            <Typography sx={{ fontSize: "0.85rem", color: "#374151", whiteSpace: "pre-line", mt: 0.5 }}>
              {errorMsg}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setErrorMsg("")} sx={{ color: "#9ca3af", p: 0.25 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </IconButton>
        </Box>
      </Snackbar>

      {/* Bottom bar: ยกเลิก (left), toggle + ยืนยัน/ยืนยันหรือข้าม (right) */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mt: 4,
          py: 2,
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{
            color: "#00AF75",
            borderColor: "#00AF75",
            textTransform: "none",
            borderRadius: "8px",
            "&:hover": { borderColor: "#036245", bgcolor: "#f0fdf4" },
          }}
        >
          ยกเลิก
        </Button>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* "ไม่อนุญาต" toggle — only in referBack mode */}
          {isReferBack && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                onClick={() => setIsChangeDoctorBranchDisallowed((prev) => !prev)}
                sx={{
                  width: 44, height: 24, borderRadius: 12,
                  bgcolor: isChangeDoctorBranchDisallowed ? "#00AF75" : "#d1d5db",
                  position: "relative", cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
              >
                <Box sx={{
                  width: 20, height: 20, borderRadius: "50%", bgcolor: "#fff",
                  position: "absolute", top: 2,
                  left: isChangeDoctorBranchDisallowed ? 22 : 2,
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </Box>
              <Typography sx={{ color: "#6b7280", fontSize: "0.875rem", whiteSpace: "nowrap" }}>
                ไม่อนุญาตให้ปลายทางส่งไปสาขา/แผนกอื่น
              </Typography>
            </Box>
          )}
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={handleProceed}
            sx={{
              bgcolor: "#00AF75",
              "&:hover": { bgcolor: "#036245" },
              textTransform: "none",
              borderRadius: "8px",
              whiteSpace: "nowrap",
            }}
          >
            {isReferBack ? "ยืนยันหรือข้าม" : "ยืนยัน"}
          </Button>
        </Box>
      </Box>

    </Box>
  );
}
