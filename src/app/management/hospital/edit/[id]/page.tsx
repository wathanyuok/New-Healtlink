"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Snackbar,
  Alert,
  InputLabel,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import ImageIcon from "@mui/icons-material/Image";
import { useParams, useRouter } from "next/navigation";
import { useHospitalStore } from "@/stores/hospitalStore";

/* ── Nuxt-style select border ── */
const selectSx = {
  borderRadius: "8px",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#9ca3af" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#22c55e" },
};

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

/* ── Dropdown helper ── */
const renderSelectValue = (selected: any, options: { value: any; name: string }[], placeholder: string) => {
  if (!selected && selected !== 0) return <span style={{ color: "#9ca3af" }}>{placeholder}</span>;
  const found = options.find((o) => o.value === selected);
  return found ? found.name : <span style={{ color: "#9ca3af" }}>{placeholder}</span>;
};

/* ── Static options ── */
const SERVICE_LEVEL_OPTIONS = [
  { value: "ปฐมภูมิ", name: "ปฐมภูมิ" },
  { value: "ทุติยภูมิ", name: "ทุติยภูมิ" },
  { value: "ตติยภูมิ", name: "ตติยภูมิ" },
];

const AFFILIATION_OPTIONS = [
  { value: "สำนักการแพทย์", name: "สำนักการแพทย์" },
  { value: "โรงพยาบาลมหาลัย", name: "โรงพยาบาลมหาลัย" },
  { value: "สำนักอนามัย", name: "สำนักอนามัย" },
  { value: "คลินิกชุมชนอบอุ่น", name: "คลินิกชุมชนอบอุ่น" },
  { value: "กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม", name: "กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม" },
];

