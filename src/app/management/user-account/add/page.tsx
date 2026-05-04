"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  IconButton,
  InputAdornment,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/userStore";
import { useHospitalStore } from "@/stores/hospitalStore";
import { useAuthStore } from "@/stores/authStore";

/* ── MUI Select border style (Nuxt-matching) ── */
const selectSx = {
  bgcolor: "#F8FFFE",
  borderRadius: 1,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#00AF75" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#00AF75" },
};
const dropdownMenuProps = { PaperProps: { sx: { maxHeight: 240 } } };

/* ── Render placeholder for empty Select ── */
const renderPlaceholder = (placeholder: string) => (selected: any) => {
  if (selected === "" || selected === undefined || selected === null) {
    return <span style={{ color: "#9ca3af" }}>{placeholder}</span>;
  }
  return undefined;
};

/* ── TextField border style ── */
const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#d1d5db" },
    "&:hover fieldset": { borderColor: "#00AF75" },
    "&.Mui-focused fieldset": { borderColor: "#00AF75" },
  },
};

/* ── Position options (from Nuxt account.vue) ── */
const POSITION_OPTIONS = [
  { value: "DENTIST", name: "ทันตแพทย์" },
  { value: "DOCTOR", name: "แพทย์" },
  { value: "MEDICAL_TECH", name: "เทคนิคการแพทย์" },
  { value: "NURSE", name: "พยาบาล" },
  { value: "PHARMACIST", name: "เภสัชกร" },
  { value: "PHYSIO", name: "นักกายภาพบำบัด" },
  { value: "TRADITIONAL_MED", name: "แพทย์แผนไทย" },
  { value: "AUDITOR", name: "ผู้ตรวจสอบการเบิกจ่ายเงินของคนไข้" },
  { value: "GENERAL", name: "เจ้าหน้าที่ทั่วไป" },
];

/* ── Prefix options (from Nuxt) ── */
const PREFIX_OPTIONS = [
  { value: "นาย", name: "นาย" },
  { value: "นางสาว", name: "นางสาว" },
  { value: "นพ.", name: "นพ." },
  { value: "พญ.", name: "พญ." },
  { value: "อ.", name: "อ." },
  { value: "ดร.", name: "ดร." },
  { value: "อื่นๆ", name: "อื่นๆ" },
];

/* ── General positions that don't require license number ── */
const GENERAL_POSITIONS = ["AUDITOR", "GENERAL", "PUBLIC_HEALTH_OFFICER"];

