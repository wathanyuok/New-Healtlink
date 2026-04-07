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
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  ExpandLess,
  ExpandMore,
  CloudUpload as CloudUploadIcon,
  ImageOutlined as ImageIcon,
} from "@mui/icons-material";
import { useReferralCreateStore } from "@/stores/referralCreateStore";
import { useAuthStore } from "@/stores/authStore";

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
  name: string;
  dose: string;
  frequency: string;
}
interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}
interface DocumentItem {
  id: number;
  fileName: string;
  fileType: string;
  docCode: string;
  docName: string;
  detail: string;
  dateTime: string;
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
  patient_address: string;
  patient_subdistrict: string;
  patient_district: string;
  patient_province: string;
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
  patient_pid: "",
  patient_prefix: "",
  patient_firstname: "",
  patient_lastname: "",
  patient_birthday: "",
  patient_age: "",
  patient_sex: "",
  patient_blood_group: "",
  patient_hn: "",
  patient_an: "",
  patient_vn: "",
  patient_image: null,
  patient_treatment: "",
  patient_treatment_other: "",
  patient_address: "",
  patient_subdistrict: "",
  patient_district: "",
  patient_province: "",
  patient_zipcode: "",
  patient_phone: "",
  emergency_contacts: [{ name: "", phone: "", relation: "" }],
  prescribingDoctor: "",
  doctorCode: "",
  medicalDepartment: "",
  doctorContactNumber: "",
  referral_cause: "",
  referral_reason: "",
  acute_level: "",
  additional_info: "",
  is_infectious: "",
  infectious_detail: "",
  physicalExam: "",
  diseases: [],
  drugAllergy: [],
  vaccines: [{ id: 1, vaccineName: "", date: "", location: "" }],
  temperature: "",
  bps: "",
  bpd: "",
  pulse: "",
  rr: "",
  visit_primary_symptom_main_symptom: "",
  visit_primary_symptom_current_illness: "",
  pe: "",
  Imp: "",
  moreDetail: "",
  icd10Basic: "",
  icd10: [{ id: 1, icd_10_tm: "", diagetname: "", diagename: "" }],
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
  <Box sx={{ bgcolor: "#dcfce7", px: 2, py: 1.5, mb: 0 }}>
    <Typography sx={{ fontWeight: 600, color: "#036245", fontSize: "1.05rem" }}>
      {title}
    </Typography>
  </Box>
);