export default function HospitalEditPage() {
  const params = useParams();
  const router = useRouter();
  const hospitalId = params?.id as string;
  const hospitalStore = useHospitalStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── State ── */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Primary info
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalCode, setHospitalCode] = useState("");
  const [hospitalZone, setHospitalZone] = useState<number | "">("");
  const [hospitalSubType, setHospitalSubType] = useState<number | "">("");
  const [serviceLevel, setServiceLevel] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [phone, setPhone] = useState("");

  // Address info
  const [address, setAddress] = useState("");
  const [subDistrict, setSubDistrict] = useState("");
  const [district, setDistrict] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Image
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Options from API
  const [zoneOptions, setZoneOptions] = useState<{ value: number; name: string }[]>([]);
  const [typeOptions, setTypeOptions] = useState<{ value: number; name: string }[]>([]);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  /* ── Load data ── */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch options and hospital data in parallel
      const [hosRes, zoneRes, typeRes] = await Promise.all([
        hospitalStore.getDataHosById(hospitalId),
        hospitalStore.getOptionHosZone(),
        hospitalStore.getOptionHosType(),
      ]);

      // Map options
      const zones = (zoneRes?.hospitalZones || []).map((z: any) => ({ value: z.id, name: z.name }));
      const types = (typeRes?.hospitalSubTypes || []).map((t: any) => ({ value: t.id, name: t.name }));
      setZoneOptions(zones);
      setTypeOptions(types);

      // Populate form
      const data = hosRes?.hospital || hosRes;
      if (data) {
        setHospitalName(data.name || "");
        setHospitalCode(data.code || "");
        setPhone(data.phone || "");
        setServiceLevel(data.serviceLevel || "");
        setAffiliation(data.affiliation || "");
        setPreviewImage(data.image || null);

        // Address
        setAddress(data.address || "");
        setSubDistrict(data.subDistrict || "");
        setDistrict(data.district || "");
        setProvince(data.province || "");
        setPostalCode(data.postalCode || "");

        // Match zone/type by name
        if (data.zone) {
          const matched = zones.find((z: any) => z.name === data.zone.name);
          if (matched) setHospitalZone(matched.value);
        }
        if (data.subType) {
          const matched = types.find((t: any) => t.name === data.subType.name);
          if (matched) setHospitalSubType(matched.value);
        }
      }
    } catch (err) {
      console.error("Error loading hospital data:", err);
      setSnackbar({ open: true, message: "ไม่สามารถโหลดข้อมูลได้", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Image upload ── */
  const handleImageClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    setPreviewImage(URL.createObjectURL(file));

    try {
      const res = await hospitalStore.uploadFile(file);
      setImageUrl(res.data);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  /* ── Validation ── */
  const validate = () => {
    const errors: string[] = [];
    if (!hospitalName) errors.push("ชื่อสถานพยาบาล");
    if (!hospitalCode) errors.push("รหัสสถานพยาบาล");
    if (!hospitalZone) errors.push("โซนสถานพยาบาล");
    if (!hospitalSubType) errors.push("ประเภทสถานพยาบาล");
    if (!serviceLevel) errors.push("ระดับการให้บริการ");
    if (!affiliation) errors.push("สังกัดของสถานพยาบาล");
    return errors;
  };

  /* ── Save ── */
  const handleSave = async () => {
    const errors = validate();
    if (errors.length > 0) {
      setSnackbar({
        open: true,
        message: `กรุณากรอกข้อมูลให้ครบถ้วน: ${errors.join(", ")}`,
        severity: "error",
      });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: hospitalName,
        code: hospitalCode,
        phone,
        zone: hospitalZone,
        subType: hospitalSubType,
        serviceLevel,
        affiliation,
        address,
        subDistrict,
        district,
        province,
        postalCode,
        image: imageUrl || previewImage,
      };

      await hospitalStore.updateHospital(hospitalId, payload);
      setSnackbar({ open: true, message: "บันทึกข้อมูลสำเร็จ", severity: "success" });
      setTimeout(() => router.push("/management/hospital"), 1000);
    } catch (err) {
      console.error("Save error:", err);
      setSnackbar({ open: true, message: "ไม่สามารถบันทึกข้อมูลได้", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress sx={{ color: "#22c55e" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      {/* ── Page title ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <Button
          onClick={() => router.push("/management/hospital")}
          sx={{ minWidth: 0, p: 1, color: "#111" }}
        >
          <ArrowBackIcon />
        </Button>
        <Typography sx={{ fontSize: "1.5rem", fontWeight: 700, color: "#036245" }}>
          แก้ไขโรงพยาบาล
        </Typography>
      </Box>

      {/* ── Main panel ── */}
      <Box sx={{ bgcolor: "white", borderRadius: 2, border: "1px solid #e5e7eb", p: 3 }}>
        <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
          {/* ── Image upload (left) ── */}
          <Box
            onClick={handleImageClick}
            sx={{
              width: 240,
              height: 240,
              minWidth: 240,
              borderRadius: 2,
              overflow: "hidden",
              cursor: "pointer",
              bgcolor: previewImage ? "transparent" : "#f3f4f6",
              border: previewImage ? "4px solid white" : "1px solid #d1d5db",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              "&:hover": { opacity: 0.85 },
            }}
          >
            {previewImage ? (
              <img
                src={previewImage}
                alt="Hospital"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <ImageIcon sx={{ fontSize: 48, color: "#9ca3af" }} />
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </Box>

          {/* ── Form (right) ── */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            {/* ─── ข้อมูลเบื้องต้น ─── */}
            <SectionCard>
              <SectionHeader title="ข้อมูลเบื้องต้น" />
              <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2.5 }}>
                {/* Row 1: Name + Code */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                      ชื่อสถานพยาบาล <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      placeholder="กรุณาตั้งชื่อโรงพยาบาล"
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                      รหัสสถานพยาบาล <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={hospitalCode}
                      onChange={(e) => setHospitalCode(e.target.value)}
                      placeholder="กรุณากรอกรหัสโรงพยาบาล"
                    />
                  </Box>
                </Box>

                {/* Row 2: Zone + Type */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                      โซนสถานพยาบาล <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={hospitalZone}
                      onChange={(e) => setHospitalZone(e.target.value as number)}
                      displayEmpty
                      sx={selectSx}
                      renderValue={(val) => renderSelectValue(val, zoneOptions, "เลือกโซนสถานพยาบาล")}
                    >
                      {zoneOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.name}</MenuItem>
                      ))}
                    </Select>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                      ประเภทสถานพยาบาล <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={hospitalSubType}
                      onChange={(e) => setHospitalSubType(e.target.value as number)}
                      displayEmpty
                      sx={selectSx}
                      renderValue={(val) => renderSelectValue(val, typeOptions, "กรุณาเลือกประเภทโรงพยาบาล")}
                    >
                      {typeOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.name}</MenuItem>
                      ))}
                    </Select>
                  </Box>
                </Box>

                {/* Row 3: ServiceLevel + Affiliation + Phone */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                      ระดับการให้บริการ <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={serviceLevel}
                      onChange={(e) => setServiceLevel(e.target.value)}
                      displayEmpty
                      sx={selectSx}
                      renderValue={(val) => renderSelectValue(val, SERVICE_LEVEL_OPTIONS, "เลือกระดับการให้บริการ")}
                    >
                      {SERVICE_LEVEL_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.name}</MenuItem>
                      ))}
                    </Select>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                      สังกัดของสถานพยาบาล <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={affiliation}
                      onChange={(e) => setAffiliation(e.target.value)}
                      displayEmpty
                      sx={selectSx}
                      renderValue={(val) => renderSelectValue(val, AFFILIATION_OPTIONS, "กรุณาเลือกสังกัดของสถานพยาบาล")}
                    >
                      {AFFILIATION_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.name}</MenuItem>
                      ))}
                    </Select>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                      เบอร์โทร
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="กรุณากรอกเบอร์โทร"
                    />
                  </Box>
                </Box>
              </Box>
            </SectionCard>

            {/* ─── ข้อมูลที่อยู่ ─── */}
            <SectionCard>
              <SectionHeader title="ข้อมูลที่อยู่" />
              <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2.5 }}>
                {/* Row 1: Address (full width) */}
                <Box>
                  <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                    ที่อยู่
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="กรุณากรอกที่อยู่ บ้านเลทที่ หมู่"
                  />
                </Box>

                {/* Row 2: SubDistrict + District */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                      แขวง/ตำบล
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={subDistrict}
                      onChange={(e) => setSubDistrict(e.target.value)}
                      placeholder="แขวง/ตำบล"
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                      เขต/อำเภอ
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="เขต/อำเภอ"
                    />
                  </Box>
                </Box>

                {/* Row 3: Province + PostalCode */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                      จังหวัด
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      placeholder="จังหวัด"
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                      รหัสไปรษณีย์
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="รหัสไปรษณีย์"
                    />
                  </Box>
                </Box>
              </Box>
            </SectionCard>
          </Box>
        </Box>

        {/* ── Action buttons ── */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push("/management/hospital")}
            sx={{
              color: "#374151",
              borderColor: "#d1d5db",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              px: 3,
              py: 1,
              "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" },
            }}
          >
            ย้อนกลับ
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} sx={{ color: "white" }} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            sx={{
              bgcolor: "#22c55e",
              color: "white",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              px: 3,
              py: 1,
              "&:hover": { bgcolor: "#16a34a" },
            }}
          >
            บันทึกข้อมูล
          </Button>
        </Box>
      </Box>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