export default function AddUserAccountPage() {
  const router = useRouter();
  const userStore = useUserStore();
  const hospitalStore = useHospitalStore();
  const authStore = useAuthStore();

  /* ── Profile & role ── */
  const profile = authStore.profile;
  const roleName = profile?.permissionGroup?.role?.name || "superAdmin";

  /* ── Form state ── */
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  /* ── Section 1: Basic Information ── */
  const [prefix, setPrefix] = useState("");
  const [customPrefix, setCustomPrefix] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [position, setPosition] = useState("");
  const [numberCallSign, setNumberCallSign] = useState("");
  const [depOfMedicine, setDepOfMedicine] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /* ── Section 2: Role & Permissions ── */
  const [permissionRadio, setPermissionRadio] = useState<number | "">("");
  const [selectedZone, setSelectedZone] = useState<number | "">("");
  const [selectedType, setSelectedType] = useState<number | "">("");
  const [selectedHospital, setSelectedHospital] = useState<number | "">("");
  const [selectedGroup, setSelectedGroup] = useState<number | "">("");

  /* ── Options state ── */
  const [roleOptions, setRoleOptions] = useState<any[]>([]);
  const [zoneOptions, setZoneOptions] = useState<any[]>([]);
  const [typeOptions, setTypeOptions] = useState<any[]>([]);
  const [hospitalOptions, setHospitalOptions] = useState<any[]>([]);
  const [groupOptions, setGroupOptions] = useState<any[]>([]);

  /* ── Loading & validation ── */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ── isGeneralPosition check (from Nuxt) ── */
  const isGeneralPosition = GENERAL_POSITIONS.includes(position);

  /* ── Transform API response to options { value, name } ── */
  const transformOptions = (arr: any[]) =>
    (arr || []).map((item: any) => ({ value: item.id, name: item.name, displayName: item.displayName }));

  /* ── Fetch roles (with role-based filtering) ── */
  const loadRoles = useCallback(async () => {
    try {
      const res = await hospitalStore.getOptionRole();
      let filtered = res?.roles || [];
      if (roleName === "superAdminZone") {
        filtered = filtered.filter((r: any) => r.displayName !== "Super Admin");
      } else if (roleName === "superAdminHospital") {
        filtered = filtered.filter((r: any) => r.displayName !== "Super Admin" && r.displayName !== "Zone User");
      } else if (roleName === "superAdmin") {
        filtered = filtered.filter((r: any) => r.displayName !== "superAdminZone" && r.displayName !== "superAdminHospital");
      }
      setRoleOptions(
        filtered.map((r: any) => {
          let description = "";
          if (r.displayName === "superAdmin") description = "สำหรับการจัดการระดับสูงสุด";
          else if (r.displayName === "superAdminZone") description = "จัดการสถานพยาบาลแม่ข่าย";
          else if (r.displayName === "superAdminHospital") description = "จัดการภายในโรงพยาบาลเดียว";
          return {
            value: r.id,
            name: r.displayName || r.name,
            ...(description ? { description } : {}),
          };
        })
      );
    } catch (err) {
      console.error("Error loading roles:", err);
    }
  }, [roleName, hospitalStore]);

  /* ── Fetch zones ── */
  const loadZones = useCallback(async () => {
    try {
      const params: any = { zone: null, subType: null, hospital: null };
      if (roleName === "superAdminZone") {
        params.zone = profile?.permissionGroup?.zone?.id || null;
      }
      const res = await hospitalStore.getOptionHosZone(params);
      setZoneOptions(transformOptions(res?.hospitalZones || []));
    } catch (err) {
      console.error("Error loading zones:", err);
    }
  }, [roleName, profile, hospitalStore]);

  /* ── Fetch types ── */
  const loadTypes = useCallback(async (zoneId?: number | "") => {
    try {
      const params: any = { zone: zoneId || null, subType: null, hospital: null };
      if (roleName === "superAdminZone") {
        params.zone = profile?.permissionGroup?.zone?.id || zoneId || null;
      }
      const res = await hospitalStore.getOptionHosType(params);
      setTypeOptions(transformOptions(res?.hospitalSubTypes || []));
    } catch (err) {
      console.error("Error loading types:", err);
    }
  }, [roleName, profile, hospitalStore]);

  /* ── Fetch hospitals ── */
  const loadHospitals = useCallback(async (zoneId?: number | "", subType?: number | "") => {
    try {
      const params: any = { zone: zoneId || null, subType: subType || null, hospital: null };
      if (roleName === "superAdminZone") {
        params.zone = profile?.permissionGroup?.zone?.id || zoneId || null;
      }
      const res = await hospitalStore.getOptionHospital(params);
      setHospitalOptions(transformOptions(res?.hospitals || []));
    } catch (err) {
      console.error("Error loading hospitals:", err);
    }
  }, [roleName, profile, hospitalStore]);

  /* ── Fetch permission groups (with role parameter like Nuxt) ── */
  const loadGroups = useCallback(async (params?: any) => {
    try {
      const res = await hospitalStore.getOptionGroupPer(params || {});
      setGroupOptions(transformOptions(res?.permissionsGroup || []));
    } catch (err) {
      console.error("Error loading groups:", err);
    }
  }, [hospitalStore]);

  /* ── Load groups based on radio selection + role context (matching Nuxt logic) ── */
  const loadGroupsForRadio = useCallback(async (radioValue: number | "", zoneVal?: number | "", typeVal?: number | "", hospitalVal?: number | "") => {
    if (!radioValue) return;
    const selectedRoleName = roleOptions.find((r) => r.value === radioValue)?.name || "";

    if (roleName === "superAdmin") {
      if (selectedRoleName === "Super Admin") {
        // Nuxt: getOptionGroupAdmin → role=1
        await loadGroups({ role: 1 });
      } else if (selectedRoleName === "Zone User") {
        // Nuxt: getOptionGroupAndZone → role=2, zone
        await loadGroups({ role: 2, zone: zoneVal || undefined });
      } else if (selectedRoleName === "Hospital User") {
        // Nuxt: getOptionGroupRoleZoneInHos → role=3, hospital, subType
        await loadGroups({ role: 3, hospital: hospitalVal || undefined, subType: typeVal || undefined });
      }
    } else if (roleName === "superAdminZone") {
      if (selectedRoleName === "Zone User") {
        // Nuxt: getOptionGroupRoleZone → role=2, zone from profile
        await loadGroups({ role: 2, zone: profile?.permissionGroup?.zone?.id || undefined });
      } else if (selectedRoleName === "Hospital User") {
        // Nuxt: getOptionGroupPreRoleZoneInHos → role=3, hospital, subType
        await loadGroups({ role: 3, hospital: hospitalVal || undefined, subType: typeVal || undefined });
      }
    } else if (roleName === "superAdminHospital") {
      // Nuxt: getOptionGroupAndHospital → role=3, hospital from profile
      await loadGroups({
        role: 3,
        hospital: profile?.permissionGroup?.hospital?.id || undefined,
        zone: profile?.permissionGroup?.zone?.id || undefined,
      });
    }
  }, [roleName, profile, roleOptions, loadGroups]);

  /* ── Initialize on mount ── */
  useEffect(() => {
    const init = async () => {
      await loadRoles();
      await loadZones();
      await loadTypes();
      await loadHospitals();
      // Initial groups for superAdminHospital (always visible)
      if (roleName === "superAdminHospital") {
        await loadGroups({
          role: 3,
          hospital: profile?.permissionGroup?.hospital?.id || undefined,
          zone: profile?.permissionGroup?.zone?.id || undefined,
        });
      }
    };
    init();
  }, []);

  /* ── Refetch groups when radio changes ── */
  useEffect(() => {
    if (permissionRadio) {
      loadGroupsForRadio(permissionRadio, selectedZone, selectedType, selectedHospital);
    }
  }, [permissionRadio]);

  /* ── Refetch when zone changes (cascading: reset type/hospital/group + refetch) ── */
  useEffect(() => {
    if (selectedZone) {
      loadTypes(selectedZone);
      loadHospitals(selectedZone);
      // Refetch groups with zone context
      if (permissionRadio) {
        loadGroupsForRadio(permissionRadio, selectedZone, "", "");
      }
    }
  }, [selectedZone]);

  /* ── Refetch when type changes (cascading: refetch hospitals) ── */
  useEffect(() => {
    if (selectedType) {
      loadHospitals(selectedZone, selectedType);
    }
  }, [selectedType]);

  /* ── Refetch groups when hospital changes ── */
  useEffect(() => {
    if (selectedHospital && permissionRadio) {
      loadGroupsForRadio(permissionRadio, selectedZone, selectedType, selectedHospital);
    }
  }, [selectedHospital]);

  /* ── Handle avatar select (preview only, upload on save) ── */
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  /* ── Handle save ── */
  const handleSave = async () => {
    setError("");
    // Basic validation
    if (!firstName.trim()) { setError("กรุณากรอกชื่อ"); return; }
    if (!lastName.trim()) { setError("กรุณากรอกนามสกุล"); return; }
    if (!phone.trim()) { setError("กรุณากรอกเบอร์โทร"); return; }
    if (!username.trim()) { setError("กรุณากรอก Username"); return; }
    if (password !== confirmPassword) { setError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน"); return; }

    setLoading(true);
    try {
      /* ── Upload avatar if file selected ── */
      let uploadedImageUrl = imageUrl;
      if (avatarFile && !uploadedImageUrl) {
        try {
          const uploadRes = await hospitalStore.uploadFile(avatarFile);
          uploadedImageUrl = uploadRes?.data || uploadRes?.url || null;
          setImageUrl(uploadedImageUrl);
        } catch (uploadErr) {
          console.warn("[WARN] Avatar upload failed, continuing without avatar:", uploadErr);
        }
      }

      const computedPrefix = customPrefix || prefix;
      const formData: any = {
        prefix: computedPrefix,
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
        position,
        identifyNumber: numberCallSign.trim(),
        department: depOfMedicine.trim(),
        phone: phone.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        avatar: uploadedImageUrl,
        citizenId: numberCallSign.trim(),
      };

      /* ── Add role/permission data based on current user role (matching Nuxt account.vue checkFormData) ── */
      const permissionGroupHospitalId = profile?.permissionGroup?.hospital?.id;
      const permissionGroupSubTypeId = (profile?.permissionGroup as any)?.subType?.id;
      const permissionGroupZoneId = profile?.permissionGroup?.zone?.id;
      const selectedRoleName = roleOptions.find((r) => r.value === permissionRadio)?.name || "";

      if (roleName === "superAdminHospital") {
        // Nuxt: superAdminHospital sends profile's hospital/subType/zone
        formData.permissionGroup = selectedGroup;
        formData.hospital = permissionGroupHospitalId;
        formData.subType = permissionGroupSubTypeId;
        formData.zone = permissionGroupSubTypeId; // Nuxt uses subType here (bug in Nuxt but keep consistent)
        formData.role = permissionRadio || undefined;
      } else if (roleName === "superAdminZone" && selectedRoleName === "Zone User") {
        // Nuxt: superAdminZone radio=2 sends profile's hospital/zone
        formData.role = permissionRadio;
        formData.permissionGroup = selectedGroup;
        formData.hospital = permissionGroupHospitalId;
        formData.subType = permissionGroupSubTypeId;
        formData.zone = permissionGroupZoneId;
      } else if (roleName === "superAdminZone" && selectedRoleName === "Hospital User") {
        // Nuxt: superAdminZone radio=3 sends selected hospital/type + profile zone
        formData.role = permissionRadio;
        formData.permissionGroup = selectedGroup;
        formData.hospital = selectedHospital;
        formData.subType = selectedType;
        formData.zone = permissionGroupZoneId;
      } else if (roleName === "superAdmin" && selectedRoleName === "Super Admin") {
        // Nuxt: superAdmin radio=1 sends profile's hospital/subType/zone
        formData.role = permissionRadio;
        formData.permissionGroup = selectedGroup;
        formData.hospital = permissionGroupHospitalId;
        formData.subType = permissionGroupSubTypeId;
        formData.zone = permissionGroupZoneId;
      } else if (roleName === "superAdmin" && selectedRoleName === "Zone User") {
        // Nuxt: superAdmin radio=2 sends selected zone + profile hospital/subType
        formData.role = permissionRadio;
        formData.permissionGroup = selectedGroup;
        formData.hospital = permissionGroupHospitalId;
        formData.subType = permissionGroupSubTypeId;
        formData.zone = selectedZone;
      } else if (roleName === "superAdmin" && selectedRoleName === "Hospital User") {
        // Nuxt: superAdmin radio=3 sends all selected values
        formData.role = permissionRadio;
        formData.permissionGroup = selectedGroup;
        formData.hospital = selectedHospital;
        formData.subType = selectedType;
        formData.zone = selectedZone;
      }

      await userStore.createUser(formData);
      router.push("/management/user-account");
    } catch (err: any) {
      if (err?.message === "User already exist") {
        setError("ชื่อผู้ใช้นี้ถูกใช้งานแล้ว");
      } else {
        setError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
      console.error("Error creating user:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Get radio group number (1=SuperAdmin, 2=ZoneUser, 3=HospitalUser) ── */
  const getRadioGroupNumber = (): number => {
    if (!permissionRadio) return 0;
    const selectedRoleName = roleOptions.find((r) => r.value === permissionRadio)?.name || "";
    if (selectedRoleName === "Super Admin") return 1;
    if (selectedRoleName === "Zone User") return 2;
    if (selectedRoleName === "Hospital User") return 3;
    return 0;
  };
  const checkRadioGroup = getRadioGroupNumber();

  /* ── Green section header component ── */
  const SectionHeader = ({ title }: { title: string }) => (
    <Box
      sx={{
        background: "linear-gradient(135deg, #c6f6d5, #e6fffa)",
        px: 2,
        py: 1,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#036245", fontSize: "1.1rem" }}>
        {title}
      </Typography>
    </Box>
  );

  /* ── Card wrapper ── */
  const SectionCard = ({ children, sx: cardSx }: { children: React.ReactNode; sx?: any }) => (
    <Box
      sx={{
        border: "1px solid #e5e7eb",
        borderRadius: 1,
        overflow: "hidden",
        ...cardSx,
      }}
    >
      {children}
    </Box>
  );

  return (
    <Box sx={{ width: "100%" }}>
      {/* ── Title bar ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <IconButton onClick={() => router.back()} size="small" sx={{ p: 1 }}>
          <ArrowBackIcon sx={{ fontSize: 24, color: "#000" }} />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#036245" }}>
          เพิ่มบัญชีเจ้าหน้าที่
        </Typography>
      </Box>

      {/* ── Error alert ── */}
      {error && (
        <Box sx={{ bgcolor: "#fee2e2", color: "#991b1b", p: 2, borderRadius: 1, mb: 2, border: "1px solid #fecaca" }}>
          {error}
        </Box>
      )}

      {/* ── Main panel: Avatar LEFT + Form RIGHT ── */}
      <Box sx={{ bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: 2, p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
          {/* ── Avatar upload (240x240) ── */}
          <Box
            component="label"
            sx={{
              flexShrink: 0,
              width: 240,
              height: 240,
              borderRadius: 2,
              overflow: "hidden",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              ...(previewImage
                ? { border: "4px solid #fff", bgcolor: "transparent" }
                : { bgcolor: "#e5e7eb", outline: "1px solid #9ca3af" }),
              "&:hover": { opacity: 0.8 },
            }}
          >
            {previewImage ? (
              <img src={previewImage} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
            ) : (
              <FileUploadIcon sx={{ fontSize: 48, color: "#fff" }} />
            )}
            <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
          </Box>

          {/* ── Form content ── */}
          <Box sx={{ flex: 1 }}>
            {/* ── Section: ข้อมูลเบื้องต้น ── */}
            <SectionCard>
              <SectionHeader title="ข้อมูลเบื้องต้น" />
              <Box sx={{ p: 2 }}>
                {/* ── Row 1: Prefix + Name ── */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "200px 1fr 1fr 1fr" }, gap: 2, mb: 2 }}>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: prefix === "อื่นๆ" ? 120 : 200 }}>
                      <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                        คำนำหน้า <span style={{ color: "red" }}>*</span>
                      </Typography>
                      <Select
                        value={prefix}
                        onChange={(e) => { setPrefix(e.target.value); setCustomPrefix(""); }}
                        displayEmpty
                        renderValue={renderPlaceholder("กรุณาเลือกคำนำหน้า")}
                        sx={selectSx}
                        MenuProps={dropdownMenuProps}
                      >
                        {PREFIX_OPTIONS.map((p) => (
                          <MenuItem key={p.value} value={p.value}>{p.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {prefix === "อื่นๆ" && (
                      <Box sx={{ mt: 2.5 }}>
                        <TextField
                          label="ระบุ"
                          value={customPrefix}
                          onChange={(e) => setCustomPrefix(e.target.value)}
                          size="small"
                          sx={{ ...textFieldSx, width: 120 }}
                          placeholder="คำนำหน้า"
                        />
                      </Box>
                    )}
                  </Box>

                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                      ชื่อ <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <TextField value={firstName} onChange={(e) => setFirstName(e.target.value)} size="small" fullWidth placeholder="ชื่อ" sx={textFieldSx} />
                  </Box>

                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>ชื่อกลาง</Typography>
                    <TextField value={middleName} onChange={(e) => setMiddleName(e.target.value)} size="small" fullWidth placeholder="ชื่อกลาง" sx={textFieldSx} />
                  </Box>

                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                      นามสกุล <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <TextField value={lastName} onChange={(e) => setLastName(e.target.value)} size="small" fullWidth placeholder="นามสกุล" sx={textFieldSx} />
                  </Box>
                </Box>

                {/* ── Row 2: Position + License + Department + Phone ── */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: `1fr ${!isGeneralPosition ? "1fr 1fr" : ""} 1fr` }, gap: 2, mb: 2 }}>
                  <FormControl size="small" fullWidth>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                      ตำแหน่งเจ้าหน้าที่ <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <Select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      displayEmpty
                      renderValue={renderPlaceholder("ตำแหน่งเจ้าหน้าที่")}
                      sx={selectSx}
                      MenuProps={dropdownMenuProps}
                    >
                      {POSITION_OPTIONS.map((p) => (
                        <MenuItem key={p.value} value={p.value}>{p.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {!isGeneralPosition && (
                    <>
                      <Box>
                        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                          เลข ว./เลขใบประกอบวิชาชีพ <span style={{ color: "red" }}>*</span>
                        </Typography>
                        <TextField value={numberCallSign} onChange={(e) => setNumberCallSign(e.target.value)} size="small" fullWidth placeholder="เลข ว./เลขใบประกอบวิชาชีพ" sx={textFieldSx} />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>ภาควิชาแพทย์</Typography>
                        <TextField value={depOfMedicine} onChange={(e) => setDepOfMedicine(e.target.value)} size="small" fullWidth placeholder="ภาควิชาแพทย์" sx={textFieldSx} />
                      </Box>
                    </>
                  )}

                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                      เบอร์โทร <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <TextField value={phone} onChange={(e) => setPhone(e.target.value)} size="small" fullWidth placeholder="เบอร์โทร" sx={textFieldSx} />
                  </Box>
                </Box>

                {/* ── Row 3: Username + Email ── */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2, mb: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                      Username <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <TextField value={username} onChange={(e) => setUsername(e.target.value)} size="small" fullWidth placeholder="Username" sx={textFieldSx} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>Email</Typography>
                    <TextField value={email} onChange={(e) => setEmail(e.target.value)} size="small" fullWidth placeholder="Email" type="email" sx={textFieldSx} />
                  </Box>
                </Box>

                {/* ── Row 4: Password + Confirm Password ── */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                      รหัสผ่าน <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <TextField
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      size="small"
                      fullWidth
                      placeholder="รหัสผ่าน"
                      type={showPassword ? "text" : "password"}
                      sx={textFieldSx}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowPassword(!showPassword)} edge="end">
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                      ยืนยันรหัสผ่าน <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <TextField
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      size="small"
                      fullWidth
                      placeholder="ยืนยันรหัสผ่าน"
                      type={showConfirmPassword ? "text" : "password"}
                      sx={textFieldSx}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                              {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </SectionCard>

            {/* ── Section: ระดับบัญชี (hidden for superAdminHospital) ── */}
            {roleName !== "superAdminHospital" && (
              <SectionCard sx={{ mt: 2 }}>
                <SectionHeader title="ระดับบัญชี" />
                <Box sx={{ p: 2 }}>
                  <FormControl component="fieldset" fullWidth>
                    <RadioGroup
                      row
                      value={permissionRadio}
                      onChange={(e) => {
                        setPermissionRadio(Number(e.target.value));
                        setSelectedZone("");
                        setSelectedType("");
                        setSelectedHospital("");
                        setSelectedGroup("");
                      }}
                    >
                      {roleOptions.map((role) => (
                        <FormControlLabel
                          key={role.value}
                          value={role.value}
                          control={<Radio sx={{ color: "#d1d5db", "&.Mui-checked": { color: "#00AF75" } }} />}
                          label={
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{role.name}</Typography>
                              {role.description && (
                                <Typography variant="caption" sx={{ color: "#6b7280" }}>{role.description}</Typography>
                              )}
                            </Box>
                          }
                          sx={{ mr: 4, mb: 1 }}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                </Box>
              </SectionCard>
            )}

            {/* ══════════════════════════════════════════════════════════
                 Conditional sections based on role + radio selection
                 Each uses separate bordered cards side-by-side (Nuxt layout)
               ══════════════════════════════════════════════════════════ */}

            {/* ── superAdmin + Radio 1 (Super Admin): กลุ่มสิทธิ์ only ── */}
            {roleName === "superAdmin" && checkRadioGroup === 1 && (
              <SectionCard sx={{ mt: 2 }}>
                <SectionHeader title="กลุ่มสิทธิ์การใช้งาน" />
                <Box sx={{ p: 2 }}>
                  <FormControl size="small" fullWidth>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                      กลุ่มสิทธิ์การใช้งาน <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <Select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value as any)} displayEmpty renderValue={renderPlaceholder("เลือกกลุ่มสิทธิ์การใช้งาน")} sx={selectSx} MenuProps={dropdownMenuProps}>
                      {groupOptions.map((g) => (<MenuItem key={g.value} value={g.value}>{g.name}</MenuItem>))}
                    </Select>
                  </FormControl>
                </Box>
              </SectionCard>
            )}

            {/* ── superAdmin + Radio 2 (Zone User): สถานพยาบาล LEFT + กลุ่มสิทธิ์ RIGHT ── */}
            {roleName === "superAdmin" && checkRadioGroup === 2 && (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2, mt: 2 }}>
                <SectionCard>
                  <SectionHeader title="สถานพยาบาลที่รับผิดชอบ" />
                  <Box sx={{ p: 2 }}>
                    <FormControl size="small" fullWidth>
                      <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                        โซนสถานพยาบาล <span style={{ color: "red" }}>*</span>
                      </Typography>
                      <Select value={selectedZone} onChange={(e) => { setSelectedZone(e.target.value as any); setSelectedType(""); setSelectedHospital(""); setSelectedGroup(""); }} displayEmpty renderValue={renderPlaceholder("กรุณาเลือกโซนสถานพยาบาล")} sx={selectSx} MenuProps={dropdownMenuProps}>
                        {zoneOptions.map((z) => (<MenuItem key={z.value} value={z.value}>{z.name}</MenuItem>))}
                      </Select>
                    </FormControl>
                  </Box>
                </SectionCard>
                <SectionCard>
                  <SectionHeader title="กลุ่มสิทธิ์การใช้งาน" />
                  <Box sx={{ p: 2 }}>
                    <FormControl size="small" fullWidth>
                      <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                        กลุ่มสิทธิ์การใช้งาน <span style={{ color: "red" }}>*</span>
                      </Typography>
                      <Select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value as any)} disabled={!selectedZone} displayEmpty renderValue={renderPlaceholder("เลือกกลุ่มสิทธิ์การใช้งาน")} sx={selectSx} MenuProps={dropdownMenuProps}>
                        {groupOptions.map((g) => (<MenuItem key={g.value} value={g.value}>{g.name}</MenuItem>))}
                      </Select>
                    </FormControl>
                  </Box>
                </SectionCard>
              </Box>
            )}

            {/* ── superAdmin + Radio 3 (Hospital User): สถานพยาบาล LEFT + กลุ่มสิทธิ์ RIGHT ── */}
            {roleName === "superAdmin" && checkRadioGroup === 3 && (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2, mt: 2 }}>
                <SectionCard>
                  <SectionHeader title="สถานพยาบาลที่รับผิดชอบ" />
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                      <FormControl size="small" fullWidth>
                        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                          โซนสถานพยาบาล <span style={{ color: "red" }}>*</span>
                        </Typography>
                        <Select value={selectedZone} onChange={(e) => { setSelectedZone(e.target.value as any); setSelectedType(""); setSelectedHospital(""); setSelectedGroup(""); }} displayEmpty renderValue={renderPlaceholder("กรุณาเลือกโซนสถานพยาบาล")} sx={selectSx} MenuProps={dropdownMenuProps}>
                          {zoneOptions.map((z) => (<MenuItem key={z.value} value={z.value}>{z.name}</MenuItem>))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" fullWidth>
                        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                          ประเภทสถานพยาบาล <span style={{ color: "red" }}>*</span>
                        </Typography>
                        <Select value={selectedType} onChange={(e) => { setSelectedType(e.target.value as any); setSelectedHospital(""); setSelectedGroup(""); }} disabled={!selectedZone} displayEmpty renderValue={renderPlaceholder("กรุณาเลือกประเภทสถานพยาบาล")} sx={selectSx} MenuProps={dropdownMenuProps}>
                          {typeOptions.map((t) => (<MenuItem key={t.value} value={t.value}>{t.name}</MenuItem>))}
                        </Select>
                      </FormControl>
                    </Box>
                    <FormControl size="small" fullWidth>
                      <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                        สถานพยาบาล <span style={{ color: "red" }}>*</span>
                      </Typography>
                      <Select value={selectedHospital} onChange={(e) => { setSelectedHospital(e.target.value as any); setSelectedGroup(""); }} disabled={!selectedType} displayEmpty renderValue={renderPlaceholder("กรุณาเลือกสถานพยาบาล")} sx={selectSx} MenuProps={dropdownMenuProps}>
                        {hospitalOptions.map((h) => (<MenuItem key={h.value} value={h.value}>{h.name}</MenuItem>))}
                      </Select>
                    </FormControl>
                  </Box>
                </SectionCard>
                <SectionCard>
                  <SectionHeader title="กลุ่มสิทธิ์การใช้งาน" />
                  <Box sx={{ p: 2 }}>
                    <FormControl size="small" fullWidth>
                      <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                        กลุ่มสิทธิ์การใช้งาน <span style={{ color: "red" }}>*</span>
                      </Typography>
                      <Select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value as any)} disabled={!selectedHospital} displayEmpty renderValue={renderPlaceholder("เลือกกลุ่มสิทธิ์การใช้งาน")} sx={selectSx} MenuProps={dropdownMenuProps}>
                        {groupOptions.map((g) => (<MenuItem key={g.value} value={g.value}>{g.name}</MenuItem>))}
                      </Select>
                    </FormControl>
                  </Box>
                </SectionCard>
              </Box>
            )}

            {/* ── superAdminZone + Radio 2 (Zone User): กลุ่มสิทธิ์ only ── */}
            {roleName === "superAdminZone" && checkRadioGroup === 2 && (
              <SectionCard sx={{ mt: 2 }}>
                <SectionHeader title="กลุ่มสิทธิ์การใช้งาน" />
                <Box sx={{ p: 2 }}>
                  <FormControl size="small" fullWidth>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                      กลุ่มสิทธิ์การใช้งาน <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <Select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value as any)} displayEmpty renderValue={renderPlaceholder("เลือกกลุ่มสิทธิ์การใช้งาน")} sx={selectSx} MenuProps={dropdownMenuProps}>
                      {groupOptions.map((g) => (<MenuItem key={g.value} value={g.value}>{g.name}</MenuItem>))}
                    </Select>
                  </FormControl>
                </Box>
              </SectionCard>
            )}

            {/* ── superAdminZone + Radio 3 (Hospital User): สถานพยาบาล LEFT + กลุ่มสิทธิ์ RIGHT ── */}
            {roleName === "superAdminZone" && checkRadioGroup === 3 && (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2, mt: 2 }}>
                <SectionCard>
                  <SectionHeader title="สถานพยาบาลที่รับผิดชอบ" />
                  <Box sx={{ p: 2 }}>
                    <FormControl size="small" fullWidth sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                        ประเภทสถานพยาบาล <span style={{ color: "red" }}>*</span>
                      </Typography>
                      <Select value={selectedType} onChange={(e) => { setSelectedType(e.target.value as any); setSelectedHospital(""); setSelectedGroup(""); }} displayEmpty renderValue={renderPlaceholder("กรุณาเลือกประเภทสถานพยาบาล")} sx={selectSx} MenuProps={dropdownMenuProps}>
                        {typeOptions.map((t) => (<MenuItem key={t.value} value={t.value}>{t.name}</MenuItem>))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth>
                      <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                        สถานพยาบาล <span style={{ color: "red" }}>*</span>
                      </Typography>
                      <Select value={selectedHospital} onChange={(e) => { setSelectedHospital(e.target.value as any); setSelectedGroup(""); }} disabled={!selectedType} displayEmpty renderValue={renderPlaceholder("กรุณาเลือกสถานพยาบาล")} sx={selectSx} MenuProps={dropdownMenuProps}>
                        {hospitalOptions.map((h) => (<MenuItem key={h.value} value={h.value}>{h.name}</MenuItem>))}
                      </Select>
                    </FormControl>
                  </Box>
                </SectionCard>
                <SectionCard>
                  <SectionHeader title="กลุ่มสิทธิ์การใช้งาน" />
                  <Box sx={{ p: 2 }}>
                    <FormControl size="small" fullWidth>
                      <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                        กลุ่มสิทธิ์การใช้งาน <span style={{ color: "red" }}>*</span>
                      </Typography>
                      <Select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value as any)} disabled={!selectedHospital} displayEmpty renderValue={renderPlaceholder("เลือกกลุ่มสิทธิ์การใช้งาน")} sx={selectSx} MenuProps={dropdownMenuProps}>
                        {groupOptions.map((g) => (<MenuItem key={g.value} value={g.value}>{g.name}</MenuItem>))}
                      </Select>
                    </FormControl>
                  </Box>
                </SectionCard>
              </Box>
            )}

            {/* ── superAdminHospital: กลุ่มสิทธิ์ only ── */}
            {roleName === "superAdminHospital" && (
              <SectionCard sx={{ mt: 2 }}>
                <SectionHeader title="กลุ่มสิทธิ์การใช้งาน" />
                <Box sx={{ p: 2 }}>
                  <FormControl size="small" fullWidth>
                    <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                      กลุ่มสิทธิ์การใช้งาน <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <Select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value as any)} displayEmpty renderValue={renderPlaceholder("เลือกกลุ่มสิทธิ์การใช้งาน")} sx={selectSx} MenuProps={dropdownMenuProps}>
                      {groupOptions.map((g) => (<MenuItem key={g.value} value={g.value}>{g.name}</MenuItem>))}
                    </Select>
                  </FormControl>
                </Box>
              </SectionCard>
            )}

            {/* ── Action buttons ── */}
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => router.back()}
                sx={{
                  borderColor: "#d1d5db",
                  color: "#374151",
                  fontWeight: 600,
                  "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" },
                }}
              >
                ย้อนกลับ
              </Button>
              <Button
                variant="outlined"
                startIcon={loading ? <CircularProgress size={20} sx={{ color: "#00AF75" }} /> : <SaveIcon />}
                onClick={handleSave}
                disabled={loading}
                sx={{
                  borderColor: "#00AF75",
                  color: "#00AF75",
                  fontWeight: 600,
                  "&:hover": { borderColor: "#009966", bgcolor: "#f0fdf4" },
                  "&:disabled": { opacity: 0.5 },
                }}
              >
                บันทึกข้อมูล
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
