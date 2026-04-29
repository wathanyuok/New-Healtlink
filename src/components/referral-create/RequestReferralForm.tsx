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
  Autocomplete,
  Tooltip,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  ExpandLess,
  ExpandMore,
  ImageOutlined as ImageIcon,
  Close as CloseIcon,
  HelpOutline as HelpOutlineIcon,
} from "@mui/icons-material";
import { useReferralCreateStore } from "@/stores/referralCreateStore";
import { useAuthStore } from "@/stores/authStore";
import ThaiDateInput from "@/components/shared/ThaiDateInput";
import ThaiTimeInput from "@/components/shared/ThaiTimeInput";
import TreatmentDocuments, { type DocumentItem, type UploadedFileItem } from "@/components/shared/TreatmentDocuments";
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
// DocumentItem and UploadedFileItem are imported from TreatmentDocuments

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
  patient_contact_full_name: string;
  patient_contact_mobile_phone: string;
  patient_contact_relation: string;
  // ER-only top-level schedule
  startDate: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  referralCreationPoint: string; // id of selected creation point
  // Referral info (left column)
  referral_cause: string;
  referral_reason: string;
  acute_level: string;
  icu_level: string;
  additional_info: string;
  is_infectious: string; // "yes" | "no" | ""
  infectious_detail: string;
  car_refer: string; // "need" | "notNeed" | ""
  use_nurse: string; // "use" | "notUse" | ""
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
  docterName: string;
  doctorCode: string;
  medicalDepartment: string;
  doctorContactNumber: string;
  // Certification period (OPD)
  certificationPeriod: string | number;
  deliveryPeriod: any[];
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
  patient_treatment_hospital: "",
  patient_house: "",
  patient_moo: "",
  patient_road: "",
  patient_alley: "",
  patient_tambon: "",
  patient_amphur: "",
  patient_changwat: "",
  patient_zipcode: "",
  patient_phone: "",
  emergency_contacts: [],
  patient_contact_full_name: "",
  patient_contact_mobile_phone: "",
  patient_contact_relation: "",
  prescribingDoctor: "",
  docterName: "",
  doctorCode: "",
  medicalDepartment: "",
  doctorContactNumber: "",
  startDate: "",
  startTime: "",
  referralCreationPoint: "",
  referral_cause: "",
  referral_reason: "",
  acute_level: "",
  icu_level: "",
  additional_info: "",
  is_infectious: "",
  infectious_detail: "",
  car_refer: "",
  use_nurse: "",
  additionalComments: "",
  requiredEquipment: [],
  certificationPeriod: "",
  deliveryPeriod: [{ startDelivery: "", startDeliveryTime: "", startDelivery2: "", endDeliveryTime: "" }],
  physicalExam: "",
  diseases: [],
  drugAllergy: [],
  vaccines: [],
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
  icd10: [{ id: Date.now(), icd_10_tm: "", diagetname: "", diagename: "" }],
  icd10MoreBasic: "",
  icd10More: [{ id: Date.now() + 1, icd_10_tm: "", diagetname: "", diagename: "" }],
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
const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "ไม่ทราบ", "ไม่ระบุ", "อื่นๆ"];
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
  { value: 1, label: "ผู้ป่วยไร้เสถียรภาพ", badge: "U", color: "#EF4444" },
  { value: 2, label: "ผู้ป่วยมีเสถียรภาพ มีความเสี่ยงต่อการทรุดลงเฉียบพลันสูง", badge: "H", color: "#F97316" },
  { value: 3, label: "ผู้ป่วยมีเสถียรภาพ มีความเสี่ยงต่อการทรุดลงเฉียบพลันปานกลาง", badge: "M", color: "#EAB308" },
  { value: 4, label: "ผู้ป่วยมีเสถียรภาพ มีความเสี่ยงต่อการทรุดลงเฉียบพลันต่ำ", badge: "L", color: "#3B82F6" },
  { value: 5, label: "ผู้ป่วยมีเสถียรภาพ ไม่มีความเสี่ยงต่อการทรุดลงเฉียบพลัน", badge: "N", color: "#22C55E" },
];

