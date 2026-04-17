"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TreatmentDocuments, { type DocumentItem as TreatDocItem } from "@/components/shared/TreatmentDocuments";
/* ep:edit icon — pencil with square border (matches Element Plus) */
const EpEditIcon = ({ size = 22, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 1024 1024" fill={color}>
    <path d="M832 512a32 32 0 1 1 64 0v352a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h352a32 32 0 0 1 0 64H192v640h640V512z" />
    <path d="m469.952 554.24 52.8-7.552L847.104 222.4a32 32 0 1 0-45.248-45.248L477.504 501.44l-7.552 52.8zm422.4-422.4a96 96 0 0 1 0 135.808l-331.84 331.84a32 32 0 0 1-18.112 9.088L436.8 623.68a32 32 0 0 1-36.224-36.224l15.104-105.6a32 32 0 0 1 9.024-18.112l331.84-331.84a96 96 0 0 1 135.808 0z" />
  </svg>
);
import CloseIcon from "@mui/icons-material/Close";
import Image from "next/image";
import { useReferralStore } from "@/stores/referralStore";
import { useHospitalStore } from "@/stores/hospitalStore";

/* ------------------------------------------------------------------ */
/*  Helper: format date string to Thai Buddhist era                    */
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

function fmtDateOnly(d: any) {
  if (!d) return "-";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return String(d);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear() + 543;
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return String(d);
  }
}

/* ------------------------------------------------------------------ */
/*  Status badge classes (matching Nuxt)                               */
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

