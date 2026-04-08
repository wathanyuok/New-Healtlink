"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Radio,
  RadioGroup,
  FormControlLabel,
  Collapse,
  Dialog,
  DialogContent,
  Autocomplete,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  ExpandLess,
  ExpandMore,
  CloudUpload as CloudUploadIcon,
  ImageOutlined as ImageIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useReferralCreateStore } from "@/stores/referralCreateStore";
import { useAuthStore } from "@/stores/authStore";
import ThaiDateInput from "@/components/shared/ThaiDateInput";
import api from "@/lib/api";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface DiseaseItem {
  id: number;
  name: string;
}
interface AllergyItem {
  id: number;
  name: string;
}
interface VaccineItem {
  id: number;
  vaccineName: string;
  date: string;
  location: string;
}
interface ICD10Item {
  id: number;
  icd_10_tm: string;
  diagetname: string;
  diagename: string;
}
interface MedicineItem {
  id: number;
  drugname: string;
  qty: string;
  drugusage: string;
  strength: string;
}
interface EquipmentItem {
  id: number;
  name: string;
}
interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}
interface UploadedFileItem {
  id: number;
  name: string;
  size: string;
  file: File;
  url: string;
}
interface DocumentItem {
  id: number;
  fileName: string;
  fileType: string; // "X-ray" | "Lab" | "MRI" | "อื่นๆ"
  docCode: string;
  docName: string;
  detail: string;
  dateTime: string;
  files: UploadedFileItem[];
}

export interface ReferralFormData {
  // Patient info
  patient_pid: string;
  patient_prefix: string;
  patient_firstname: string;
  patient_lastname: string;
  patient_birthday: string;
  patient_age: string;
  patient_sex: string;
  patient_blood_group: string;
  patient_hn: string;
  patient_an: string;
  patient_vn: string;
  patient_image: string | null;
  patient_treatment: string;
  patient_treatment_other: string;
  patient_treatment_hospital: string;
  patient_house: string;
  patient_moo: string;
  patient_road: string;
  patient_alley: string;
  patient_tambon: string;
  patient_amphur: string;
  patient_changwat: string;
  patient_zipcode: string;
  patient_phone: string;
  // Emergency contact
  emergency_contacts: EmergencyContact[];
  // Referral info (left column)
  referral_cause: string;
  referral_reason: string;
  acute_level: string;
  additional_info: string;
  is_infectious: string; // "yes" | "no" | ""
  infectious_detail: string;
  additionalComments: string;
  requiredEquipment: EquipmentItem[];
  // Health info
  physicalExam: string;
  diseases: DiseaseItem[];
  drugAllergy: AllergyItem[];
  vaccines: VaccineItem[];
  // Medical info
  temperature: string;
  bps: string;
  bpd: string;
  pulse: string;
  rr: string;
  visit_primary_symptom_main_symptom: string;
  visit_primary_symptom_current_illness: string;
  pe: string;
  Imp: string;
  moreDetail: string;
  icd10Basic: string;
  icd10: ICD10Item[];
  icd10MoreBasic: string;
  icd10More: ICD10Item[];
  medicines: MedicineItem[];
  // Doctor info
  prescribingDoctor: string;
  doctorCode: string;
  medicalDepartment: string;
  doctorContactNumber: string;
  // Documents
  documents: DocumentItem[];
}

const defaultFormData: ReferralFormData = {
  patient_pid: "1234567890123",
  patient_prefix: "นาย",
  patient_firstname: "ทดสอบ",
  patient_lastname: "ระบบ",
  patient_birthday: "1990-05-15",
  patient_age: "36",
  patient_sex: "ชาย",
  patient_blood_group: "O",
  patient_hn: "HN001234",
  patient_an: "",
  patient_vn: "",
  patient_image: null,
  patient_treatment: "บัตรทอง",
  patient_treatment_other: "",
  patient_treatment_hospital: "",
  patient_house: "99/1",
  patient_moo: "5",
  patient_road: "สุขุมวิท",
  patient_alley: "ซอย 10",
  patient_tambon: "บางจาก",
  patient_amphur: "พระโขนง",
  patient_changwat: "กรุงเทพมหานคร",
  patient_zipcode: "10260",
  patient_phone: "0812345678",
  emergency_contacts: [{ name: "สมศรี ระบบ", phone: "0898765432", relation: "คู่สมรส" }],
  prescribingDoctor: "",
  doctorCode: "D12345",
  medicalDepartment: "อายุรกรรม",
  doctorContactNumber: "0891112222",
  referral_cause: "",
  referral_reason: "ส่งต่อเพื่อรับการรักษา",
  acute_level: "5",
  additional_info: "",
  is_infectious: "false",
  infectious_detail: "",
  additionalComments: "",
  requiredEquipment: [],
  physicalExam: "",
  diseases: [],
  drugAllergy: [],
  vaccines: [{ id: 1, vaccineName: "", date: "", location: "" }],
  temperature: "36.5",
  bps: "120",
  bpd: "80",
  pulse: "72",
  rr: "18",
  visit_primary_symptom_main_symptom: "ปวดท้อง",
  visit_primary_symptom_current_illness: "ปวดท้องบริเวณลิ้นปี่ 2 วัน มีอาเจียน",
  pe: "Abdomen: mild tenderness at epigastric area",
  Imp: "R/O Gastritis",
  moreDetail: "",
  icd10Basic: "โรคกระเพาะอาหารอักเสบ",
  icd10: [{ id: 1, icd_10_tm: "K29", diagetname: "กระเพาะอาหารอักเสบ", diagename: "GASTRITIS" }],
  icd10MoreBasic: "",
  icd10More: [{ id: 2, icd_10_tm: "", diagetname: "", diagename: "" }],
  medicines: [],
  documents: [],
};