const ICU_LEVEL_OPTIONS = [
  {
    value: "1",
    label: "ผู้ป่วยวิกฤต (Priority 1)",
    badge: { text: "ICU", color: "#dc2626" }, // red
  },
  {
    value: "2",
    label: "ผู้ป่วยที่ต้องเฝ้าระวังอย่างใกล้ชิด (Priority 2)",
    badge: { text: "ICU", color: "#f97316" }, // orange
  },
  {
    value: "3",
    label: "ผู้ป่วยโรครุนแรงที่มีโอกาสฟื้นตัวต่ำ (Priority 3)",
    badge: { text: "ICU", color: "#eab308" }, // yellow
  },
  {
    value: "4",
    label: "ผู้ป่วยที่ไม่จำเป็นต้องอยู่ใน ICU (Priority 4)",
    badge: { text: "ICU", color: "#22c55e" }, // green
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Shared sx for MUI Select to match Nuxt's base-select-dynamic (bordered, green focus) */
const selectSx = {
  bgcolor: "#F8FFFE",
  borderRadius: 1,
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#d1d5db",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#00AF75",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#00AF75",
    borderWidth: 2,
  },
} as const;

/** Clearable endAdornment for MUI Select — shows X when value is set */
const clearableSelectProps = (
  value: string,
  onClear: () => void
) =>
  value
    ? {
        endAdornment: (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            sx={{ mr: 2, p: 0.25, color: "#9ca3af" }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        ),
      }
    : {};

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
  draftLoaded?: number; // counter that increments when draft data is loaded
  referGroupCasePatient?: any; // patient data from referBack groupCase
  referGroupCase?: any; // original referral document from groupCase
  referInfo?: any; // draft document (for requestReferBack draft edit)
}

export default function RequestReferralForm({
  kind,
  hospitalName,
  branchNames,
  searchParams,
  formData: externalFormData,
  onUpdate,
  formErrors = {},
  draftLoaded = 0,
  referGroupCasePatient,
  referGroupCase,
  referInfo,
}: Props) {
  // Local form state merged with external (only non-empty external values override defaults)
  const [form, setForm] = useState<ReferralFormData>(() => {
    const merged = { ...defaultFormData };
    if (externalFormData) {
      Object.entries(externalFormData).forEach(([key, value]) => {
        if (key.startsWith("_draft")) return; // skip internal metadata
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

  // Refs to hold draft doctor/cause data so they survive async fetch overwrites
  const draftDoctorRef = useRef<any>(null);
  const draftCauseRef = useRef<any>(null);

  // Document add/remove handlers — TreatmentDocuments manages its own modal state
  const handleAddDocument = (newDoc: DocumentItem) => {
    updateField("documents", [...form.documents, newDoc]);
  };

  const handleRemoveDocument = (index: number) => {
    const updated = form.documents.filter((_: any, i: number) => i !== index);
    updateField("documents", updated);
  };

  // Sync initial form values back to the store on mount
  // so that handleSave in the parent can read the correct values.
  // Only sync fields that are NOT empty — this avoids overwriting draft/groupCase
  // data that was loaded into the store before the form mounted.
  const initialSynced = useRef(false);
  useEffect(() => {
    if (!initialSynced.current) {
      initialSynced.current = true;
      // Only push non-empty fields to avoid wiping store data from draft/groupCase loading
      const nonEmpty: Record<string, any> = {};
      Object.entries(form).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0)) {
          nonEmpty[key] = value;
        }
      });
      if (Object.keys(nonEmpty).length > 0) {
        onUpdate(nonEmpty);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When draft data is loaded (signalled by draftLoaded counter), update local form state
  const lastProcessedDraftLoaded = useRef(0);
  useEffect(() => {
    console.log("[Form draftLoaded effect] draftLoaded:", draftLoaded, "lastProcessed:", lastProcessedDraftLoaded.current);
    if (draftLoaded === 0) return; // skip initial render
    if (!externalFormData) return;
    // Check if external data has meaningful content (not just empty defaults)
    const hasData = Object.values(externalFormData).some((v) =>
      v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)
    );
    if (!hasData) { console.log("[Form draftLoaded effect] No meaningful data in externalFormData"); return; }
    // Only sync back to store once per draftLoaded increment (avoid infinite loop:
    // onUpdate → store changes → externalFormData changes → effect re-runs → onUpdate …)
    const shouldSyncToStore = draftLoaded !== lastProcessedDraftLoaded.current;
    if (shouldSyncToStore) lastProcessedDraftLoaded.current = draftLoaded;
    // Collect fields to sync to store OUTSIDE of setForm to avoid setState-during-render
    const storeSync: Record<string, any> = {};
    setForm((prev) => {
      const merged = { ...prev };
      Object.entries(externalFormData).forEach(([key, value]) => {
        // Skip internal metadata keys
        if (key.startsWith("_draft")) return;
        if (value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0)) {
          (merged as any)[key] = value;
          if (shouldSyncToStore) storeSync[key] = value;
        }
      });
      return merged;
    });
    // Sync merged draft data back to the store so validation reads correct values
    // (the initial sync effect may have overwritten the store with empty defaults)
    if (shouldSyncToStore && Object.keys(storeSync).length > 0) {
      onUpdate(storeSync);
    }

    // Store draft doctor/cause in refs so they survive fetch overwrites
    const draftDoctorData = (externalFormData as any)?._draftDoctor;
    if (draftDoctorData?.id) {
      draftDoctorRef.current = draftDoctorData;
      // Also inject immediately into store
      const store = useReferralCreateStore.getState();
      const existing = store.doctorUsers || [];
      if (!existing.find((d: any) => String(d.id) === String(draftDoctorData.id))) {
        useReferralCreateStore.setState({ doctorUsers: [...existing, draftDoctorData] });
      }
    }

    const draftCauseData = (externalFormData as any)?._draftCause;
    if (draftCauseData?.id) {
      draftCauseRef.current = draftCauseData;
      // Also inject immediately into store
      const store = useReferralCreateStore.getState();
      const existing = store.referralCauses || [];
      if (!existing.find((c: any) => String(c.id) === String(draftCauseData.id))) {
        useReferralCreateStore.setState({ referralCauses: [...existing, draftCauseData] });
      }
    }
  }, [draftLoaded, externalFormData]);

  // Pre-fill patient + visit + health data from referBack groupCase
  useEffect(() => {
    console.log("[Form groupCase effect] referGroupCasePatient:", !!referGroupCasePatient, "referGroupCase:", !!referGroupCase);
    if (!referGroupCasePatient && !referGroupCase) return;
    const fields: Partial<ReferralFormData> = {};

    // ── Patient demographics ──
    if (referGroupCasePatient) {
      const p = referGroupCasePatient;
      if (p.patient_prefix) fields.patient_prefix = p.patient_prefix;
      if (p.patient_firstname) fields.patient_firstname = p.patient_firstname;
      if (p.patient_lastname) fields.patient_lastname = p.patient_lastname;
      if (p.patient_pid) fields.patient_pid = p.patient_pid;
      if (p.patient_hn) fields.patient_hn = p.patient_hn;
      if (p.patient_an) fields.patient_an = p.patient_an;
      if (p.patient_vn) fields.patient_vn = p.patient_vn;
      if (p.patient_sex || p.patient_gender) fields.patient_sex = p.patient_sex || p.patient_gender;
      const bday = p.patient_birthday || p.patient_dob || "";
      if (bday) {
        // Strip ISO time portion (e.g. "1997-12-10T00:00:00.000Z" → "1997-12-10")
        const bdayDate = bday.split("T")[0];
        fields.patient_birthday = bdayDate;
        // Calculate age from birthday (handle both CE and BE year)
        const [by, bm, bd] = bdayDate.split("-").map(Number);
        if (by && bm && bd) {
          const ceYear = by > 2400 ? by - 543 : by;
          const now = new Date();
          let age = now.getFullYear() - ceYear;
          if (now.getMonth() + 1 < bm || (now.getMonth() + 1 === bm && now.getDate() < bd)) age--;
          if (age >= 0) fields.patient_age = `${age} ปี`;
        }
      }
      if (p.patient_age && !fields.patient_age) fields.patient_age = String(p.patient_age);
      if (p.patient_phone || p.patient_mobile_phone) fields.patient_phone = p.patient_phone || p.patient_mobile_phone;
      if (p.patient_blood_group) fields.patient_blood_group = p.patient_blood_group;
      if (p.patient_treatment) fields.patient_treatment = p.patient_treatment;
      if (p.patient_treatment_hospital) fields.patient_treatment_hospital = p.patient_treatment_hospital;
      // Address
      if (p.patient_house) fields.patient_house = p.patient_house;
      if (p.patient_moo) fields.patient_moo = p.patient_moo;
      if (p.patient_road) fields.patient_road = p.patient_road;
      if (p.patient_alley) fields.patient_alley = p.patient_alley;
      if (p.patient_tambon) fields.patient_tambon = p.patient_tambon;
      if (p.patient_amphur) fields.patient_amphur = p.patient_amphur;
      if (p.patient_changwat) fields.patient_changwat = p.patient_changwat;
      if (p.patient_zipcode) fields.patient_zipcode = p.patient_zipcode;
      if (p.patient_zip_code) fields.patient_zipcode = p.patient_zip_code;
      // Emergency contact
      if (p.patient_contact_full_name) fields.patient_contact_full_name = p.patient_contact_full_name;
      if (p.patient_contact_mobile_phone) fields.patient_contact_mobile_phone = p.patient_contact_mobile_phone;
      if (p.patient_contact_relation) fields.patient_contact_relation = p.patient_contact_relation;
      if (p.patient_contact_full_name) {
        fields.emergency_contacts = [{
          name: p.patient_contact_full_name || "",
          phone: p.patient_contact_mobile_phone || "",
          relation: p.patient_contact_relation || "",
        }];
      }
    }

    // ── Visit data / vital signs from referGroupCase ──
    if (referGroupCase) {
      const visitData = referGroupCase.data?.visitData;
      if (visitData) {
        if (visitData.temperature) fields.temperature = visitData.temperature;
        if (visitData.bps) fields.bps = visitData.bps;
        if (visitData.bpd) fields.bpd = visitData.bpd;
        if (visitData.pulse) fields.pulse = visitData.pulse;
        if (visitData.rr) fields.rr = visitData.rr;
        if (visitData.visit_primary_symptom_main_symptom) fields.visit_primary_symptom_main_symptom = visitData.visit_primary_symptom_main_symptom;
        if (visitData.visit_primary_symptom_current_illness) fields.visit_primary_symptom_current_illness = visitData.visit_primary_symptom_current_illness;
        if (visitData.pe) fields.pe = visitData.pe;
        if (visitData.Imp) fields.Imp = visitData.Imp;
        if (visitData.moreDetail) fields.moreDetail = visitData.moreDetail;
        // ICD-10
        if (visitData.icd10Basic) fields.icd10Basic = visitData.icd10Basic;
        if (visitData.icd10 && Array.isArray(visitData.icd10) && visitData.icd10.length > 0) fields.icd10 = visitData.icd10;
        if (visitData.icd10MoreBasic) fields.icd10MoreBasic = visitData.icd10MoreBasic;
        if (visitData.icd10More && Array.isArray(visitData.icd10More) && visitData.icd10More.length > 0) fields.icd10More = visitData.icd10More;
      }

      // ── Drugs / medicines ──
      const drugs = referGroupCase.data?.drugs;
      if (drugs && Array.isArray(drugs) && drugs.length > 0) {
        fields.medicines = drugs;
      }

      // ── Health info: drugAllergy, vaccines, disease/physicalExam ──
      const healthInfo = referGroupCase.data?.healthInfo || referGroupCase.data;
      if (healthInfo) {
        if (healthInfo.drugAllergy && Array.isArray(healthInfo.drugAllergy) && healthInfo.drugAllergy.length > 0) {
          fields.drugAllergy = healthInfo.drugAllergy;
        }
        if (healthInfo.vaccines && Array.isArray(healthInfo.vaccines) && healthInfo.vaccines.length > 0) {
          fields.vaccines = healthInfo.vaccines;
        }
        if (healthInfo.physicalExam) fields.physicalExam = healthInfo.physicalExam;
        if (healthInfo.disease) {
          fields.diseases = Array.isArray(healthInfo.disease)
            ? healthInfo.disease
            : [{ id: 1, name: String(healthInfo.disease) }];
        }
      }

      // ── Referral-level fields (cause, acute, doctor, equipment) ──
      const causeId = referGroupCase.referralCause?.id || referGroupCase.referralCause;
      if (causeId) {
        fields.referral_cause = String(causeId);
        // Store in ref so it survives the fetchReferralCauses overwrite
        const causeObj = referGroupCase.referralCause?.id
          ? { id: referGroupCase.referralCause.id, name: referGroupCase.referralCause.name || "" }
          : null;
        if (causeObj) {
          draftCauseRef.current = causeObj;
          const store = useReferralCreateStore.getState();
          if (!store.referralCauses.find((c: any) => String(c.id) === String(causeObj.id))) {
            useReferralCreateStore.setState({ referralCauses: [...store.referralCauses, causeObj] });
          }
        }
      }
      if (referGroupCase.acuteLevel) {
        fields.acute_level = String(referGroupCase.acuteLevel?.id ?? referGroupCase.acuteLevel);
      }
      if (referGroupCase.contagious !== undefined) {
        fields.is_infectious = referGroupCase.contagious ? "true" : "false";
      }
      if (referGroupCase.moreDetail) fields.additionalComments = referGroupCase.moreDetail;
      // Doctor info
      if (referGroupCase.doctor?.id || referGroupCase.doctor) {
        fields.prescribingDoctor = String(referGroupCase.doctor?.id || referGroupCase.doctor);
        if (referGroupCase.doctorName) fields.docterName = referGroupCase.doctorName;
        if (referGroupCase.doctorIdentifyNumber) fields.doctorCode = referGroupCase.doctorIdentifyNumber;
        if (referGroupCase.doctorDepartment) fields.medicalDepartment = referGroupCase.doctorDepartment;
        if (referGroupCase.doctorPhone) fields.doctorContactNumber = String(referGroupCase.doctorPhone);
        // Store in ref so it survives the fetchDoctorUsers overwrite
        const docObj = referGroupCase.doctor?.id ? {
          id: referGroupCase.doctor.id,
          name: referGroupCase.doctor.fullName || referGroupCase.doctorName || "",
          email: referGroupCase.doctor.email || "",
          phone: referGroupCase.doctor.phone || "",
          licenseNumber: referGroupCase.doctor.identifyNumber || referGroupCase.doctorIdentifyNumber || "",
          department: referGroupCase.doctor.department || referGroupCase.doctorDepartment || "",
        } : null;
        if (docObj) {
          draftDoctorRef.current = docObj;
          const store = useReferralCreateStore.getState();
          if (!store.doctorUsers.find((d: any) => String(d.id) === String(docObj.id))) {
            useReferralCreateStore.setState({ doctorUsers: [...store.doctorUsers, docObj] });
          }
        }
      }
      // Equipment
      const equip = referGroupCase.equipment || referGroupCase.data?.equipment;
      if (equip && Array.isArray(equip) && equip.length > 0) {
        fields.requiredEquipment = equip.map((e: any, i: number) =>
          typeof e === "string" ? { id: i + 1, name: e } : { id: e.id || i + 1, name: e.name || String(e) }
        );
      }
    }

    if (Object.keys(fields).length > 0) {
      console.log("[Form groupCase effect] Setting fields:", Object.keys(fields));
      setForm((prev) => ({ ...prev, ...fields }));
      onUpdate(fields);
    } else {
      console.log("[Form groupCase effect] No fields to set");
    }
  }, [referGroupCasePatient, referGroupCase]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Referral creation point options (all types: ER / IPD / OPD) — keep raw to access phone/phone2
  const [erReferPoints, setErReferPoints] = useState<any[]>([]);

  // Derive hospital ID for creation-point fetch reactively so we re-fetch
  // when profile loads (authProfile) or when navbar hospital changes (optionHospital).
  const profileHospitalId = (authProfile as any)?.permissionGroup?.hospital?.id;

  useEffect(() => {
    const hospitalId =
      profileHospitalId || optionHospital || searchParams.hospitalID || null;
    if (!hospitalId) return;
    (async () => {
      try {
        const res = await api.get(
          "main-service/referral/deliveryPointTypeStart/find",
          {
            params: {
              useFor: "จุดสร้างใบส่งตัว",
              hospital: hospitalId,
              ...(kind === "referER" ? { isEr: "true" } : kind === "referIPD" ? { isIpd: "true" } : { isOpd: "true" }),
              isActive: "true",
            },
          }
        );
        setErReferPoints(res.data?.referralDeliveryPointTypeStarts || []);
      } catch (err) {
        console.error("Error fetching refer creation points:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, optionHospital, profileHospitalId]);

  useEffect(() => {
    const authState = useAuthStore.getState();
    const roleName = authState.getRoleName();
    let userHospitalId: string | undefined;
    if (roleName === "superAdmin") {
      // Use navbar selection first, then URL hospitalID param as fallback
      // (draft loading no longer sets optionHospital to avoid showing
      // the hospital in the Navbar — matching Nuxt behavior)
      userHospitalId = optionHospital
        ? String(optionHospital)
        : searchParams.hospitalID || undefined;
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

    const referralType = kind === "requestReferOut" || kind === "referOut" || kind === "referER" || kind === "referIPD"
      ? "Refer Out - ส่งตัวออก"
      : "Refer Back - ส่งตัวกลับ";

    // Fetch and then re-inject any draft items that the fetch may overwrite
    Promise.all([
      fetchReferralCauses({
        hospital: userHospitalId,
        referralType,
        ...(kind === "referER"
          ? { isEr: "true", isActive: "true" }
          : kind === "referIPD"
            ? { isIpd: "true", isActive: "true" }
            : { isOpd: "true" }),
      }),
      fetchDoctorUsers({
        hospital: userHospitalId,
      }),
    ]).then(() => {
      // Re-inject draft doctor if it was set and is missing from fetched results
      const dd = draftDoctorRef.current;
      if (dd?.id) {
        const store = useReferralCreateStore.getState();
        if (!store.doctorUsers.find((d: any) => String(d.id) === String(dd.id))) {
          useReferralCreateStore.setState({ doctorUsers: [...store.doctorUsers, dd] });
        }
      }
      // Re-inject draft cause if it was set and is missing from fetched results
      const dc = draftCauseRef.current;
      if (dc?.id) {
        const store = useReferralCreateStore.getState();
        if (!store.referralCauses.find((c: any) => String(c.id) === String(dc.id))) {
          useReferralCreateStore.setState({ referralCauses: [...store.referralCauses, dc] });
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, optionHospital, authProfile]);

// Branch data from query params (branchData is JSON array from DoctorBranchSelector)
  const branchList = (() => {
    try {
      console.log("[Form branchList] searchParams.branchData:", searchParams.branchData ? `"${searchParams.branchData.substring(0, 100)}..."` : "EMPTY");
      if (searchParams.branchData) {
        const data = JSON.parse(searchParams.branchData);
        console.log("[Form branchList] Parsed branchData:", JSON.stringify(data));
        return data.map((item: any, i: number) => ({
          index: i + 1,
          name: item.name || "",
          appointmentDate: item.appointmentDate || "",
          appointmentTime: item.appointmentTime || "",
          appointment: item.appointment ?? 1,
          remark: item.remark || "",
        }));
      }
    } catch (e) { console.error("[Form branchList] JSON parse error:", e); }
    // Fallback: parse Nuxt-style query params (branch_type, datetime, remark)
    if (branchNames && searchParams.branch_type) {
      console.log("[Form branchList] Using Nuxt-style params: branch_type=", searchParams.branch_type, "datetime=", searchParams.datetime);
      const types = (searchParams.branch_type || "").split(",");
      const dates = (searchParams.datetime || "").split(",");
      const remarks = (searchParams.remark || "").split(",");
      return branchNames.split(",").map((name: string, i: number) => {
        const typeVal = types[i]?.trim() || "";
        const isWaiting = typeVal === "2" || typeVal === "รอนัดรักษาต่อเนื่อง";
        const rawDate = dates[i]?.trim() || "";
        // Parse datetime: could be "2026-04-27T07:00" or "2026-04-27"
        let apptDate = "";
        let apptTime = "";
        if (rawDate) {
          if (rawDate.includes("T")) {
            const [datePart, timePart] = rawDate.split("T");
            apptDate = datePart;
            apptTime = timePart || "";
          } else {
            // Date-only string like "2026-04-27" — use new Date() to match Nuxt behavior
            // new Date("2026-04-27") = UTC midnight → local time in Thailand = 07:00
            const dt = new Date(rawDate);
            if (!isNaN(dt.getTime())) {
              const y = dt.getFullYear();
              const m = String(dt.getMonth() + 1).padStart(2, "0");
              const d = String(dt.getDate()).padStart(2, "0");
              apptDate = `${y}-${m}-${d}`;
              apptTime = `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
            } else {
              apptDate = rawDate;
            }
          }
        }
        return {
          index: i + 1,
          name: name.trim(),
          appointmentDate: apptDate,
          appointmentTime: apptTime,
          appointment: isWaiting ? 2 : 1,
          remark: remarks[i]?.trim() || "",
        };
      });
    }
    // Fallback: parse from branchNames only (no date/time info)
    if (branchNames) {
      return branchNames.split(",").map((name: string, i: number) => ({
        index: i + 1,
        name: name.trim(),
        appointmentDate: "",
        appointmentTime: "",
        appointment: 1,
        remark: "",
      }));
    }
    // Fallback for draft edit: use appointmentData from draft document or groupCase
    const apptData = referInfo?.appointmentData || referGroupCase?.appointmentData;
    if (apptData && Array.isArray(apptData) && apptData.length > 0) {
      return apptData.map((item: any, i: number) => {
        let apptDate = "";
        let apptTime = "";
        if (item.appointmentDate) {
          // Use new Date() with local timezone to match Nuxt behavior
          // "2026-04-27" → UTC midnight → local time (Thailand +7) = 07:00
          const dt = new Date(item.appointmentDate);
          if (!isNaN(dt.getTime())) {
            const y = dt.getFullYear();
            const m = String(dt.getMonth() + 1).padStart(2, "0");
            const d = String(dt.getDate()).padStart(2, "0");
            apptDate = `${y}-${m}-${d}`;
            apptTime = `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
          }
        }
        return {
          index: i + 1,
          name: item.doctorBranchName || item.name || "",
          appointmentDate: apptDate,
          appointmentTime: apptTime,
          appointment: item.appointmentType === "รอนัดรักษาต่อเนื่อง" ? 2 : 1,
          remark: item.remark === "undefined" ? "" : (item.remark || ""),
        };
      });
    }
    return [];
  })();

  // Referral point info — prefer query params, fallback to groupCase/draft deliveryPointTypeEnd
  const deliveryPointEnd = referGroupCase?.deliveryPointTypeEnd || referInfo?.deliveryPointTypeEnd;
  console.log("[Form] referGroupCase:", !!referGroupCase, "referInfo:", !!referInfo, "deliveryPointEnd:", !!deliveryPointEnd, deliveryPointEnd?.name);
  const referPointName = searchParams.referPointName || deliveryPointEnd?.name || "";
  const referPointPhone = searchParams.referPointPhone || deliveryPointEnd?.phone || "";
  const referPointPhone2 = searchParams.referPointPhone2 || deliveryPointEnd?.phone2 || "";

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

  // Medicine autocomplete search
  interface MedicineOption {
    value: string;
    label: string;
    name_th: string;
  }
  const [medicineOptions, setMedicineOptions] = useState<MedicineOption[]>([]);
  const [medicineLoading, setMedicineLoading] = useState(false);
  const medicineSearchTimer = useRef<NodeJS.Timeout | null>(null);

  const searchMedicine = useCallback((searchValue: string) => {
    if (medicineSearchTimer.current) clearTimeout(medicineSearchTimer.current);
    if (!searchValue || searchValue.length < 1) {
      setMedicineOptions([]);
      return;
    }
    medicineSearchTimer.current = setTimeout(async () => {
      setMedicineLoading(true);
      try {
        const res = await api.get("main-service/medicine/findAndCount", {
          params: { limit: 10, offset: 1, search: searchValue },
        });
        const items = res.data?.medicine || res.data?.medicines || res.data?.data || [];
        setMedicineOptions(
          items.map((item: any) => ({
            value: item.tmtid || item.id || "",
            label: `${item.tmtid || ""} - ${item.name || ""}`,
            name_th: item.name || "",
          }))
        );
      } catch (e) {
        console.error("Medicine search error:", e);
        setMedicineOptions([]);
      } finally {
        setMedicineLoading(false);
      }
    }, 300);
  }, []);

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
    if (branch.appointment === 2) return "รอนัดรักษาต่อเนื่อง";
    if (!branch.appointmentDate && !branch.appointmentTime) return "-";
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
              {/* ER/IPD: วันที่ส่งตัว + เวลาที่ส่งตัว — top of section */}
              {(kind === "referER" || kind === "referIPD") && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <Box>
                    <FieldLabel label="วันที่ส่งตัว" required />
                    <ThaiDateInput
                      value={form.startDate}
                      onChange={(val) => updateField("startDate", val)}
                      placeholder="เลือกวันที่ส่งตัว"
                    />
                  </Box>
                  <Box>
                    <FieldLabel label="เวลาที่ส่งตัว" required />
                    <ThaiTimeInput
                      value={form.startTime}
                      onChange={(val) => updateField("startTime", val)}
                      placeholder="เลือกเวลาที่ส่งตัว"
                      minWidth="100%"
                    />
                  </Box>
                </Box>
              )}

              {/* ระยะเวลารับรองสิทธิ์ — only for referOut (not ER/IPD/referBack/request kinds) */}
              {kind !== "referER" && kind !== "referIPD" && kind !== "referBack" && kind !== "requestReferOut" && kind !== "requestReferBack" && (
                <Box
                  sx={{
                    mb: 3,
                    p: 3,
                    bgcolor: "#FEFCE8",
                    borderRadius: 2,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #111", pb: 1, mb: 2 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: "1.1rem", color: "#036245" }}>
                      ระยะเวลารับรองสิทธิ์ <span style={{ color: "#ef4444" }}>*</span>
                    </Typography>
                    <Tooltip
                      title={
                        <Box sx={{ p: 1, fontSize: "0.85rem", whiteSpace: "pre-line" }}>
                          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>ระยะเวลารับรองสิทธิ์แต่ละแบบจะมีผลกับการนัดหมาย</Typography>
                          <b>ใช้ได้ครั้งเดียว</b> — จะไม่สามารถนัดรักษาต่อเนื่องได้{"\n"}
                          <b>กำหนดช่วง และ อื่นๆ</b> — สามารถกำหนดนัดหมายได้ภายในช่วงเวลาที่กำหนดเท่านั้น
                        </Box>
                      }
                      arrow
                      slotProps={{ tooltip: { sx: { bgcolor: "#036245", color: "white", maxWidth: 400 } } }}
                    >
                      <IconButton size="small" sx={{ color: "#9ca3af" }}>
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <RadioGroup
                    row
                    value={String(form.certificationPeriod)}
                    onChange={(e) => {
                      const newVal = Number(e.target.value);
                      // Match Nuxt: clear deliveryPeriod when radio changes, then add fresh empty entry
                      const freshDP = { startDelivery: "", endDelivery: "", startDelivery2: "", endDelivery2: "" };
                      updateField("certificationPeriod", newVal);
                      updateField("deliveryPeriod", [freshDP]);
                    }}
                    sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" }, gap: 1, mb: 2 }}
                  >
                    {[
                      { value: 1, label: "ใช้ได้ครั้งเดียว" },
                      { value: 2, label: "กำหนดช่วง" },
                      { value: 3, label: "1 เดือน" },
                      { value: 4, label: "3 เดือน" },
                      { value: 5, label: "6 เดือน" },
                      { value: 6, label: "1 ปี" },
                      { value: 7, label: "สิ้นสุดปีงบ" },
                    ].map((opt) => (
                      <FormControlLabel
                        key={opt.value}
                        value={String(opt.value)}
                        control={<Radio size="small" sx={{ color: "#9ca3af", "&.Mui-checked": { color: "#00AF75" } }} />}
                        label={<Typography sx={{ fontSize: "0.875rem" }}>{opt.label}</Typography>}
                        sx={{
                          m: 0,
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          border: form.certificationPeriod === opt.value ? "2px solid #00AF75" : "1px solid transparent",
                          bgcolor: form.certificationPeriod === opt.value ? "#f0fdf4" : "transparent",
                        }}
                      />
                    ))}
                  </RadioGroup>
                  {/* === Radio 1: ใช้ได้ครั้งเดียว === */}
                  {form.certificationPeriod === 1 && (
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mt: 2 }}>
                      <Box>
                        <FieldLabel label="วันที่เริ่มต้น" required />
                        <ThaiDateInput
                          value={form.deliveryPeriod?.[0]?.startDelivery || ""}
                          onChange={(val) => {
                            const dp = [...(form.deliveryPeriod || [{ startDelivery: "", endDelivery: "", startDelivery2: "", endDelivery2: "" }])];
                            dp[0] = { ...dp[0], startDelivery: val };
                            updateField("deliveryPeriod", dp);
                          }}
                          placeholder="DD/MM/YY"
                        />
                      </Box>
                      <Box>
                        <FieldLabel label="เวลาเริ่มต้น" required />
                        <ThaiTimeInput
                          value={form.deliveryPeriod?.[0]?.endDelivery || ""}
                          onChange={(val) => {
                            const dp = [...(form.deliveryPeriod || [{ startDelivery: "", endDelivery: "", startDelivery2: "", endDelivery2: "" }])];
                            dp[0] = { ...dp[0], endDelivery: val };
                            updateField("deliveryPeriod", dp);
                          }}
                          placeholder="HH:MM"
                          minWidth="100%"
                        />
                      </Box>
                    </Box>
                  )}

                  {/* === Radio 2: กำหนดช่วง === */}
                  {form.certificationPeriod === 2 && (
                    <Box sx={{ mt: 2 }}>
                      {/* Row 1: วันที่เริ่มต้น + เวลา */}
                      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mb: 2 }}>
                        <Box>
                          <FieldLabel label="วันที่เริ่มต้น" required />
                          <ThaiDateInput
                            value={form.deliveryPeriod?.[0]?.startDelivery || ""}
                            onChange={(val) => {
                              const dp = [...(form.deliveryPeriod || [{ startDelivery: "", endDelivery: "", startDelivery2: "", endDelivery2: "" }])];
                              dp[0] = { ...dp[0], startDelivery: val };
                              updateField("deliveryPeriod", dp);
                            }}
                            placeholder="DD/MM/YY"
                          />
                        </Box>
                        <Box>
                          <FieldLabel label="เวลา" required />
                          <ThaiTimeInput
                            value={form.deliveryPeriod?.[0]?.endDelivery || ""}
                            onChange={(val) => {
                              const dp = [...(form.deliveryPeriod || [{ startDelivery: "", endDelivery: "", startDelivery2: "", endDelivery2: "" }])];
                              dp[0] = { ...dp[0], endDelivery: val };
                              updateField("deliveryPeriod", dp);
                            }}
                            placeholder="HH:MM"
                            minWidth="100%"
                          />
                        </Box>
                      </Box>
                      {/* Row 2: วันหมดอายุ + เวลา */}
                      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                        <Box>
                          <FieldLabel label="วันหมดอายุ" required />
                          <ThaiDateInput
                            value={form.deliveryPeriod?.[0]?.startDelivery2 || ""}
                            onChange={(val) => {
                              const dp = [...(form.deliveryPeriod || [{ startDelivery: "", endDelivery: "", startDelivery2: "", endDelivery2: "" }])];
                              dp[0] = { ...dp[0], startDelivery2: val };
                              updateField("deliveryPeriod", dp);
                            }}
                            placeholder="DD/MM/YY"
                          />
                        </Box>
                        <Box>
                          <FieldLabel label="เวลา" required />
                          <ThaiTimeInput
                            value={form.deliveryPeriod?.[0]?.endDelivery2 || ""}
                            onChange={(val) => {
                              const dp = [...(form.deliveryPeriod || [{ startDelivery: "", endDelivery: "", startDelivery2: "", endDelivery2: "" }])];
                              dp[0] = { ...dp[0], endDelivery2: val };
                              updateField("deliveryPeriod", dp);
                            }}
                            placeholder="HH:MM"
                            minWidth="100%"
                          />
                        </Box>
                      </Box>
                    </Box>
                  )}

                  {/* === Radio 3-7: 1 เดือน / 3 เดือน / 6 เดือน / 1 ปี / สิ้นสุดปีงบ === */}
                  {[3, 4, 5, 6, 7].includes(Number(form.certificationPeriod)) && (
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mt: 2 }}>
                      <Box>
                        <FieldLabel label="วันที่เริ่มต้น" required />
                        <ThaiDateInput
                          value={form.deliveryPeriod?.[0]?.startDelivery || ""}
                          onChange={(val) => {
                            const dp = [...(form.deliveryPeriod || [{ startDelivery: "", endDelivery: "", startDelivery2: "", endDelivery2: "" }])];
                            dp[0] = { ...dp[0], startDelivery: val };
                            // Auto-calculate end date based on period (matching Nuxt logic)
                            if (val) {
                              try {
                                const startDate = new Date(val);
                                if (!isNaN(startDate.getTime())) {
                                  const endDate = new Date(startDate);
                                  const period = Number(form.certificationPeriod);
                                  switch (period) {
                                    case 3: endDate.setMonth(endDate.getMonth() + 1); break;
                                    case 4: endDate.setMonth(endDate.getMonth() + 3); break;
                                    case 5: endDate.setMonth(endDate.getMonth() + 6); break;
                                    case 6: endDate.setFullYear(endDate.getFullYear() + 1); break;
                                    case 7: {
                                      // สิ้นสุดปีงบ = 30 กันยายน
                                      const currentYear = startDate.getFullYear();
                                      const sept30 = new Date(currentYear, 8, 30);
                                      if (startDate <= sept30) {
                                        endDate.setTime(sept30.getTime());
                                      } else {
                                        endDate.setTime(new Date(currentYear + 1, 8, 30).getTime());
                                      }
                                      break;
                                    }
                                    default: endDate.setMonth(endDate.getMonth() + 1);
                                  }
                                  // Handle month overflow (e.g. Jan 31 + 1 month)
                                  if (period !== 7 && endDate.getDate() !== startDate.getDate()) {
                                    endDate.setDate(0); // last day of previous month
                                  }
                                  // Use local date string to avoid timezone shift (toISOString converts to UTC)
                                  const yy = endDate.getFullYear();
                                  const mm2 = String(endDate.getMonth() + 1).padStart(2, "0");
                                  const dd2 = String(endDate.getDate()).padStart(2, "0");
                                  dp[0].startDelivery2 = `${yy}-${mm2}-${dd2}`;
                                }
                              } catch { /* ignore */ }
                            } else {
                              dp[0].startDelivery2 = "";
                            }
                            updateField("deliveryPeriod", dp);
                          }}
                          placeholder="DD/MM/YY"
                        />
                      </Box>
                      <Box>
                        <FieldLabel label="เวลา" required />
                        <ThaiTimeInput
                          value={form.deliveryPeriod?.[0]?.endDelivery || ""}
                          onChange={(val) => {
                            const dp = [...(form.deliveryPeriod || [{ startDelivery: "", endDelivery: "", startDelivery2: "", endDelivery2: "" }])];
                            dp[0] = { ...dp[0], endDelivery: val, endDelivery2: val };
                            updateField("deliveryPeriod", dp);
                          }}
                          placeholder="HH:MM"
                          minWidth="100%"
                        />
                      </Box>
                      <Box>
                        <FieldLabel label="วันหมดอายุ" required />
                        <ThaiDateInput
                          value={form.deliveryPeriod?.[0]?.startDelivery2 || ""}
                          onChange={() => {}}
                          placeholder="DD/MM/YY"
                          disabled
                        />
                      </Box>
                      <Box>
                        <FieldLabel label="เวลา" required />
                        <ThaiTimeInput
                          value={form.deliveryPeriod?.[0]?.endDelivery2 || ""}
                          onChange={() => {}}
                          placeholder="HH:MM"
                          minWidth="100%"
                          disabled
                        />
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

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
                  {(kind === "referER" || kind === "referIPD") ? (
                    <Typography
                      variant="body2"
                      sx={{ ml: 2, color: "#EAB308" }}
                    >
                      รอตอบรับ
                    </Typography>
                  ) : (
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
                  )}

                  <Typography
                    sx={{ fontWeight: 500, fontSize: "1rem", mt: 3, mb: 0.5 }}
                  >
                    จุดรับใบส่งตัว
                  </Typography>
                  {(kind === "referER" || kind === "referIPD") ? (
                    <Typography
                      variant="body2"
                      sx={{ ml: 2, color: "#EAB308" }}
                    >
                      รอตอบรับ
                    </Typography>
                  ) : (
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      {referPointName || "-"}
                    </Typography>
                  )}

                  <Typography
                    sx={{ fontWeight: 500, fontSize: "1rem", mt: 3, mb: 0.5 }}
                  >
                    จุดสร้างใบส่งตัว
                    {kind !== "requestReferOut" && kind !== "requestReferBack" && (
                      <Typography
                        component="span"
                        sx={{ color: "#ef4444", ml: 0.5 }}
                      >
                        *
                      </Typography>
                    )}
                  </Typography>
                  {(kind === "requestReferOut" || kind === "requestReferBack") ? (
                    <Typography variant="body2" sx={{ ml: 2, color: "#EAB308" }}>
                      รอยืนยันนัดหมาย
                    </Typography>
                  ) : (
                    <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                      <Select
                        value={form.referralCreationPoint}
                        displayEmpty
                        onChange={(e) =>
                          updateField("referralCreationPoint", e.target.value)
                        }
                        sx={selectSx}
                        renderValue={(selected) => {
                          if (!selected) return <span style={{ color: "#9ca3af" }}>เลือกจุดสร้าง ใบส่งตัว</span>;
                          const opt = erReferPoints.find((o: any) => String(o.id) === String(selected));
                          return opt?.name || selected;
                        }}
                        endAdornment={
                          form.referralCreationPoint ? (
                            <IconButton
                              size="small"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                updateField("referralCreationPoint", "");
                              }}
                              sx={{ mr: 2, p: 0.25, color: "#9ca3af", "&:hover": { color: "#ef4444" } }}
                            >
                              <CloseIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          ) : null
                        }
                      >
                        {erReferPoints.map((opt: any) => (
                          <MenuItem key={opt.id} value={String(opt.id)}>
                            {opt.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
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
                    sx={{
                      ml: 2,
                      mt: 2,
                      color: kind === "referER" ? "#F97316" : kind === "referIPD" ? "#3B82F6" : "#7c3aed",
                    }}
                  >
                    {kind === "referER"
                      ? "Emergency - ผู้ฉุกเฉิน"
                      : kind === "referIPD"
                        ? "IPD - ผู้ป่วยใน"
                        : "OPD - ผู้ป่วยนอก"}
                  </Typography>

                  <Typography
                    sx={{ fontWeight: 500, fontSize: "1rem", mt: 3, mb: 0.5 }}
                  >
                    เบอร์ติดต่อจุดใบส่งตัว
                  </Typography>
                  {(kind === "referER" || kind === "referIPD") ? (
                    <Typography
                      variant="body2"
                      sx={{ ml: 2, color: "#EAB308" }}
                    >
                      รอตอบรับ
                    </Typography>
                  ) : (
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      {`${referPointPhone || "-"} ต่อ ${referPointPhone2 || "ไม่ระบุ"}`}
                    </Typography>
                  )}

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
                  {(() => {
                    if (kind === "requestReferOut" || kind === "requestReferBack") {
                      return (
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          -
                        </Typography>
                      );
                    }
                    const selected = erReferPoints.find(
                      (o: any) =>
                        String(o.id) === String(form.referralCreationPoint)
                    );
                    if (selected && (selected.phone || selected.phone2)) {
                      return (
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          {`${selected.phone || 0} ต่อ ${
                            selected.phone2 || 0
                          }`}
                        </Typography>
                      );
                    }
                    return (
                      <Typography variant="body2" sx={{ ml: 2 }}>
                        -
                      </Typography>
                    );
                  })()}
                </Box>
              </Box>

              {/* สาขา/แผนกปลายทาง */}
              {(kind === "referER" || kind === "referIPD") ? (
                /* ER/IPD — show header + simple "รอตอบรับ" text (matching Nuxt IPD/ER) */
                searchParams?.branch_names !== "false" && (
                  <>
                    <Box
                      sx={{
                        borderBottom: "2px solid #16a34a",
                        mb: 2,
                        pb: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography
                        sx={{
                          color: "#036245",
                          fontSize: "1rem",
                          fontWeight: 400,
                          ml: 1,
                        }}
                      >
                        สาขา/แผนกปลายทาง (
                        <Typography
                          component="span"
                          sx={{
                            color: "#036245",
                            fontSize: "0.875rem",
                            fontWeight: 400,
                          }}
                        >
                          อนุญาติให้ส่งต่อสาขาอื่น
                        </Typography>
                        )
                      </Typography>
                      <Tooltip
                        title="สามารถพิจารณาปรับเปลี่ยนสาขาที่ส่งต่อ จากที่ต้นทางกำหนดมาได้ถ้าต้นทางอนุญาต"
                        placement="top"
                        arrow
                        componentsProps={{
                          tooltip: {
                            sx: {
                              fontSize: "1rem",
                              lineHeight: 1.6,
                              padding: "14px 18px",
                              maxWidth: 460,
                              bgcolor: "rgba(0,0,0,0.88)",
                              fontWeight: 500,
                            },
                          },
                          arrow: { sx: { color: "rgba(0,0,0,0.88)" } },
                        }}
                      >
                        <IconButton size="small" sx={{ color: "#9ca3af" }}>
                          <HelpOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box sx={{ p: 3 }}>
                      <Typography sx={{ color: "#64748B", fontSize: "1rem", fontWeight: 500, mb: 1 }}>
                        สาขา/แผนกที่ส่งต่อ
                      </Typography>
                      <Typography sx={{ ml: 2, color: "#EAB308", fontSize: "1rem" }}>
                        รอตอบรับ
                      </Typography>
                    </Box>
                  </>
                )
              ) : (kind === "requestReferOut" || kind === "requestReferBack") ? (
                <>
                  <Box
                    sx={{
                      borderBottom: "2px solid #16a34a",
                      mb: 2,
                      pb: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#036245",
                        fontSize: "1rem",
                        fontWeight: 400,
                        ml: 1,
                      }}
                    >
                      สาขา/แผนกปลายทาง
                    </Typography>
                    <Tooltip
                      title="สามารถพิจารณาปรับเปลี่ยนสาขาที่ส่งต่อ จากที่ต้นทางกำหนดมาได้ถ้าต้นทางอนุญาต"
                      placement="top"
                      arrow
                      componentsProps={{
                        tooltip: {
                          sx: {
                            fontSize: "1rem",
                            lineHeight: 1.6,
                            padding: "14px 18px",
                            maxWidth: 460,
                            bgcolor: "rgba(0,0,0,0.88)",
                            fontWeight: 500,
                          },
                        },
                        arrow: { sx: { color: "rgba(0,0,0,0.88)" } },
                      }}
                    >
                      <IconButton size="small" sx={{ color: "#9ca3af" }}>
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {/* Branch table matching Nuxt layout — green text header on white bg */}
                  <TableContainer sx={{ mb: 3, border: "1px solid #e5e7eb", borderRadius: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ borderBottom: "2px solid #16a34a" }}>
                          <TableCell sx={{ color: "#036245", fontWeight: 600, width: 60 }}>ลำดับ</TableCell>
                          <TableCell sx={{ color: "#036245", fontWeight: 600 }}>สาขา/แผนกที่ส่งต่อ</TableCell>
                          <TableCell sx={{ color: "#036245", fontWeight: 600 }}>วัน/เวลานัดหมาย</TableCell>
                          <TableCell sx={{ color: "#036245", fontWeight: 600 }}>หมายเหตุ</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {branchList.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} sx={{ textAlign: "center", color: "#9ca3af" }}>ไม่มีข้อมูล</TableCell>
                          </TableRow>
                        ) : branchList.map((branch: any) => (
                          <TableRow key={branch.index} sx={{ bgcolor: "#fefce8" }}>
                            <TableCell sx={{ textAlign: "center" }}>{branch.index}</TableCell>
                            <TableCell>{branch.name || "-"}</TableCell>
                            <TableCell>
                              {branch.appointment === 2
                                ? "รอนัดรักษาต่อเนื่อง"
                                : branch.appointmentDate
                                  ? `${(() => {
                                      const [y, m, d] = branch.appointmentDate.split("-").map(Number);
                                      return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y + 543}`;
                                    })()} - ${branch.appointmentTime || "00:00"} น.`
                                  : "-"}
                            </TableCell>
                            <TableCell>{branch.remark || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : kind === "referBack" ? (
                /* referBack — Nuxt style: simple numbered list, no table */
                searchParams?.branch_names !== "false" && (
                  <>
                    <Box
                      sx={{
                        borderBottom: "2px solid #16a34a",
                        mb: 2,
                        pb: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography
                        sx={{
                          color: "#036245",
                          fontSize: "1rem",
                          fontWeight: 400,
                          ml: 1,
                        }}
                      >
                        สาขา/แผนกปลายทาง{" "}
                        {searchParams?.isChangeDoctorBranch === "true" ? (
                          <>
                            (
                            <Typography
                              component="span"
                              sx={{ color: "#f01000", fontSize: "0.875rem", fontWeight: 400 }}
                            >
                              ไม่อนุญาตให้ส่งต่อสาขาอื่น
                            </Typography>
                            )
                          </>
                        ) : (
                          <>
                            (
                            <Typography
                              component="span"
                              sx={{ color: "#036245", fontSize: "0.875rem", fontWeight: 400 }}
                            >
                              อนุญาตให้ส่งต่อสาขาอื่น
                            </Typography>
                            )
                          </>
                        )}
                      </Typography>
                      <Tooltip
                        title="สามารถพิจารณาปรับเปลี่ยนสาขาที่ส่งต่อ จากที่ต้นทางกำหนดมาได้ถ้าต้นทางอนุญาต"
                        placement="top"
                        arrow
                        componentsProps={{
                          tooltip: {
                            sx: {
                              fontSize: "1rem",
                              lineHeight: 1.6,
                              padding: "14px 18px",
                              maxWidth: 460,
                              bgcolor: "rgba(0,0,0,0.88)",
                              fontWeight: 500,
                            },
                          },
                          arrow: { sx: { color: "rgba(0,0,0,0.88)" } },
                        }}
                      >
                        <IconButton size="small" sx={{ color: "#9ca3af" }}>
                          <HelpOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    {/* Simple list matching Nuxt referOut form */}
                    <Box sx={{ mb: 3 }}>
                      <Typography sx={{ color: "#64748B", fontSize: "1rem", fontWeight: 500, ml: 1 }}>
                        สาขา/แผนกที่ส่งต่อ
                      </Typography>
                      {branchList.length > 0 ? (
                        branchList.map((branch: any) => (
                          <Typography
                            key={branch.index}
                            sx={{ ml: 4, color: "#374151", fontSize: "1rem", lineHeight: 1.8 }}
                          >
                            {`${branch.index}.${branch.name}`}
                          </Typography>
                        ))
                      ) : (
                        <Typography sx={{ ml: 4, color: "#374151", fontSize: "1rem" }}>
                          ไม่มีสาขาส่งต่อ
                        </Typography>
                      )}
                    </Box>
                  </>
                )
              ) : (
                /* referOut — table layout with appointment columns */
                searchParams?.branch_names !== "false" && (
                  <>
                    <Box
                      sx={{
                        borderBottom: "2px solid #16a34a",
                        mb: 2,
                        pb: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography
                        sx={{
                          color: "#036245",
                          fontSize: "1rem",
                          fontWeight: 400,
                          ml: 1,
                        }}
                      >
                        สาขา/แผนกปลายทาง
                      </Typography>
                      <Tooltip
                        title="สามารถพิจารณาปรับเปลี่ยนสาขาที่ส่งต่อ จากที่ต้นทางกำหนดมาได้ถ้าต้นทางอนุญาต"
                        placement="top"
                        arrow
                        componentsProps={{
                          tooltip: {
                            sx: {
                              fontSize: "1rem",
                              lineHeight: 1.6,
                              padding: "14px 18px",
                              maxWidth: 460,
                              bgcolor: "rgba(0,0,0,0.88)",
                              fontWeight: 500,
                            },
                          },
                          arrow: { sx: { color: "rgba(0,0,0,0.88)" } },
                        }}
                      >
                        <IconButton size="small" sx={{ color: "#9ca3af" }}>
                          <HelpOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <TableContainer
                      sx={{
                        boxShadow: "none",
                        mb: 3,
                      }}
                    >
                      <Table size="small" sx={{ borderCollapse: "collapse" }}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ bgcolor: "#f9fafb", color: "#64748B", fontWeight: 500, borderBottom: "1px solid #e5e7eb", width: 60 }}>
                              ลำดับ
                            </TableCell>
                            <TableCell sx={{ bgcolor: "#f9fafb", color: "#64748B", fontWeight: 500, borderBottom: "1px solid #e5e7eb" }}>
                              สาขา/แผนกที่ส่งต่อ
                            </TableCell>
                            <TableCell sx={{ bgcolor: "#FEFCE8", color: "#64748B", fontWeight: 500, borderBottom: "1px solid #e5e7eb" }}>
                              วัน/เวลานัดหมาย
                            </TableCell>
                            <TableCell sx={{ bgcolor: "#FEFCE8", color: "#64748B", fontWeight: 500, borderBottom: "1px solid #e5e7eb" }}>
                              หมายเหตุ
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {branchList.map((branch: any) => (
                            <TableRow key={branch.index} sx={{ borderBottom: "1px solid #f3f4f6" }}>
                              <TableCell sx={{ color: "#374151" }}>{branch.index}</TableCell>
                              <TableCell sx={{ color: "#374151" }}>{branch.name || "-"}</TableCell>
                              <TableCell sx={{ bgcolor: "#FEFCE8", color: "#374151" }}>
                                {branch.appointment === 2
                                  ? "รอนัดรักษาต่อเนื่อง"
                                  : branch.appointmentDate
                                    ? `${(() => {
                                        const [y, m, d] = branch.appointmentDate.split("-").map(Number);
                                        return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y + 543}`;
                                      })()} - ${branch.appointmentTime || "00:00"} น.`
                                    : "-"}
                              </TableCell>
                              <TableCell sx={{ bgcolor: "#FEFCE8", color: "#374151" }}>
                                <Box sx={{ maxWidth: 200, wordBreak: "break-word" }}>
                                  {branch.remark || "-"}
                                </Box>
                              </TableCell>
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
                  </>
                )
              )}

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
                        updateField("docterName" as any, newValue?.name || "");
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
                    sx={selectSx}
                    MenuProps={{
                      PaperProps: {
                        sx: { maxHeight: 240 },
                      },
                    }}
                    {...clearableSelectProps(form.referral_cause, () => updateField("referral_cause", ""))}
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
                  value={form.notes || ""}
                  onChange={(e) =>
                    updateField("notes", e.target.value)
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
                    sx={selectSx}
                    renderValue={(selected) => {
                      if (!selected) return <span style={{ color: "#9ca3af" }}>เลือกระดับ</span>;
                      const opt = ACUTE_LEVEL_OPTIONS.find((o) => String(o.value) === String(selected));
                      if (!opt) return selected;
                      return (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box
                            sx={{
                              width: 24, height: 24, borderRadius: "50%",
                              bgcolor: opt.color, color: "#fff",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "0.75rem", fontWeight: 700, flexShrink: 0,
                            }}
                          >
                            {opt.badge}
                          </Box>
                          <span>{opt.label}</span>
                        </Box>
                      );
                    }}
                    {...clearableSelectProps(form.acute_level, () => updateField("acute_level", ""))}
                  >
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

              {/* ระดับคนไข้ ICU — เฉพาะ ER / IPD */}
              {(kind === "referER" || kind === "referIPD") && (
                <Box sx={{ mb: 2 }}>
                  <FieldLabel label="ระดับคนไข้ ICU" required />
                  <FormControl fullWidth size="small">
                    <Select
                      value={form.icu_level}
                      displayEmpty
                      onChange={(e) =>
                        updateField("icu_level", e.target.value)
                      }
                      sx={selectSx}
                      {...clearableSelectProps(form.icu_level, () => updateField("icu_level", ""))}
                      renderValue={(selected) => {
                        if (!selected) return <span style={{ color: "#9ca3af" }}>เลือกระดับ</span>;
                        const opt = ICU_LEVEL_OPTIONS.find((o) => o.value === selected);
                        if (!opt) return selected;
                        return (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box sx={{
                              bgcolor: opt.badge.color, color: "#fff", borderRadius: "50%",
                              width: 28, height: 28, display: "flex", alignItems: "center",
                              justifyContent: "center", fontSize: "0.65rem", fontWeight: 700,
                              flexShrink: 0,
                            }}>
                              {opt.badge.text}
                            </Box>
                            <span>{opt.label}</span>
                          </Box>
                        );
                      }}
                    >
                      <MenuItem value="" disabled>
                        <span style={{ color: "#9ca3af" }}>เลือกระดับ</span>
                      </MenuItem>
                      {ICU_LEVEL_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box sx={{
                              bgcolor: opt.badge.color, color: "#fff", borderRadius: "50%",
                              width: 28, height: 28, display: "flex", alignItems: "center",
                              justifyContent: "center", fontSize: "0.65rem", fontWeight: 700,
                              flexShrink: 0,
                            }}>
                              {opt.badge.text}
                            </Box>
                            <span>{opt.label}</span>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}

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

              {/* คนไข้เป็นโรคติดต่อ — เฉพาะ ER / refer-out / refer-back (ไม่มีใน request) */}
              {kind !== "requestReferOut" && kind !== "requestReferBack" && (
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
                    value="true"
                    control={<Radio size="small" />}
                    label="ใช่"
                  />
                  <FormControlLabel
                    value="false"
                    control={<Radio size="small" />}
                    label="ไม่"
                  />
                </RadioGroup>
              </Box>
              )}

              {/* ใช้รถส่งตัว + ใช้พยาบาล — เฉพาะ ER / IPD */}
              {(kind === "referER" || kind === "referIPD") && (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      sx={{ fontWeight: 500, fontSize: "0.95rem", mb: 1 }}
                    >
                      ใช้รถส่งตัว
                    </Typography>
                    <RadioGroup
                      row
                      value={form.car_refer}
                      onChange={(e) =>
                        updateField("car_refer", e.target.value)
                      }
                    >
                      <FormControlLabel
                        value="true"
                        control={<Radio size="small" />}
                        label="ต้องการใช้"
                      />
                      <FormControlLabel
                        value="false"
                        control={<Radio size="small" />}
                        label="ไม่ต้องการใช้"
                      />
                    </RadioGroup>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      sx={{ fontWeight: 500, fontSize: "0.95rem", mb: 1 }}
                    >
                      ใช้พยาบาลที่จุดรับส่ง
                    </Typography>
                    <RadioGroup
                      row
                      value={form.use_nurse}
                      onChange={(e) =>
                        updateField("use_nurse", e.target.value)
                      }
                    >
                      <FormControlLabel
                        value="true"
                        control={<Radio size="small" />}
                        label="ใช้"
                      />
                      <FormControlLabel
                        value="false"
                        control={<Radio size="small" />}
                        label="ไม่ได้ใช้"
                      />
                    </RadioGroup>
                  </Box>
                </>
              )}

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
                  key={item.id ?? index}
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
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    updateField("patient_pid", v);
                  }}
                  error={!!formErrors.patient_pid}
                  helperText={formErrors.patient_pid}
                  inputProps={{ maxLength: 13, inputMode: "numeric" }}
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
                      sx={selectSx}
                      {...clearableSelectProps(form.patient_prefix, () => updateField("patient_prefix", ""))}
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
                        // Auto-calculate age (handle both CE and BE year)
                        if (val) {
                          const [by, bm, bd] = val.split("-").map(Number);
                          const ceYear = by > 2400 ? by - 543 : by;
                          const now = new Date();
                          let age = now.getFullYear() - ceYear;
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
                        sx={selectSx}
                        {...clearableSelectProps(form.patient_sex, () => updateField("patient_sex", ""))}
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
                        sx={selectSx}
                        {...clearableSelectProps(form.patient_blood_group, () => updateField("patient_blood_group", ""))}
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
                      sx={selectSx}
                      {...clearableSelectProps(form.patient_treatment, () => updateField("patient_treatment", ""))}
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

              {/* ติดต่อในกรณีฉุกเฉิน — flat fields matching Nuxt */}
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
                    <Box
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
                          value={form.patient_contact_full_name || ""}
                          onChange={(e) =>
                            updateField("patient_contact_full_name", e.target.value)
                          }
                        />
                      </Box>
                      <Box>
                        <FieldLabel label="หมายเลขโทรศัพท์" />
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="กรอกข้อมูล"
                          value={form.patient_contact_mobile_phone || ""}
                          onChange={(e) =>
                            updateField("patient_contact_mobile_phone", e.target.value)
                          }
                        />
                      </Box>
                      <Box>
                        <FieldLabel label="เกี่ยวข้องเป็น" />
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="กรอกข้อมูล"
                          value={form.patient_contact_relation || ""}
                          onChange={(e) =>
                            updateField("patient_contact_relation", e.target.value)
                          }
                        />
                      </Box>
                    </Box>
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
                key={disease.id ?? index}
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
                key={allergy.id ?? index}
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
                key={vaccine.id ?? index}
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
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9.]/g, "");
                    updateField("temperature", v);
                  }}
                  inputProps={{ inputMode: "decimal" }}
                />
              </Box>
              <Box>
                <FieldLabel label="BP" />
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder="BP"
                    value={form.bps}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "");
                      updateField("bps", v);
                    }}
                    inputProps={{ inputMode: "numeric" }}
                    sx={{ flex: 1 }}
                  />
                  <Typography sx={{ color: "#6b7280" }}>/</Typography>
                  <TextField
                    size="small"
                    placeholder="M"
                    value={form.bpd}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "");
                      updateField("bpd", v);
                    }}
                    inputProps={{ inputMode: "numeric" }}
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
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    updateField("pulse", v);
                  }}
                  inputProps={{ inputMode: "numeric" }}
                />
              </Box>
              <Box>
                <FieldLabel label="RR" />
                <TextField
                  fullWidth
                  size="small"
                  placeholder="RR"
                  value={form.rr}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    updateField("rr", v);
                  }}
                  inputProps={{ inputMode: "numeric" }}
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
                  key={item.id ?? `icd10-${index}`}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 2,
                    mb: 2,
                    alignItems: "end",
                    border: "1px solid #e5e7eb",
                    borderRadius: 1,
                    p: 2,
                  }}
                >
                  <Box>
                    <FieldLabel label="รหัสโรค (ICD-10)" />
                    <Autocomplete
                      freeSolo
                      options={icd10Options}
                      loading={icd10Loading}
                      inputValue={item.icd_10_tm}
                      onInputChange={(_e, value, reason) => {
                        updateICD10Field(index, "icd_10_tm", value);
                        if (reason === "input") searchICD10(value);
                      }}
                      onChange={(_e, value) => {
                        if (value && typeof value !== "string") {
                          handleICD10Select(value as ICD10Option, index, "icd10");
                        }
                      }}
                      getOptionLabel={(option) =>
                        typeof option === "string" ? option : option.value
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
                          placeholder="รหัสโรค (ICD-10)"
                        />
                      )}
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
                        typeof option === "string" ? option : option.name_th
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
                    <Autocomplete
                      freeSolo
                      options={icd10Options}
                      loading={icd10Loading}
                      inputValue={item.diagename}
                      onInputChange={(_e, value, reason) => {
                        updateICD10Field(index, "diagename", value);
                        if (reason === "input") searchICD10(value);
                      }}
                      onChange={(_e, value) => {
                        if (value && typeof value !== "string") {
                          handleICD10Select(value as ICD10Option, index, "icd10");
                        }
                      }}
                      getOptionLabel={(option) =>
                        typeof option === "string" ? option : option.name_en
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
                          placeholder="ชื่อโรคภาษาอังกฤษ"
                        />
                      )}
                    />
                  </Box>
                </Box>
              ))}
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
                  key={item.id ?? `icd10m-${index}`}
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
                    <Autocomplete
                      freeSolo
                      options={icd10Options}
                      loading={icd10Loading}
                      inputValue={item.icd_10_tm}
                      onInputChange={(_e, value, reason) => {
                        updateICD10MoreField(index, "icd_10_tm", value);
                        if (reason === "input") searchICD10(value);
                      }}
                      onChange={(_e, value) => {
                        if (value && typeof value !== "string") {
                          handleICD10Select(value as ICD10Option, index, "icd10More");
                        }
                      }}
                      getOptionLabel={(option) =>
                        typeof option === "string" ? option : option.value
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
                          placeholder="รหัสโรค (ICD-10)"
                        />
                      )}
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
                        typeof option === "string" ? option : option.name_th
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
                    <Autocomplete
                      freeSolo
                      options={icd10Options}
                      loading={icd10Loading}
                      inputValue={item.diagename}
                      onInputChange={(_e, value, reason) => {
                        updateICD10MoreField(index, "diagename", value);
                        if (reason === "input") searchICD10(value);
                      }}
                      onChange={(_e, value) => {
                        if (value && typeof value !== "string") {
                          handleICD10Select(value as ICD10Option, index, "icd10More");
                        }
                      }}
                      getOptionLabel={(option) =>
                        typeof option === "string" ? option : option.name_en
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
                          placeholder="ชื่อโรคภาษาอังกฤษ"
                        />
                      )}
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
                  key={med.id ?? `med-${index}`}
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
                    <Autocomplete
                      freeSolo
                      options={medicineOptions}
                      loading={medicineLoading}
                      inputValue={med.drugname}
                      onInputChange={(_e, value, reason) => {
                        const newMeds = [...form.medicines];
                        newMeds[index] = { ...newMeds[index], drugname: value };
                        updateField("medicines", newMeds);
                        if (reason === "input") searchMedicine(value);
                      }}
                      onChange={(_e, value) => {
                        if (value && typeof value !== "string") {
                          const opt = value as MedicineOption;
                          const newMeds = [...form.medicines];
                          newMeds[index] = { ...newMeds[index], drugname: opt.name_th };
                          updateField("medicines", newMeds);
                          setMedicineOptions([]);
                        }
                      }}
                      getOptionLabel={(option) =>
                        typeof option === "string" ? option : option.name_th
                      }
                      renderOption={(props, option) => (
                        <li {...props} key={option.value}>
                          <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                              {option.label}
                            </Typography>
                          </Box>
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          placeholder="ชื่อยา"
                        />
                      )}
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
        <TreatmentDocuments
          documents={form.documents}
          onAddDocument={handleAddDocument}
          onRemoveDocument={handleRemoveDocument}
        />
      </Box>

    </Paper>
  );
}
