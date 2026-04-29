"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  TextField,
  Snackbar,
  Alert,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import TreatmentDocuments, { type DocumentItem as TreatDocItem } from "@/components/shared/TreatmentDocuments";
import { useAuthStore } from "@/stores/authStore";
/* ep:edit icon — pencil with square border (matches Element Plus) */
const EpEditIcon = ({ size = 22, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 1024 1024" fill={color}>
    <path d="M832 512a32 32 0 1 1 64 0v352a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h352a32 32 0 0 1 0 64H192v640h640V512z" />
    <path d="m469.952 554.24 52.8-7.552L847.104 222.4a32 32 0 1 0-45.248-45.248L477.504 501.44l-7.552 52.8zm422.4-422.4a96 96 0 0 1 0 135.808l-331.84 331.84a32 32 0 0 1-18.112 9.088L436.8 623.68a32 32 0 0 1-36.224-36.224l15.104-105.6a32 32 0 0 1 9.024-18.112l331.84-331.84a96 96 0 0 1 135.808 0z" />
  </svg>
);
import CloseIcon from "@mui/icons-material/Close";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Image from "next/image";
import { useReferralStore } from "@/stores/referralStore";
import { useHospitalStore } from "@/stores/hospitalStore";
import {
  fmtDateThai as fmtDateThaiDirect,
  fmtDateTimeThai as fmtThaiDateTimeLocal,
  fmtTimeDirect,
  formatBirthdayThai,
} from "@/utils/dateFormat";

/* ------------------------------------------------------------------ */
/*  Helper: format date+time with timezone conversion (for log dates)  */
/* ------------------------------------------------------------------ */
function fmtDate(d: any) {
  if (!d) return "-";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return String(d);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear() + 543;
    const hh = String(date.getHours()).padStart(2, "0");
    const mi = String(date.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${mi} น.`;
  } catch {
    return String(d);
  }
}

/* ------------------------------------------------------------------ */
/*  Status badge classes                                */
/* ------------------------------------------------------------------ */
function getCountBadgeClasses(name: string): { bgcolor: string; color: string } {
  if (!name) return { bgcolor: "#f3f4f6", color: "#6b7280" };
  if (name === "ยกเลิก") return { bgcolor: "#FEF2F2", color: "#EF4444" };
  if (name === "ยืนยันนัดหมาย") return { bgcolor: "#EFF6FF", color: "#3B82F6" };
  if (name === "เปลี่ยนแปลงนัดหมาย") return { bgcolor: "#FFF7ED", color: "#F97316" };
  if (name === "รับเข้ารักษา") return { bgcolor: "#22C55E", color: "#FFFFFF" };
  if (name === "นัดรักษาต่อเนื่อง") return { bgcolor: "#F0FDF4", color: "#22C55E" };
  if (name === "รอตอบรับ") return { bgcolor: "#FEFCE8", color: "#EAB308" };
  if (name === "ปฏิเสธการตอบรับ") return { bgcolor: "#FEF2F2", color: "#EF4444" };
  if (name === "สิ้นสุดการส่งตัว") return { bgcolor: "#036245", color: "#FFFFFF" };
  return { bgcolor: "#f3f4f6", color: "#6b7280" };
}

/* Status text color */
function getStatusTextColor(name: string): string {
  if (name === "ยกเลิก") return "#EF4444";
  if (name === "ยืนยันนัดหมาย") return "#3B82F6";
  if (name === "เปลี่ยนแปลงนัดหมาย") return "#F97316";
  if (name === "รับเข้ารักษา") return "#22C55E";
  if (name === "นัดรักษาต่อเนื่อง") return "#22C55E";
  if (name === "รอตอบรับ") return "#EAB308";
  if (name === "สิ้นสุดการส่งตัว") return "#036245";
  if (name === "ปฏิเสธการตอบรับ") return "#EF4444";
  return "#6b7280";
}

function getStatusBgColor(status: string): string {
  switch (status) {
    case "มีชีวิต": return "#00AF75";
    case "เสียชีวิต": return "#EF4444";
    case "หลบหนี": return "#A855F7";
    default: return "#00AF75";
  }
}

/* ------------------------------------------------------------------ */
/*  Section header (green bg like original)                                */
/* ------------------------------------------------------------------ */
function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <Box sx={{
      bgcolor: "#BBF7D0",
      px: "16px", py: "12px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: "1px solid #E5E7EB",
    }}>
      <Typography sx={{ fontWeight: 600, fontSize: "1.125rem", color: "#036245" }}>
        {title}
      </Typography>
      {right}
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  Info field                                                         */
/* ------------------------------------------------------------------ */
function InfoField({ label, value, bold }: { label: string; value: any; bold?: boolean }) {
  return (
    <Box sx={{ mb: "4px" }}>
      <Typography sx={{ fontSize: "0.875rem", fontWeight: 500, color: "#6b7280", lineHeight: 1.75, mb: "2px" }}>{label}</Typography>
      <Typography sx={{ fontSize: "1rem", fontWeight: bold ? 700 : 400, color: "#111827", lineHeight: 1.5, ml: "16px" }}>
        {value || "-"}
      </Typography>
    </Box>
  );
}



/* ------------------------------------------------------------------ */
/*  Helper: calculate age from birthday string                         */
/* ------------------------------------------------------------------ */
function calculateAge(birthday: string | undefined | null): string {
  if (!birthday) return "-";
  try {
    const birthDate = new Date(Date.parse(birthday));
    if (isNaN(birthDate.getTime())) return "-";
    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${Math.max(0, age)} ปี`;
  } catch {
    return "-";
  }
}

/* ------------------------------------------------------------------ */
/*  Life status options                  */
/* ------------------------------------------------------------------ */
const LIFE_STATUS_OPTIONS = [
  { value: "มีชีวิต", text: "มีชีวิต", color: "#00AF75" },
  { value: "เสียชีวิต", text: "เสียชีวิต", color: "#EF4444" },
  { value: "หลบหนี", text: "หลบหนี", color: "#A855F7" },
];

interface LifeStatusLog {
  referralLifeStatus: string;
  referralLifeStatusNote: string;
  name: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  LifeStatusModal */
/* ------------------------------------------------------------------ */
function LifeStatusModal({
  open,
  onClose,
  onSave,
  logs,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (payload: { referralLifeStatus: string; referralLifeStatusNote: string; referralLifeStatusLogs: LifeStatusLog[] }) => void;
  logs: LifeStatusLog[];
}) {
  const { profile } = useAuthStore();
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ status?: string; note?: string }>({});

  // Populate form with latest log entry when modal opens 
  useEffect(() => {
    if (open && logs.length > 0) {
      const latest = [...logs].reverse()[0];
      setStatus(latest.referralLifeStatus || "");
      setNote(latest.referralLifeStatusNote || "");
    } else if (open) {
      setStatus("");
      setNote("");
    }
    setErrors({});
  }, [open, logs]);

  const validate = (): boolean => {
    const newErrors: { status?: string; note?: string } = {};
    if (!status) newErrors.status = "กรุณาเลือกสถานะของผู้ป่วย";
    if (!note.trim()) newErrors.note = "กรุณากรอกรายละเอียด";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const userName = profile?.fullName || profile?.username || "ไม่ทราบ";
    const newLog: LifeStatusLog = {
      referralLifeStatus: status,
      referralLifeStatusNote: note,
      name: userName,
      updatedAt: new Date().toISOString(),
    };
    const updatedLogs = [...logs, newLog];

    onSave({
      referralLifeStatus: status,
      referralLifeStatusNote: note,
      referralLifeStatusLogs: updatedLogs,
    });
  };

  // Build display data for log history
  const logNames = logs.length > 0
    ? logs.map((l) => l.name).join(", ")
    : "ยังไม่มีการบันทึก";
  const logDates = logs.length > 0
    ? logs.map((l) => fmtDate(l.updatedAt)).join(", ")
    : "ยังไม่มีการบันทึก";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "8px", overflow: "hidden" } }}
    >
      {/* Green header */}
      <Box sx={{
        bgcolor: "#00AF75",
        px: "24px",
        py: "16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1.125rem" }}>
          สถานะของผู้ป่วยปัจจุบัน
        </Typography>
        <IconButton onClick={onClose} sx={{ color: "#fff", p: "4px" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: "24px", py: "24px" }}>
        {/* Status dropdown */}
        <FormControl fullWidth error={!!errors.status} sx={{ mb: "20px" }}>
          <InputLabel
            id="life-status-label"
            shrink
            sx={{
              fontSize: "0.875rem",
              color: "#374151",
              fontWeight: 500,
              transform: "translate(0, -8px)",
              position: "relative",
              "&.Mui-focused": { color: "#374151" },
            }}
          >
            สถานะของผู้ป่วย <span style={{ color: "#EF4444" }}>*</span>
          </InputLabel>
          <Select
            labelId="life-status-label"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              if (errors.status) setErrors((prev) => ({ ...prev, status: undefined }));
            }}
            displayEmpty
            size="small"
            sx={{
              mt: "8px",
              borderRadius: "6px",
              "& .MuiSelect-select": { py: "10px", pr: status ? "48px !important" : undefined },
            }}
            endAdornment={
              status ? (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatus("");
                  }}
                  sx={{ position: "absolute", right: 28, p: "2px" }}
                >
                  <CloseIcon sx={{ fontSize: 18, color: "#9ca3af" }} />
                </IconButton>
              ) : null
            }
            renderValue={(val) => {
              if (!val) return <span style={{ color: "#9ca3af" }}>เลือกสถานะ</span>;
              const opt = LIFE_STATUS_OPTIONS.find((o) => o.value === val);
              return <span style={{ color: opt?.color || "#111827" }}>{opt?.text || val}</span>;
            }}
          >
            {LIFE_STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                <span style={{ color: opt.color, fontWeight: 500 }}>{opt.text}</span>
              </MenuItem>
            ))}
          </Select>
          {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
        </FormControl>

        {/* Detail textarea */}
        <Box sx={{ mb: "20px" }}>
          <Typography sx={{ fontSize: "0.875rem", color: "#374151", fontWeight: 500, mb: "8px" }}>
            รายละเอียด <span style={{ color: "#EF4444" }}>*</span>
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={6}
            placeholder="คำอธิบาย"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              if (errors.note) setErrors((prev) => ({ ...prev, note: undefined }));
            }}
            error={!!errors.note}
            helperText={errors.note}
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": { borderRadius: "6px" },
            }}
          />
        </Box>

        {/* Log history info */}
        <Box sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          borderTop: "1px solid #E5E7EB",
          pt: "16px",
        }}>
          <Box>
            <Typography sx={{ fontSize: "0.875rem", color: "#6b7280", mb: "4px" }}>
              ผู้บันทึกข้อมูล
            </Typography>
            <Typography sx={{ fontSize: "0.875rem", color: "#111827" }}>
              {logNames}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: "0.875rem", color: "#6b7280", mb: "4px" }}>
              เวลา/วันที่ บันทึกข้อมูล
            </Typography>
            <Typography sx={{ fontSize: "0.875rem", color: "#111827" }}>
              {logDates}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      {/* Footer buttons */}
      <Box sx={{
        px: "24px",
        py: "16px",
        borderTop: "1px solid #E5E7EB",
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
      }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon sx={{ fontSize: "18px !important" }} />}
          onClick={onClose}
          sx={{
            textTransform: "none",
            borderColor: "#D1D5DB",
            color: "#374151",
            fontWeight: 500,
            borderRadius: "6px",
            px: "20px",
            "&:hover": { bgcolor: "#F9FAFB", borderColor: "#D1D5DB" },
          }}
        >
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon sx={{ fontSize: "18px !important" }} />}
          onClick={handleSave}
          sx={{
            bgcolor: "#00AF75",
            textTransform: "none",
            fontWeight: 500,
            borderRadius: "6px",
            px: "20px",
            boxShadow: "none",
            "&:hover": { bgcolor: "#009966", boxShadow: "none" },
          }}
        >
          บันทึกข้อมูล
        </Button>
      </Box>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  PatientInfoSection */