const SubSectionHeader = ({ title }: { title: string }) => (
  <Box sx={{ borderBottom: "1px solid #CBD5E1", px: 2, py: 1.5 }}>
    <Typography sx={{ fontWeight: 600, color: "#036245", fontSize: "1rem" }}>
      {title}
    </Typography>
  </Box>
);

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
  // Local form state merged with external
  const [form, setForm] = useState<ReferralFormData>(() => ({
    ...defaultFormData,
    ...externalFormData,
  }));
  const [emergencyOpen, setEmergencyOpen] = useState(true);
  const imageInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    // Get user's hospital for API calls
    const authState = useAuthStore.getState();
    const roleName = authState.getRoleName();
    let userHospitalId: string | undefined;
    if (roleName === "superAdmin") {
      userHospitalId = authState.optionHospital ? String(authState.optionHospital) : undefined;
    } else {
      const ownHospitalId = (authState.profile as any)?.permissionGroup?.hospital?.id;
      userHospitalId = ownHospitalId ? String(ownHospitalId) : undefined;
    }

    // Fetch referral causes
    const referralType = kind === "requestReferOut" || kind === "referOut"
      ? "Refer Out - ส่งตัวออก"
      : "Refer Back - ส่งตัวกลับ";
    fetchReferralCauses({
      hospital: userHospitalId,
      referralType,
      isOpd: "true",
    });

    // Fetch doctor users (prescribing doctor dropdown)
    fetchDoctorUsers({
      hospital: userHospitalId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

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

  const addMedicine = () => {
    const newMeds = [
      ...form.medicines,
      { id: Date.now(), name: "", dose: "", frequency: "" },
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
              <Box sx={{ borderBottom: "1px solid #e5e7eb", mb: 2 }} />

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
              <Box sx={{ borderBottom: "1px solid #e5e7eb", mb: 2 }}>
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
              <Box sx={{ borderBottom: "1px solid #e5e7eb", mt: 2, mb: 2 }}>
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
                    <FormControl fullWidth size="small">
                      <Select
                        value={form.prescribingDoctor || ""}
                        displayEmpty
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          updateField("prescribingDoctor" as any, selectedId);
                          // Auto-fill doctor code when doctor is selected
                          const doc = doctorUsers.find((d) => String(d.id) === String(selectedId));
                          if (doc) {
                            updateField("doctorCode" as any, doc.licenseNumber || "");
                            updateField("doctorContactNumber" as any, doc.phone || "");
                          }
                        }}
                        error={!!formErrors.prescribingDoctor}
                      >
                        <MenuItem value="" disabled>
                          <span style={{ color: "#9ca3af" }}>
                            เลือกแพทย์ผู้ที่สั่ง
                          </span>
                        </MenuItem>
                        {doctorUsers.map((doc) => (
                          <MenuItem key={doc.id} value={String(doc.id)}>
                            {doc.name}
                          </MenuItem>
                        ))}
                        {doctorUsers.length === 0 && (
                          <MenuItem value="" disabled>
                            ไม่พบแพทย์ที่ค้นหา
                          </MenuItem>
                        )}
                      </Select>
                    </FormControl>
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
              <Box sx={{ borderBottom: "1px solid #e5e7eb", mb: 2 }}>
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
              <Box sx={{ borderBottom: "1px solid #e5e7eb", mb: 2 }} />

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
              <Box sx={{ borderBottom: "1px solid #e5e7eb", mb: 2 }} />

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
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      placeholder="DD/MM/YYYY"
                      value={form.patient_birthday}
                      onChange={(e) =>
                        updateField("patient_birthday", e.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
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

              {/* สิทธิ์การรักษา */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box>
                  <FieldLabel label="สิทธิ์การรักษา" />
                  <FormControl fullWidth size="small">
                    <Select
                      value={form.patient_treatment}
                      displayEmpty
                      onChange={(e) =>
                        updateField("patient_treatment", e.target.value)
                      }
                    >
                      <MenuItem value="" disabled>
                        <span style={{ color: "#9ca3af" }}>
                          เลือกสิทธิ์การรักษา
                        </span>
                      </MenuItem>
                      {TREATMENT_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                {form.patient_treatment === "อื่นๆ" && (
                  <Box>
                    <FieldLabel label="ระบุสิทธิ์การรักษา" />
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="ระบุรายละเอียด"
                      value={form.patient_treatment_other}
                      onChange={(e) =>
                        updateField(
                          "patient_treatment_other",
                          e.target.value
                        )
                      }
                    />
                  </Box>
                )}
              </Box>

              {/* ที่อยู่ */}
              <Box sx={{ mb: 2 }}>
                <FieldLabel label="ที่อยู่" />
                <TextField
                  fullWidth
                  size="small"
                  placeholder="ที่อยู่ผู้ป่วย"
                  value={form.patient_address}
                  onChange={(e) =>
                    updateField("patient_address", e.target.value)
                  }
                />
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box>
                  <FieldLabel label="ตำบล/แขวง" />
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="กรอกตำบล/แขวง"
                    value={form.patient_subdistrict}
                    onChange={(e) =>
                      updateField("patient_subdistrict", e.target.value)
                    }
                  />
                </Box>
                <Box>
                  <FieldLabel label="อำเภอ/เขต" />
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="กรอกอำเภอ/เขต"
                    value={form.patient_district}
                    onChange={(e) =>
                      updateField("patient_district", e.target.value)
                    }
                  />
                </Box>
                <Box>
                  <FieldLabel label="จังหวัด" />
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="กรอกจังหวัด"
                    value={form.patient_province}
                    onChange={(e) =>
                      updateField("patient_province", e.target.value)
                    }
                  />
                </Box>
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box>
                  <FieldLabel label="รหัสไปรษณีย์" />
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="กรอกข้อมูลรหัสไปรษณีย์"
                    value={form.patient_zipcode}
                    onChange={(e) =>
                      updateField("patient_zipcode", e.target.value)
                    }
                  />
                </Box>
                <Box>
                  <FieldLabel label="เบอร์โทรผู้ป่วย" />
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="กรอกข้อมูลเบอร์โทรผู้ป่วย"
                    value={form.patient_phone}
                    onChange={(e) =>
                      updateField("patient_phone", e.target.value)
                    }
                  />
                </Box>
              </Box>

              {/* ติดต่อในกรณีฉุกเฉิน */}
              <Box
                sx={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 1,
                  overflow: "hidden",
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    px: 2,
                    py: 1.5,
                    cursor: "pointer",
                  }}
                  onClick={() => setEmergencyOpen(!emergencyOpen)}
                >
                  <Typography sx={{ fontWeight: 500, fontSize: "1rem" }}>
                    ติดต่อในกรณีฉุกเฉิน
                  </Typography>
                  {emergencyOpen ? <ExpandLess /> : <ExpandMore />}
                </Box>
                <Collapse in={emergencyOpen}>
                  <Box sx={{ px: 2, pb: 2 }}>
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
                    <AddButton onClick={addEmergencyContact} />
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
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    placeholder="DD/MM/YYYY"
                    value={vaccine.date}
                    onChange={(e) =>
                      updateVaccineField(index, "date", e.target.value)
                    }
                    InputLabelProps={{ shrink: true }}
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
                    border: "1px solid #e5e7eb",
                    borderRadius: 1,
                    p: 2,
                    mb: 1,
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
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="ชื่อโรคภาษาไทย"
                      value={item.diagetname}
                      onChange={(e) =>
                        updateICD10Field(index, "diagetname", e.target.value)
                      }
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
                      alignItems: "flex-end",
                      pb: 0.5,
                    }}
                  >
                    <IconButton
                      onClick={() => removeICD10(index)}
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
              <AddButton onClick={addICD10} />

              {/* รายการยา */}
              <Typography sx={{ fontWeight: 600, mt: 3, mb: 1 }}>
                รายการยา
              </Typography>
              <Box sx={{ borderBottom: "1px solid #e5e7eb", mb: 2 }} />
              {form.medicines.map((med, index) => (
                <Box
                  key={med.id}
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
                    size="small"
                    placeholder="ชื่อยา"
                    value={med.name}
                    onChange={(e) => {
                      const newMeds = [...form.medicines];
                      newMeds[index] = { ...newMeds[index], name: e.target.value };
                      updateField("medicines", newMeds);
                    }}
                    sx={{ flex: 1 }}
                  />
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
                  {form.documents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="textSecondary">
                          ไม่มีข้อมูลเอกสาร คลิก &quot;เพิ่มรายการ&quot;
                          เพื่อเพิ่มเอกสารใหม่
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
