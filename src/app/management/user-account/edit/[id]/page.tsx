"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  IconButton,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import LockResetIcon from "@mui/icons-material/LockReset";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useRouter, useParams } from "next/navigation";
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

/* ── Position options (from Nuxt account-edit.vue) ── */
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

export default function EditUserAccountPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const userStore = useUserStore();
  const hospitalStore = useHospitalStore();
  const authStore = useAuthStore();

  /* ── Profile & role ── */
  const profile = authStore.profile;
  const roleName = profile?.permissionGroup?.role?.name || "superAdmin";

  /* ── Watcher flags (matching Nuxt account-edit.vue) ── */
  const isLoadingUserProfile = useRef(false);
  const isInitializingForm = useRef(false);
  const isUpdatingTypeOption = useRef(false);
  const isPermissionInitialized = useRef(false);

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
  const [initializing, setInitializing] = useState(true);

  /* ── Reset password modal ── */
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  /* ── isGeneralPosition check (from Nuxt) ── */
  const isGeneralPosition = GENERAL_POSITIONS.includes(position);

  /* ── Transform API response to options { value, name } ── */
  const transformOptions = (arr: any[]) =>
    (arr || []).map((item: any) => ({ value: item.id, name: item.name, displayName: item.displayName }));

  /* ── Fetch roles (with role-based filtering) ── */
  const loadRoles = async () => {
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
      const opts = filtered.map((r: any) => {
        let description = "";
        if (r.displayName === "superAdmin") description = "สำหรับการจัดการระดับสูงสุด";
        else if (r.displayName === "superAdminZone") description = "จัดการสถานพยาบาลแม่ข่าย";
        else if (r.displayName === "superAdminHospital") description = "จัดการภายในโรงพยาบาลเดียว";
        return {
          value: r.id,
          name: r.displayName || r.name,
          ...(description ? { description } : {}),
        };
      });
      setRoleOptions(opts);
      return opts;
    } catch (err) {
      console.error("Error loading roles:", err);
      return [];
    }
  };

  /* ── Fetch zones ── */
  const loadZones = async () => {
    try {
      const res = await hospitalStore.getOptionHosZone();
      const opts = transformOptions(res?.hospitalZones || []);
      setZoneOptions(opts);
      return opts;
    } catch (err) {
      console.error("Error loading zones:", err);
      return [];
    }
  };

  /* ── Fetch types ── */
  const loadTypes = async (zoneId?: number | "") => {
    try {
      const p: any = { zone: zoneId || undefined, subType: undefined };
      if (roleName === "superAdminZone") {
        p.zone = profile?.permissionGroup?.zone?.id || zoneId || undefined;
      }
      const res = await hospitalStore.getOptionHosType(p);
      const opts = transformOptions(res?.hospitalSubTypes || []);
      setTypeOptions(opts);
      return opts;
    } catch (err) {
      console.error("Error loading types:", err);
      return [];
    }
  };

  /* ── Fetch hospitals ── */
  const loadHospitals = async (zoneId?: number | "", subType?: number | "") => {
    try {
      const p: any = { zone: zoneId || undefined, subType: subType || undefined };
      if (roleName === "superAdminZone") {
        p.zone = profile?.permissionGroup?.zone?.id || zoneId || undefined;
      }
      const res = await hospitalStore.getOptionHospital(p);
      const opts = transformOptions(res?.hospitals || []);
      setHospitalOptions(opts);
      return opts;
    } catch (err) {
      console.error("Error loading hospitals:", err);
      return [];
    }
  };

  /* ── Fetch permission groups (with role parameter like Nuxt) ── */
  const loadGroups = async (params?: any) => {
    try {
      const res = await hospitalStore.getOptionGroupPer(params || {});
      const opts = transformOptions(res?.permissionsGroup || []);
      setGroupOptions(opts);
      return opts;
    } catch (err) {
      console.error("Error loading groups:", err);
      return [];
    }
  };

  /* ── Load groups based on radio selection + role context (matching Nuxt logic) ── */
  const loadGroupsForRadio = async (
    radioValue: number | "",
    roles: any[],
    zoneVal?: number | "",
    typeVal?: number | "",
    hospitalVal?: number | ""
  ) => {
    if (!radioValue) return;
    const selectedRoleName = roles.find((r: any) => r.value === radioValue)?.name || "";

    if (roleName === "superAdmin") {
      if (selectedRoleName === "Super Admin") {
        await loadGroups({ role: 1 });
      } else if (selectedRoleName === "Zone User") {
        await loadGroups({ role: 2, zone: zoneVal || undefined });
      } else if (selectedRoleName === "Hospital User") {
        await loadGroups({ role: 3, hospital: hospitalVal || undefined, subType: typeVal || undefined });
      }
    } else if (roleName === "superAdminZone") {
      if (selectedRoleName === "Zone User") {
        await loadGroups({ role: 2, zone: profile?.permissionGroup?.zone?.id || undefined });
      } else if (selectedRoleName === "Hospital User") {
        await loadGroups({ role: 3, hospital: hospitalVal || undefined, subType: typeVal || undefined });
      }
    } else if (roleName === "superAdminHospital") {
      await loadGroups({
        role: 3,
        hospital: profile?.permissionGroup?.hospital?.id || undefined,
        zone: profile?.permissionGroup?.zone?.id || undefined,
      });
    }
  };

  /* ── Handle prefix from user data (matching Nuxt handleCustomPrefix) ── */
  const handleCustomPrefixFromData = (userPrefix: string) => {
    const standardPrefixes = PREFIX_OPTIONS.map((p) => p.value);
    if (standardPrefixes.includes(userPrefix) && userPrefix !== "อื่นๆ") {
      setPrefix(userPrefix);
      setCustomPrefix("");
    } else if (userPrefix) {
      setPrefix("อื่นๆ");
      setCustomPrefix(userPrefix);
    }
  };

  /* ── Initialize: load options, then load user data and populate form ── */
  useEffect(() => {
    const init = async () => {
      try {
        setInitializing(true);
        isLoadingUserProfile.current = true;
        isInitializingForm.current = true;

        // Step 1: Load all options in parallel
        const [roles] = await Promise.all([
          loadRoles(),
          loadZones(),
          loadTypes(),
          loadHospitals(),
        ]);

        // Step 2: Load user data
        const user = await userStore.getDataUserById(id);
        if (!user) {
          setError("ไม่สามารถค้นหาข้อมูลผู้ใช้");
          setInitializing(false);
          isLoadingUserProfile.current = false;
          isInitializingForm.current = false;
          return;
        }

        // Step 3: Populate basic info
        setPreviewImage(user.avatar || null);
        if (user.prefix) {
          handleCustomPrefixFromData(user.prefix);
        }
        setFirstName(user.firstName || "");
        setMiddleName(user.middleName || "");
        setLastName(user.lastName || "");
        setPosition(user.position || "");
        setNumberCallSign(user.identifyNumber || user.numberCallSign || "");
        setDepOfMedicine(user.department || user.depOfMedicine || "");
        setPhone(user.phone || "");
        setUsername(user.username || "");
        setEmail(user.email || "");

        // Step 4: Populate permission fields
        const userRoleId = user.permissionGroup?.role?.id;
        const userGroupId = user.permissionGroup?.id;
        const userZoneId = user.permissionGroup?.zone?.id;
        const userTypeId = user.permissionGroup?.hospital?.subType?.id;
        const userHospitalId = user.permissionGroup?.hospital?.id;

        if (userRoleId) setPermissionRadio(userRoleId);
        if (userZoneId) setSelectedZone(userZoneId);
        if (userTypeId) setSelectedType(userTypeId);
        if (userHospitalId) setSelectedHospital(userHospitalId);

        // Step 5: Load group options with correct role parameter, then set selected group
        if (roles && roles.length > 0 && userRoleId) {
          await loadGroupsForRadio(userRoleId, roles, userZoneId, userTypeId, userHospitalId);
        }
        if (userGroupId) setSelectedGroup(userGroupId);

        // For superAdminHospital, load groups immediately
        if (roleName === "superAdminHospital") {
          await loadGroups({
            role: 3,
            hospital: profile?.permissionGroup?.hospital?.id || undefined,
            zone: profile?.permissionGroup?.zone?.id || undefined,
          });
          if (userGroupId) setSelectedGroup(userGroupId);
        }
      } catch (err) {
        console.error("Error initializing edit page:", err);
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setInitializing(false);
        // Delay releasing flags to prevent cascading watchers
        setTimeout(() => {
          isLoadingUserProfile.current = false;
          isInitializingForm.current = false;
        }, 150);
      }
    };
    init();
  }, [id]);

  /* ── Handle radio change (user interaction only, not initialization) ── */
  const handleRadioChange = async (newValue: number) => {
    if (isLoadingUserProfile.current || isInitializingForm.current) return;

    setPermissionRadio(newValue);
    setSelectedZone("");
    setSelectedType("");
    setSelectedHospital("");
    setSelectedGroup("");

    // Load groups for new radio
    await loadGroupsForRadio(newValue, roleOptions);
  };

  /* ── Handle zone change (user interaction) ── */
  const handleZoneChange = async (newZone: number | "") => {
    if (isLoadingUserProfile.current || isInitializingForm.current) return;

    setSelectedZone(newZone);
    setSelectedType("");
    setSelectedHospital("");
    setSelectedGroup("");

    if (newZone) {
      await loadTypes(newZone);
      await loadHospitals(newZone);
      await loadGroupsForRadio(permissionRadio, roleOptions, newZone, "", "");
    }
  };

  /* ── Handle type change (user interaction) ── */
  const handleTypeChange = async (newType: number | "") => {
    if (isLoadingUserProfile.current || isInitializingForm.current) return;

    setSelectedType(newType);
    setSelectedHospital("");
    setSelectedGroup("");

    if (newType) {
      await loadHospitals(selectedZone, newType);
    }
  };

  /* ── Handle hospital change (user interaction) ── */
  const handleHospitalChange = async (newHospital: number | "") => {
    if (isLoadingUserProfile.current || isInitializingForm.current) return;

    setSelectedHospital(newHospital);
    setSelectedGroup("");

    if (newHospital && permissionRadio) {
      await loadGroupsForRadio(permissionRadio, roleOptions, selectedZone, selectedType, newHospital);
    }
  };

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
        prefix: computedPrefix === "อื่นๆ" ? customPrefix : computedPrefix,
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
        position,
        identifyNumber: numberCallSign.trim(),
        department: depOfMedicine.trim(),
        phone: phone.trim(),
        username: username.trim(),
        email: email.trim(),
        citizenId: numberCallSign.trim(),
        avatar: uploadedImageUrl || previewImage || "",
      };

      /* ── Add role/permission data based on current user role (matching Nuxt account-edit.vue checkFormData) ── */
      const permissionGroupHospitalId = profile?.permissionGroup?.hospital?.id;
      const permissionGroupSubTypeId = (profile?.permissionGroup as any)?.subType?.id;
      const permissionGroupZoneId = profile?.permissionGroup?.zone?.id;
      const selectedRoleName = roleOptions.find((r) => r.value === permissionRadio)?.name || "";

      if (roleName === "superAdminHospital") {
        formData.permissionGroup = selectedGroup;
        formData.hospital = permissionGroupHospitalId;
        formData.subType = permissionGroupSubTypeId;
        formData.zone = permissionGroupSubTypeId;
        formData.role = permissionRadio || undefined;
      } else if (roleName === "superAdminZone" && selectedRoleName === "Zone User") {
        formData.role = permissionRadio;
        formData.permissionGroup = selectedGroup;
        formData.hospital = permissionGroupHospitalId;
        formData.subType = permissionGroupSubTypeId;
        formData.zone = permissionGroupZoneId;
      } else if (roleName === "superAdminZone" && selectedRoleName === "Hospital User") {
        formData.role = permissionRadio;
        formData.permissionGroup = selectedGroup;
        formData.hospital = selectedHospital;
        formData.subType = selectedType;
        formData.zone = permissionGroupZoneId;
      } else if (roleName === "superAdmin" && selectedRoleName === "Super Admin") {
        formData.role = permissionRadio;
        formData.permissionGroup = selectedGroup;
        formData.hospital = permissionGroupHospitalId;
        formData.subType = permissionGroupSubTypeId;
        formData.zone = permissionGroupZoneId;
      } else if (roleName === "superAdmin" && selectedRoleName === "Zone User") {
        formData.role = permissionRadio;
        formData.permissionGroup = selectedGroup;
        formData.hospital = permissionGroupHospitalId;
        formData.subType = permissionGroupSubTypeId;
        formData.zone = selectedZone;
      } else if (roleName === "superAdmin" && selectedRoleName === "Hospital User") {
        formData.role = permissionRadio;
        formData.permissionGroup = selectedGroup;
        formData.hospital = selectedHospital;
        formData.subType = selectedType;
        formData.zone = selectedZone;
      }

      await userStore.updateUser(id, formData);
      router.push("/management/user-account");
    } catch (err: any) {
      const errorMessage = err?.message || err?.response?.data?.message || "";
      if (errorMessage === "User already exist" || errorMessage === "Username already exists") {
        setError("ชื่อนี้มีผู้ใช้งานแล้ว กรุณาใช้ชื่ออื่น");
      } else {
        setError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
      console.error("Error updating user:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Handle reset password (superAdmin only) ── */
  const handleResetPassword = async () => {
    if (!newPassword.trim()) return;
    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }
    setResetPasswordLoading(true);
    try {
      await userStore.resetPassword(id, newPassword.trim());
      setResetPasswordOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Error resetting password:", err);
      setError("เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน");
    } finally {
      setResetPasswordLoading(false);
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

  /* ── Show loading state while initializing ── */
  if (initializing) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress sx={{ color: "#00AF75" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* ── Title bar: back button LEFT + title + reset password button RIGHT ── */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => router.back()} size="small" sx={{ p: 1 }}>
            <ArrowBackIcon sx={{ fontSize: 24, color: "#000" }} />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#036245" }}>
            แก้ไขบัญชีเจ้าหน้าที่
          </Typography>
        </Box>
        {/* Reset password button - superAdmin only (matching Nuxt) */}
        {roleName === "superAdmin" && (
          <Button
            variant="contained"
            startIcon={<LockResetIcon />}
            onClick={() => setResetPasswordOpen(true)}
            sx={{
              bgcolor: "#fbbf24",
              color: "#334155",
              fontWeight: 700,
              "&:hover": { bgcolor: "#f59e0b" },
              textTransform: "none",
            }}
          >
            รีเซ็ตรหัสผ่าน
          </Button>
        )}
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

                {/* ── Row 3: Username + Email (NO password fields in edit) ── */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
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
                      onChange={(e) => handleRadioChange(Number(e.target.value))}
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
                      <Select value={selectedZone} onChange={(e) => handleZoneChange(e.target.value as any)} displayEmpty renderValue={renderPlaceholder("กรุณาเลือกโซนสถานพยาบาล")} sx={selectSx} MenuProps={dropdownMenuProps}>
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
                        <Select value={selectedZone} onChange={(e) => handleZoneChange(e.target.value as any)} displayEmpty renderValue={renderPlaceholder("กรุณาเลือกโซนสถานพยาบาล")} sx={selectSx} MenuProps={dropdownMenuProps}>
                          {zoneOptions.map((z) => (<MenuItem key={z.value} value={z.value}>{z.name}</MenuItem>))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" fullWidth>
                        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                          ประเภทสถานพยาบาล <span style={{ color: "red" }}>*</span>
                        </Typography>
                        <Select value={selectedType} onChange={(e) => handleTypeChange(e.target.value as any)} disabled={!selectedZone} displayEmpty renderValue={renderPlaceholder("กรุณาเลือกประเภทสถานพยาบาล")} sx={selectSx} MenuProps={dropdownMenuProps}>
                          {typeOptions.map((t) => (<MenuItem key={t.value} value={t.value}>{t.name}</MenuItem>))}
                        </Select>
                      </FormControl>
                    </Box>
                    <FormControl size="small" fullWidth>
                      <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                        สถานพยาบาล <span style={{ color: "red" }}>*</span>
                      </Typography>
                      <Select value={selectedHospital} onChange={(e) => handleHospitalChange(e.target.value as any)} disabled={!selectedType} displayEmpty renderValue={renderPlaceholder("กรุณาเลือกสถานพยาบาล")} sx={selectSx} MenuProps={dropdownMenuProps}>
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
                      <Select value={selectedType} onChange={(e) => handleTypeChange(e.target.value as any)} displayEmpty renderValue={renderPlaceholder("กรุณาเลือกประเภทสถานพยาบาล")} sx={selectSx} MenuProps={dropdownMenuProps}>
                        {typeOptions.map((t) => (<MenuItem key={t.value} value={t.value}>{t.name}</MenuItem>))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth>
                      <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                        สถานพยาบาล <span style={{ color: "red" }}>*</span>
                      </Typography>
                      <Select value={selectedHospital} onChange={(e) => handleHospitalChange(e.target.value as any)} disabled={!selectedType} displayEmpty renderValue={renderPlaceholder("กรุณาเลือกสถานพยาบาล")} sx={selectSx} MenuProps={dropdownMenuProps}>
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

      {/* ── Reset Password Modal (superAdmin only) ── */}
      <Dialog open={resetPasswordOpen} onClose={() => setResetPasswordOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: "#036245" }}>รีเซ็ตรหัสผ่าน</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                รหัสผ่านใหม่ <span style={{ color: "red" }}>*</span>
              </Typography>
              <TextField
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                size="small"
                fullWidth
                placeholder="รหัสผ่านใหม่"
                type={showNewPassword ? "text" : "password"}
                sx={textFieldSx}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                        {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                ยืนยันรหัสผ่านใหม่ <span style={{ color: "red" }}>*</span>
              </Typography>
              <TextField
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                size="small"
                fullWidth
                placeholder="ยืนยันรหัสผ่านใหม่"
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
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => { setResetPasswordOpen(false); setNewPassword(""); setConfirmPassword(""); }}
            sx={{ color: "#374151" }}
          >
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={handleResetPassword}
            disabled={resetPasswordLoading || !newPassword.trim() || newPassword !== confirmPassword}
            sx={{
              bgcolor: "#fbbf24",
              color: "#334155",
              fontWeight: 700,
              "&:hover": { bgcolor: "#f59e0b" },
            }}
          >
            {resetPasswordLoading ? <CircularProgress size={20} /> : "ยืนยันรีเซ็ต"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