/* ------------------------------------------------------------------ */
/*  Options                                                            */
/* ------------------------------------------------------------------ */
const PREFIX_OPTIONS = [
  { name: "นาย", value: "นาย" },
  { name: "นาง", value: "นาง" },
  { name: "นางสาว", value: "นางสาว" },
  { name: "ด.ช.", value: "ด.ช." },
  { name: "ด.ญ.", value: "ด.ญ." },
  { name: "อื่นๆ", value: "อื่นๆ" },
];
const SEX_OPTIONS = ["ชาย", "หญิง", "อื่นๆ"];
const BLOOD_GROUP_OPTIONS = ["A", "B", "AB", "O", "อื่นๆ"];
const TREATMENT_OPTIONS = [
  { name: "สิทธิข้าราชการ", value: "สิทธิข้าราชการ" },
  { name: "ประกันสังคม", value: "ประกันสังคม" },
  { name: "บัตรทอง", value: "บัตรทอง" },
  { name: "ประกันสุภาพเอกชน", value: "ประกันสุภาพเอกชน" },
  { name: "ชำระเงินเอง", value: "ชำระเงินเอง" },
  { name: "สิทธิอื่นๆไม่ระบุ", value: "สิทธิอื่นๆไม่ระบุ" },
  { name: "อื่นๆ", value: "อื่นๆ" },
];
const ACUTE_LEVEL_OPTIONS = [
  { value: 1, label: "ผู้ป่วยไร้เสถียรภาพ", badge: "U", color: "#dc2626" },
  { value: 2, label: "ผู้ป่วยมีเสถียรภาพ มีความเสี่ยงต่อการทรุดลงเฉียบพลันสูง", badge: "H", color: "#ea580c" },
  { value: 3, label: "ผู้ป่วยมีเสถียรภาพ มีความเสี่ยงต่อการทรุดลงเฉียบพลันปานกลาง", badge: "M", color: "#eab308" },
  { value: 4, label: "ผู้ป่วยมีเสถียรภาพ มีความเสี่ยงต่อการทรุดลงเฉียบพลันต่ำ", badge: "L", color: "#22c55e" },
  { value: 5, label: "ผู้ป่วยมีเสถียรภาพ ไม่มีความเสี่ยงต่อการทรุดลงเฉียบพลัน", badge: "N", color: "#6b7280" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const SectionHeader = ({ title }: { title: string }) => (
  <Box sx={{ bgcolor: "#dcfce7", px: 2, py: 1.5, mb: 0, borderBottom: "2px solid #16a34a" }}>
    <Typography sx={{ fontWeight: 600, color: "#036245", fontSize: "1.05rem" }}>
      {title}
    </Typography>
  </Box>
);

const SubSectionHeader = ({ title }: { title: string }) => {
  const hasAsterisk = title.includes("*");
  const cleanTitle = hasAsterisk ? title.replace(" *", "").replace("*", "") : title;
  return (
    <Box sx={{ borderBottom: "2px solid #16a34a", px: 2, py: 1.5 }}>
      <Typography sx={{ fontWeight: 600, color: "#036245", fontSize: "1rem" }}>
        {cleanTitle}
        {hasAsterisk && <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>}
      </Typography>
    </Box>
  );
};

const FieldLabel = ({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) => (
  <Typography
    variant="body2"
    sx={{ mb: 0.5, fontWeight: 500, color: "#374151", fontSize: "0.95rem" }}
  >
    {label}
    {required && (
      <Typography component="span" sx={{ color: "#ef4444", ml: 0.5 }}>
        *
      </Typography>
    )}
  </Typography>
);

const AddButton = ({ onClick }: { onClick: () => void }) => (
  <Box
    onClick={onClick}
    sx={{
      border: "2px dashed #CBD5E1",
      borderRadius: 1,
      py: 1.5,
      textAlign: "center",
      cursor: "pointer",
      "&:hover": { bgcolor: "#f9fafb" },
    }}
  >
    <Typography sx={{ fontWeight: 500, color: "#036245" }}>เพิ่ม</Typography>
  </Box>
);

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
interface Props {
  kind: string;
  hospitalName: string;
  branchNames: string;
  searchParams: Record<string, string>;
  formData: Record<string, any>;
  onUpdate: (partial: Record<string, any>) => void;
  formErrors?: Record<string, string>;
}

export default function RequestReferralForm({
  kind,
  hospitalName,
  branchNames,
  searchParams,
  formData: externalFormData,
  onUpdate,
  formErrors = {},
}: Props) {
  // Local form state merged with external (only non-empty external values override defaults)
  const [form, setForm] = useState<ReferralFormData>(() => {
    const merged = { ...defaultFormData };
    if (externalFormData) {
      Object.entries(externalFormData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0)) {
          (merged as any)[key] = value;
        }
      });
    }
    return merged;
  });
  const [addressOpen, setAddressOpen] = useState(true);
  const [emergencyOpen, setEmergencyOpen] = useState(true);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Document upload modal state
  const [showDocModal, setShowDocModal] = useState(false);
  const [docModalData, setDocModalData] = useState({
    docCode: "",
    docName: "",
    detail: "",
    docType: "",
    otherTypeDetail: "",
    files: [] as UploadedFileItem[],
  });
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const [showDocDetailModal, setShowDocDetailModal] = useState(false);
  const [docDetailViewData, setDocDetailViewData] = useState<DocumentItem | null>(null);

  const resetDocModal = () => {
    setDocModalData({ docCode: "", docName: "", detail: "", docType: "อื่นๆ", otherTypeDetail: "test", files: [] });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    const newFiles: UploadedFileItem[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.size > 10 * 1024 * 1024) {
        alert(`ไฟล์ "${file.name}" ขนาดเกิน 10 MB`);
        continue;
      }
      newFiles.push({
        id: Date.now() + i,
        name: file.name,
        size: formatFileSize(file.size),
        file,
        url: URL.createObjectURL(file),
      });
    }
    setDocModalData((prev) => ({ ...prev, files: [...prev.files, ...newFiles] }));
    // Reset input so same file can be selected again
    if (docFileInputRef.current) docFileInputRef.current.value = "";
  };

  const removeDocFile = (fileId: number) => {
    setDocModalData((prev) => ({ ...prev, files: prev.files.filter((f) => f.id !== fileId) }));
  };

  const handleDocModalSave = () => {
    if (!docModalData.docType) {
      alert("กรุณาเลือกประเภทเอกสาร");
      return;
    }
    if (docModalData.docType === "อื่นๆ" && !docModalData.otherTypeDetail.trim()) {
      alert("กรุณาระบุรายละเอียดสำหรับประเภทเอกสาร \"อื่นๆ\"");
      return;
    }
    if (docModalData.docType !== "อื่นๆ" && docModalData.files.length === 0) {
      alert("กรุณาอัพโหลดไฟล์ก่อน");
      return;
    }
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear() + 543;
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    const dateTimeStr = `${dd}/${mm}/${yyyy} ${hh}:${min} น.`;
    const newDoc: DocumentItem = {
      id: Date.now(),
      fileName: docModalData.files.map((f) => f.name).join(", ") || "-",
      fileType: docModalData.docType,
      docCode: docModalData.docCode,
      docName: docModalData.docName,
      detail: docModalData.docType === "อื่นๆ" ? docModalData.otherTypeDetail : docModalData.detail,
      dateTime: dateTimeStr,
      files: docModalData.files,
    };
    updateField("documents", [...form.documents, newDoc]);
    resetDocModal();
    setShowDocModal(false);
  };

  const updateField = useCallback(
    (field: keyof ReferralFormData, value: any) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      onUpdate({ [field]: value });
    },
    [onUpdate]
  );

  // ---- Fetch dropdown data from API ----
  const { referralCauses, doctorUsers, fetchReferralCauses, fetchDoctorUsers } =
    useReferralCreateStore();

  // Subscribe reactively so useEffect re-runs when navbar hospital changes
  const optionHospital = useAuthStore((s) => s.optionHospital);
  const authProfile = useAuthStore((s) => s.profile);

  useEffect(() => {
    const authState = useAuthStore.getState();
    const roleName = authState.getRoleName();
    let userHospitalId: string | undefined;
    if (roleName === "superAdmin") {
      userHospitalId = optionHospital ? String(optionHospital) : undefined;
    } else {
      const ownHospitalId = (authProfile as any)?.permissionGroup?.hospital?.id;
      userHospitalId = ownHospitalId ? String(ownHospitalId) : undefined;
    }

    // If no valid hospital (e.g. superAdmin hasn't picked one in navbar),
    // clear the dropdowns and skip fetch — matches Nuxt behavior.
    if (!userHospitalId) {
      useReferralCreateStore.setState({ doctorUsers: [], referralCauses: [] });
      return;
    }

    const referralType = kind === "requestReferOut" || kind === "referOut"
      ? "Refer Out - ส่งตัวออก"
      : "Refer Back - ส่งตัวกลับ";
    fetchReferralCauses({
      hospital: userHospitalId,
      referralType,
      isOpd: "true",
    });

    fetchDoctorUsers({
      hospital: userHospitalId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, optionHospital, authProfile]);

// Branch data from query params (branchData is JSON array from DoctorBranchSelector)
  const branchList = (() => {
    try {
      if (searchParams.branchData) {
        const data = JSON.parse(searchParams.branchData);
        return data.map((item: any, i: number) => ({
          index: i + 1,
          name: item.name || "",
          appointmentDate: item.appointmentDate || "",
          appointmentTime: item.appointmentTime || "",
          appointment: item.appointment ?? 1,
          remark: item.remark || "",
        }));
      }
    } catch { /* fallback */ }
    // Fallback: parse from branchNames
    return branchNames
      ? branchNames.split(",").map((name: string, i: number) => ({
          index: i + 1,
          name: name.trim(),
          appointmentDate: "",
          appointmentTime: "",
          appointment: 1,
          remark: "",
        }))
      : [];
  })();

  // Referral point info from query params
  const referPointName = searchParams.referPointName || "";
  const referPointPhone = searchParams.referPointPhone || "";

  /* ---- Image handling ---- */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateField("patient_image", reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /* ---- Dynamic list helpers ---- */
  const addDisease = () => {
    const newDiseases = [
      ...form.diseases,
      { id: Date.now(), name: "" },
    ];
    updateField("diseases", newDiseases);
  };
  const removeDisease = (index: number) => {
    const newDiseases = form.diseases.filter((_, i) => i !== index);
    updateField("diseases", newDiseases);
  };
  const updateDiseaseName = (index: number, value: string) => {
    const newDiseases = [...form.diseases];
    newDiseases[index] = { ...newDiseases[index], name: value };
    updateField("diseases", newDiseases);
  };

  const addAllergy = () => {
    const newAllergy = [
      ...form.drugAllergy,
      { id: Date.now(), name: "" },
    ];
    updateField("drugAllergy", newAllergy);
  };
  const removeAllergy = (index: number) => {
    const newAllergy = form.drugAllergy.filter((_, i) => i !== index);
    updateField("drugAllergy", newAllergy);
  };
  const updateAllergyName = (index: number, value: string) => {
    const newAllergy = [...form.drugAllergy];
    newAllergy[index] = { ...newAllergy[index], name: value };
    updateField("drugAllergy", newAllergy);
  };

  const addVaccine = () => {
    const newVaccines = [
      ...form.vaccines,
      { id: Date.now(), vaccineName: "", date: "", location: "" },
    ];
    updateField("vaccines", newVaccines);
  };
  const removeVaccine = (index: number) => {
    if (form.vaccines.length <= 1) return;
    const newVaccines = form.vaccines.filter((_, i) => i !== index);
    updateField("vaccines", newVaccines);
  };
  const updateVaccineField = (
    index: number,
    field: keyof VaccineItem,
    value: string
  ) => {
    const newVaccines = [...form.vaccines];
    newVaccines[index] = { ...newVaccines[index], [field]: value };
    updateField("vaccines", newVaccines);
  };

  const addICD10 = () => {
    const newIcd = [
      ...form.icd10,
      { id: Date.now(), icd_10_tm: "", diagetname: "", diagename: "" },
    ];
    updateField("icd10", newIcd);
  };
  const removeICD10 = (index: number) => {
    const newIcd = form.icd10.filter((_, i) => i !== index);
    updateField("icd10", newIcd);
  };
  const updateICD10Field = (
    index: number,
    field: keyof ICD10Item,
    value: string
  ) => {
    const newIcd = [...form.icd10];
    newIcd[index] = { ...newIcd[index], [field]: value };
    updateField("icd10", newIcd);
  };

  // ICD10 More (โรคร่วม)
  const addICD10More = () => {
    const newIcd = [
      ...form.icd10More,
      { id: Date.now(), icd_10_tm: "", diagetname: "", diagename: "" },
    ];
    updateField("icd10More", newIcd);
  };
  const removeICD10More = (index: number) => {
    const newIcd = form.icd10More.filter((_, i) => i !== index);
    updateField("icd10More", newIcd);
  };
  const updateICD10MoreField = (
    index: number,
    field: keyof ICD10Item,
    value: string
  ) => {
    const newIcd = [...form.icd10More];
    newIcd[index] = { ...newIcd[index], [field]: value };
    updateField("icd10More", newIcd);
  };

  // ICD-10 autocomplete search
  interface ICD10Option {
    value: string;
    label: string;
    name_th: string;
    name_en: string;
  }
  const [icd10Options, setIcd10Options] = useState<ICD10Option[]>([]);
  const [icd10Loading, setIcd10Loading] = useState(false);
  const icd10SearchTimer = useRef<NodeJS.Timeout | null>(null);

  const searchICD10 = useCallback((searchValue: string) => {
    if (icd10SearchTimer.current) clearTimeout(icd10SearchTimer.current);
    if (!searchValue || searchValue.length < 1) {
      setIcd10Options([]);
      return;
    }
    icd10SearchTimer.current = setTimeout(async () => {
      setIcd10Loading(true);
      try {
        const res = await api.get("main-service/icd10/findAndCount", {
          params: { limit: 10, offset: 1, search: searchValue },
        });
        const items = res.data?.icd10 || res.data?.data || [];
        setIcd10Options(
          items.map((item: any) => ({
            value: item.icd10_code || item.code || "",
            label: `${item.icd10_code || item.code || ""} - ${item.icd10_name || item.name_en || ""}`,
            name_th: item.icd10_name_th || item.name_th || "",
            name_en: item.icd10_name || item.name_en || "",
          }))
        );
      } catch (e) {
        console.error("ICD-10 search error:", e);
        setIcd10Options([]);
      } finally {
        setIcd10Loading(false);
      }
    }, 300);
  }, []);

  const handleICD10Select = (
    option: ICD10Option | null,
    index: number,
    section: "icd10" | "icd10More"
  ) => {
    if (!option) return;
    const fieldName = section;
    const arr = [...form[fieldName]];
    arr[index] = {
      ...arr[index],
      icd_10_tm: option.value,
      diagetname: option.name_th,
      diagename: option.name_en,
    };
    updateField(fieldName, arr);
    setIcd10Options([]);
  };

  const addMedicine = () => {
    const newMeds = [
      ...form.medicines,
      { id: Date.now(), drugname: "", qty: "", drugusage: "", strength: "" },
    ];
    updateField("medicines", newMeds);
  };
  const removeMedicine = (index: number) => {
    const newMeds = form.medicines.filter((_, i) => i !== index);
    updateField("medicines", newMeds);
  };

  const addEmergencyContact = () => {
    const newContacts = [
      ...form.emergency_contacts,
      { name: "", phone: "", relation: "" },
    ];
    updateField("emergency_contacts", newContacts);
  };
  const updateEmergencyContact = (
    index: number,
    field: keyof EmergencyContact,
    value: string
  ) => {
    const newContacts = [...form.emergency_contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    updateField("emergency_contacts", newContacts);
  };

  const formatBranchDateTime = (branch: any) => {
    if (!branch.appointmentDate && !branch.appointmentTime) return "-";
    if (branch.appointment === 2) return "ไม่ระบุวัน/เวลา";
    // appointmentDate is "YYYY-MM-DD", appointmentTime is "HH:MM"
    const dateParts = branch.appointmentDate ? branch.appointmentDate.split("-") : null;
    if (!dateParts || dateParts.length < 3) return branch.appointmentDate || "-";
    const day = dateParts[2];
    const month = dateParts[1];
    const year = Number(dateParts[0]) + 543;
    const time = branch.appointmentTime || "00:00";
    return `${day}/${month}/${year} - ${time} น.`;
  };

  return (
    <Paper
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        boxShadow: "none",
        border: "1px solid #e5e7eb",
      }}
    >
      {/* ============================================================ */}
      {/*  TOP: Two-column layout                                       */}
      {/* ============================================================ */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          gap: 3,
          p: 2,
        }}
      >
        {/* ========== LEFT COLUMN: ข้อมูลใบส่งตัว ========== */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              border: "1px solid #e5e7eb",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <SectionHeader title="ข้อมูลใบส่งตัว" />
            <Box sx={{ p: 2 }}>
              {/* ข้อมูลสถานพยาบาล */}
              <Typography
                sx={{
                  fontWeight: 500,
                  color: "#036245",
                  fontSize: "1.05rem",
                  mb: 1,
                }}
              >
                ข้อมูลสถานพยาบาล
              </Typography>
              <Box sx={{ borderBottom: "2px solid #16a34a", mb: 2 }} />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 3,
                  mb: 3,
                }}
              >
                {/* Left sub-col */}
                <Box>
                  <Typography
                    sx={{ fontWeight: 500, fontSize: "1rem", mb: 0.5 }}
                  >
                    สถานพยาบาลปลายทาง
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: "#e5e7eb",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.7rem",
                        color: "#9ca3af",
                      }}
                    >
                      40x40
                    </Box>
                    <Typography variant="body2">{hospitalName}</Typography>
                  </Box>

                  <Typography
                    sx={{ fontWeight: 500, fontSize: "1rem", mt: 3, mb: 0.5 }}
                  >
                    จุดรับใบส่งตัว
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    {referPointName || "-"}
                  </Typography>

                  <Typography
                    sx={{ fontWeight: 500, fontSize: "1rem", mt: 3, mb: 0.5 }}
                  >
                    จุดสร้างใบส่งตัว
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ ml: 2, color: "#EAB308" }}
                  >
                    รอยืนยันนัดหมาย
                  </Typography>
                </Box>

                {/* Right sub-col */}
                <Box>
                  <Typography
                    sx={{ fontWeight: 500, fontSize: "1rem", mb: 0.5 }}
                  >
                    ประเภทผู้ป่วยที่ส่งตัว
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ ml: 2, mt: 2, color: "#7c3aed" }}
                  >
                    OPD - ผู้ป่วยนอก
                  </Typography>

                  <Typography
                    sx={{ fontWeight: 500, fontSize: "1rem", mt: 3, mb: 0.5 }}
                  >
                    เบอร์ติดต่อจุดใบส่งตัว
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    {referPointPhone ? `${referPointPhone} ต่อ ไม่ระบุ` : "-"}
                  </Typography>

                  <Typography
                    sx={{ fontWeight: 500, fontSize: "1rem", mt: 3, mb: 0.5 }}
                  >
                    เบอร์ติดต่อจุดสร้างใบส่งตัว
                    <Typography
                      component="span"
                      sx={{ color: "#ef4444", ml: 0.5 }}
                    >
                      *
                    </Typography>
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    -
                  </Typography>
                </Box>
              </Box>

              {/* สาขา/แผนกปลายทาง */}
              <Box sx={{ borderBottom: "2px solid #16a34a", mb: 2 }}>
                <Typography
                  sx={{
                    fontWeight: 500,
                    color: "#036245",
                    fontSize: "1rem",
                    mb: 1,
                  }}
                >
                  สาขา/แผนกปลายทาง
                </Typography>
              </Box>

              <TableContainer
                sx={{
                  boxShadow: "none",
                  border: "1px solid #e5e7eb",
                  borderRadius: 1,
                  mb: 3,
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f9fafb" }}>
                      <TableCell
                        sx={{ fontWeight: 600, textAlign: "center", width: 60 }}
                      >
                        ลำดับ
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        สาขา/แผนกที่ส่งต่อ
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        วัน/เวลานัดหมาย
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>หมายเหตุ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {branchList.map((branch) => (
                      <TableRow key={branch.index}>
                        <TableCell align="center">{branch.index}</TableCell>
                        <TableCell>{branch.name}</TableCell>
                        <TableCell>
                          {formatBranchDateTime(branch)}
                        </TableCell>
                        <TableCell>{branch.remark || "-"}</TableCell>
                      </TableRow>
                    ))}
                    {branchList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 2 }}>
                          <Typography variant="body2" color="textSecondary">
                            ไม่มีข้อมูล
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* ข้อมูลผู้สร้างใบส่งตัว */}
              <Box sx={{ borderBottom: "2px solid #16a34a", mt: 2, mb: 2 }}>
                <Typography
                  sx={{
                    fontWeight: 500,
                    color: "#036245",
                    fontSize: "1rem",
                    mb: 1,
                  }}
                >
                  ข้อมูลผู้สร้างใบส่งตัว
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 3,
                  mb: 3,
                }}
              >
                {/* Left */}
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <FieldLabel label="แพทย์ผู้ที่สั่ง" required />
                    <Autocomplete
                      fullWidth
                      size="small"
                      options={doctorUsers}
                      getOptionLabel={(option) => typeof option === "string" ? option : option.name}
                      value={doctorUsers.find((d) => String(d.id) === String(form.prescribingDoctor)) || null}
                      onChange={(_e, newValue) => {
                        const selectedId = newValue ? String(newValue.id) : "";
                        updateField("prescribingDoctor" as any, selectedId);
                        if (newValue) {
                          updateField("doctorCode" as any, newValue.licenseNumber || "");
                          updateField("doctorContactNumber" as any, newValue.phone || "");
                        } else {
                          updateField("doctorCode" as any, "");
                          updateField("doctorContactNumber" as any, "");
                        }
                      }}
                      isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                      noOptionsText="ไม่พบแพทย์ที่ค้นหา"
                      renderOption={(props, option) => (
                        <li {...props} key={String(option.id)}>
                          {option.name}
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="เลือกแพทย์ผู้สั่ง"
                          error={!!formErrors.prescribingDoctor}
                        />
                      )}
                      ListboxProps={{ style: { maxHeight: 240 } }}
                    />
                    {formErrors.prescribingDoctor && (
                      <Typography variant="caption" sx={{ color: "#ef4444", mt: 0.5 }}>
                        {formErrors.prescribingDoctor}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <FieldLabel label="ภาควิชาแพทย์" />
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="เลือกภาควิชาแพทย์"
                      value={form.medicalDepartment || ""}
                      onChange={(e) =>
                        updateField("medicalDepartment" as any, e.target.value)
                      }
                    />
                  </Box>
                </Box>

                {/* Right */}
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <FieldLabel label="รหัสแพทย์" required />
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="รหัสแพทย์"
                      value={form.doctorCode || ""}
                      onChange={(e) =>
                        updateField("doctorCode" as any, e.target.value)
                      }
                      error={!!formErrors.doctorCode}
                      helperText={formErrors.doctorCode}
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <FieldLabel label="เบอร์ติดต่อแพทย์" />
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="เบอร์ติดต่อแพทย์"
                      value={form.doctorContactNumber || ""}
                      onChange={(e) =>
                        updateField("doctorContactNumber" as any, e.target.value)
                      }
                    />
                  </Box>
                </Box>
              </Box>

              {/* เหตุผลและสาเหตุ */}
              <Box sx={{ borderBottom: "2px solid #16a34a", mb: 2 }}>
                <Typography
                  sx={{
                    fontWeight: 500,
                    color: "#036245",
                    fontSize: "1rem",
                    mb: 1,
                  }}
                >
                  เหตุผลและสาเหตุ
                </Typography>
              </Box>

              {/* สาเหตุการส่งตัว */}
              <Box sx={{ mb: 2 }}>
                <FieldLabel label="สาเหตุการส่งตัว" required />
                <FormControl fullWidth size="small">
                  <Select
                    value={form.referral_cause}
                    displayEmpty
                    onChange={(e) =>
                      updateField("referral_cause", e.target.value)
                    }
                    error={!!formErrors.referral_cause}
                    MenuProps={{
                      PaperProps: {
                        sx: { maxHeight: 240 },
                      },
                    }}
                  >
                    <MenuItem value="" disabled>
                      <span style={{ color: "#9ca3af" }}>
                        เลือกสาเหตุการส่งตัว
                      </span>
                    </MenuItem>
                    {referralCauses.map((cause) => (
                      <MenuItem key={cause.id} value={String(cause.id)}>
                        {cause.name}
                      </MenuItem>
                    ))}
                    {referralCauses.length === 0 && (
                      <MenuItem value="" disabled>
                        ไม่พบข้อมูล
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
                {formErrors.referral_cause && (
                  <Typography
                    variant="caption"
                    sx={{ color: "#ef4444", mt: 0.5 }}
                  >
                    กรุณาเลือกข้อมูล
                  </Typography>
                )}
              </Box>

              {/* เหตุผลการส่งตัว */}
              <Box sx={{ mb: 2 }}>
                <FieldLabel label="เหตุผลการส่งตัว" />
                <TextField
                  fullWidth
                  size="small"
                  placeholder="เหตุผลการส่งตัว (ถ้ามี)"
                  value={form.referral_reason}
                  onChange={(e) =>
                    updateField("referral_reason", e.target.value)
                  }
                />
              </Box>

              {/* ระดับความสำคัญ */}
              <Typography
                sx={{
                  fontWeight: 500,
                  color: "#036245",
                  fontSize: "1rem",
                  mt: 2,
                  mb: 1,
                }}
              >
                ระดับความสำคัญ
              </Typography>
              <Box sx={{ borderBottom: "2px solid #16a34a", mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <FieldLabel label="ระดับความเฉียบพลัน" required />
                <FormControl fullWidth size="small">
                  <Select
                    value={form.acute_level}
                    displayEmpty
                    onChange={(e) =>
                      updateField("acute_level", e.target.value)
                    }
                    error={!!formErrors.acute_level}
                  >
                    <MenuItem value="" disabled>
                      <span style={{ color: "#9ca3af" }}>เลือกระดับ</span>
                    </MenuItem>
                    {ACUTE_LEVEL_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={String(opt.value)}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              bgcolor: opt.color,
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {opt.badge}
                          </Box>
                          <span>{opt.label}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {formErrors.acute_level && (
                  <Typography
                    variant="caption"
                    sx={{ color: "#ef4444", mt: 0.5 }}
                  >
                    กรุณาเลือกข้อมูล
                  </Typography>
                )}
              </Box>

              {/* ข้อมูลเพิ่มเติม */}
              <Typography
                sx={{
                  fontWeight: 500,
                  color: "#036245",
                  fontSize: "1rem",
                  mt: 2,
                  mb: 1,
                }}
              >
                ข้อมูลเพิ่มเติม
              </Typography>
              <Box sx={{ borderBottom: "2px solid #16a34a", mb: 2 }} />

              {/* คนไข้เป็นโรคติดต่อ */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  sx={{ fontWeight: 500, fontSize: "0.95rem", mb: 1 }}
                >
                  คนไข้เป็นโรคติดต่อ
                </Typography>
                <RadioGroup
                  row
                  value={form.is_infectious}
                  onChange={(e) =>
                    updateField("is_infectious", e.target.value)
                  }
                >
                  <FormControlLabel
                    value="yes"
                    control={<Radio size="small" />}
                    label="ใช่"
                  />
                  <FormControlLabel
                    value="no"
                    control={<Radio size="small" />}
                    label="ไม่"
                  />
                </RadioGroup>
                {form.is_infectious === "yes" && (
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="ระบุรายละเอียด"
                    value={form.infectious_detail}
                    onChange={(e) =>
                      updateField("infectious_detail", e.target.value)
                    }
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>

              {/* ความเห็นเพิ่มเติม */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  sx={{ fontWeight: 500, fontSize: "0.95rem", mb: 1 }}
                >
                  ความเห็นเพิ่มเติม
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="ความเห็นเพิ่มเติม(ถ้ามี)"
                  value={form.additionalComments}
                  onChange={(e) =>
                    updateField("additionalComments", e.target.value)
                  }
                />
              </Box>
            </Box>

            {/* อุปกรณ์ที่จำเป็น */}
            <Typography
              sx={{
                fontWeight: 400,
                color: "#036245",
                fontSize: "1rem",
                px: 2,
                py: 1,
                borderBottom: "2px solid #16a34a",
              }}
            >
              อุปกรณ์ที่จำเป็น
            </Typography>
            <Box sx={{ p: 2 }}>
              <Typography
                sx={{ fontWeight: 500, fontSize: "0.95rem", mb: 1 }}
              >
                ชื่ออุปกรณ์
              </Typography>
              {form.requiredEquipment.map((item, index) => (
                <Box
                  key={item.id}
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    value={item.name}
                    onChange={(e) => {
                      const updated = [...form.requiredEquipment];
                      updated[index] = { ...updated[index], name: e.target.value };
                      updateField("requiredEquipment", updated);
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => {
                      const updated = form.requiredEquipment.filter(
                        (_, i) => i !== index
                      );
                      updateField("requiredEquipment", updated);
                    }}
                    sx={{
                      bgcolor: "#ef4444",
                      color: "#fff",
                      "&:hover": { bgcolor: "#dc2626" },
                      width: 32,
                      height: 32,
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Box
                onClick={() => {
                  const newId =
                    form.requiredEquipment.length > 0
                      ? Math.max(...form.requiredEquipment.map((e) => e.id)) + 1
                      : 1;
                  updateField("requiredEquipment", [
                    ...form.requiredEquipment,
                    { id: newId, name: "" },
                  ]);
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px dashed #CBD5E1",
                  borderRadius: 1,
                  p: 1,
                  cursor: "pointer",
                  "&:hover": { bgcolor: "#f9fafb" },
                }}
              >
                <Typography sx={{ fontWeight: 500, color: "#036245" }}>
                  เพิ่ม
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ========== RIGHT COLUMN: ข้อมูลผู้ป่วย ========== */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              border: "1px solid #e5e7eb",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <SectionHeader title="ข้อมูลผู้ป่วย" />
            <Box sx={{ p: 2 }}>
              {/* เลขที่บัตรประชาชน */}
              <Box sx={{ mb: 2 }}>
                <FieldLabel label="เลขที่บัตรประชาชน/หนังสือเดินทาง" required />
                <TextField
                  fullWidth
                  size="small"
                  placeholder="กรอกหมายเลขบัตรประชาชน"
                  value={form.patient_pid}
                  onChange={(e) =>
                    updateField("patient_pid", e.target.value)
                  }
                  error={!!formErrors.patient_pid}
                  helperText={formErrors.patient_pid}
                  inputProps={{ maxLength: 13 }}
                />
              </Box>

              {/* คำนำหน้า, ชื่อ, นามสกุล */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box>
                  <FieldLabel label="คำนำหน้า" required />
                  <FormControl fullWidth size="small">
                    <Select
                      value={form.patient_prefix}
                      displayEmpty
                      onChange={(e) =>
                        updateField("patient_prefix", e.target.value)
                      }
                      error={!!formErrors.patient_prefix}
                    >
                      <MenuItem value="" disabled>
                        <span style={{ color: "#9ca3af" }}>คำนำหน้า...</span>
                      </MenuItem>
                      {PREFIX_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {formErrors.patient_prefix && (
                    <Typography variant="caption" sx={{ color: "#ef4444", mt: 0.5 }}>
                      {formErrors.patient_prefix}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <FieldLabel label="ชื่อ" required />
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="กรอกชื่อ"
                    value={form.patient_firstname}
                    onChange={(e) =>
                      updateField("patient_firstname", e.target.value)
                    }
                    error={!!formErrors.patient_firstname}
                    helperText={formErrors.patient_firstname}
                  />
                </Box>
                <Box>
                  <FieldLabel label="นามสกุล" required />
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="นามสกุลผู้ป่วย"
                    value={form.patient_lastname}
                    onChange={(e) =>
                      updateField("patient_lastname", e.target.value)
                    }
                    error={!!formErrors.patient_lastname}
                    helperText={formErrors.patient_lastname}
                  />
                </Box>
              </Box>

              {/* Photo + วันเกิด/อายุ + เพศ/กรุ๊ปเลือด */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 2,
                  mb: 2,
                }}
              >
                {/* Photo upload */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    pt: 1,
                  }}
                >
                  <Box
                    onClick={() => imageInputRef.current?.click()}
                    sx={{
                      width: 200,
                      height: 150,
                      border: "1px solid #e5e7eb",
                      borderRadius: 1,
                      bgcolor: "#f9fafb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      overflow: "hidden",
                      "&:hover": { bgcolor: "#f3f4f6" },
                    }}
                  >
                    {form.patient_image ? (
                      <Box
                        component="img"
                        src={form.patient_image}
                        alt="uploaded"
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <ImageIcon sx={{ fontSize: 48, color: "#9ca3af" }} />
                    )}
                  </Box>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleImageChange}
                  />
                </Box>

                {/* วันเกิด + เพศ */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box>
                    <FieldLabel label="วันเกิด" />
                    <ThaiDateInput
                      value={form.patient_birthday}
                      onChange={(val) => {
                        updateField("patient_birthday", val);
                        // Auto-calculate age
                        if (val) {
                          const [by, bm, bd] = val.split("-").map(Number);
                          const now = new Date();
                          let age = now.getFullYear() - by;
                          if (now.getMonth() + 1 < bm || (now.getMonth() + 1 === bm && now.getDate() < bd)) {
                            age--;
                          }
                          updateField("patient_age", age >= 0 ? `${age} ปี` : "");
                        } else {
                          updateField("patient_age", "");
                        }
                      }}
                      placeholder="เลือกวันเกิด"
                      maxDate={new Date().toISOString().split("T")[0]}
                    />
                  </Box>
                  <Box>
                    <FieldLabel label="เพศ" required />
                    <FormControl fullWidth size="small">
                      <Select
                        value={form.patient_sex}
                        displayEmpty
                        onChange={(e) =>
                          updateField("patient_sex", e.target.value)
                        }
                        error={!!formErrors.patient_sex}
                      >
                        <MenuItem value="" disabled>
                          <span style={{ color: "#9ca3af" }}>เพศ...</span>
                        </MenuItem>
                        {SEX_OPTIONS.map((opt) => (
                          <MenuItem key={opt} value={opt}>
                            {opt}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {formErrors.patient_sex && (
                      <Typography variant="caption" sx={{ color: "#ef4444", mt: 0.5 }}>
                        {formErrors.patient_sex}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* อายุ + กรุ๊ปเลือด */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box>
                    <FieldLabel label="อายุ" required />
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="อายุ"
                      value={form.patient_age}
                      disabled
                      error={!!formErrors.patient_age}
                      helperText={formErrors.patient_age}
                    />
                  </Box>
                  <Box>
                    <FieldLabel label="กรุ๊ปเลือด" />
                    <FormControl fullWidth size="small">
                      <Select
                        value={form.patient_blood_group}
                        displayEmpty
                        onChange={(e) =>
                          updateField("patient_blood_group", e.target.value)
                        }
                      >
                        <MenuItem value="" disabled>
                          <span style={{ color: "#9ca3af" }}>
                            กรุ๊ปเลือด...
                          </span>
                        </MenuItem>
                        {BLOOD_GROUP_OPTIONS.map((opt) => (
                          <MenuItem key={opt} value={opt}>
                            {opt}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </Box>

              {/* HN, AN, VN */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box>
                  <FieldLabel label="HN" required />
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="HN ผู้ป่วย"
                    value={form.patient_hn}
                    onChange={(e) =>
                      updateField("patient_hn", e.target.value)
                    }
                    error={!!formErrors.patient_hn}
                    helperText={formErrors.patient_hn}
                  />
                </Box>
                <Box>
                  <FieldLabel label="AN" />
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="AN ผู้ป่วย"
                    value={form.patient_an}
                    onChange={(e) =>
                      updateField("patient_an", e.target.value)
                    }
                  />
                </Box>
                <Box>
                  <FieldLabel label="VN ล่าสุด" />
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="VN ล่าสุด"
                    value={form.patient_vn}
                    onChange={(e) =>
                      updateField("patient_vn", e.target.value)
                    }
                  />
                </Box>
              </Box>

              {/* สิทธิ์การรักษา + สิทธิ์สถานพยาบาล */}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                <Box>
                  <FieldLabel label="สิทธิ์การรักษา" required />
                  <FormControl fullWidth size="small" error={!!formErrors.patient_treatment}>
                    <Select
                      value={form.patient_treatment}
                      displayEmpty
                      onChange={(e) => updateField("patient_treatment", e.target.value)}
                      error={!!formErrors.patient_treatment}
                    >
                      <MenuItem value="" disabled>
                        <span style={{ color: "#9ca3af" }}>สิทธิ์การรักษา...</span>
                      </MenuItem>
                      {TREATMENT_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {formErrors.patient_treatment && (
                    <Typography variant="caption" sx={{ color: "#ef4444", mt: 0.5 }}>
                      {formErrors.patient_treatment}
                    </Typography>
                  )}
                  {form.patient_treatment === "อื่นๆ" && (
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="ระบุรายละเอียด"
                      value={form.patient_treatment_other}
                      onChange={(e) => updateField("patient_treatment_other", e.target.value)}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
                <Box>
                  <FieldLabel label="สิทธิ์สถานพยาบาล" />
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="สิทธิ์สถานพยาบาล"
                    value={form.patient_treatment_hospital}
                    onChange={(e) => updateField("patient_treatment_hospital", e.target.value)}
                  />
                </Box>
              </Box>

              {/* ที่อยู่ผู้ป่วย - collapsible */}
              <Box sx={{ mb: 2 }}>
                <Box
                  onClick={() => setAddressOpen((v) => !v)}
                  sx={{ cursor: "pointer", borderBottom: "2px solid #16a34a", px: 1, py: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <Typography sx={{ fontWeight: 500, color: "#036245", fontSize: "1rem" }}>ที่อยู่ผู้ป่วย</Typography>
                  {addressOpen ? <ExpandLess sx={{ color: "#036245" }} /> : <ExpandMore sx={{ color: "#036245" }} />}
                </Box>
                <Collapse in={addressOpen}>
                  <Box sx={{ pt: 2 }}>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 2, mb: 2 }}>
                      <Box>
                        <FieldLabel label="บ้านเลขที่" />
                        <TextField fullWidth size="small" placeholder="บ้านเลขที่" value={form.patient_house} onChange={(e) => updateField("patient_house", e.target.value)} />
                      </Box>
                      <Box>
                        <FieldLabel label="หมู่" />
                        <TextField fullWidth size="small" placeholder="กรอกหมู่" value={form.patient_moo} onChange={(e) => updateField("patient_moo", e.target.value)} />
                      </Box>
                      <Box>
                        <FieldLabel label="ถนน/สาย" />
                        <TextField fullWidth size="small" placeholder="กรอกถนน/สาย" value={form.patient_road} onChange={(e) => updateField("patient_road", e.target.value)} />
                      </Box>
                      <Box>
                        <FieldLabel label="ซอย/ตรอก" />
                        <TextField fullWidth size="small" placeholder="กรอกซอย/ตรอก" value={form.patient_alley} onChange={(e) => updateField("patient_alley", e.target.value)} />
                      </Box>
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, mb: 2 }}>
                      <Box>
                        <FieldLabel label="ตำบล/แขวง" />
                        <TextField fullWidth size="small" placeholder="กรอกตำบล/แขวง" value={form.patient_tambon} onChange={(e) => updateField("patient_tambon", e.target.value)} />
                      </Box>
                      <Box>
                        <FieldLabel label="อำเภอ/เขต" />
                        <TextField fullWidth size="small" placeholder="กรอกข้อมูลอำเภอ/เขต" value={form.patient_amphur} onChange={(e) => updateField("patient_amphur", e.target.value)} />
                      </Box>
                      <Box>
                        <FieldLabel label="จังหวัด" />
                        <TextField fullWidth size="small" placeholder="กรอกจังหวัด" value={form.patient_changwat} onChange={(e) => updateField("patient_changwat", e.target.value)} />
                      </Box>
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                      <Box>
                        <FieldLabel label="รหัสไปรษณีย์" />
                        <TextField fullWidth size="small" placeholder="กรอกข้อมูลรหัสไปรษณีย์" value={form.patient_zipcode} onChange={(e) => updateField("patient_zipcode", e.target.value)} />
                      </Box>
                      <Box>
                        <FieldLabel label="เบอร์โทรผู้ป่วย" />
                        <TextField fullWidth size="small" placeholder="กรอกข้อมูลเบอร์โทรผู้ป่วย" value={form.patient_phone} onChange={(e) => updateField("patient_phone", e.target.value)} />
                      </Box>
                    </Box>
                  </Box>
                </Collapse>
              </Box>

              {/* ติดต่อในกรณีฉุกเฉิน */}
              <Box sx={{ mb: 2 }}>
                <Box
                  onClick={() => setEmergencyOpen(!emergencyOpen)}
                  sx={{ cursor: "pointer", borderBottom: "2px solid #16a34a", px: 1, py: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <Typography sx={{ fontWeight: 500, color: "#036245", fontSize: "1rem" }}>
                    ติดต่อในกรณีฉุกเฉิน
                  </Typography>
                  {emergencyOpen ? <ExpandLess sx={{ color: "#036245" }} /> : <ExpandMore sx={{ color: "#036245" }} />}
                </Box>
                <Collapse in={emergencyOpen}>
                  <Box sx={{ pt: 2 }}>
                    {form.emergency_contacts.map((contact, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: 2,
                          mb: 1,
                        }}
                      >
                        <Box>
                          <FieldLabel label="ชื่อ-นามสกุล" />
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="กรอกข้อมูล"
                            value={contact.name}
                            onChange={(e) =>
                              updateEmergencyContact(
                                index,
                                "name",
                                e.target.value
                              )
                            }
                          />
                        </Box>
                        <Box>
                          <FieldLabel label="หมายเลขโทรศัพท์" />
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="กรอกข้อมูล"
                            value={contact.phone}
                            onChange={(e) =>
                              updateEmergencyContact(
                                index,
                                "phone",
                                e.target.value
                              )
                            }
                          />
                        </Box>
                        <Box>
                          <FieldLabel label="เกี่ยวข้องเป็น" />
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="กรอกข้อมูล"
                            value={contact.relation}
                            onChange={(e) =>
                              updateEmergencyContact(
                                index,
                                "relation",
                                e.target.value
                              )
                            }
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Collapse>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ============================================================ */}
      {/*  FULL WIDTH: ข้อมูลสุขภาพประจำตัวผู้ป่วย                      */}
      {/* ============================================================ */}
      <Box sx={{ p: 2, pt: 0 }}>
        <Box
          sx={{
            border: "1px solid #e5e7eb",
            borderRadius: 2,
            overflow: "hidden",
            mb: 2,
          }}
        >
          <SectionHeader title="ข้อมูลสุขภาพประจำตัวผู้ป่วย" />
          <SubSectionHeader title="ประวัติโรค" />
          <Box sx={{ p: 2 }}>
            {/* ประวัติการป่วยในอดีต */}
            <Box sx={{ mb: 2 }}>
              <FieldLabel label="ประวัติการป่วยในอดีตและประวัติครอบครัว" />
              <TextField
                fullWidth
                size="small"
                placeholder="ประวัติการป่วย"
                value={form.physicalExam}
                onChange={(e) =>
                  updateField("physicalExam", e.target.value)
                }
              />
            </Box>

            {/* โรคประจำตัว */}
            <Typography sx={{ fontWeight: 500, mb: 1 }}>โรคประจำตัว</Typography>
            {form.diseases.map((disease, index) => (
              <Box
                key={disease.id}
                sx={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 2,
                  border: "1px solid #e5e7eb",
                  borderRadius: 1,
                  p: 2,
                  mb: 1,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <FieldLabel label="โรคประจำตัว" />
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="โรคประจำตัว"
                    value={disease.name}
                    onChange={(e) => updateDiseaseName(index, e.target.value)}
                  />
                </Box>
                <IconButton
                  onClick={() => removeDisease(index)}
                  sx={{
                    bgcolor: "#ef4444",
                    color: "#fff",
                    "&:hover": { bgcolor: "#dc2626" },
                    width: 36,
                    height: 36,
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <AddButton onClick={addDisease} />

            {/* ประวัติการแพ้ */}
            <Typography sx={{ fontWeight: 600, mt: 3, mb: 1 }}>
              ประวัติการแพ้
            </Typography>
            {form.drugAllergy.map((allergy, index) => (
              <Box
                key={allergy.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  border: "1px solid #e5e7eb",
                  borderRadius: 1,
                  p: 2,
                  mb: 1,
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  placeholder="ระบุรายละเอียด"
                  value={allergy.name}
                  onChange={(e) => updateAllergyName(index, e.target.value)}
                />
                <IconButton
                  onClick={() => removeAllergy(index)}
                  sx={{
                    bgcolor: "#ef4444",
                    color: "#fff",
                    "&:hover": { bgcolor: "#dc2626" },
                    width: 36,
                    height: 36,
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <AddButton onClick={addAllergy} />
          </Box>

          {/* ข้อมูลวัคซีน */}
          <SubSectionHeader title="ข้อมูลวัคซีน" />
          <Box sx={{ p: 2 }}>
            {form.vaccines.map((vaccine, index) => (
              <Box
                key={vaccine.id}
                sx={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 2,
                  border: "1px solid #e5e7eb",
                  borderRadius: 1,
                  p: 2,
                  mb: 1,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <FieldLabel label="วัคซีนล่าสุด" />
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="ชื่อวัคซีน"
                    value={vaccine.vaccineName}
                    onChange={(e) =>
                      updateVaccineField(index, "vaccineName", e.target.value)
                    }
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FieldLabel label="วันที่ได้รับ" />
                  <ThaiDateInput
                    value={vaccine.date}
                    onChange={(val) =>
                      updateVaccineField(index, "date", val)
                    }
                    placeholder="เลือกวันที่ได้รับ"
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FieldLabel label="สถานที่รับ" />
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="สถานที่รับ"
                    value={vaccine.location}
                    onChange={(e) =>
                      updateVaccineField(index, "location", e.target.value)
                    }
                  />
                </Box>
                {form.vaccines.length > 1 && (
                  <IconButton
                    onClick={() => removeVaccine(index)}
                    sx={{
                      bgcolor: "#ef4444",
                      color: "#fff",
                      "&:hover": { bgcolor: "#dc2626" },
                      width: 36,
                      height: 36,
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            ))}
            <AddButton onClick={addVaccine} />
          </Box>
        </Box>

        {/* ============================================================ */}
        {/*  FULL WIDTH: ข้อมูลทางการแพทย์                                 */}
        {/* ============================================================ */}
        <Box
          sx={{
            border: "1px solid #e5e7eb",
            borderRadius: 2,
            overflow: "hidden",
            mb: 2,
          }}
        >
          <SectionHeader title="ข้อมูลทางการแพทย์" />
          <SubSectionHeader title="อาการป่วยปัจจุบัน" />
          <Box sx={{ p: 2 }}>
            {/* อุณหภูมิ, BP, PR, RR */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", md: "1fr 1fr 1fr 1fr" },
                gap: 2,
                mb: 2,
              }}
            >
              <Box>
                <FieldLabel label="อุณหภูมิ" />
                <TextField
                  fullWidth
                  size="small"
                  placeholder="อุณหภูมิ"
                  value={form.temperature}
                  onChange={(e) =>
                    updateField("temperature", e.target.value)
                  }
                />
              </Box>
              <Box>
                <FieldLabel label="BP" />
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder="BP"
                    value={form.bps}
                    onChange={(e) => updateField("bps", e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <Typography sx={{ color: "#6b7280" }}>/</Typography>
                  <TextField
                    size="small"
                    placeholder="M"
                    value={form.bpd}
                    onChange={(e) => updateField("bpd", e.target.value)}
                    sx={{ flex: 1 }}
                  />
                </Box>
              </Box>
              <Box>
                <FieldLabel label="PR" />
                <TextField
                  fullWidth
                  size="small"
                  placeholder="PR"
                  value={form.pulse}
                  onChange={(e) => updateField("pulse", e.target.value)}
                />
              </Box>
              <Box>
                <FieldLabel label="RR" />
                <TextField
                  fullWidth
                  size="small"
                  placeholder="RR"
                  value={form.rr}
                  onChange={(e) => updateField("rr", e.target.value)}
                />
              </Box>
            </Box>

            {/* อาการนำ */}
            <Box sx={{ mb: 2 }}>
              <FieldLabel label="อาการนำ" required />
              <TextField
                fullWidth
                size="small"
                multiline
                rows={3}
                placeholder="อาการนำ"
                value={form.visit_primary_symptom_main_symptom}
                onChange={(e) =>
                  updateField(
                    "visit_primary_symptom_main_symptom",
                    e.target.value
                  )
                }
                error={!!formErrors.visit_primary_symptom_main_symptom}
                helperText={formErrors.visit_primary_symptom_main_symptom}
              />
            </Box>

            {/* รายละเอียดอาการป่วยปัจจุบัน */}
            <Box sx={{ mb: 2 }}>
              <FieldLabel label="รายละเอียดอาการป่วยปัจจุบัน" required />
              <TextField
                fullWidth
                size="small"
                multiline
                rows={3}
                placeholder="รายละเอียดอาการป่วย"
                value={form.visit_primary_symptom_current_illness}
                onChange={(e) =>
                  updateField(
                    "visit_primary_symptom_current_illness",
                    e.target.value
                  )
                }
                error={
                  !!formErrors.visit_primary_symptom_current_illness
                }
              />
            </Box>

            {/* การรักษาที่ให้แล้ว */}
            <Box sx={{ mb: 2 }}>
              <FieldLabel label="การรักษาที่ให้แล้ว" />
              <TextField
                fullWidth
                size="small"
                multiline
                rows={3}
                placeholder="ระบุรายละเอียด"
                value={form.pe}
                onChange={(e) => updateField("pe", e.target.value)}
              />
            </Box>

            {/* การตรวจร่างกายเบื้องต้น */}
            <Box sx={{ mb: 2 }}>
              <FieldLabel label="การตรวจร่างกายเบื้องต้น" />
              <TextField
                fullWidth
                size="small"
                multiline
                rows={3}
                placeholder="ระบุรายละเอียด"
                value={form.Imp}
                onChange={(e) => updateField("Imp", e.target.value)}
              />
            </Box>

            {/* ข้อมูลเพิ่มเติมอื่นๆ */}
            <Box sx={{ mb: 2 }}>
              <FieldLabel label="ข้อมูลเพิ่มเติมอื่นๆ" />
              <TextField
                fullWidth
                size="small"
                multiline
                rows={3}
                placeholder="ระบุรายละเอียด"
                value={form.moreDetail}
                onChange={(e) =>
                  updateField("moreDetail", e.target.value)
                }
              />
            </Box>

            {/* โรคหลักที่ต้องการให้รักษา */}
            <SubSectionHeader title="โรคหลักที่ต้องการให้รักษา *" />
            <Box sx={{ p: 0, pt: 2 }}>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                วินิฉัยโรคหลัก
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="วินิฉัยโรค"
                value={form.icd10Basic}
                onChange={(e) =>
                  updateField("icd10Basic", e.target.value)
                }
                sx={{ mb: 2 }}
              />

              {form.icd10.map((item, index) => (
                <Box
                  key={item.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr auto",
                    gap: 2,
                    mb: 2,
                    alignItems: "end",
                  }}
                >
                  <Box>
                    <FieldLabel label="รหัสโรค (ICD-10)" />
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="รหัสโรค (ICD-10)"
                      value={item.icd_10_tm}
                      onChange={(e) =>
                        updateICD10Field(index, "icd_10_tm", e.target.value)
                      }
                    />
                  </Box>
                  <Box>
                    <FieldLabel label="ชื่อโรคภาษาไทย" />
                    <Autocomplete
                      freeSolo
                      options={icd10Options}
                      loading={icd10Loading}
                      inputValue={item.diagetname}
                      onInputChange={(_e, value, reason) => {
                        updateICD10Field(index, "diagetname", value);
                        if (reason === "input") searchICD10(value);
                      }}
                      onChange={(_e, value) => {
                        if (value && typeof value !== "string") {
                          handleICD10Select(value as ICD10Option, index, "icd10");
                        }
                      }}
                      getOptionLabel={(option) =>
                        typeof option === "string" ? option : option.label
                      }
                      renderOption={(props, option) => (
                        <li {...props} key={option.value}>
                          <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                              {option.value} - {option.name_en}
                            </Typography>
                            <Typography sx={{ fontSize: "0.8rem", color: "#666" }}>
                              {option.name_th}
                            </Typography>
                          </Box>
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          placeholder="ชื่อโรคภาษาไทย"
                        />
                      )}
                    />
                  </Box>
                  <Box>
                    <FieldLabel label="ชื่อโรคภาษาอังกฤษ" />
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="ชื่อโรคภาษาอังกฤษ"
                      value={item.diagename}
                      onChange={(e) =>
                        updateICD10Field(index, "diagename", e.target.value)
                      }
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      pb: 0.25,
                    }}
                  >
                    <IconButton
                      onClick={() => removeICD10(index)}
                      sx={{
                        bgcolor: "#ef4444",
                        color: "#fff",
                        "&:hover": { bgcolor: "#dc2626" },
                        width: 40,
                        height: 40,
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
              <AddButton onClick={addICD10} />
            </Box>

            {/* รายการโรคร่วมที่ต้องการให้รักษา */}
            <SubSectionHeader title="รายการโรคร่วมที่ต้องการให้รักษา" />
            <Box sx={{ p: 0, pt: 2 }}>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                วินิฉัยโรคร่วม
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="วินิฉัยโรค"
                value={form.icd10MoreBasic}
                onChange={(e) =>
                  updateField("icd10MoreBasic", e.target.value)
                }
                sx={{ mb: 2 }}
              />

              {form.icd10More.map((item, index) => (
                <Box
                  key={item.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr auto",
                    gap: 2,
                    mb: 2,
                    alignItems: "end",
                  }}
                >
                  <Box>
                    <FieldLabel label="รหัสโรค (ICD-10)" />
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="รหัสโรค (ICD-10)"
                      value={item.icd_10_tm}
                      onChange={(e) =>
                        updateICD10MoreField(index, "icd_10_tm", e.target.value)
                      }
                    />
                  </Box>
                  <Box>
                    <FieldLabel label="ชื่อโรคภาษาไทย" />
                    <Autocomplete
                      freeSolo
                      options={icd10Options}
                      loading={icd10Loading}
                      inputValue={item.diagetname}
                      onInputChange={(_e, value, reason) => {
                        updateICD10MoreField(index, "diagetname", value);
                        if (reason === "input") searchICD10(value);
                      }}
                      onChange={(_e, value) => {
                        if (value && typeof value !== "string") {
                          handleICD10Select(value as ICD10Option, index, "icd10More");
                        }
                      }}
                      getOptionLabel={(option) =>
                        typeof option === "string" ? option : option.label
                      }
                      renderOption={(props, option) => (
                        <li {...props} key={option.value}>
                          <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                              {option.value} - {option.name_en}
                            </Typography>
                            <Typography sx={{ fontSize: "0.8rem", color: "#666" }}>
                              {option.name_th}
                            </Typography>
                          </Box>
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          placeholder="ชื่อโรคภาษาไทย"
                        />
                      )}
                    />
                  </Box>
                  <Box>
                    <FieldLabel label="ชื่อโรคภาษาอังกฤษ" />
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="ชื่อโรคภาษาอังกฤษ"
                      value={item.diagename}
                      onChange={(e) =>
                        updateICD10MoreField(index, "diagename", e.target.value)
                      }
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      pb: 0.25,
                    }}
                  >
                    <IconButton
                      onClick={() => removeICD10More(index)}
                      sx={{
                        bgcolor: "#ef4444",
                        color: "#fff",
                        "&:hover": { bgcolor: "#dc2626" },
                        width: 40,
                        height: 40,
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
              <AddButton onClick={addICD10More} />
            </Box>

            {/* รายการยา */}
            <SubSectionHeader title="รายการยา" />
            <Box sx={{ p: 2 }}>
              {form.medicines.map((med, index) => (
                <Box
                  key={med.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "auto 2fr 1fr 1fr 1fr auto",
                    gap: 2,
                    alignItems: "start",
                    border: "1px solid #e5e7eb",
                    borderRadius: 1,
                    p: 2,
                    mb: 1,
                  }}
                >
                  {/* ลำดับที่ */}
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pt: 2.5 }}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 500, color: "#6b7280", mb: 0.5 }}>
                      ลำดับที่
                    </Typography>
                    <Typography sx={{ fontSize: "1.1rem", fontWeight: 600 }}>
                      {index + 1}
                    </Typography>
                  </Box>
                  <Box>
                    <FieldLabel label="ชื่อยา" />
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="ชื่อยา"
                      value={med.drugname}
                      onChange={(e) => {
                        const newMeds = [...form.medicines];
                        newMeds[index] = { ...newMeds[index], drugname: e.target.value };
                        updateField("medicines", newMeds);
                      }}
                    />
                  </Box>
                  <Box>
                    <FieldLabel label="จำนวน" />
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="จำนวน"
                      value={med.qty}
                      onChange={(e) => {
                        const newMeds = [...form.medicines];
                        newMeds[index] = { ...newMeds[index], qty: e.target.value };
                        updateField("medicines", newMeds);
                      }}
                    />
                  </Box>
                  <Box>
                    <FieldLabel label="วิธีใช้" />
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="วิธีใช้"
                      value={med.drugusage}
                      onChange={(e) => {
                        const newMeds = [...form.medicines];
                        newMeds[index] = { ...newMeds[index], drugusage: e.target.value };
                        updateField("medicines", newMeds);
                      }}
                    />
                  </Box>
                  <Box>
                    <FieldLabel label="Memo" />
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Memo"
                      value={med.strength}
                      onChange={(e) => {
                        const newMeds = [...form.medicines];
                        newMeds[index] = { ...newMeds[index], strength: e.target.value };
                        updateField("medicines", newMeds);
                      }}
                    />
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "flex-end", pb: 0.5, pt: 2.5 }}>
                    <IconButton
                      onClick={() => removeMedicine(index)}
                      sx={{
                        bgcolor: "#ef4444",
                        color: "#fff",
                        "&:hover": { bgcolor: "#dc2626" },
                        width: 36,
                        height: 36,
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
              <AddButton onClick={addMedicine} />
            </Box>
          </Box>
        </Box>

        {/* ============================================================ */}
        {/*  FULL WIDTH: เอกสารประกอบการรักษา                               */}
        {/* ============================================================ */}
        <Box
          sx={{
            border: "1px solid #e5e7eb",
            borderRadius: 2,
            overflow: "hidden",
            mb: 2,
          }}
        >
          <SectionHeader title="เอกสารประกอบการรักษา" />
          <Box sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography sx={{ fontWeight: 500 }}>
                อัพโหลดเอกสารเพิ่มเติม
              </Typography>
              <Button
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                onClick={() => { resetDocModal(); setShowDocModal(true); }}
                sx={{
                  textTransform: "none",
                  borderColor: "#00AF75",
                  color: "#00AF75",
                  "&:hover": { borderColor: "#036245", color: "#036245" },
                }}
              >
                เพิ่มรายการ
              </Button>
            </Box>

            <TableContainer
              sx={{
                boxShadow: "none",
                border: "1px solid #e5e7eb",
                borderRadius: 1,
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f9fafb" }}>
                    <TableCell
                      sx={{ fontWeight: 600, textAlign: "center", width: 60 }}
                    >
                      ลำดับ
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>
                      ไฟล์แนบ
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>
                      ประเภทเอกสาร
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>
                      รหัสเอกสาร
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>
                      ชื่อเอกสาร
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>
                      รายละเอียด
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>
                      วัน/เวลา
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>
                      จัดการ
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {form.documents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="textSecondary">
                          ไม่มีข้อมูลเอกสาร คลิก &quot;เพิ่มรายการ&quot;
                          เพื่อเพิ่มเอกสารใหม่
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    form.documents.map((doc, index) => (
                      <TableRow key={doc.id}>
                        <TableCell align="center">{index + 1}</TableCell>
                        <TableCell align="center">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => { setDocDetailViewData(doc); setShowDocDetailModal(true); }}
                            sx={{
                              textTransform: "none",
                              fontSize: "0.75rem",
                              borderColor: "#6b7280",
                              color: "#374151",
                              "&:hover": { borderColor: "#374151" },
                              minWidth: 0,
                              px: 1.5,
                            }}
                            startIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
                          >
                            เปิดดู
                          </Button>
                        </TableCell>
                        <TableCell align="center">{doc.fileType}</TableCell>
                        <TableCell align="center">{doc.docCode || "-"}</TableCell>
                        <TableCell align="center">{doc.docName || "-"}</TableCell>
                        <TableCell align="center">{doc.detail || "-"}</TableCell>
                        <TableCell align="center">{doc.dateTime}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => {
                              const updated = form.documents.filter((_, i) => i !== index);
                              updateField("documents", updated);
                            }}
                            sx={{ bgcolor: "#ef4444", color: "#fff", "&:hover": { bgcolor: "#dc2626" }, width: 32, height: 32 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {form.documents.length > 0 && (
              <Box sx={{ bgcolor: "#e5e7eb", px: 2, py: 0.75, borderRadius: "0 0 4px 4px" }}>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 500 }}>
                  ทั้งหมด {form.documents.length} เอกสาร
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* ========== Document Detail View Modal ========== */}
      <Dialog
        open={showDocDetailModal}
        onClose={() => setShowDocDetailModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, overflow: "hidden" } }}
      >
        <Box sx={{ bgcolor: "#00AF75", px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "1.1rem" }}>
            รายละเอียดไฟล์แนบ
          </Typography>
          <IconButton onClick={() => setShowDocDetailModal(false)} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          {docDetailViewData && (
            <Box>
              <Box sx={{ bgcolor: "#dcfce7", px: 2, py: 1, borderRadius: 1, mb: 1 }}>
                <Typography sx={{ fontWeight: 600, color: "#036245" }}>รายละเอียด</Typography>
              </Box>
              <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 1, p: 2, mb: 2 }}>
                <Typography>{docDetailViewData.detail || "-"}</Typography>
              </Box>
              {docDetailViewData.files && docDetailViewData.files.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ bgcolor: "#dcfce7", px: 2, py: 1, borderRadius: 1, mb: 1 }}>
                    <Typography sx={{ fontWeight: 600, color: "#036245" }}>ไฟล์แนบ ({docDetailViewData.files.length} ไฟล์)</Typography>
                  </Box>
                  {docDetailViewData.files.map((f) => (
                    <Box key={f.id} sx={{ border: "1px solid #e5e7eb", borderRadius: 1, p: 2, mb: 1 }}>
                      {f.name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ? (
                        <Box sx={{ textAlign: "center" }}>
                          <img src={f.url} alt={f.name} style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 4 }} />
                          <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#6b7280" }}>{f.name} ({f.size})</Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography sx={{ flex: 1 }}>{f.name} ({f.size})</Typography>
                          <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ color: "#00AF75", fontWeight: 600 }}>เปิดไฟล์</a>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => setShowDocDetailModal(false)}
              sx={{ textTransform: "none", borderColor: "#00AF75", color: "#00AF75", "&:hover": { borderColor: "#036245", color: "#036245" } }}
            >
              ยกเลิก
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* ========== Document Upload Modal ========== */}
      <Dialog
        open={showDocModal}
        onClose={() => setShowDocModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, overflow: "hidden" } }}
      >
        {/* Header */}
        <Box sx={{ bgcolor: "#00AF75", px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "1.1rem" }}>
            เพิ่มไฟล์เอกสารประกอบการรักษา
          </Typography>
          <IconButton onClick={() => setShowDocModal(false)} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          {/* เลขที่เอกสาร */}
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 500, mb: 0.5 }}>เลขที่เอกสาร</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="เลขที่เอกสาร(ถ้ามี)"
              value={docModalData.docCode}
              onChange={(e) => setDocModalData((p) => ({ ...p, docCode: e.target.value }))}
            />
          </Box>

          {/* ชื่อเอกสาร */}
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 500, mb: 0.5 }}>ชื่อเอกสาร</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="ชื่อเอกสาร(ถ้าต้องการระบุ)"
              value={docModalData.docName}
              onChange={(e) => setDocModalData((p) => ({ ...p, docName: e.target.value }))}
            />
          </Box>

          {/* รายละเอียด */}
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 500, mb: 0.5 }}>รายละเอียด</Typography>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={3}
              placeholder="รายละเอียด"
              value={docModalData.detail}
              onChange={(e) => setDocModalData((p) => ({ ...p, detail: e.target.value }))}
            />
          </Box>

          {/* รายละเอียด label + ประเภทเอกสาร */}
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 500, mb: 0.5 }}>
              ประเภทเอกสาร <span style={{ color: "#ef4444" }}>*</span>
            </Typography>
            <RadioGroup
              row
              value={docModalData.docType}
              onChange={(e) => setDocModalData((p) => ({ ...p, docType: e.target.value }))}
            >
              <FormControlLabel value="X-ray" control={<Radio size="small" />} label="X-ray" />
              <FormControlLabel value="Lab" control={<Radio size="small" />} label="Lab" />
              <FormControlLabel value="MRI" control={<Radio size="small" />} label="MRI" />
              <FormControlLabel value="อื่นๆ" control={<Radio size="small" />} label="อื่นๆ" />
            </RadioGroup>
            {docModalData.docType === "อื่นๆ" && (
              <Box sx={{ mt: 1, border: docModalData.docType === "อื่นๆ" && !docModalData.otherTypeDetail.trim() ? "1px solid #ef4444" : "1px solid #e5e7eb", borderRadius: 1, p: 0 }}>
                <Typography sx={{ fontWeight: 500, fontSize: "0.85rem", mb: 0.5, px: 1.5, pt: 1 }}>
                  ระบุรายละเอียด <span style={{ color: "#ef4444" }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  placeholder="ขอความอื่นๆ"
                  value={docModalData.otherTypeDetail}
                  onChange={(e) => setDocModalData((p) => ({ ...p, otherTypeDetail: e.target.value }))}
                  sx={{ "& .MuiOutlinedInput-notchedOutline": { border: "none" } }}
                />
              </Box>
            )}
          </Box>

          {/* Uploaded files list */}
          {docModalData.files.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 500, mb: 1 }}>
                ไฟล์ที่อัพโหลด ({docModalData.files.length} ไฟล์)
              </Typography>
              {docModalData.files.map((f) => (
                <Box
                  key={f.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid #e5e7eb",
                    borderRadius: 1,
                    p: 1.5,
                    mb: 1,
                    bgcolor: "#f9fafb",
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: "#9ca3af", flexShrink: 0, marginRight: 12 }}>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: "0.9rem", fontWeight: 500 }}>{f.name}</Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: "#9ca3af" }}>{f.size}</Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => removeDocFile(f.id)}
                    sx={{ bgcolor: "#ef4444", color: "#fff", "&:hover": { bgcolor: "#dc2626" }, width: 32, height: 32 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          {/* File upload area */}
          <Box
            onClick={() => docFileInputRef.current?.click()}
            sx={{
              border: "2px dashed #CBD5E1",
              borderRadius: 1,
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              cursor: "pointer",
              bgcolor: "#f9fafb",
              "&:hover": { bgcolor: "#f0fdf4" },
              mb: 1,
            }}
          >
            <CloudUploadIcon sx={{ color: "#6b7280" }} />
            <Typography sx={{ color: "#374151" }}>
              เลือกอัพโหลดไฟล์
            </Typography>
          </Box>
          <input
            ref={docFileInputRef}
            type="file"
            hidden
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleDocFileChange}
          />
          <Typography variant="caption" sx={{ color: "#9ca3af" }}>
            กำหนดขนาดไฟล์แนบสูงสุด 10 MB
          </Typography>

          {/* Footer buttons */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => setShowDocModal(false)}
              sx={{
                textTransform: "none",
                borderColor: "#00AF75",
                color: "#00AF75",
                "&:hover": { borderColor: "#036245", color: "#036245" },
              }}
            >
              ยกเลิก
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleDocModalSave}
              sx={{
                textTransform: "none",
                bgcolor: "#00AF75",
                "&:hover": { bgcolor: "#036245" },
              }}
            >
              บันทึกข้อมูล
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Paper>
  );
}