/* Status text color — matches Nuxt getCountTextClasses */
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
/*  Section header (green bg like Nuxt)                                */
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
/*  Helper: format birthday to Thai Buddhist era (dd/mm/yyyy)          */
/* ------------------------------------------------------------------ */
function formatBirthdayThai(birthday: string | undefined | null): string {
  if (!birthday || typeof birthday !== "string") return "-";
  try {
    let year: number, month: number, day: number;
    if (birthday.includes("T")) {
      const [dateStr] = birthday.split("T");
      [year, month, day] = dateStr.split("-").map(Number);
    } else if (birthday.includes("-")) {
      [year, month, day] = birthday.split("-").map(Number);
    } else {
      return birthday; // already formatted or unknown format
    }
    if (isNaN(year) || isNaN(month) || isNaN(day)) return birthday;
    const buddhistYear = year + 543;
    return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${buddhistYear}`;
  } catch {
    return birthday;
  }
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
/*  PatientInfoSection — matches Nuxt patient-info.vue                 */
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

        {/* Image row: profile image + sex/birthday + blood group/age — Nuxt: grid-cols-3 equal */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, p: 1, mb: 1 }}>
          {/* Column 1: Profile image — Nuxt: w-[250px] h-[150px] but shrinks to fit column */}
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

        {/* สิทธิ์การรักษา / สิทธิ์สถานพยาบาล — 2 columns */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 1 }}>
          <InfoField label="สิทธิ์การรักษา" value={patient.patient_right || doc.data?.patient?.patient_right} />
          <InfoField label="สิทธิ์สถานพยาบาล" value={patient.patient_hospital_right || doc.data?.patient?.patient_hospital_right} />
        </Box>

        {/* ── ที่อยู่ผู้ป่วย — collapsible ── */}
        <Box
          onClick={() => setShowAddress(!showAddress)}
          sx={{ borderBottom: "1px solid #CBD5E1", display: "flex", alignItems: "center", justifyContent: "space-between", p: 2, cursor: "pointer" }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: "1.125rem", color: "#036245", textDecoration: "underline" }}>
            ที่อยู่ผู้ป่วย
          </Typography>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="#6b7280" style={{ transition: "transform 0.2s", transform: showAddress ? "rotate(180deg)" : "rotate(0deg)" }}>
            <path d="M4 6l4 4 4-4" stroke="#6b7280" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Box>
        {showAddress && (
          <Box sx={{ mt: 1 }}>
            {/* Row 1: บ้านเลขที่ / หมู่ / ถนน/สาย / ซอย/ตรอก — 4 columns */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 2, p: 2 }}>
              <InfoField label="บ้านเลขที่" value={patient.patient_house} />
              <InfoField label="หมู่" value={patient.patient_moo} />
              <InfoField label="ถนน/สาย" value={patient.patient_road} />
              <InfoField label="ซอย/ตรอก" value={patient.patient_alley} />
            </Box>
            {/* Row 2: จังหวัด / ตำบล/แขวง / อำเภอ/เขต — 3 columns */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, px: 2 }}>
              <InfoField label="จังหวัด" value={patient.patient_changwat} />
              <InfoField label="ตำบล/แขวง" value={patient.patient_tambon} />
              <InfoField label="อำเภอ/เขต" value={patient.patient_amphur} />
            </Box>
            {/* Row 3: รหัสไปรษณีย์ / เบอร์โทรศัพท์ — 3 columns */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, p: 2 }}>
              <InfoField label="รหัสไปรษณีย์" value={patient.patient_zip_code} />
              <InfoField label="เบอร์โทรศัพท์" value={patient.patient_mobile_phone} />
              <Box />
            </Box>
          </Box>
        )}

        {/* ── ติดต่อในกรณีฉุกเฉิน — collapsible ── */}
        <Box
          onClick={() => setShowEmergency(!showEmergency)}
          sx={{ borderBottom: "1px solid #CBD5E1", display: "flex", alignItems: "center", justifyContent: "space-between", p: 2, cursor: "pointer" }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: "1.125rem", color: "#036245", textDecoration: "underline" }}>
            ติดต่อในกรณีฉุกเฉิน
          </Typography>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transition: "transform 0.2s", transform: showEmergency ? "rotate(180deg)" : "rotate(0deg)" }}>
            <path d="M4 6l4 4 4-4" stroke="#6b7280" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Box>
        {showEmergency && (
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, p: 2 }}>
            <InfoField label="ชื่อ-นามสกุล" value={patient.patient_contact_full_name || doc.emergencyContactFullName} />
            <InfoField label="หมายเลขโทรศัพท์" value={patient.patient_contact_mobile_phone || doc.emergencyContactTel} />
            <InfoField label="เกี่ยวข้องเป็น" value={patient.patient_contact_relation || doc.emergencyContactRelated} />
          </Box>
        )}
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */
function RequestReferOutDetailPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const { findOneReferral, findGroupCase, updateReferral } = useReferralStore();
  const { uploadFile } = useHospitalStore();

  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<any>(null);
  const [groupDocs, setGroupDocs] = useState<any[]>([]);

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

  // Handle add document from shared TreatmentDocuments component — same logic as Nuxt
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
  const personalDisease = patient.patient_personal_disease || healthData.patient_personal_disease || "";

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

  // Sorted group case with order (Nuxt: reverse)
  const sortedGroupDocs = groupDocs.map((item: any, idx: number) => ({
    ...item,
    order: groupDocs.length - idx,
    index: idx,
  }));

  // Check if cancel button should show
  const shouldShowCancel = statusName &&
    statusName !== "ยกเลิก" &&
    statusName !== "รับเข้ารักษา" &&
    statusName !== "สิ้นสุดการส่งตัว" &&
    statusName !== "ปฏิเสธการตอบรับ" &&
    sortedGroupDocs.length > 0 &&
    doc.id === sortedGroupDocs[0]?.id;

  const lifeStatus = doc.referralLifeStatus || "มีชีวิต";

  return (
    <Box sx={{ px: "24px" }}>
      {/* ── Header row ── */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: "24px" }}>
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
        {shouldShowCancel && (
          <Button
            variant="contained"
            startIcon={<CloseIcon sx={{ fontSize: "22px !important" }} />}
            sx={{
              bgcolor: "#F25555",
              "&:hover": { bgcolor: "#FF808E" },
              "&:active": { bgcolor: "#DC4040" },
              textTransform: "none",
              fontWeight: 400,
              fontSize: "16px",
              fontFamily: "Poppins, sans-serif",
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
                  <b>จาก :</b>{" "}<span style={{ fontWeight: 400 }}>{gDoc.toHospital?.name || "-"}</span>
                </Typography>
                <Typography sx={{ fontSize: "1rem" }}>
                  <b>ไปยัง :</b>{" "}<span style={{ fontWeight: 400 }}>{gDoc.fromHospital?.name || "-"}</span>
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}

      {/* ── Main panel (white bg) ── */}
      <Paper sx={{ borderRadius: "8px", overflow: "hidden", mb: 3, bgcolor: "#fff", p: "16px" }}>
        {/* Status life + History buttons */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: "12px" }}>
          <Box
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
          <Button
            variant="outlined"
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
                {/* Delivery period */}
                {deliveryPeriods.length > 0 && (
                  <Box sx={{ border: "1px solid #E5E7EB", borderRadius: 1, mb: 2 }}>
                    <Box sx={{ borderBottom: "1px solid #E5E7EB", px: 2, py: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>ระยะเวลารับรองสิทธิ์</Typography>
                    </Box>
                    <Box sx={{ p: 2 }}>
                      {doc.referralDeliveryPeriod?.name && (
                        <Typography sx={{ fontWeight: 700, mb: 1 }}>{doc.referralDeliveryPeriod.name}</Typography>
                      )}
                      {deliveryPeriods.map((period: any, idx: number) => (
                        <Box key={idx} sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 2, mb: 1 }}>
                          <Box>
                            <Typography sx={{ fontSize: "0.8rem", color: "#6b7280" }}>วันที่เริ่มต้น</Typography>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>{fmtDateOnly(period.startDelivery)}</Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: "0.8rem", color: "#6b7280" }}>เวลา</Typography>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>{period.startDelivery ? fmtDate(period.startDelivery).split(" ").pop() : "-"}</Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: "0.8rem", color: "#6b7280" }}>วันหมดอายุ</Typography>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>{fmtDateOnly(period.endDelivery)}</Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: "0.8rem", color: "#6b7280" }}>เวลา</Typography>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>{period.endDelivery ? fmtDate(period.endDelivery).split(" ").pop() : "-"}</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* ข้อมูลสถานพยาบาล */}
                <Box sx={{ border: "1px solid #E5E7EB", borderRadius: "6px", p: "16px", mb: "16px" }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "1.125rem", mb: "12px", color: "#036245" }}>
                    ข้อมูลสถานพยาบาล
                  </Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                    <InfoField label="สถานพยาบาลต้นทาง" value={originHospitalName} bold />
                    <InfoField label="ประเภทผู้ป่วยที่ส่งตัว" value={referralKindText} bold />
                    <InfoField label="จุดรับใบส่งตัว" value={doc.deliveryPointTypeEnd?.name} />
                    <InfoField label="เบอร์ติดต่อจุดรับใบส่งตัว" value={doc.deliveryPointTypeEnd?.phone} />
                    <InfoField label="จุดสร้างใบส่งตัว" value={doc.deliveryPointTypeStart?.name} />
                    <InfoField label="เบอร์ติดต่อจุดสร้างใบส่งตัว" value={doc.deliveryPointTypeStart?.phone} />
                  </Box>
                </Box>

                {/* ข้อมูลผู้สั่งใบส่งตัว */}
                <Box sx={{ border: "1px solid #E5E7EB", borderRadius: "6px", p: "16px", mb: "16px" }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "1.125rem", mb: "12px", color: "#036245" }}>
                    ข้อมูลผู้สั่งใบส่งตัว
                  </Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                    <InfoField label="แพทย์ผู้สั่ง" value={doc.doctorName} bold />
                    <InfoField label="รหัสแพทย์" value={doc.doctorIdentifyNumber || doc.doctorCode} bold />
                    <InfoField label="ภาควิชาแพทย์" value={doc.doctorDepartment} />
                    <InfoField label="เบอร์ติดต่อแพทย์" value={doc.doctorPhone} />
                  </Box>
                </Box>

                {/* เหตุผลและสาเหตุ */}
                <Box sx={{ border: "1px solid #E5E7EB", borderRadius: "6px", p: "16px", mb: "16px" }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "1.125rem", mb: "12px", color: "#036245" }}>
                    เหตุผลและสาเหตุ
                  </Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                    <InfoField label="เหตุผลการส่งตัว" value={doc.referralStatusDetail?.name || doc.referral_reason} />
                    <InfoField label="สาเหตุการส่งตัว" value={doc.referralCause?.name} />
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                    <InfoField label="หมายเหตุ" value={doc.remark} />
                    {/* เหตุผล (สถานะ) — colored by referral status */}
                    <Box sx={{ mb: "8px" }}>
                      <Typography sx={{ fontWeight: 500, fontSize: "1.125rem", mb: "4px" }}>
                        เหตุผล
                        <Typography
                          component="span"
                          sx={{
                            ml: "4px",
                            fontWeight: 500,
                            fontSize: "1.125rem",
                            color: getStatusTextColor(doc.referralStatus?.name || ""),
                            fontFamily: "Sarabun, sans-serif",
                          }}
                        >
                          ({doc.referralStatus?.name || "-"})
                        </Typography>
                      </Typography>
                      <Typography
                        sx={{
                          ml: "16px",
                          fontSize: "1rem",
                          color: getStatusTextColor(doc.referralStatus?.name || ""),
                          fontFamily: "Sarabun, sans-serif",
                        }}
                      >
                        {doc.referralStatusDetailCurrent?.name || "-"}
                      </Typography>
                    </Box>
                  </Box>
                  {/* รายละเอียด */}
                  <InfoField label="รายละเอียด" value={doc.referralStatusDetailCurrentText} />

                  {/* Hospital branches (destinations) */}
                  {doc.referralDocumentHospitals && doc.referralDocumentHospitals.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, mb: 0.5 }}>รวมรายละเอียด</Typography>
                      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 1, border: "1px solid #E5E7EB", borderRadius: 1, p: 1 }}>
                        {doc.referralDocumentHospitals.map((h: any, hi: number) => (
                          <React.Fragment key={hi}>
                            <Typography sx={{ fontSize: "0.8rem" }}>{h.hospital?.name || "-"}</Typography>
                            <Typography sx={{ fontSize: "0.8rem" }}>{h.doctorBranch?.name || "-"}</Typography>
                          </React.Fragment>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* ระดับความสำคัญ + ข้อมูลเพิ่มเติม — same box style as เหตุผลและสาเหตุ */}
                <Box sx={{ border: "1px solid #E5E7EB", borderRadius: "6px", p: "16px", mb: "16px" }}>
                  {/* ระดับความสำคัญ */}
                  <Box sx={{ borderBottom: "1px solid #E5E7EB", pb: "8px", mb: "16px" }}>
                    <Typography sx={{ fontWeight: 400, fontSize: "1.125rem", color: "#036245" }}>
                      ระดับความสำคัญ
                    </Typography>
                  </Box>
                  <Box sx={{ pl: "8px", mb: "16px" }}>
                    <Typography sx={{ fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.5 }}>
                      ระดับความเฉียบพลัน
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mt: "4px" }}>
                      <Box sx={{
                        width: 28, height: 28, borderRadius: "50%",
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
                        H
                      </Box>
                      <Typography sx={{ fontSize: "1rem", color: "#111827" }}>
                        {(() => {
                          const id = doc.acuteLevel?.id;
                          if (id === 1) return "Unstable";
                          if (id === 2) return "Stable with High risk of deterioration";
                          if (id === 3) return "Stable with Medium risk of deterioration";
                          if (id === 4) return "Stable with Low risk of deterioration";
                          if (id === 5) return "Stable with No risk of deterioration";
                          return "-";
                        })()}
                      </Typography>
                    </Box>
                  </Box>

                  {/* ข้อมูลเพิ่มเติม */}
                  <Box sx={{ borderBottom: "1px solid #E5E7EB", pb: "8px", mb: "16px" }}>
                    <Typography sx={{ fontWeight: 400, fontSize: "1.125rem", color: "#036245" }}>
                      ข้อมูลเพิ่มเติม
                    </Typography>
                  </Box>
                  <Box sx={{ pl: "8px" }}>
                    <Box sx={{ mb: "8px" }}>
                      <Typography sx={{ fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.5 }}>คนไข้เป็นโรคติดต่อ</Typography>
                      <Typography sx={{ fontSize: "1rem", color: "#111827", lineHeight: 1.5 }}>{doc.contagious ? "ใช่" : "ไม่"}</Typography>
                    </Box>
                    <Box sx={{ mb: "8px" }}>
                      <Typography sx={{ fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.5 }}>ความเห็นเพิ่มเติม</Typography>
                      <Typography sx={{ fontSize: "1rem", color: "#111827", lineHeight: 1.5 }}>{doc.moreDetail || "-"}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Right: ข้อมูลผู้ป่วย */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <PatientInfoSection patient={patient} doc={doc} />
          </Box>
        </Box>

        {/* ── ข้อมูลสุขภาพประจำตัวผู้ป่วย ── */}
        <Box sx={{ mt: "24px" }}>
          <Box sx={{ border: "1px solid #E5E7EB", borderRadius: "8px", overflow: "hidden" }}>
            <SectionHeader title="ข้อมูลสุขภาพประจำตัวผู้ป่วย" />
            <Box sx={{ p: 2 }}>
              {/* ประวัติโรค */}
              <Typography sx={{ fontWeight: 700, fontSize: "1.125rem", mb: "8px", textDecoration: "underline" }}>ประวัติโรค</Typography>
              <InfoField label="ประวัติการป่วยในอดีตและประวัติครอบครัว" value={personalDisease} />

              <Typography sx={{ fontWeight: 600, mt: 1, mb: 0.5 }}>โรคประจำตัว</Typography>
              {diseases.length > 0 ? (
                <Box sx={{ mb: 1 }}>
                  {diseases.map((d: any, i: number) => (
                    <Typography key={i} sx={{ fontSize: "0.9rem" }}>
                      {i + 1}. {typeof d === "string" ? d : d.name || "-"}
                    </Typography>
                  ))}
                </Box>
              ) : (
                <Typography sx={{ fontSize: "0.9rem", color: "#9ca3af", mb: 1 }}>-</Typography>
              )}

              <Typography sx={{ fontWeight: 600, mt: 1, mb: 0.5 }}>ประวัติการแพ้</Typography>
              {drugAllergy.length > 0 ? (
                <Box sx={{ mb: 1 }}>
                  {drugAllergy.map((d: any, i: number) => (
                    <Typography key={i} sx={{ fontSize: "0.9rem" }}>
                      {i + 1}. {typeof d === "string" ? d : d.name || "-"}
                    </Typography>
                  ))}
                </Box>
              ) : (
                <Typography sx={{ fontSize: "0.9rem", color: "#9ca3af", mb: 1 }}>-</Typography>
              )}

              {/* ข้อมูลวัคซีน */}
              <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mt: 2, mb: 1, textDecoration: "underline" }}>ข้อมูลวัคซีน</Typography>
              {vaccines.length > 0 ? (
                <TableContainer sx={{ mb: 2 }}>
                  <Table size="small" sx={{ border: "1px solid #E5E7EB" }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f9fafb" }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>วัคซีนล่าสุด</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>วันที่ฉีด</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>สถานที่ฉีด</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vaccines.map((v: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontSize: "0.875rem" }}>{v.vaccineName || v.name || "-"}</TableCell>
                          <TableCell sx={{ fontSize: "0.875rem" }}>{v.date || fmtDateOnly(v.vaccineDate) || "-"}</TableCell>
                          <TableCell sx={{ fontSize: "0.875rem" }}>{v.place || v.vaccinePlace || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography sx={{ fontSize: "0.9rem", color: "#9ca3af", mb: 2 }}>-</Typography>
              )}

              {/* วัคซีนโควิด */}
              <Typography sx={{ fontWeight: 600, mb: 1 }}>วัคซีนโควิด</Typography>
              {vaccinesCovid.length > 0 ? (
                <TableContainer sx={{ mb: 1 }}>
                  <Table size="small" sx={{ border: "1px solid #E5E7EB" }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f9fafb" }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>วัคซีนล่าสุด</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>วันที่ฉีด</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>สถานที่ฉีด</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vaccinesCovid.map((v: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontSize: "0.875rem" }}>{v.vaccineName || v.name || "-"}</TableCell>
                          <TableCell sx={{ fontSize: "0.875rem" }}>{v.date || fmtDateOnly(v.vaccineDate) || "-"}</TableCell>
                          <TableCell sx={{ fontSize: "0.875rem" }}>{v.place || v.vaccinePlace || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography sx={{ fontSize: "0.9rem", color: "#9ca3af" }}>-</Typography>
              )}
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

              {/* Vital signs — match Nuxt: always show unit suffix */}
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
          {shouldShowCancel && (
            <Button
              variant="contained"
              startIcon={<CloseIcon sx={{ fontSize: "22px !important" }} />}
              sx={{
                bgcolor: "#F25555",
                "&:hover": { bgcolor: "#FF808E" },
                "&:active": { bgcolor: "#DC4040" },
                textTransform: "none",
                fontWeight: 400,
                fontSize: "16px",
                fontFamily: "Poppins, sans-serif",
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