/* ------------------------------------------------------------------ */
function PatientInfoSection({ patient, doc }: { patient: any; doc: any }) {
  const [showAddress, setShowAddress] = React.useState(true);
  const [showEmergency, setShowEmergency] = React.useState(true);

  return (
    <Box sx={{ border: "1px solid #E5E7EB", borderRadius: "8px", overflow: "hidden" }}>
      <SectionHeader title="ข้อมูลผู้ป่วย" />
      <Box sx={{ p: 2 }}>
        {/* เลขที่บัตรประชาชน */}
        <Box sx={{ mb: 1 }}>
          <Typography sx={{ fontSize: "0.875rem", color: "#6b7280", fontWeight: 600 }}>
            เลขที่บัตรประชาชน/หนังสือเดินทาง
          </Typography>
          <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "#111827", ml: 2 }}>
            {patient.patient_pid || "-"}
          </Typography>
        </Box>

        {/* คำนำหน้า / ชื่อ / นามสกุล — 3 columns */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, p: 1, mb: 1 }}>
          <InfoField label="คำนำหน้า" value={patient.patient_prefix} />
          <InfoField label="ชื่อ" value={patient.patient_firstname} />
          <InfoField label="นามสกุล" value={patient.patient_lastname} />
        </Box>

        {/* Image row: profile image + sex/birthday + blood group/age */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, p: 1, mb: 1 }}>
          {/* Column 1: Profile image */}
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Box
              component="label"
              sx={{
                width: "100%",
                maxWidth: 250,
                height: 150,
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                bgcolor: "#e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                cursor: "pointer",
              }}
            >
              <img
                src="/images/userPlaceholder2.jpg"
                alt="patient"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
          </Box>

          {/* Column 2: เพศ + วันเกิด */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <InfoField label="เพศ" value={patient.patient_sex} />
            <InfoField label="วันเกิด" value={formatBirthdayThai(patient.patient_birthday)} />
          </Box>

          {/* Column 3: กรุ๊ปเลือด + อายุ */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <InfoField label="กรุ๊ปเลือด" value={patient.patient_blood_group} />
            <InfoField label="อายุ" value={calculateAge(patient.patient_birthday)} />
          </Box>
        </Box>

        {/* HN / AN / VN ล่าสุด — 3 columns */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, mt: 2, mb: 1 }}>
          <InfoField label="HN" value={doc.HN} />
          <InfoField label="AN" value={doc.AN} />
          <InfoField label="VN ล่าสุด" value={doc.VN} />
        </Box>

        {/* สิทธิ์การรักษา / สิทธิ์สถานพยาบาล — 2 columns  */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 1 }}>
          <InfoField label="สิทธิ์การรักษา" value={patient.patient_treatment || patient.patient_right || doc.data?.patient?.patient_treatment || doc.data?.patient?.patient_right} />
          <InfoField label="สิทธิ์สถานพยาบาล" value={patient.patient_treatment_hospital || patient.patient_hospital_right || doc.data?.patient?.patient_treatment_hospital || doc.data?.patient?.patient_hospital_right} />
        </Box>

        {/* ── ที่อยู่ผู้ป่วย — collapsible  ── */}
        <Box
          onClick={() => setShowAddress(!showAddress)}
          sx={{ borderBottom: "1px solid #CBD5E1", display: "flex", alignItems: "center", justifyContent: "space-between", p: 2, cursor: "pointer" }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: "1.125rem", color: "#036245" }}>
            ที่อยู่ผู้ป่วย
          </Typography>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transition: "transform 0.2s", transform: showAddress ? "rotate(180deg)" : "rotate(0deg)" }}>
            <path d="M4 6l4 4 4-4" stroke="#6b7280" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Box>
        {showAddress && (
          <Box sx={{ mt: 1 }}>
            {/* Row 1: บ้านเลขที่ / หมู่ / ถนน/สาย / ซอย/ตรอก — 4 columns */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 2, p: 2, borderBottom: "1px solid #e5e7eb" }}>
              <InfoField label="บ้านเลขที่" value={patient.patient_house} />
              <InfoField label="หมู่" value={patient.patient_moo} />
              <InfoField label="ถนน/สาย" value={patient.patient_road} />
              <InfoField label="ซอย/ตรอก" value={patient.patient_alley} />
            </Box>
            {/* Row 2: จังหวัด / ตำบล/แขวง / อำเภอ/เขต — 3 columns */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, p: 2, borderBottom: "1px solid #e5e7eb" }}>
              <InfoField label="จังหวัด" value={patient.patient_changwat} />
              <InfoField label="ตำบล/แขวง" value={patient.patient_tambon} />
              <InfoField label="อำเภอ/เขต" value={patient.patient_amphur} />
            </Box>
            {/* Row 3: รหัสไปรษณีย์ / เบอร์โทรศัพท์ — 2 columns */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, p: 2 }}>
              <InfoField label="รหัสไปรษณีย์" value={patient.patient_zip_code} />
              <InfoField label="เบอร์โทรศัพท์" value={patient.patient_mobile_phone} />
            </Box>
          </Box>
        )}

        {/* ── ติดต่อในกรณีฉุกเฉิน — collapsible ── */}
        <Box
          onClick={() => setShowEmergency(!showEmergency)}
          sx={{ borderBottom: "1px solid #CBD5E1", display: "flex", alignItems: "center", justifyContent: "space-between", p: 2, cursor: "pointer" }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: "1.125rem", color: "#036245" }}>
            ติดต่อในกรณีฉุกเฉิน
          </Typography>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transition: "transform 0.2s", transform: showEmergency ? "rotate(180deg)" : "rotate(0deg)" }}>
            <path d="M4 6l4 4 4-4" stroke="#6b7280" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Box>
        {showEmergency && (
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, p: 2, borderBottom: "1px solid #e5e7eb" }}>
              <InfoField label="ชื่อ-นามสกุล" value={patient.patient_contact_full_name || doc.emergencyContactFullName} />
              <InfoField label="หมายเลขโทรศัพท์" value={patient.patient_contact_mobile_phone || doc.emergencyContactTel} />
              <InfoField label="เกี่ยวข้องเป็น" value={patient.patient_contact_relation || doc.emergencyContactRelated} />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  CancelReferralModal */
/* ------------------------------------------------------------------ */
function CancelReferralModal({
  open,
  onClose,
  onSave,
  deliveryPeriod,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (payload: { referralStatus: number; referralStatusDetailCurrent: number; referralStatusDetailCurrentText: string }) => void;
  deliveryPeriod?: any;
}) {
  const { findStatusDetail } = useReferralStore();
  const profile = useAuthStore((s) => s.profile);
  const optionHospital = useAuthStore((s) => s.optionHospital);
  const [reason, setReason] = useState<number | "">("");
  const [detail, setDetail] = useState("");
  const [errors, setErrors] = useState<{ reason?: string; detail?: string }>({});
  const [reasonOptions, setReasonOptions] = useState<{ value: number; name: string }[]>([]);

  // Fetch cancel reason options when modal opens
  useEffect(() => {
    if (!open) return;
    setReason("");
    setDetail("");
    setErrors({});

    const fetchOptions = async () => {
      try {
        // Determine referral kind flags from deliveryPeriod 
        const kindName = deliveryPeriod?.referralKind?.name || "";
        const params: any = {
          statusType: "ยกเลิก",
          isActive: true,
        };
        if (kindName === "OPD" || kindName === "ผู้ป่วยนอก") params.isOpd = true;
        else if (kindName === "IPD" || kindName === "ผู้ป่วยใน") params.isIpd = true;
        else if (kindName === "EMERGENCY" || kindName === "ฉุกเฉิน") params.isEr = true;

        // Pass hospital param
        const roleName = profile?.permissionGroup?.role?.name;
        const profileHospitalId = (profile?.permissionGroup as any)?.hospital?.id
          || profile?.hospital?.id;
        if (roleName === "superAdmin" && optionHospital) {
          params.hospital = Number(optionHospital);
        } else if (roleName === "superAdminHospital" && profileHospitalId) {
          params.hospital = Number(profileHospitalId);
        } else if (roleName === "superAdminZone" && profileHospitalId) {
          params.hospital = Number(profileHospitalId);
        }

        // Get hospital from document for client-side filtering if no API filter
        const docHospitalId = typeof deliveryPeriod?.fromHospital === "object"
          ? deliveryPeriod?.fromHospital?.id
          : deliveryPeriod?.fromHospital;

        const res = await findStatusDetail(params);
        let items = res?.referralStatusDetails || res || [];

        // If no hospital filter was sent and we have doc hospital, filter client-side
        if (!params.hospital && docHospitalId && Array.isArray(items)) {
          items = items.filter((item: any) => {
            const itemHospId = item.hospital?.id || item.hospital;
            return itemHospId === Number(docHospitalId);
          });

        }

        setReasonOptions(
          Array.isArray(items)
            ? items.map((item: any) => ({ value: item.id, name: item.name }))
            : []
        );
      } catch {
        setReasonOptions([]);
      }
    };
    fetchOptions();
  }, [open, deliveryPeriod, findStatusDetail, profile, optionHospital]);

  const validate = (): boolean => {
    const newErrors: { reason?: string; detail?: string } = {};
    if (!reason) newErrors.reason = "กรุณาเลือกเหตุผล";
    if (!detail.trim()) newErrors.detail = "กรุณากรอกรายละเอียด";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      referralStatus: 5, // Status ID for cancellation 
      referralStatusDetailCurrent: reason as number,
      referralStatusDetailCurrentText: detail,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "8px", overflow: "hidden" } }}
    >
      {/* Green header */}
      <Box sx={{
        bgcolor: "#00AF75",
        px: "24px",
        py: "16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1.125rem" }}>
          ยืนยันการยกเลิกการส่งตัวผู้ป่วย
        </Typography>
        <IconButton onClick={onClose} sx={{ color: "#fff", p: "4px" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: "24px", py: "24px" }}>
        {/* Reason dropdown */}
        <FormControl fullWidth error={!!errors.reason} sx={{ mb: "20px" }}>
          <Typography sx={{ fontSize: "0.875rem", color: "#374151", fontWeight: 500, mb: "8px" }}>
            เหตุผลการยกเลิก <span style={{ color: "#EF4444" }}>*</span>
          </Typography>
          <Select
            value={reason}
            onChange={(e) => {
              setReason(e.target.value as number);
              if (errors.reason) setErrors((prev) => ({ ...prev, reason: undefined }));
            }}
            displayEmpty
            size="small"
            MenuProps={{ PaperProps: { sx: { maxHeight: 250 } } }}
            sx={{
              bgcolor: "#F8FFFE",
              borderRadius: 1,
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#00AF75" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#00AF75", borderWidth: 2 },
              "& .MuiSelect-select": { py: "10px", pr: reason ? "48px !important" : undefined },
            }}
            endAdornment={
              reason ? (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReason("");
                  }}
                  sx={{ position: "absolute", right: 28, p: "2px" }}
                >
                  <CloseIcon sx={{ fontSize: 18, color: "#9ca3af" }} />
                </IconButton>
              ) : null
            }
            renderValue={(val) => {
              if (!val) return <span style={{ color: "#9ca3af" }}>เลือกเหตุผลการยกเลิก</span>;
              const opt = reasonOptions.find((o) => o.value === val);
              return opt?.name || String(val);
            }}
          >
            {reasonOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.name}
              </MenuItem>
            ))}
          </Select>
          {errors.reason && <FormHelperText>{errors.reason}</FormHelperText>}
        </FormControl>

        {/* Detail text input */}
        <Box>
          <Typography sx={{ fontSize: "0.875rem", color: "#374151", fontWeight: 500, mb: "8px" }}>
            รายละเอียด <span style={{ color: "#EF4444" }}>*</span>
          </Typography>
          <TextField
            fullWidth
            placeholder="กรุณากรอกรายละเอียด"
            value={detail}
            onChange={(e) => {
              setDetail(e.target.value);
              if (errors.detail) setErrors((prev) => ({ ...prev, detail: undefined }));
            }}
            error={!!errors.detail}
            helperText={errors.detail}
            size="small"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px" } }}
          />
        </Box>
      </DialogContent>

      {/* Footer buttons */}
      <Box sx={{
        px: "24px",
        py: "16px",
        borderTop: "1px solid #E5E7EB",
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
      }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon sx={{ fontSize: "18px !important" }} />}
          onClick={onClose}
          sx={{
            textTransform: "none",
            borderColor: "#00AF75",
            color: "#00AF75",
            fontWeight: 500,
            borderRadius: "6px",
            px: "20px",
            "&:hover": { bgcolor: "#f0fdf4", borderColor: "#00AF75" },
          }}
        >
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon sx={{ fontSize: "18px !important" }} />}
          onClick={handleSave}
          sx={{
            bgcolor: "#00AF75",
            textTransform: "none",
            fontWeight: 500,
            borderRadius: "6px",
            px: "20px",
            boxShadow: "none",
            "&:hover": { bgcolor: "#009966", boxShadow: "none" },
          }}
        >
          บันทึกข้อมูล
        </Button>
      </Box>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */
function RequestReferOutDetailPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const id = searchParams.get("id");
  // Detect if we are on /refer-out/in (uses referral-info / referral-info-ipd)
  // vs /request-refer-out/in (uses referral-request-info)
  const isReferOutRoute = pathname?.startsWith("/refer-out");
  const isReferBackRoute = pathname?.startsWith("/refer-back");

  const { findOneReferral, findGroupCase, updateReferral, getPatientHistory } = useReferralStore();
  const { uploadFile } = useHospitalStore();

  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<any>(null);
  const [groupDocs, setGroupDocs] = useState<any[]>([]);
  const [lifeStatusModalOpen, setLifeStatusModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [viewHospitalsModalOpen, setViewHospitalsModalOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await findOneReferral(id);
      const referDoc = res?.referralDocument || res;
      setDoc(referDoc);

      // Fetch group case if available
      const gcId = referDoc?.groupCase?.id || referDoc?.groupCase;
      if (gcId) {
        try {
          const groupRes = await findGroupCase(String(gcId));
          setGroupDocs(groupRes?.referralDocuments || []);
        } catch {
          setGroupDocs([]);
        }
      }
    } catch (err) {
      console.error("Error fetching referral detail:", err);
    } finally {
      setLoading(false);
    }
  }, [id, findOneReferral, findGroupCase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle add document from shared TreatmentDocuments component — same logic as original
  const handleAddDocument = async (newDoc: TreatDocItem) => {
    if (!doc?.id) return;
    try {
      const existingFiles = doc.referralFiles || [];
      // Convert DocumentItem → API format (MedicalDocument)
      const apiDoc = {
        id: Math.floor(Math.random() * 9000) + 1000,
        isDelete: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "currentUser",
        code: newDoc.docCode,
        name: newDoc.docName,
        type: newDoc.fileType,
        detail: newDoc.detail,
        url: newDoc.files.map((f) => ({ url: f.url, name: f.name, size: f.size })),
        textContent: newDoc.fileType === "อื่นๆ" ? newDoc.detail : "",
        clinicName: null,
      };
      const newFiles = [...existingFiles, apiDoc];
      await updateReferral(doc.id, { referralFiles: newFiles });
      setDoc((prev: any) => ({ ...prev, referralFiles: newFiles }));
    } catch (err) {
      console.error("Error uploading file:", err);
    }
  };

  // Handle life status modal save
  const handleLifeStatusSave = async (payload: {
    referralLifeStatus: string;
    referralLifeStatusNote: string;
    referralLifeStatusLogs: LifeStatusLog[];
  }) => {
    if (!doc?.id) return;
    try {
      await updateReferral(doc.id, payload);
      setLifeStatusModalOpen(false);
      // Refresh data 
      await fetchData();
    } catch (err) {
      console.error("Error updating life status:", err);
    }
  };

  // Go to patient treatment history
  const gotoHistoryPatient = async () => {
    if (!doc) return;
    const patient = doc.data?.patient || {};
    const data = {
      hospitalCode: "000000000",
      patientCid: patient.patient_pid,
      patientFirstName: patient.patient_firstname,
      patientLastName: patient.patient_lastname,
    };
    const showToast = (msg: string) => {
      setToastMessage(msg);
      setToastOpen(true);
    };
    try {
      const res = await getPatientHistory(data);
      if (res?.response?.status === "PERMISSION_ERROR") {
        showToast("ขออภัย สถานพยาบาลของท่านยังไม่เปิดใช้งาน กรุณาติดต่อ Health Link 02 026 2333 ต่อ 3456");
        return;
      }
      if (res?.response?.status === "USER_NOT_FOUND") {
        showToast("ขออภัย ไม่พบชื่อของท่านในระบบ กรุณาติดต่อแผนกไอทีของสถานพยาบาล เพื่อเพิ่มรายชื่อของท่าน");
        return;
      }
      if (res?.response?.url) {
        window.open(res.response.url, "_blank");
      } else {
        showToast("ไม่พบประวัติการรักษาของผู้ป่วย");
      }
    } catch (err) {
      console.error("Error getting patient history:", err);
      showToast("ไม่พบประวัติการรักษาของผู้ป่วย");
    }
  };

  // Handle cancel referral
  const handleCancelReferral = async (payload: {
    referralStatus: number;
    referralStatusDetailCurrent: number;
    referralStatusDetailCurrentText: string;
  }) => {
    if (!doc?.id) return;
    try {
      await updateReferral(doc.id, payload);
      setCancelModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error("Error cancelling referral:", err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress sx={{ color: "#16a34a" }} />
      </Box>
    );
  }

  if (!doc) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="error">ไม่พบข้อมูลใบส่งตัว (ID: {id})</Typography>
        <Button onClick={() => router.back()} sx={{ mt: 2 }}>กลับ</Button>
      </Box>
    );
  }

  const patient = doc.data?.patient || {};
  const visitData = doc.data?.visitData || {};
  const healthData = doc.data || {};
  const statusName = doc.referralStatus?.name || "ไม่ทราบ";
  // DB swap convention: fromHospital = destination, toHospital = origin
  const originHospitalName = doc.toHospital?.name || doc.toHospital || "-";
  const destHospitalName = doc.fromHospital?.name || doc.fromHospital || "-";

  // Referral kind — API returns object with .name, not a number
  const referralKindText = doc.referralKind?.name || doc.referralKind || "-";

  // ICD-10
  const icd10List = Array.isArray(visitData.icd10) ? visitData.icd10 : [];
  const icd10MoreList = Array.isArray(visitData.icd10More) ? visitData.icd10More : [];

  // Health data
  const diseases = Array.isArray(healthData.disease) ? healthData.disease : [];
  const drugAllergy = Array.isArray(healthData.drugAllergy) ? healthData.drugAllergy : [];
  const vaccines = Array.isArray(healthData.vaccines) ? healthData.vaccines : [];
  const vaccinesCovid = Array.isArray(healthData.vaccinesCovid) ? healthData.vaccinesCovid : [];
  const drugs = Array.isArray(healthData.drugs) ? healthData.drugs : [];
  const personalDisease = healthData.physicalExam || patient.patient_personal_disease || healthData.patient_personal_disease || "";

  // Documents — convert API referralFiles to DocumentItem format for shared component
  const referralFiles = (doc.referralFiles || []).filter((f: any) => !f.isDelete);
  const documentItems: TreatDocItem[] = referralFiles.map((rf: any, idx: number) => {
    // Format createdAt to Thai Buddhist era
    let formattedDate = "";
    if (rf.createdAt) {
      const d = new Date(rf.createdAt);
      if (!isNaN(d.getTime())) {
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear() + 543;
        const hh = String(d.getHours()).padStart(2, "0");
        const min = String(d.getMinutes()).padStart(2, "0");
        formattedDate = `${dd}/${mm}/${yyyy} ${hh}:${min} น.`;
      }
    }
    return {
      id: rf.id || idx,
      fileName: rf.name || "",
      fileType: rf.name === "อื่นๆ" && rf.textContent ? rf.textContent : (rf.type || "-"),
      docCode: rf.code || "",
      docName: rf.name || "",
      detail: rf.detail || "",
      dateTime: formattedDate,
      files: Array.isArray(rf.url)
        ? rf.url.map((f: any, fi: number) => ({
            id: fi,
            name: f.name || "",
            size: f.size || "",
            file: null as any,
            url: f.url || "",
          }))
        : typeof rf.url === "string" && rf.url
          ? [{ id: 0, name: rf.url.split("/").pop() || "file", size: "", file: null as any, url: rf.url }]
          : [],
    };
  });

  // Delivery periods
  const deliveryPeriods = Array.isArray(doc.deliveryPeriod) ? doc.deliveryPeriod : [];

  // Sorted group case with order 
  // For IPD/EMERGENCY: show only the current record 
  const sortedGroupDocs = (() => {
    const kindName = doc.referralKind?.name || "";
    if (kindName === "IPD" || kindName === "EMERGENCY") {
      const currentIndex = groupDocs.findIndex((item: any) => item.id === doc.id);
      if (currentIndex >= 0) {
        return [{
          ...groupDocs[currentIndex],
          order: groupDocs.length - currentIndex,
          index: currentIndex,
        }];
      }
      return [];
    }
    return groupDocs.map((item: any, idx: number) => ({
      ...item,
      order: groupDocs.length - idx,
      index: idx,
    }));
  })();

  // shouldShowButtons
  const shouldShowButtons = String(id) === String(doc.id);

  // Check if cancel button should show
  const shouldShowCancel = shouldShowButtons &&
    statusName &&
    statusName !== "ยกเลิก" &&
    statusName !== "รับเข้ารักษา" &&
    statusName !== "สิ้นสุดการส่งตัว" &&
    statusName !== "ปฏิเสธการตอบรับ" &&
    statusName !== "เปลี่ยนแปลงนัดหมาย" &&
    statusName !== "ยืนยันนัดหมาย";

  // Check if "ดูรายการสถานพยาบาลที่ส่งไป" button should show — only on /refer-out, not OPD
  const shouldShowViewHospitals = isReferOutRoute &&
    shouldShowButtons &&
    statusName !== "ยกเลิก" &&
    statusName !== "รับเข้ารักษา" &&
    statusName !== "สิ้นสุดการส่งตัว" &&
    statusName !== "เปลี่ยนแปลงนัดหมาย" &&
    statusName !== "ยืนยันนัดหมาย" &&
    referralKindText !== "OPD";

  // Build hospital list 
  const viewHospitals = groupDocs
    .map((item: any) => ({
      id: item.toHospital?.id || item.id,
      name: item.toHospital?.name || "",
      image: item.toHospital?.image || item.toHospital?.logo || "",
      phone: item.toHospital?.phone || item.toHospital?.telephone || "",
      referralStatus: item.referralStatus?.name || "",
      referralStatusDetailCurrent: item.referralStatusDetailCurrent?.name || "",
      detail: item?.referralStatusDetailCurrentText || "",
    }))
    .filter((h: any) => h.name);

  // Check if print button should show
  // Show for any group case document as long as status is not "รอตอบรับ"
  const shouldShowPrint = statusName &&
    statusName !== "รอตอบรับ";

  const lifeStatus = doc.referralLifeStatus || "มีชีวิต";
  const lifeStatusLogs: LifeStatusLog[] = doc.referralLifeStatusLogs || [];

  return (
    <Box sx={{ px: "24px" }}>
      {/* ── Toast notification  ── */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToastOpen(false)}
          severity="error"
          variant="filled"
          sx={{
            width: "100%",
            bgcolor: "#FEE2E2",
            color: "#DC2626",
            fontWeight: 500,
            "& .MuiAlert-icon": { color: "#DC2626" },
            "& .MuiAlert-action .MuiIconButton-root": { color: "#374151" },
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: "#DC2626" }}>ระบบ</Typography>
          <Typography sx={{ fontSize: "0.875rem", color: "#DC2626" }}>{toastMessage}</Typography>
        </Alert>
      </Snackbar>

      {/* ── Life Status Modal ── */}
      <LifeStatusModal
        open={lifeStatusModalOpen}
        onClose={() => setLifeStatusModalOpen(false)}
        onSave={handleLifeStatusSave}
        logs={lifeStatusLogs}
      />

      {/* ── Cancel Referral Modal ── */}
      <CancelReferralModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onSave={handleCancelReferral}
        deliveryPeriod={doc}
      />

      {/* ── View Selected Hospitals Modal (refer-out only) */}
      <Dialog
        open={viewHospitalsModalOpen}
        onClose={() => setViewHospitalsModalOpen(false)}
        maxWidth={false}
        PaperProps={{ sx: { borderRadius: "0.5rem", overflow: "hidden", width: 890, maxWidth: "95vw" } }}
      >
        <Box sx={{ bgcolor: "#3b82f6", px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>รายการสถานพยาบาลที่ส่งไป</Typography>
          <IconButton onClick={() => setViewHospitalsModalOpen(false)} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          {viewHospitals.length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ py: 4, textAlign: "center" }}>ไม่มีข้อมูลสถานพยาบาลที่เลือก</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#036245", "& th": { color: "#fff", fontWeight: 600, fontSize: "0.85rem", textAlign: "center", py: 1.5 } }}>
                    <TableCell>ลำดับ</TableCell>
                    <TableCell>รูปภาพ</TableCell>
                    <TableCell sx={{ textAlign: "left" }}>ชื่อสถานพยาบาล</TableCell>
                    <TableCell>สถานะ</TableCell>
                    <TableCell>เหตุผลการปฏิเสธ</TableCell>
                    <TableCell>รายละเอียดเพิ่มเติม</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {viewHospitals.filter((h: any) => h.name || h.phone || h.image).map((h: any, i: number) => {
                    const badgeColors = getCountBadgeClasses(h.referralStatus || "");
                    return (
                      <TableRow key={h.id} sx={{ borderBottom: "1px solid #e5e7eb", "&:hover": { bgcolor: "#f9fafb" } }}>
                        <TableCell sx={{ width: 60, textAlign: "center" }}>{i + 1}</TableCell>
                        <TableCell sx={{ width: 60, textAlign: "center" }}>
                          <Box component="img" src={h.image || "/images/Image_Avatar.png"} alt={h.name} sx={{ width: 40, height: 40, borderRadius: "50%", mx: "auto", objectFit: "cover" }} />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 500, fontSize: "0.95rem" }}>{h.name}</Typography>
                          {h.phone && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                              <Typography sx={{ fontSize: "0.75rem", color: "#6b7280" }}>📞 {h.phone}</Typography>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          {h.referralStatus ? (
                            <Chip label={h.referralStatus} size="small" sx={{ bgcolor: badgeColors.bgcolor, color: badgeColors.color, fontWeight: 500, fontSize: "0.75rem" }} />
                          ) : "-"}
                        </TableCell>
                        <TableCell sx={{ textAlign: "center", fontWeight: 500 }}>{h.referralStatusDetailCurrent || "-"}</TableCell>
                        <TableCell sx={{ textAlign: "center", fontWeight: 500 }}>{h.detail || "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Header row ── */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: "8px" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <IconButton
            onClick={() => router.back()}
            sx={{
              width: 40,
              height: 40,
              borderRadius: "8px",
              border: "1px solid #D1D5DB",
              color: "#000",
              bgcolor: "#fff",
              "&:hover": { bgcolor: "#F9FAFB" },
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Typography sx={{ fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.4, color: "#00AF75" }}>
            ข้อมูลใบส่งตัวผู้ป่วย
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* ดูรายการสถานพยาบาลที่ส่งไป — only on /refer-out, not OPD */}
          {shouldShowViewHospitals && (
            <Button
              variant="contained"
              onClick={() => setViewHospitalsModalOpen(true)}
              startIcon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
                </svg>
              }
              sx={{
                bgcolor: "#3b82f6",
                "&:hover": { bgcolor: "#091b63" },
                "&:active": { bgcolor: "#0735ed" },
                textTransform: "none",
                fontWeight: 400,
                fontSize: "16px",
                fontFamily: "Sarabun, sans-serif",
                color: "#fff",
                borderRadius: "4px",
                px: "16px",
                py: "8px",
                minHeight: "40px",
                boxShadow: "none",
                border: "none",
              }}
            >
              ดูรายการสถานพยาบาลที่ส่งไป
            </Button>
          )}
          {shouldShowCancel && (
            <Button
              variant="contained"
              onClick={() => setCancelModalOpen(true)}
              startIcon={<CloseIcon sx={{ fontSize: "22px !important" }} />}
              sx={{
                bgcolor: "#F25555",
                "&:hover": { bgcolor: "#FF808E" },
                "&:active": { bgcolor: "#DC4040" },
                textTransform: "none",
                fontWeight: 400,
                fontSize: "16px",
                fontFamily: "Sarabun, sans-serif",
                color: "#FAFAF9",
                borderRadius: "4px",
                px: "16px",
                py: "8px",
                minHeight: "40px",
                boxShadow: "none",
              }}
            >
              ยกเลิกการส่งตัวผู้ป่วย
            </Button>
          )}
        </Box>
      </Box>

      {/* ── Breadcrumb ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: "24px" }}>
        <Typography
          sx={{ fontSize: "1rem", color: "#00AF75", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
          onClick={() => router.back()}
        >
          สร้างใบส่งตัว
        </Typography>
        <Typography sx={{ fontSize: "1rem", color: "#9CA3AF" }}>&gt;</Typography>
        <Typography sx={{ fontSize: "1rem", color: "#00AF75" }}>
          เลือกสถานพยาบาลปลายทาง
        </Typography>
      </Box>

      {/* ── Group Case Cards ── */}
      {sortedGroupDocs.length > 0 && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, gap: "16px", mb: "16px" }}>
          {sortedGroupDocs.map((gDoc: any) => {
            const isActive = gDoc.id === doc.id;
            const gStatus = gDoc.referralStatus?.name || "";
            const badgeColors = getCountBadgeClasses(gStatus);
            return (
              <Box
                key={gDoc.id}
                onClick={() => {
                  if (!isActive) router.push(`/request-refer-out/in?id=${gDoc.id}`);
                }}
                sx={{
                  bgcolor: isActive ? "#00AF75" : "#fff",
                  color: isActive ? "#fff" : "#000",
                  border: isActive ? "none" : "1px solid #00AF75",
                  borderRadius: "8px",
                  p: "16px",
                  cursor: isActive ? "default" : "pointer",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: "8px" }}>
                  <Typography sx={{ fontWeight: 600, fontSize: "1.125rem", lineHeight: 1.4 }}>
                    ส่งตัวครั้งที่ {gDoc.order}
                  </Typography>
                  <Chip
                    label={gStatus}
                    size="small"
                    sx={{
                      bgcolor: badgeColors.bgcolor,
                      color: badgeColors.color,
                      fontWeight: 500,
                      fontSize: "0.75rem",
                      height: 22,
                      borderRadius: "9999px",
                    }}
                  />
                </Box>
                <Typography sx={{ fontSize: "1rem", mb: "4px" }}>
                  <b>จาก :</b>{" "}<span style={{ fontWeight: 400 }}>{gDoc.fromHospital?.name || "-"}</span>
                </Typography>
                <Typography sx={{ fontSize: "1rem" }}>
                  <b>ไปยัง :</b>{" "}
                  <span style={{
                    fontWeight: 400,
                    ...((doc.referralKind?.name === "IPD" || doc.referralKind?.name === "EMERGENCY") && !gDoc.toHospital
                      ? { color: "#EAB308" }
                      : {}),
                  }}>
                    {(doc.referralKind?.name === "IPD" || doc.referralKind?.name === "EMERGENCY") && !gDoc.toHospital
                      ? "รอตอบรับ"
                      : gDoc.toHospital?.name || "-"}
                  </span>
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}

      {/* ── Main panel (white bg) ── */}
      <Paper sx={{ borderRadius: "8px", overflow: "hidden", mb: 3, bgcolor: "#fff", p: "16px" }}>
        {/* No. + Status life + History buttons */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: "12px" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Typography sx={{ fontSize: "1.125rem", fontWeight: 600, color: "#036245", lineHeight: "28px", fontFamily: "Sarabun, sans-serif", mr: "8px" }}>
              {`No .${doc.runNumber || ""}`}
            </Typography>
            <Box
              onClick={() => setLifeStatusModalOpen(true)}
              sx={{
                bgcolor: getStatusBgColor(lifeStatus),
                color: "#fff",
                borderRadius: "9999px",
                px: "16px",
                py: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                userSelect: "none",
                boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
                transition: "box-shadow 0.15s, transform 0.15s",
                "&:hover": { boxShadow: "0 3px 6px rgba(0,0,0,0.16)" },
                "&:active": { transform: "scale(0.95)" },
              }}
            >
              <Typography sx={{ fontSize: "1rem" }}>
                {lifeStatus}
              </Typography>
              <EpEditIcon size={22} color="#fff" />
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <Button
              variant="outlined"
              onClick={gotoHistoryPatient}
              startIcon={
                <Image
                  src="/images/logo2.png"
                  alt="Health Link"
                  width={35}
                  height={35}
                  style={{ objectFit: "contain" }}
                />
              }
              sx={{
                borderColor: "#00AF75",
                color: "#00AF75",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "1rem",
                borderRadius: "8px",
                px: "16px",
                py: "4px",
                "&:hover": { bgcolor: "#f0fdf4", borderColor: "#00AF75" },
              }}
            >
              ประวัติการรักษา
            </Button>
            {shouldShowPrint && (
              <Button
                variant="outlined"
                onClick={() => {
                  // Open print page in new tab — it will replace itself with PDF blob
                  // Result: detail tab stays + print tab becomes blob tab 
                  const printUrl = `/print-refer?id=${doc.id}&referraltype=refer-out&isWatch=true&printReferral=true`;
                  window.open(printUrl, "_blank");
                }}
                startIcon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                }
                sx={{
                  borderColor: "#3B82F6",
                  color: "#3B82F6",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "1rem",
                  borderRadius: "8px",
                  px: "16px",
                  py: "4px",
                  "&:hover": { bgcolor: "#EFF6FF", borderColor: "#3B82F6" },
                }}
              >
                พิมพ์เอกสารส่งตัว
              </Button>
            )}
          </Box>
        </Box>

        {/* ── Two-column: Referral Info + Patient Info ── */}
        <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: "24px" }}>
          {/* Left: ข้อมูลใบส่งตัว */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ border: "1px solid #E5E7EB", borderRadius: "8px", overflow: "hidden" }}>
              <SectionHeader
                title="ข้อมูลใบส่งตัว"
                right={
                  <Chip
                    label={statusName}
                    size="small"
                    sx={{
                      ...getCountBadgeClasses(statusName),
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      border: "1px solid #FEFCE8",
                    }}
                  />
                }
              />
              <Box sx={{ p: 2 }}>
                {/* Delivery period
                    - IPD/ER detail (IPD/ER on /refer-out) → bordered card, "ข้อมูลวันและเวลา", 2 cols, yellow bg
                    - OPD detail / OPD detail → "ระยะเวลารับรองสิทธิ์", 4 cols, กรุณาใช้สิทธิ์ */}
                {deliveryPeriods.length > 0 && doc.referralDeliveryPeriod != null && (() => {

                  const isIPDorERRoute = isReferOutRoute && (referralKindText === "IPD" || referralKindText === "EMERGENCY");
                  const periodId = doc.referralDeliveryPeriod?.id;

                  if (isIPDorERRoute) {
                    /* ── IPD/ER on /refer-out → IPD/ER detail style ── */
                    return (
                      <Box sx={{ border: "1px solid #E5E7EB", borderRadius: 1, mb: 2 }}>
                        <Box sx={{ borderBottom: "1px solid #E5E7EB", px: 2, py: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography sx={{ fontWeight: 600, fontSize: "1.125rem", color: "#036245" }}>ข้อมูลวันและเวลา</Typography>
                        </Box>
                        <Box sx={{ p: 2 }}>
                          {deliveryPeriods.map((period: any, idx: number) => (
                            <Box key={idx}>
                              {doc.referralDeliveryPeriod?.name && (
                                <Typography sx={{ fontWeight: 700, mb: 1, p: "8px" }}>{doc.referralDeliveryPeriod.name}</Typography>
                              )}
                              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                                <Box>
                                  <Typography sx={{ fontSize: "0.875rem", color: "#374151", mb: "4px" }}>วันที่เริ่มต้น</Typography>
                                  <Typography sx={{
                                    fontWeight: 700, fontSize: "0.95rem",
                                    bgcolor: "#FEFCE8", borderLeft: "4px solid #FEFCE8",
                                    borderRadius: "4px 0 0 4px", p: "12px",
                                  }}>
                                    {fmtDateThaiDirect(period.endDelivery)}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography sx={{ fontSize: "0.875rem", color: "#374151", mb: "4px" }}>เวลา</Typography>
                                  <Typography sx={{
                                    fontWeight: 700, fontSize: "0.95rem",
                                    bgcolor: "#FEFCE8", borderLeft: "4px solid #FEFCE8",
                                    borderRadius: "4px 0 0 4px", p: "12px",
                                  }}>
                                    {fmtTimeDirect(period.endDelivery)}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          ))}
                          {/* ตอบรับภายในวันที่ */}
                          {doc.isEndAccept && (
                            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 2 }}>
                              <Box>
                                <Typography sx={{ fontSize: "0.875rem", color: "#374151", mb: "4px" }}>ตอบรับภายในวันที่</Typography>
                                <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>{fmtDateThaiDirect(doc.endAccept)}</Typography>
                              </Box>
                              <Box>
                                <Typography sx={{ fontSize: "0.875rem", color: "#374151", mb: "4px" }}>เวลา</Typography>
                                <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>{fmtTimeDirect(doc.endAccept)}</Typography>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    );
                  }

                  /* ── OPD / request-refer-out → OPD detail style (bordered card + ? icon) ── */
                  return (
                    <Box sx={{ border: "1px solid #E5E7EB", borderRadius: "8px", mb: 2 }}>
                      {/* Header with border-bottom divider + tooltip icon */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E5E7EB", px: 2, py: 1.5 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: "1.125rem" }}>ระยะเวลารับรองสิทธิ์</Typography>
                        <Tooltip
                          title={
                            <Box sx={{ p: 1 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: "1rem", mb: 1 }}>ระยะเวลารับรองสิทธิ์แต่ละแบบจะมีผลกับการนัดหมาย</Typography>
                              <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
                                <Typography sx={{ fontWeight: 600, minWidth: 130 }}>ใช้ได้ครั้งเดียว</Typography>
                                <Typography>จะไม่สามารถนัดรักษาต่อเนื่องได้ ขอบเขตของเวลานัดหมายจะอยู่ในเวลาที่กำหนดเป็นต้นไปภายในวันที่กำหนด</Typography>
                              </Box>
                              <Box sx={{ display: "flex", gap: 2 }}>
                                <Typography sx={{ fontWeight: 600, minWidth: 130 }}>กำหนดช่วง และ อื่นๆ</Typography>
                                <Typography>สามารถกำหนดนัดหมายได้ภายในช่วงเวลาที่กำหนดเท่านั้น</Typography>
                              </Box>
                            </Box>
                          }
                          placement="top"
                          arrow
                          slotProps={{ tooltip: { sx: { maxWidth: 500, bgcolor: "#374151", p: 2 } } }}
                        >
                          <HelpOutlineIcon sx={{ color: "#9CA3AF", fontSize: 20, cursor: "pointer", "&:hover": { color: "#6B7280" } }} />
                        </Tooltip>
                      </Box>
                      {/* Content */}
                      <Box sx={{ p: 2 }}>
                        {deliveryPeriods.map((period: any, idx: number) => (
                          <Box key={idx}>
                            <Typography sx={{ fontWeight: 700, mb: 1, p: 1 }}>
                              {doc.referralDeliveryPeriod?.name || "-"}
                            </Typography>
                            {periodId === 1 ? (
                              /* periodId 1 (ใช้ได้ครั้งเดียว): 2 cols, uses endDelivery for both date & time */
                              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                                <Box>
                                  <Typography sx={{ fontSize: "0.875rem", color: "#374151" }}>วันที่เริ่มต้น</Typography>
                                  <Typography sx={{ fontWeight: 700 }}>{fmtDateThaiDirect(period.endDelivery)}</Typography>
                                </Box>
                                <Box>
                                  <Typography sx={{ fontSize: "0.875rem", color: "#374151" }}>เวลา</Typography>
                                  <Typography sx={{ fontWeight: 700 }}>{fmtTimeDirect(period.endDelivery)}</Typography>
                                </Box>
                              </Box>
                            ) : (
                              /* periodId 2-7: 4 cols
                                 Logic: periodId===2 → col2 time from startDelivery; periodId 3-7 → col2 time from endDelivery */
                              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 2, p: 1 }}>
                                <Box>
                                  <Typography sx={{ fontSize: "0.875rem", color: "#374151" }}>วันที่เริ่มต้น</Typography>
                                  <Typography sx={{ fontWeight: 700 }}>{fmtDateThaiDirect(period.startDelivery || period.endDelivery)}</Typography>
                                </Box>
                                <Box>
                                  <Typography sx={{ fontSize: "0.875rem", color: "#374151" }}>เวลา</Typography>
                                  <Typography sx={{ fontWeight: 700 }}>
                                    {periodId === 2
                                      ? fmtTimeDirect(period.startDelivery || period.endDelivery)
                                      : fmtTimeDirect(period.endDelivery)}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography sx={{ fontSize: "0.875rem", color: "#374151" }}>วันหมดอายุ</Typography>
                                  <Typography sx={{ fontWeight: 700 }}>{fmtDateThaiDirect(period.endDelivery)}</Typography>
                                </Box>
                                <Box>
                                  <Typography sx={{ fontSize: "0.875rem", color: "#374151" }}>เวลา</Typography>
                                  <Typography sx={{ fontWeight: 700 }}>{fmtTimeDirect(period.endDelivery)}</Typography>
                                </Box>
                              </Box>
                            )}
                          </Box>
                        ))}
                        {/* ตอบรับภายในวันที่ */}
                        {doc.isEndAccept && (
                          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 2, p: 1 }}>
                            <Box>
                              <Typography sx={{ fontSize: "0.875rem", color: "#374151" }}>ตอบรับภายในวันที่</Typography>
                              <Typography sx={{ fontWeight: 700 }}>{fmtDateThaiDirect(doc.endAccept)}</Typography>
                            </Box>
                            <Box>
                              <Typography sx={{ fontSize: "0.875rem", color: "#374151" }}>เวลา</Typography>
                              <Typography sx={{ fontWeight: 700 }}>{fmtTimeDirect(doc.endAccept)}</Typography>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                })()}

                {/* ข้อมูลสถานพยาบาล */}
                {(() => {
                  const isIPDorER = referralKindText === "IPD" || referralKindText === "EMERGENCY";
                  const isWaiting = statusName === "รอตอบรับ";
                  // Labels depend on route path; for refer-out: สถานพยาบาลปลายทาง
                  const hospLabel = "สถานพยาบาลปลายทาง";
                  // hospitalFrom: for refer-out uses toHospital (DB swap)
                  const hospValue = doc.toHospital?.name || "-";
                  // Show "รอตอบรับ" in yellow for IPD/ER when status is รอตอบรับ
                  const showWaiting = isIPDorER && isWaiting;
                  // Patient type display
                  const kindDisplay = referralKindText === "IPD" ? "IPD - ผู้ป่วยใน"
                    : referralKindText === "EMERGENCY" ? "Emergency - ผู้ป่วยฉุกเฉิน"
                    : referralKindText;
                  const kindColor = referralKindText === "IPD" ? "#3B82F6"
                    : referralKindText === "EMERGENCY" ? "#F97316"
                    : "#111827";

                  return (
                    <Box sx={{ mb: "16px" }}>
                      <Typography sx={{ fontWeight: 400, fontSize: "1.125rem", color: "#036245", borderBottom: "1px solid #E5E7EB", pb: 1, mb: 2 }}>
                        ข้อมูลสถานพยาบาล
                      </Typography>
                      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, p: 2 }}>
                        {/* Left column */}
                        <Box>
                          <Typography sx={{ fontSize: "1.125rem", fontWeight: 500, mb: "4px" }}>{hospLabel}</Typography>
                          {showWaiting ? (
                            <Typography sx={{ ml: 2, color: "#EAB308", fontSize: "1rem" }}>รอตอบรับ</Typography>
                          ) : (
                            <Typography sx={{ ml: 2, fontSize: "1rem" }}>{hospValue}</Typography>
                          )}

                          <Typography sx={{ fontSize: "1.125rem", fontWeight: 500, mt: 2, mb: "4px" }}>จุดรับใบส่งตัว</Typography>
                          {doc.deliveryPointTypeEnd ? (
                            <Typography sx={{ ml: 2, fontSize: "1rem" }}>{doc.deliveryPointTypeEnd.name || "-"}</Typography>
                          ) : isReferBackRoute ? (
                            <Typography sx={{ ml: 2, fontSize: "1rem" }}>-</Typography>
                          ) : (
                            <Typography sx={{ ml: 2, color: "#EAB308", fontSize: "1rem" }}>รอตอบรับ</Typography>
                          )}

                          <Typography sx={{ fontSize: "1.125rem", fontWeight: 500, mt: 2, mb: "4px" }}>จุดสร้างใบส่งตัว</Typography>
                          <Typography sx={{ ml: 2, fontSize: "1rem" }}>{doc.deliveryPointTypeStart?.name || "-"}</Typography>
                        </Box>

                        {/* Right column */}
                        <Box>
                          <Typography sx={{ fontSize: "1.125rem", fontWeight: 500, mb: "4px" }}>ประเภทผู้ป่วยที่ส่งตัว</Typography>
                          <Typography sx={{ ml: 2, fontSize: "1rem", color: kindColor }}>{kindDisplay}</Typography>

                          <Typography sx={{ fontSize: "1.125rem", fontWeight: 500, mt: 2, mb: "4px" }}>เบอร์ติดต่อจุดรับใบส่งตัว</Typography>
                          {doc.deliveryPointTypeEnd ? (
                            <Typography sx={{ ml: 2, fontSize: "1rem" }}>{doc.deliveryPointTypeEnd.phone || "-"}</Typography>
                          ) : isReferBackRoute ? (
                            <Typography sx={{ ml: 2, fontSize: "1rem" }}>-</Typography>
                          ) : (
                            <Typography sx={{ ml: 2, color: "#EAB308", fontSize: "1rem" }}>รอตอบรับ</Typography>
                          )}

                          <Typography sx={{ fontSize: "1.125rem", fontWeight: 500, mt: 2, mb: "4px" }}>เบอร์ติดต่อจุดสร้างใบส่งตัว</Typography>
                          <Typography sx={{ ml: 2, fontSize: "1rem" }}>{doc.deliveryPointTypeStart?.phone || "-"}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                })()}

                {/* สาขา/แผนกปลายทาง — appointment table (matches Nuxt referral-info.vue) */}
                {doc.appointmentData && doc.appointmentData.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #036245", pb: 1, mb: 2 }}>
                      <Typography component="div" sx={{ fontWeight: 400, fontSize: "1.125rem", color: "#036245" }}>
                        สาขา/แผนกปลายทาง (
                        <Typography component="span" sx={{
                          fontSize: "0.875rem",
                          fontWeight: 400,
                          color: doc.isChangeDoctorBranch ? "#f01000" : "#036245",
                        }}>
                          {doc.isChangeDoctorBranch ? "ไม่อนุญาติให้ส่งต่อสาขาอื่น" : "อนุญาติให้ส่งต่อสาขาอื่น"}
                        </Typography>
                        )
                      </Typography>
                      <Tooltip
                        title={
                          <Box sx={{ p: 1 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", mb: 1 }}>สาขา/แผนกปลายทาง</Typography>
                            <Typography sx={{ fontSize: "0.8rem" }}>
                              หากอนุญาติให้ส่งต่อสาขาอื่น สถานพยาบาลปลายทางสามารถเปลี่ยนแปลงสาขา/แผนกได้
                            </Typography>
                          </Box>
                        }
                        placement="top"
                        arrow
                        slotProps={{ tooltip: { sx: { maxWidth: 400, bgcolor: "#374151", p: 2 } } }}
                      >
                        <HelpOutlineIcon sx={{ color: "#9CA3AF", fontSize: 20, cursor: "pointer", "&:hover": { color: "#6B7280" } }} />
                      </Tooltip>
                    </Box>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ bgcolor: "#f9fafb", fontWeight: 500, fontSize: "1rem", color: "#64748B", fontFamily: "Sarabun, sans-serif" }}>
                              ลำดับ
                            </TableCell>
                            <TableCell sx={{ bgcolor: "#f9fafb", fontWeight: 500, fontSize: "1rem", color: "#64748B", fontFamily: "Sarabun, sans-serif" }}>
                              สาขา/แผนกที่ส่งต่อ
                            </TableCell>
                            {doc.referralStatus?.name !== "รอตอบรับ" && (
                              <TableCell sx={{ bgcolor: "#FEFCE8", fontWeight: 500, fontSize: "1rem", color: "#64748B", fontFamily: "Sarabun, sans-serif" }}>
                                วัน/เวลานัดหมาย
                              </TableCell>
                            )}
                            {doc.referralStatus?.name !== "รอตอบรับ" && (
                              <TableCell sx={{ bgcolor: "#FEFCE8", fontWeight: 500, fontSize: "1rem", color: "#64748B", fontFamily: "Sarabun, sans-serif" }}>
                                หมายเหตุ
                              </TableCell>
                            )}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {doc.appointmentData.map((item: any, index: number) => (
                            <TableRow key={index} sx={{ borderBottom: "1px solid #f3f4f6" }}>
                              <TableCell sx={{ fontFamily: "Sarabun, sans-serif", fontSize: "1rem" }}>
                                {index + 1}
                              </TableCell>
                              <TableCell sx={{ fontFamily: "Sarabun, sans-serif", fontSize: "1rem" }}>
                                {item.doctorBranchName || "-"}
                              </TableCell>
                              {doc.referralStatus?.name !== "รอตอบรับ" && (
                                <TableCell sx={{ bgcolor: "#FEFCE8", fontFamily: "Sarabun, sans-serif", fontSize: "1rem" }}>
                                  {item.appointmentType === "รอนัดรักษาต่อเนื่อง"
                                    ? "รอนัดรักษาต่อเนื่อง"
                                    : fmtThaiDateTimeLocal(item.appointmentDate) || "-"}
                                </TableCell>
                              )}
                              {doc.referralStatus?.name !== "รอตอบรับ" && (
                                <TableCell sx={{ bgcolor: "#FEFCE8", fontFamily: "Sarabun, sans-serif", fontSize: "1rem", maxWidth: 200, wordBreak: "break-word" }}>
                                  {item.remark || "-"}
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* ข้อมูลผู้สร้างใบส่งตัว */}
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #E5E7EB", pb: 1, mb: 2 }}>
                    <Typography sx={{ fontWeight: 400, fontSize: "1.125rem", color: "#036245" }}>
                      ข้อมูลผู้สร้างใบส่งตัว
                    </Typography>
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, p: 2 }}>
                    {/* Left column */}
                    <Box>
                      <Typography sx={{ fontSize: "1.125rem", fontWeight: 500, mb: "4px" }}>แพทย์ผู้ที่สั่ง</Typography>
                      <Typography sx={{ ml: 2, fontSize: "1rem", fontWeight: 700 }}>{doc.doctorName || "-"}</Typography>

                      <Typography sx={{ fontSize: "1.125rem", fontWeight: 500, mt: 2, mb: "4px" }}>ภาควิชาแพทย์</Typography>
                      <Typography sx={{ ml: 2, fontSize: "1rem", fontWeight: 700 }}>{doc.doctorDepartment || "-"}</Typography>
                    </Box>
                    {/* Right column */}
                    <Box>
                      <Typography sx={{ fontSize: "1.125rem", fontWeight: 500, mb: "4px" }}>รหัสแพทย์</Typography>
                      <Typography sx={{ ml: 2, fontSize: "1rem", fontWeight: 700 }}>{doc.doctorIdentifyNumber || "-"}</Typography>

                      <Typography sx={{ fontSize: "1.125rem", fontWeight: 500, mt: 2, mb: "4px" }}>เบอร์ติดต่อแพทย์</Typography>
                      <Typography sx={{ ml: 2, fontSize: "1rem", fontWeight: 700 }}>{doc.doctorPhone || "-"}</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* เหตุผลและการสาเหตุ */}
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #E5E7EB", pb: 1, mb: 2 }}>
                    <Typography sx={{ fontWeight: 400, fontSize: "1.125rem", color: "#036245" }}>
                      เหตุผลและการสาเหตุ
                    </Typography>
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, p: 2 }}>
                    {/* Left column */}
                    <Box>
                      <Typography sx={{ fontSize: "1.125rem", fontWeight: 500, mb: "4px" }}>เหตุผลการส่งตัว</Typography>
                      <Typography sx={{ ml: 2, fontSize: "1rem", fontWeight: 700 }}>{doc.referralStatusDetail?.name || doc.referral_reason || "-"}</Typography>
                    </Box>
                    {/* Right column */}
                    <Box>
                      <Typography sx={{ fontSize: "1.125rem", fontWeight: 500, mb: "4px" }}>สาเหตุการส่งตัว</Typography>
                      <Typography sx={{ ml: 2, fontSize: "1rem", fontWeight: 700 }}>{doc.referralCause?.name || "-"}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, p: 2 }}>
                    {/* หมายเหตุ */}
                    <Box>
                      <Typography sx={{ fontSize: "1.125rem", fontWeight: 500, mb: "4px" }}>หมายเหตุ</Typography>
                      <Typography sx={{ ml: 2, fontSize: "1rem" }}>{doc.remark || "-"}</Typography>
                    </Box>
                    {/* เหตุผล (สถานะ) — colored by referral status */}
                    <Box>
                      <Typography sx={{ fontSize: "1.125rem", fontWeight: 500, mb: "4px" }}>
                        เหตุผล
                        <Typography
                          component="span"
                          sx={{
                            ml: "4px",
                            fontWeight: 500,
                            fontSize: "1.125rem",
                            color: getStatusTextColor(doc.referralStatus?.name || ""),
                          }}
                        >
                          ({doc.referralStatus?.name || "-"})
                        </Typography>
                      </Typography>
                      <Typography
                        sx={{
                          ml: 2,
                          fontSize: "1rem",
                          color: getStatusTextColor(doc.referralStatus?.name || ""),
                        }}
                      >
                        {doc.referralStatusDetailCurrent?.name || "-"}
                      </Typography>
                    </Box>
                  </Box>
                  {/* รายละเอียด */}
                  <Box sx={{ p: 2 }}>
                    <Typography sx={{ fontSize: "1.125rem", fontWeight: 500, mb: "4px" }}>รายละเอียด</Typography>
                    <Typography sx={{ ml: 2, fontSize: "1rem" }}>{doc.referralStatusDetailCurrentText || "-"}</Typography>
                  </Box>

                  {/* Appointment table moved to after ข้อมูลสถานพยาบาล — สาขา/แผนกปลายทาง section */}
                </Box>

                {/* ระดับความสำคัญ — conditional based on route + referralKind
                  * /request-refer-out → OPD detail: English text, "H" badge, "ระดับความเฉียบพลัน", no ICU
                  * /refer-out + OPD → OPD detail: Thai text, shortName badge, "ระดับความเฉียบพลัน", no ICU
                  * /refer-out + IPD/EMERGENCY → IPD/ER detail: Thai text, shortName badge, "ความเฉียบพลัน", ICU, ใช้รถ/ใช้พยาบาล
                */}
                {(() => {
                  const kindName = referralKindText;
                  const isIPDorER = isReferOutRoute && (kindName === "IPD" || kindName === "EMERGENCY");
                  // referral-request-info uses English + hardcoded "H"
                  // referral-info / referral-info-ipd use Thai + shortName
                  const useEnglish = !isReferOutRoute;
                  const badgeLetter = useEnglish ? "H" : (doc.acuteLevel?.shortName || "-");
                  const acuteLabel = isIPDorER ? "ความเฉียบพลัน" : "ระดับความเฉียบพลัน";

                  const getAcuteTextEn = (id: number) => {
                    if (id === 1) return "Unstable";
                    if (id === 2) return "Stable with High risk of deterioration";
                    if (id === 3) return "Stable with Medium risk of deterioration";
                    if (id === 4) return "Stable with Low risk of deterioration";
                    if (id === 5) return "Stable with No risk of deterioration";
                    return "-";
                  };
                  const getAcuteTextTh = (id: number) => {
                    if (id === 1) return "ผู้ป่วยไร้เสถียรภาพ";
                    if (id === 2) return "ผู้ป่วยมีเสถียรภาพ มีความเสี่ยงต่อการทรุดลงเฉียบพลันสูง";
                    if (id === 3) return "ผู้ป่วยมีเสถียรภาพ มีความเสี่ยงต่อการทรุดลงเฉียบพลันปาน";
                    if (id === 4) return "ผู้ป่วยมีเสถียรภาพ มีความเสี่ยงต่อการทรุดลงเฉียบพลันต่ำ";
                    if (id === 5) return "ผู้ป่วยมีเสถียรภาพ ไม่มีความเสี่ยงต่อการทรุดลงเฉียบพลัน";
                    return "-";
                  };
                  const acuteText = useEnglish
                    ? getAcuteTextEn(doc.acuteLevel?.id)
                    : getAcuteTextTh(doc.acuteLevel?.id);

                  return (
                    <Box sx={{ mb: 2, mt: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #E5E7EB", pb: 1, mb: 2 }}>
                        <Typography sx={{ fontWeight: 400, fontSize: "1.125rem", color: "#036245" }}>
                          ระดับความสำคัญ
                        </Typography>
                      </Box>
                      <Box sx={{ display: "grid", gridTemplateColumns: isIPDorER ? "1fr 1fr" : "1fr", gap: 4, alignItems: "start", p: 2 }}>
                        {/* ความเฉียบพลัน */}
                        <Box sx={{ p: 2 }}>
                          <Typography sx={{ fontSize: "1.125rem", fontWeight: 500, mb: 1 }}>
                            {acuteLabel}
                          </Typography>
                          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, ml: 1 }}>
                            <Box sx={{
                              minWidth: 28, width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                              bgcolor: (() => {
                                const id = doc.acuteLevel?.id;
                                if (id === 1) return "#EF4444";
                                if (id === 2) return "#F97316";
                                if (id === 3) return "#EAB308";
                                if (id === 4) return "#3B82F6";
                                if (id === 5) return "#22C55E";
                                return "#22C55E";
                              })(),
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: "#fff", fontWeight: 700, fontSize: "0.875rem",
                            }}>
                              {badgeLetter}
                            </Box>
                            <Typography component="span" sx={{ fontSize: "1.125rem", fontWeight: 500 }}>
                              {acuteText}
                            </Typography>
                          </Box>
                        </Box>
                        {/* ระดับคนไข้ ICU — only for IPD/EMERGENCY on /refer-out */}
                        {isIPDorER && doc.icuLevel && (
                          <Box sx={{ p: 2 }}>
                            <Typography sx={{ fontSize: "1.125rem", fontWeight: 500, mb: 1 }}>ระดับคนไข้ ICU</Typography>
                            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, ml: 1 }}>
                              <Box sx={{
                                minWidth: 36, width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                                bgcolor: (() => {
                                  const id = doc.icuLevel?.id;
                                  if (id === 1) return "#EF4444";
                                  if (id === 2) return "#F97316";
                                  if (id === 3) return "#EAB308";
                                  if (id === 4) return "#22C55E";
                                  if (id === 5) return "#3B82F6";
                                  return "#22C55E";
                                })(),
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "#fff", fontWeight: 700, fontSize: "0.75rem",
                              }}>
                                ICU
                              </Box>
                              <Typography component="span" sx={{ fontSize: "1.125rem", fontWeight: 500 }}>
                                {(() => {
                                  const id = doc.icuLevel?.id;
                                  if (id === 1) return "ผู้ป่วยวิกฤต (Piority 1)";
                                  if (id === 2) return "ผู้ป่วยที่ต้องเฝ้าระวังอย่างใกล้ชิด (Piority 2)";
                                  if (id === 3) return "ผู้ป่วยโรครุนแรงที่มีโอกาสฟื้นตัวต่ำ (Piority 3)";
                                  if (id === 4) return "ผู้ป่วยที่ไม่จำเป็นต้องอยู่ใน (Piority 4)";
                                  if (id === 5) return "ผู้ป่วยมีเสถียรภาพ ไม่มีความเสี่ยงต่อการทรุดลงเฉียบพลัน";
                                  return "-";
                                })()}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                })()}

                {/* ข้อมูลเพิ่มเติม — conditional fields based on route + referralKind */}
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #E5E7EB", pb: 1, mb: 2 }}>
                    <Typography sx={{ fontWeight: 400, fontSize: "1.125rem", color: "#036245" }}>
                      ข้อมูลเพิ่มเติม
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ mb: 1 }}>
                      <Typography sx={{ fontSize: "1.125rem", fontWeight: 500, mb: "4px" }}>คนไข้เป็นโรคติดต่อ</Typography>
                      <Typography sx={{ ml: 2, fontSize: "1rem" }}>{doc.contagious ? "ใช่" : "ไม่"}</Typography>
                    </Box>
                    {/* ใช้รถส่งตัว + ใช้พยาบาล — only for IPD/EMERGENCY on /refer-out */}
                    {isReferOutRoute && (referralKindText === "IPD" || referralKindText === "EMERGENCY") && (
                      <>
                        <Box sx={{ mb: 1, mt: 2 }}>
                          <Typography sx={{ fontSize: "1.125rem", fontWeight: 500, mb: "4px" }}>ใช้รถส่งตัว</Typography>
                          <Typography sx={{ ml: 2, fontSize: "1rem" }}>{doc.carRefer ? "ต้องการใช้" : "ไม่ต้องการใช้"}</Typography>
                        </Box>
                        <Box sx={{ mb: 1, mt: 2 }}>
                          <Typography sx={{ fontSize: "1.125rem", fontWeight: 500, mb: "4px" }}>ใช้พยาบาลที่จุดรับส่ง</Typography>
                          <Typography sx={{ ml: 2, fontSize: "1rem" }}>{doc.useNurse ? "ใช้" : "ไม่ได้ใช้"}</Typography>
                        </Box>
                      </>
                    )}
                    <Box sx={{ mt: 2 }}>
                      <Typography sx={{ fontSize: "1.125rem", fontWeight: 500, mb: "4px" }}>ความเห็นเพิ่มเติม</Typography>
                      <Typography sx={{ ml: 2, fontSize: "1rem" }}>{doc.moreDetail || "-"}</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* อุปกรณ์ที่จำเป็น — shown on /refer-out only (commented out in OPD detail) */}
                {isReferOutRoute && (
                  <Box sx={{ mb: 2, mt: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #E5E7EB", pb: 1, mb: 2 }}>
                      <Typography sx={{ fontWeight: 400, fontSize: "1.125rem", color: "#036245" }}>
                        อุปกรณ์ที่จำเป็น
                      </Typography>
                    </Box>
                    {doc.equipment && Array.isArray(doc.equipment) && doc.equipment.length > 0 ? (
                      <Box sx={{ p: 2 }}>
                        <Typography sx={{ fontSize: "1.125rem", fontWeight: 500, mb: "4px" }}>ชื่ออุปกรณ์</Typography>
                        <Box component="ol" sx={{ ml: "0.3in", listStyleType: "decimal", fontSize: "1rem" }}>
                          {doc.equipment.map((item: any, idx: number) => (
                            <Box component="li" key={idx} sx={{ mb: 1 }}>
                              {item || "-"}
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ p: 2 }}>
                        <Typography sx={{ fontSize: "1.125rem", fontWeight: 500 }}>ไม่มีอุปกรณ์</Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          {/* Right: ข้อมูลผู้ป่วย */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <PatientInfoSection patient={patient} doc={doc} />
          </Box>
        </Box>

        {/* ── ข้อมูลสุขภาพประจำตัวผู้ป่วย */}
        <Box sx={{ mt: "24px" }}>
          <Box sx={{ border: "1px solid #E5E7EB", borderRadius: "8px", overflow: "hidden" }}>
            <SectionHeader title="ข้อมูลสุขภาพประจำตัวผู้ป่วย" />

            {/* ประวัติโรค — green text with border-bottom separator */}
            <Box sx={{ borderBottom: "1px solid #CBD5E1", p: 2 }}>
              <Typography sx={{ fontWeight: 600, fontSize: "1.125rem", color: "#036245" }}>ประวัติโรค</Typography>
            </Box>

            {/* ประวัติการป่วยในอดีตและประวัติครอบครัว */}
            <Box>
              <Typography sx={{ fontSize: "1rem", fontWeight: 500, p: 2, mb: "4px" }}>
                ประวัติการป่วยในอดีตและประวัติครอบครัว
              </Typography>
              <Typography sx={{ px: 3, pb: 2, fontSize: "1rem" }}>
                {personalDisease || "-"}
              </Typography>
            </Box>

            <Box sx={{ p: 2 }}>
              {/* โรคประจำตัว */}
              <Typography sx={{ fontSize: "1rem", fontWeight: 500, mb: "4px" }}>โรคประจำตัว</Typography>
              {diseases.length > 0 ? (
                <Box component="ol" sx={{ ml: 2, pl: 2, listStyleType: "decimal", fontSize: "1rem", mb: 2 }}>
                  {diseases.map((d: any, i: number) => (
                    <Box component="li" key={i} sx={{ mb: 0.5 }}>
                      {typeof d === "string" ? d : d.name || "-"}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography sx={{ fontSize: "1rem", mb: 2 }}>-</Typography>
              )}

              {/* ประวัติการแพ้ */}
              <Typography sx={{ fontSize: "1rem", fontWeight: 600, mb: 1, mt: 2 }}>ประวัติการแพ้</Typography>
              {drugAllergy.length > 0 ? (
                <Box component="ol" sx={{ ml: 2, pl: 2, listStyleType: "decimal", fontSize: "1rem", mb: 2 }}>
                  {drugAllergy.map((d: any, i: number) => (
                    <Box component="li" key={i} sx={{ mb: 1 }}>
                      {typeof d === "string" ? d : d.name || "-"}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography sx={{ fontSize: "1rem", mb: 2 }}>-</Typography>
              )}

              {/* ข้อมูลวัคซีน — green text with border-bottom separator */}
              <Box sx={{ borderBottom: "1px solid #CBD5E1", p: 2, mt: 2 }}>
                <Typography sx={{ fontWeight: 600, fontSize: "1.125rem", color: "#036245" }}>ข้อมูลวัคซีน</Typography>
              </Box>

              {/* วัคซีนล่าสุด — grid layout */}
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "4fr 3fr 4fr 1fr", gap: 2, px: 1.5, py: 1, mb: 1 }}>
                  <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#4b5563" }}>วัคซีนล่าสุด</Typography>
                  <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#4b5563" }}>วันที่ได้รับ</Typography>
                  <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#4b5563" }}>สถานที่รับ</Typography>
                  <Box />
                </Box>
                {vaccines.length > 0 ? vaccines.map((v: any, i: number) => (
                  <Box key={i} sx={{ display: "grid", gridTemplateColumns: "4fr 3fr 4fr 1fr", gap: 2, px: 1.5, py: 1.5, borderBottom: "1px solid #e5e7eb", "&:hover": { bgcolor: "#f9fafb" } }}>
                    <Typography sx={{ fontSize: "0.875rem", color: "#1f2937" }}>{v.vaccineName || v.name || "-"}</Typography>
                    <Typography sx={{ fontSize: "0.875rem", color: "#4b5563" }}>{fmtDateThaiDirect(v.date || v.vaccineDate) || "-"}</Typography>
                    <Typography sx={{ fontSize: "0.875rem", color: "#4b5563" }}>{v.location || v.place || v.vaccinePlace || "-"}</Typography>
                    <Box />
                  </Box>
                )) : (
                  <Typography sx={{ px: 1.5, py: 1, fontSize: "0.875rem" }}>-</Typography>
                )}
              </Box>

              {/* วัคซีนโควิด — grid layout */}
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "4fr 3fr 4fr 1fr", gap: 2, px: 1.5, py: 1, mb: 1 }}>
                  <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#4b5563" }}>วัคซีนโควิด</Typography>
                  <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#4b5563" }}>วันที่ได้รับ</Typography>
                  <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#4b5563" }}>สถานที่รับ</Typography>
                  <Box />
                </Box>
                {vaccinesCovid.length > 0 ? vaccinesCovid.map((v: any, i: number) => (
                  <Box key={i} sx={{ display: "grid", gridTemplateColumns: "4fr 3fr 4fr 1fr", gap: 2, px: 1.5, py: 1.5, borderBottom: "1px solid #e5e7eb", "&:hover": { bgcolor: "#f9fafb" } }}>
                    <Typography sx={{ fontSize: "0.875rem", color: "#1f2937" }}>{v.vaccineName || v.name || "-"}</Typography>
                    <Typography sx={{ fontSize: "0.875rem", color: "#4b5563" }}>{fmtDateThaiDirect(v.date || v.vaccineDate) || "-"}</Typography>
                    <Typography sx={{ fontSize: "0.875rem", color: "#4b5563" }}>{v.location || v.place || v.vaccinePlace || "-"}</Typography>
                    <Box />
                  </Box>
                )) : (
                  <Typography sx={{ px: 1.5, py: 1, fontSize: "0.875rem" }}>-</Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ── ข้อมูลวินิจฉัยเบื้องต้น ── */}
        <Box sx={{ mt: "24px" }}>
          <Box sx={{ border: "1px solid #E5E7EB", borderRadius: "8px", overflow: "hidden" }}>
            <SectionHeader title="ข้อมูลวินิจฉัยเบื้องต้น" />
            <Box sx={{ p: 2 }}>
              {/* อาการป่วยปัจจุบัน sub-header with border */}
              <Box sx={{ borderBottom: "1px solid #CBD5E1", pb: "8px", mb: "16px" }}>
                <Typography sx={{ fontWeight: 600, fontSize: "1.125rem", color: "#036245" }}>
                  อาการป่วยปัจจุบัน
                </Typography>
              </Box>

              {/* Vital signs — match original: always show unit suffix */}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 2, mb: 3 }}>
                <Box>
                  <Typography sx={{ fontWeight: 500, fontSize: "1rem", mb: "4px" }}>อุณหภูมิ</Typography>
                  <Typography sx={{ fontSize: "1rem" }}>
                    {visitData.temperature != null && visitData.temperature !== "" ? visitData.temperature : "-"} °C
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 500, fontSize: "1rem", mb: "4px" }}>BP</Typography>
                  <Typography sx={{ fontSize: "1rem" }}>
                    {`${visitData.bps || "-"} / ${visitData.bpd || "-"}`}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 500, fontSize: "1rem", mb: "4px" }}>PR</Typography>
                  <Typography sx={{ fontSize: "1rem" }}>
                    {visitData.pulse ? `${visitData.pulse} /min` : "/min"}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 500, fontSize: "1rem", mb: "4px" }}>RR</Typography>
                  <Typography sx={{ fontSize: "1rem" }}>
                    {visitData.rr ? `${visitData.rr}/min` : "/min"}
                  </Typography>
                </Box>
              </Box>

              <InfoField label="อาการนำ" value={visitData.visit_primary_symptom_main_symptom} />
              <InfoField label="รายละเอียดอาการป่วยในปัจจุบัน" value={visitData.visit_primary_symptom_current_illness} />
              <InfoField label="การรักษาที่ให้แล้ว" value={visitData.pe} />
              <InfoField label="การตรวจร่างกายเบื้องต้น" value={visitData.Imp} />
              <InfoField label="ข้อมูลเพิ่มเติมอื่นๆ" value={visitData.moreDetail} />
            </Box>
          </Box>
        </Box>

        {/* ── โรคหลักที่ต้องการให้รักษา (ICD-10) ── */}
        <Box sx={{ mt: "24px" }}>
          <Box sx={{ borderBottom: "1px solid #CBD5E1", pb: "8px", mb: "16px" }}>
            <Typography sx={{ fontWeight: 600, fontSize: "1.125rem", color: "#036245" }}>
              โรคหลักที่ต้องการให้รักษา
            </Typography>
          </Box>
          {icd10List.length > 0 ? (
            <TableContainer>
              <Table size="small" sx={{ border: "1px solid #E5E7EB" }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f9fafb" }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>รหัสโรค (ICD-10)</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>ชื่อโรคภาษาไทย</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>ชื่อโรคภาษาอังกฤษ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {icd10List.map((item: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell sx={{ fontSize: "0.875rem" }}>{item.icd_10_tm || "-"}</TableCell>
                      <TableCell sx={{ fontSize: "0.875rem" }}>{item.diagetname || "-"}</TableCell>
                      <TableCell sx={{ fontSize: "0.875rem" }}>{item.diagename || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <TableContainer>
              <Table size="small" sx={{ border: "1px solid #E5E7EB" }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f9fafb" }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>รหัสโรค (ICD-10)</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>ชื่อโรคภาษาไทย</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>ชื่อโรคภาษาอังกฤษ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontSize: "0.875rem" }}>-</TableCell>
                    <TableCell sx={{ fontSize: "0.875rem" }}>-</TableCell>
                    <TableCell sx={{ fontSize: "0.875rem" }}>-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* ── รายการโรคร่วมที่ต้องการให้รักษา (ICD-10 More) ── */}
        <Box sx={{ mt: "24px" }}>
          <Box sx={{ borderBottom: "1px solid #CBD5E1", pb: "8px", mb: "16px" }}>
            <Typography sx={{ fontWeight: 600, fontSize: "1.125rem", color: "#036245" }}>
              รายการโรคร่วมที่ต้องการให้รักษา
            </Typography>
          </Box>
          {icd10MoreList.length > 0 ? (
            <TableContainer>
              <Table size="small" sx={{ border: "1px solid #E5E7EB" }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f9fafb" }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>รหัสโรค (ICD-10)</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>ชื่อโรคภาษาไทย</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>ชื่อโรคภาษาอังกฤษ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {icd10MoreList.map((item: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell sx={{ fontSize: "0.875rem" }}>{item.icd_10_tm || "-"}</TableCell>
                      <TableCell sx={{ fontSize: "0.875rem" }}>{item.diagetname || "-"}</TableCell>
                      <TableCell sx={{ fontSize: "0.875rem" }}>{item.diagename || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <TableContainer>
              <Table size="small" sx={{ border: "1px solid #E5E7EB" }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f9fafb" }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>รหัสโรค (ICD-10)</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>ชื่อโรคภาษาไทย</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>ชื่อโรคภาษาอังกฤษ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontSize: "0.875rem" }}>-</TableCell>
                    <TableCell sx={{ fontSize: "0.875rem" }}>-</TableCell>
                    <TableCell sx={{ fontSize: "0.875rem" }}>-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* ── รายการยา ── */}
        <Box sx={{ mt: "24px" }}>
          <Box sx={{ borderBottom: "1px solid #CBD5E1", pb: "8px", mb: "16px" }}>
            <Typography sx={{ fontWeight: 600, fontSize: "1.125rem", color: "#036245" }}>
              รายการยา
            </Typography>
          </Box>
          {/* Header row */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 3fr 2fr 3fr 2fr", gap: 2, p: 2 }}>
            <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#4b5563" }}>ลำดับ</Typography>
            <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#4b5563" }}>ชื่อยา</Typography>
            <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#4b5563" }}>จำนวน</Typography>
            <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#4b5563" }}>วิธีใช้</Typography>
            <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "#4b5563" }}>Memo</Typography>
          </Box>
          {drugs.length > 0 ? (
            drugs.map((drug: any, i: number) => (
              <Box key={i} sx={{ display: "grid", gridTemplateColumns: "1fr 3fr 2fr 3fr 2fr", gap: 2, p: 2, "&:hover": { bgcolor: "#f9fafb" } }}>
                <Typography sx={{ fontSize: "0.875rem", fontWeight: 500 }}>{i + 1}</Typography>
                <Typography sx={{ fontSize: "0.875rem" }}>{drug.drugname || "-"}</Typography>
                <Typography sx={{ fontSize: "0.875rem", color: "#4b5563" }}>{drug.qty || "-"}</Typography>
                <Typography sx={{ fontSize: "0.875rem", color: "#4b5563" }}>{drug.drugusage || "-"}</Typography>
                <Typography sx={{ fontSize: "0.875rem", color: "#6b7280" }}>{drug.strength || "-"}</Typography>
              </Box>
            ))
          ) : (
            <Box sx={{ mt: 2, border: "1px dashed #d1d5db", borderRadius: "6px", p: 5, textAlign: "center" }}>
              <Typography sx={{ color: "#6b7280" }}>ไม่พบข้อมูลยา</Typography>
            </Box>
          )}
        </Box>

        {/* ── เอกสารประกอบการรักษา ── */}
        <Box sx={{ mt: "24px" }}>
          <TreatmentDocuments
            documents={documentItems}
            onAddDocument={handleAddDocument}
            uploadFileToServer={uploadFile}
          />
        </Box>

        {/* ── Footer ── */}
        {/* ── Footer ── */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: "24px" }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.back()}
            sx={{
              textTransform: "none",
              borderColor: "#00AF75",
              color: "#00AF75",
              fontWeight: 600,
              "&:hover": { bgcolor: "#f0fdf4", borderColor: "#00AF75" },
            }}
          >
            ย้อนกลับ
          </Button>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {shouldShowViewHospitals && (
              <Button
                variant="contained"
                onClick={() => setViewHospitalsModalOpen(true)}
                startIcon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
                  </svg>
                }
                sx={{
                  bgcolor: "#3b82f6",
                  "&:hover": { bgcolor: "#091b63" },
                  "&:active": { bgcolor: "#0735ed" },
                  textTransform: "none",
                  fontWeight: 400,
                  fontSize: "16px",
                  fontFamily: "Sarabun, sans-serif",
                  color: "#fff",
                  borderRadius: "4px",
                  px: "16px",
                  py: "8px",
                  minHeight: "40px",
                  boxShadow: "none",
                  border: "none",
                }}
              >
                ดูรายการสถานพยาบาลที่ส่งไป
              </Button>
            )}
            {shouldShowCancel && (
              <Button
                variant="contained"
                onClick={() => setCancelModalOpen(true)}
                startIcon={<CloseIcon sx={{ fontSize: "22px !important" }} />}
                sx={{
                  bgcolor: "#F25555",
                  "&:hover": { bgcolor: "#FF808E" },
                  "&:active": { bgcolor: "#DC4040" },
                  textTransform: "none",
                  fontWeight: 400,
                  fontSize: "16px",
                  fontFamily: "Sarabun, sans-serif",
                  color: "#FAFAF9",
                  borderRadius: "4px",
                  px: "16px",
                  py: "8px",
                  minHeight: "40px",
                  boxShadow: "none",
                }}
              >
                ยกเลิกการส่งตัวผู้ป่วย
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

    </Box>
  );
}

export default function RequestReferOutDetailPage() {
  return (
    <Suspense fallback={<Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress sx={{ color: "#16a34a" }} /></Box>}>
      <RequestReferOutDetailPageInner />
    </Suspense>
  );
}
