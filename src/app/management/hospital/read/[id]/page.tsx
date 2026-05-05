"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GroupIcon from "@mui/icons-material/Group";
import PersonIcon from "@mui/icons-material/Person";
import PlaceIcon from "@mui/icons-material/Place";
import ImageIcon from "@mui/icons-material/Image";
import { useParams, useRouter } from "next/navigation";
import { useHospitalStore } from "@/stores/hospitalStore";

/* ── Section green gradient header ── */
const SectionHeader = ({ title }: { title: string }) => (
  <Box
    sx={{
      background: "linear-gradient(135deg, #c6f6d5, #e6fffa)",
      px: 2,
      py: 1,
      borderBottom: "1px solid #e5e7eb",
    }}
  >
    <Typography sx={{ fontWeight: 600, color: "#036245", fontSize: "1.1rem" }}>
      {title}
    </Typography>
  </Box>
);

/* ── Card wrapper ── */
const SectionCard = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 1, overflow: "hidden" }}>
    {children}
  </Box>
);

/* ── Read-only field ── */
const ReadField = ({ label, value, required }: { label: string; value?: string | null; required?: boolean }) => (
  <Box>
    <Typography variant="body2" sx={{ color: "#6b7280", fontWeight: 500, mb: 0.5 }}>
      {label} {required && <span style={{ color: "red" }}>*</span>}
    </Typography>
    <Typography sx={{ fontWeight: 600, fontSize: "1rem", color: "#111827" }}>
      {value || "-"}
    </Typography>
  </Box>
);

export default function HospitalReadPage() {
  const params = useParams();
  const router = useRouter();
  const hospitalId = params?.id as string;
  const hospitalStore = useHospitalStore();

  const [loading, setLoading] = useState(true);
  const [hospital, setHospital] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await hospitalStore.getDataHosById(hospitalId);
      const data = res?.hospital || res;
      setHospital(data);
    } catch (err) {
      console.error("Error loading hospital:", err);
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress sx={{ color: "#22c55e" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      {/* ── Page title + action buttons ── */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button onClick={() => router.push("/management/hospital")} sx={{ minWidth: 0, p: 1, color: "#111" }}>
            <ArrowBackIcon />
          </Button>
          <Typography sx={{ fontSize: "1.5rem", fontWeight: 700, color: "#036245" }}>
            ข้อมูลโรงพยาบาล
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<GroupIcon />}
            onClick={() => router.push("/management/permission-group")}
            sx={{
              color: "#036245",
              borderColor: "#d1d5db",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              "&:hover": { borderColor: "#22c55e", bgcolor: "#f0fdf4" },
            }}
          >
            จัดการกลุ่มสิทธิ์
          </Button>
          <Button
            variant="outlined"
            startIcon={<PersonIcon />}
            onClick={() => router.push("/management/user-account")}
            sx={{
              color: "#036245",
              borderColor: "#d1d5db",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              "&:hover": { borderColor: "#22c55e", bgcolor: "#f0fdf4" },
            }}
          >
            บัญชีผู้ใช้งาน
          </Button>
          <Button
            variant="outlined"
            startIcon={<PlaceIcon sx={{ color: "#036245" }} />}
            onClick={() => router.push("/setting-delivery-point/patient-referral")}
            sx={{
              color: "#036245",
              borderColor: "#d1d5db",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              "&:hover": { borderColor: "#22c55e", bgcolor: "#f0fdf4" },
            }}
          >
            จัดการจุดส่งตัว
          </Button>
        </Box>
      </Box>

      {/* ── Main panel ── */}
      <Box sx={{ bgcolor: "white", borderRadius: 2, border: "1px solid #e5e7eb", p: 3 }}>
        <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
          {/* ── Image (left) ── */}
          <Box
            sx={{
              width: 240,
              height: 240,
              minWidth: 240,
              borderRadius: 2,
              overflow: "hidden",
              bgcolor: hospital?.image ? "transparent" : "#f3f4f6",
              border: hospital?.image ? "4px solid white" : "1px solid #d1d5db",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {hospital?.image ? (
              <img
                src={hospital.image}
                alt="Hospital"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <ImageIcon sx={{ fontSize: 48, color: "#9ca3af" }} />
            )}
          </Box>

          {/* ── Data (right) ── */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            {/* ─── ข้อมูลเบื้องต้น ─── */}
            <SectionCard>
              <SectionHeader title="ข้อมูลเบื้องต้น" />
              <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2.5 }}>
                {/* Row 1: Name + Code */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <ReadField label="ชื่อสถานพยาบาล" value={hospital?.name} required />
                  <ReadField label="รหัสสถานพยาบาล" value={hospital?.code} required />
                </Box>
                {/* Row 2: Zone + Type + Phone */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
                  <ReadField label="โซนสถานพยาบาล" value={hospital?.zone?.name} required />
                  <ReadField label="ประเภทสถานพยาบาล" value={hospital?.subType?.name} required />
                  <ReadField label="เบอร์โทร" value={hospital?.phone} />
                </Box>
              </Box>
            </SectionCard>

            {/* ─── ข้อมูลที่อยู่ ─── */}
            <SectionCard>
              <SectionHeader title="ข้อมูลที่อยู่" />
              <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2.5 }}>
                {/* Row 1: Address (full width) */}
                <ReadField label="ที่อยู่" value={hospital?.address} />
                {/* Row 2: SubDistrict + District */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <ReadField label="แขวง/ตำบล" value={hospital?.subDistrict} />
                  <ReadField label="เขต/อำเภอ" value={hospital?.district} />
                </Box>
                {/* Row 3: Province + PostalCode */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <ReadField label="จังหวัด" value={hospital?.province} />
                  <ReadField label="รหัสไปรษณีย์" value={hospital?.postalCode} />
                </Box>
              </Box>
            </SectionCard>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
