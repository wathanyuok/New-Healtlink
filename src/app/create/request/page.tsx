"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Save as SaveIcon,
  Send as SendIcon,
  Search as SearchIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
} from "@mui/icons-material";
import { useRouter, useSearchParams } from "next/navigation";

import BreadcrumbsRefer from "@/components/referral-create/BreadcrumbsRefer";
import DeliveryPointSelector from "@/components/referral-create/DeliveryPointSelector";
import DoctorBranchSelector from "@/components/referral-create/DoctorBranchSelector";
import RequestReferralFormComponent from "@/components/referral-create/RequestReferralForm";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import {
  useReferralCreateStore,
  type HospitalOption,
  type DoctorBranchOption,
} from "@/stores/referralCreateStore";
import { useAuthStore } from "@/stores/authStore";
import { useReferralStore } from "@/stores/referralStore";

/* ------------------------------------------------------------------ */
/*  Request Inner                                                      */
/* ------------------------------------------------------------------ */
function RequestReferralInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const kind = searchParams.get("kind") || "requestReferOut";
  const hospitalParam = searchParams.get("hospital");
  const hospitalIDParam = searchParams.get("hospitalID");
  const deliveryPointParam = searchParams.get("deliveryPoint");
  const doctorBranchParam = searchParams.get("docter_branch");
  const branchNamesParam = searchParams.get("branch_names");
  const referPointParam = searchParams.get("referPoint");
  const referPointNameParam = searchParams.get("referPointName");
  const referPointPhoneParam = searchParams.get("referPointPhone");
  const draftParam = searchParams.get("draft");

  // draft param can be JSON string like '{"id":1607}' or plain id
  const draftId = useMemo(() => {
    if (!draftParam) return null;
    try {
      const parsed = JSON.parse(draftParam);
      return parsed?.id?.toString() || draftParam;
    } catch {
      return draftParam;
    }
  }, [draftParam]);

  const isRequestReferBack = kind === "requestReferBack";

  const {
    hospitals,
    hospitalTotalCount,
    hospitalZones,
    hospitalTypes,
    formData,
    referInfo,
    loading,
    updateFormData,
    setReferInfo,
    fetchHospitals,
    fetchHospitalFilters,
    createReferralDocument,
    updateReferralDocument,
    findOneReferral,
  } = useReferralCreateStore();

  const [search, setSearch] = useState("");
  const [zone, setZone] = useState("");
  const [subType, setSubType] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // default 10 rows per page
  const [isLoading, setIsLoading] = useState(false);
  const [sendData, setSendData] = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastSeverity, setToastSeverity] = useState<"success" | "error">("success");
  const [patientInfo, setPatientInfo] = useState<{ firstname?: string; lastname?: string } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  // Store draft's fromHospital locally (NOT in global optionHospital to avoid Navbar side-effect)
  const draftFromHospitalRef = useRef<number | null>(null);

  // Track draft loaded state to signal form component
  const [draftLoaded, setDraftLoaded] = useState(0);

  const isFormStep = !!(branchNamesParam && doctorBranchParam);

  /* ── requestReferBack step-1 state (shows existing referrals to pick) ── */
  const { findAndCountReferral, checkReferPointHospital } = useReferralStore();
  const profile = useAuthStore((s) => s.profile);
  const optionHospital = useAuthStore((s) => s.optionHospital);
  const [referBackList, setReferBackList] = useState<any[]>([]);
  const [referBackTotal, setReferBackTotal] = useState(0);
  const [referBackPage, setReferBackPage] = useState(1);
  const [referBackLimit, setReferBackLimit] = useState(10);
  const [rbSearch, setRbSearch] = useState("");
  const [rbRunNumberSearch, setRbRunNumberSearch] = useState("");
  const [rbHospitalSearch, setRbHospitalSearch] = useState("");
  const rbDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Title matches Nuxt: default = "สร้างการร้องขอส่งตัวผู้ป่วยนอก"
  const title = useMemo(() => {
    if (kind === "referOut") return "ส่งตัวผู้ป่วย OPD";
    if (kind === "referBack") return "ส่งตัวผู้ป่วยกลับ OPD";
    return "สร้างการร้องขอส่งตัวผู้ป่วยนอก";
  }, [kind]);

  // Load initial data
  useEffect(() => {
    if (isRequestReferBack) {
      // For requestReferBack, we show referral list instead of hospital list
      return;
    }
    fetchHospitalFilters();
    if (!hospitalParam) {
      fetchHospitals({ offset: 1, limit, search: "", zone: null, subType: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── fetch referral docs list for requestReferBack step 1 ── */
  const fetchReferBackList = useCallback(
    async (overrides?: {
      page?: number;
      limit?: number;
      search?: string;
      runNumberSearch?: string;
      toHospitalSearch?: string;
    }) => {
      if (!isRequestReferBack) return;
      const ownHospitalId = (profile as any)?.permissionGroup?.hospital?.id;
      const fromHospital = optionHospital || ownHospitalId || undefined;
      const params = {
        limit: overrides?.limit ?? referBackLimit,
        offset: overrides?.page ?? referBackPage,
        search: overrides?.search ?? rbSearch,
        isTransferred: false,
        referralType: 1,
        referralKind: 3,
        referralStatus: 2,
        runNumberSearch: overrides?.runNumberSearch ?? rbRunNumberSearch,
        toHospitalSearch: overrides?.toHospitalSearch ?? rbHospitalSearch,
        fromHospital,
      };
      try {
        setShowLoadingOverlay(true);
        const res = await findAndCountReferral(params);
        if (res) {
          setReferBackList(res.referralDocuments || []);
          setReferBackTotal(res.totalCount ?? (res.referralDocuments || []).length);
        }
      } catch (err) {
        console.error("fetchReferBackList error:", err);
      } finally {
        setShowLoadingOverlay(false);
      }
    },
    [
      isRequestReferBack,
      profile,
      optionHospital,
      referBackLimit,
      referBackPage,
      rbSearch,
      rbRunNumberSearch,
      rbHospitalSearch,
      findAndCountReferral,
    ]
  );

  useEffect(() => {
    if (isRequestReferBack && !hospitalParam) {
      fetchReferBackList({ page: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRequestReferBack, hospitalParam]);

  // Debounced search handlers for referBack step 1
  const handleRbSearch = (val: string) => {
    setRbSearch(val);
    if (rbDebounceRef.current) clearTimeout(rbDebounceRef.current);
    rbDebounceRef.current = setTimeout(() => {
      setReferBackPage(1);
      fetchReferBackList({ page: 1, search: val });
    }, 500);
  };
  const handleRbRunNumberSearch = (val: string) => {
    setRbRunNumberSearch(val);
    if (rbDebounceRef.current) clearTimeout(rbDebounceRef.current);
    rbDebounceRef.current = setTimeout(() => {
      setReferBackPage(1);
      fetchReferBackList({ page: 1, runNumberSearch: val });
    }, 500);
  };
  const handleRbHospitalSearch = (val: string) => {
    setRbHospitalSearch(val);
    if (rbDebounceRef.current) clearTimeout(rbDebounceRef.current);
    rbDebounceRef.current = setTimeout(() => {
      setReferBackPage(1);
      fetchReferBackList({ page: 1, toHospitalSearch: val });
    }, 500);
  };
  const handleRbClearFilters = () => {
    setRbSearch("");
    setRbRunNumberSearch("");
    setRbHospitalSearch("");
    setReferBackPage(1);
    fetchReferBackList({
      page: 1,
      search: "",
      runNumberSearch: "",
      toHospitalSearch: "",
    });
  };
  const handleRbPageChange = (newPage: number) => {
    setReferBackPage(newPage);
    fetchReferBackList({ page: newPage });
  };
  const handleRbLimitChange = (newLimit: number) => {
    setReferBackLimit(newLimit);
    setReferBackPage(1);
    fetchReferBackList({ page: 1, limit: newLimit });
  };

  // Click "เลือก" on a referral row — matches Nuxt's handleActionReferBack
  const handleSelectReferBack = async (item: any) => {
    try {
      setShowLoadingOverlay(true);
      const ownHospitalId = (profile as any)?.permissionGroup?.hospital?.id;
      const hospitalForParam = optionHospital || ownHospitalId || null;
      const apiResponse = await checkReferPointHospital({
        hospital: hospitalForParam ? Number(hospitalForParam) : undefined,
        useFor: "จุดสร้างใบส่งตัว",
        isOpd: true,
        isActive: true,
      });
      const list: any[] = Array.isArray(apiResponse) ? apiResponse : [];
      const baseParams: Record<string, string> = {
        kind: "requestReferBack",
        hospital: item.toHospital?.name || "",
        hospitalID: String(item.toHospital?.id || ""),
        deliveryPoint: "true",
        docter_branch: "true",
      };
      if (item.groupCase?.id) baseParams.groupCase = String(item.groupCase.id);
      if (item.id) baseParams.referout_id = String(item.id);
      if (list.length === 1) {
        baseParams.referPoint = String(list[0].id);
      } else if (list.length > 1) {
        // multiple: go to refer point selection (no docter_branch)
        delete baseParams.docter_branch;
        baseParams.referPoint = String(list[0].id);
      }
      const q = new URLSearchParams(baseParams);
      router.push(`/create/request?${q.toString()}`);
    } catch (err) {
      console.error("handleSelectReferBack error:", err);
    } finally {
      setShowLoadingOverlay(false);
    }
  };

  const rbTotalPages = Math.max(1, Math.ceil(referBackTotal / referBackLimit));
  const rbPageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (rbTotalPages <= 7) {
      for (let i = 1; i <= rbTotalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (referBackPage > 3) pages.push("...");
      const start = Math.max(2, referBackPage - 1);
      const end = Math.min(rbTotalPages - 1, referBackPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (referBackPage < rbTotalPages - 2) pages.push("...");
      pages.push(rbTotalPages);
    }
    return pages;
  }, [referBackPage, rbTotalPages]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const info = localStorage.getItem("patient_info");
      if (info) try { setPatientInfo(JSON.parse(info)); } catch { /* */ }
    }
  }, []);

  // Load draft data if editing — map referInfo back into formData
  useEffect(() => {
    if (draftId) {
      findOneReferral(draftId).then((res: any) => {
        const doc = res?.referralDocument || res;
        if (!doc || !doc.data) {
          console.warn("[Request Draft] No valid document found in response");
          return;
        }
        setReferInfo(doc);

        // NOTE: Do NOT set optionHospital here — it would show the hospital
        // in the Navbar dropdown, which Nuxt does not do. The form's fetch
        // useEffect reads hospitalID from searchParams instead.
        // Instead, store the ORIGIN hospital in a local ref for the save function.
        // NOTE: Nuxt swaps hospitals on save, so in DB:
        //   fromHospital = destination (ปลายทาง), toHospital = origin (ต้นทาง)
        // We need the origin for fromHospitalId in the save function.
        const draftOriginId = doc.toHospital?.id || doc.toHospital;
        if (draftOriginId) {
          draftFromHospitalRef.current = typeof draftOriginId === "number" ? draftOriginId : Number(draftOriginId);
        }

        // Map nested API structure back to flat formData fields
        const patient = doc.data?.patient || {};
        const visitData = doc.data?.visitData || {};

        // Calculate age from birthday
        let calculatedAge = "";
        const bday = patient.patient_birthday || "";
        if (bday) {
          const [by, bm, bd] = bday.split("-").map(Number);
          if (by && bm && bd) {
            const now = new Date();
            let age = now.getFullYear() - by;
            if (now.getMonth() + 1 < bm || (now.getMonth() + 1 === bm && now.getDate() < bd)) {
              age--;
            }
            if (age >= 0) calculatedAge = `${age} ปี`;
          }
        }

        const draftFormData: Record<string, any> = {
          // Pass draft doctor/cause data for form to inject into store after fetch
          _draftDoctor: doc.doctor?.id ? {
            id: doc.doctor.id,
            name: doc.doctor.fullName || doc.doctorName || "",
            email: doc.doctor.email || "",
            phone: doc.doctor.phone || "",
            licenseNumber: doc.doctor.identifyNumber || doc.doctorIdentifyNumber || "",
            department: doc.doctor.department || doc.doctorDepartment || "",
          } : null,
          _draftCause: doc.referralCause?.id ? {
            id: doc.referralCause.id,
            name: doc.referralCause.name || "",
          } : null,
          // Patient info
          patient_pid: patient.patient_pid || "",
          patient_prefix: patient.patient_prefix || "",
          patient_firstname: patient.patient_firstname || "",
          patient_lastname: patient.patient_lastname || "",
          patient_birthday: patient.patient_birthday || "",
          patient_age: calculatedAge,
          patient_sex: patient.patient_sex || "",
          patient_blood_group: patient.patient_blood_group || "",
          patient_treatment: patient.patient_treatment || "",
          patient_treatment_hospital: patient.patient_treatment_hospital || "",
          patient_phone: patient.patient_mobile_phone || patient.patient_phone || "",
          patient_hn: doc.HN || "",
          patient_vn: doc.VN || "",
          patient_an: doc.AN || "",
          // Patient address
          patient_house: patient.patient_house || "",
          patient_moo: patient.patient_moo || "",
          patient_road: patient.patient_road || "",
          patient_alley: patient.patient_alley || "",
          patient_tambon: patient.patient_tambon || "",
          patient_amphur: patient.patient_amphur || "",
          patient_changwat: patient.patient_changwat || "",
          patient_zipcode: patient.patient_zip_code || patient.patient_zipcode || "",
          patient_zip_code: patient.patient_zip_code || patient.patient_zipcode || "",
          // Emergency contact — check nested data.patient first, then top-level fields as fallback
          patient_contact_full_name: patient.patient_contact_full_name || doc.emergencyContactFullName || "",
          patient_contact_mobile_phone: patient.patient_contact_mobile_phone || doc.emergencyContactTel || "",
          patient_contact_relation: patient.patient_contact_relation || doc.emergencyContactRelated || "",
          emergency_contacts: (patient.patient_contact_full_name || doc.emergencyContactFullName)
            ? [{
                name: patient.patient_contact_full_name || doc.emergencyContactFullName || "",
                phone: patient.patient_contact_mobile_phone || doc.emergencyContactTel || "",
                relation: patient.patient_contact_relation || doc.emergencyContactRelated || "",
              }]
            : [],
          // Doctor info
          prescribingDoctor: String(doc.doctor?.id || doc.doctor || ""),
          doctorCode: doc.doctorIdentifyNumber || "",
          medicalDepartment: doc.doctorDepartment || "",
          doctorContactNumber: doc.doctorPhone || "",
          docterName: doc.doctorName || "",
          // Referral info — convert to String for MUI Select matching
          referralCreationPoint: String(doc.deliveryPointTypeStart?.id || doc.deliveryPointTypeStart || ""),
          referral_cause: String(doc.referralCause?.id || doc.referralCause || ""),
          acute_level: doc.acuteLevel ? String(doc.acuteLevel?.id ?? doc.acuteLevel) : "",
          is_infectious: doc.contagious ? "true" : "false",
          additionalComments: doc.moreDetail || "",
          notes: doc.remark || "",
          // Visit data
          temperature: visitData.temperature || "",
          bps: visitData.bps || "",
          bpd: visitData.bpd || "",
          pulse: visitData.pulse || "",
          rr: visitData.rr || "",
          visit_primary_symptom_main_symptom: visitData.visit_primary_symptom_main_symptom || "",
          visit_primary_symptom_current_illness: visitData.visit_primary_symptom_current_illness || "",
          pe: visitData.pe || "",
          Imp: visitData.Imp || "",
          moreDetail: visitData.moreDetail || "",
          // ICD-10
          icd10Basic: visitData.icd10Basic || "",
          icd10: visitData.icd10 || [],
          icd10MoreBasic: visitData.icd10MoreBasic || "",
          icd10More: visitData.icd10More || [],
          // Drugs, allergies, etc.
          drugs: doc.data?.drugs || [],
          medicines: doc.data?.drugs || [],
          drugAllergy: doc.data?.drugAllergy || [],
          vaccines: doc.data?.vaccines || [],
          physicalExam: doc.data?.physicalExam || "",
          disease: doc.data?.disease || "",
          diseases: Array.isArray(doc.data?.disease)
            ? doc.data.disease
            : doc.data?.disease
              ? [{ id: 1, name: String(doc.data.disease) }]
              : [],
          // Files — map API referralFiles to DocumentItem format used by form UI
          referralFiles: doc.referralFiles || [],
          documents: (doc.referralFiles || [])
            .filter((rf: any) => !rf.isDelete)
            .map((rf: any, idx: number) => ({
              id: rf.id || idx,
              fileName: rf.name || "",
              fileType: rf.name || "",
              docCode: rf.code || "",
              docName: rf.name || "",
              detail: rf.detail || "",
              dateTime: rf.createdAt || "",
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
            })),
        };
        updateFormData(draftFormData);
        // Signal form to pick up changes
        setDraftLoaded((c) => c + 1);
      }).catch((err) => {
        console.error("[Request Draft] Error loading draft:", err);
      });
    }
  }, [draftId, findOneReferral, setReferInfo, updateFormData]);

  const reloadHospitals = useCallback(
    (p?: number, s?: string, z?: string, t?: string, l?: number) => {
      fetchHospitals({
        offset: p ?? page,
        limit: l ?? limit,
        search: s ?? search,
        zone: (z ?? zone) || null,
        subType: (t ?? subType) || null,
      });
    },
    [page, search, zone, subType, limit, fetchHospitals]
  );

  // Debounced search
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchHospitals({ offset: 1, limit, search: val, zone: zone || null, subType: subType || null });
    }, 500);
  };

  const handleZoneChange = (val: string) => {
    setZone(val);
    setPage(1);
    reloadHospitals(1, search, val, subType);
  };

  const handleTypeChange = (val: string) => {
    setSubType(val);
    setPage(1);
    reloadHospitals(1, search, zone, val);
  };

  const handleClearFilters = () => {
    setSearch("");
    setZone("");
    setSubType("");
    setPage(1);
    fetchHospitals({ offset: 1, limit, search: "", zone: null, subType: null });
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    reloadHospitals(1, search, zone, subType, newLimit);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    reloadHospitals(newPage, search, zone, subType, limit);
  };

  const buildQuery = useCallback((params: Record<string, string>) => {
    const q = new URLSearchParams({ kind, ...params });
    if (draftId) q.set("draft", draftId);
    return q.toString();
  }, [kind, draftId]);

  const navigateBack = () => {
    if (isFormStep) {
      router.push(`/create/request?${buildQuery({
        hospital: hospitalParam!,
        hospitalID: hospitalIDParam || "",
        deliveryPoint: "true",
        docter_branch: "true",
      })}`);
    } else if (doctorBranchParam) {
      router.push(`/create/request?${buildQuery({
        hospital: hospitalParam!,
        hospitalID: hospitalIDParam || "",
        deliveryPoint: "true",
      })}`);
    } else if (deliveryPointParam || hospitalParam) {
      router.push(`/create/request?kind=${kind}`);
    } else {
      router.push("/create");
    }
  };

  const handleSelectHospital = (hospital: HospitalOption) => {
    router.push(`/create/request?${buildQuery({
      hospital: hospital.name,
      hospitalID: String(hospital.id),
    })}`);
  };

  const handleDeliveryPointNext = (id: number, name: string, phone?: string) => {
    router.push(`/create/request?${buildQuery({
      hospital: hospitalParam!,
      hospitalID: hospitalIDParam || "",
      deliveryPoint: "true",
      docter_branch: "true",
      referPoint: String(id),
      referPointName: name,
      referPointPhone: phone || "",
    })}`);
  };

  const handleDoctorBranchNext = (branches: DoctorBranchOption[]) => {
    const branchNames = branches.map((b) => b.name).join(",");
    // Collect appointment data for each branch
    const branchData = branches.map((b) => ({
      name: b.name,
      appointmentDate: b.appointmentDate || "",
      appointmentTime: b.appointmentTime || "",
      appointment: b.appointment ?? 1,
      remark: b.remark || "",
    }));
    router.push(`/create/request?${buildQuery({
      hospital: hospitalParam!,
      hospitalID: hospitalIDParam || "",
      deliveryPoint: "true",
      docter_branch: "true",
      branch_names: branchNames,
      referPoint: referPointParam || "",
      referPointName: referPointNameParam || "",
      referPointPhone: referPointPhoneParam || "",
      branchData: JSON.stringify(branchData),
    })}`);
  };

  const validateRequiredFields = useCallback(() => {
    const errors: Record<string, string> = {};
    const requiredFields: { key: string; label: string }[] = [
      { key: "prescribingDoctor", label: "กรุณาเลือกแพทย์ผู้ที่สั่ง" },
      { key: "doctorCode", label: "กรุณากรอกรหัสแพทย์" },
      { key: "referral_cause", label: "กรุณาเลือกสาเหตุการส่งตัว" },
      { key: "acute_level", label: "กรุณาเลือกระดับความเฉียบพลัน" },
      { key: "patient_pid", label: "กรุณากรอกเลขที่บัตรประชาชน" },
      { key: "patient_prefix", label: "กรุณาเลือกคำนำหน้า" },
      { key: "patient_firstname", label: "กรุณากรอกชื่อ" },
      { key: "patient_lastname", label: "กรุณากรอกนามสกุล" },
      { key: "patient_sex", label: "กรุณาเลือกเพศ" },
      { key: "patient_age", label: "กรุณากรอกอายุ" },
      { key: "patient_hn", label: "กรุณากรอก HN" },
      { key: "patient_treatment", label: "กรุณาเลือกสิทธิ์การรักษา" },
      { key: "visit_primary_symptom_main_symptom", label: "กรุณากรอกอาการนำ" },
    ];
    for (const { key, label } of requiredFields) {
      const val = formData[key];
      if (!val || (typeof val === "string" && val.trim() === "")) {
        errors[key] = label;
      }
    }
    return errors;
  }, [formData]);

  const handleSave = useCallback(
    async (saveType: "draft" | "submit") => {
      if (isLoading || sendData) return;

      // Validate required fields only on submit (not draft)
      if (saveType === "submit") {
        const errors = validateRequiredFields();
        setFormErrors(errors);
        if (Object.keys(errors).length > 0) {
          const firstErrorKey = Object.keys(errors)[0];
          const el = document.querySelector(`[data-field="${firstErrorKey}"]`) || document.querySelector(`#${firstErrorKey}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
      }

      setIsLoading(true);
      setSendData(true);
      setShowLoadingOverlay(true);

      try {
        // ── Get hospital IDs like Nuxt's getDataFromHospital ──
        const authState = useAuthStore.getState();
        const roleName = authState.getRoleName();
        let fromHospitalId: number | undefined; // user's own hospital (ต้นทาง)
        if (roleName === "superAdminHospital") {
          fromHospitalId = (authState.profile as any)?.permissionGroup?.hospital?.id ?? undefined;
        } else if (roleName === "superAdmin" || roleName === "superAdminZone") {
          // Use global optionHospital first, then draft's stored fromHospital as fallback
          fromHospitalId = authState.optionHospital ?? draftFromHospitalRef.current ?? undefined;
        }

        const toHospitalId = hospitalIDParam ? parseInt(hospitalIDParam, 10) : undefined;

        if (!fromHospitalId) {
          alert("กรุณาเลือกสถานพยาบาลต้นทางก่อนบันทึก");
          setIsLoading(false);
          setSendData(false);
          return;
        }
        if (!toHospitalId) {
          alert("ไม่พบข้อมูลสถานพยาบาลปลายทาง กรุณาลองใหม่อีกครั้ง");
          setIsLoading(false);
          setSendData(false);
          return;
        }

        // ── referralStatus: 1 = draft, 3 = submit ──
        const referralStatusMap: Record<string, number> = { draft: 1, submit: 3 };
        const referralStatus = referralStatusMap[saveType] ?? 3;

        // ── referralType (like Nuxt createReferralTypeField) ──
        const referralTypeMap: Record<string, number> = {
          referOut: 1, referBack: 2, requestReferOut: 5, requestReferBack: 6,
        };
        const isDraft = referInfo?.referralStatus?.name === "ฉบับร่าง";
        const referralTypeValue = isDraft ? undefined : (referralTypeMap[kind] ?? 0);

        // ── appointmentData from branchData query param ──
        let appointmentData: any[] = [];
        try {
          const branchDataParam = searchParams.get("branchData");
          if (branchDataParam) {
            const branches = JSON.parse(branchDataParam);
            appointmentData = branches.map((b: any) => ({
              appointmentType: b.appointment ?? 1,
              doctorBranchName: b.name || "",
              appointmentDate: b.appointmentDate || "",
              remark: b.remark || "",
            }));
          }
        } catch { /* ignore parse error */ }

        // ── deliveryPointTypeEnd from referPoint query param ──
        const deliveryPointTypeEnd = referPointParam ? parseInt(referPointParam, 10) : undefined;

        // ── Build payload matching Nuxt's saveData structure ──
        const payload: any = {
          // Hospital fields – Nuxt swaps: fromHospital = toHospitalId, toHospital = fromHospitalId
          fromHospital: toHospitalId,
          toHospital: fromHospitalId,
          referralKind: 3, // OPD
          referralStatus,
          ...(referralTypeValue !== undefined ? { referralType: referralTypeValue } : {}),

          // Delivery points — must be numbers
          deliveryPointTypeEnd: deliveryPointTypeEnd || undefined,
          deliveryPointTypeStart: formData.referralCreationPoint ? Number(formData.referralCreationPoint) : undefined,

          // Appointment
          appointmentData,

          // Doctor info — convert to number where Nuxt sends numbers
          doctor: formData.prescribingDoctor ? Number(formData.prescribingDoctor) : undefined,
          doctorName: formData.docterName || undefined,
          doctorIdentifyNumber: formData.doctorCode || undefined,
          doctorDepartment: formData.medicalDepartment || undefined,
          doctorPhone: formData.doctorContactNumber ? String(formData.doctorContactNumber) : undefined,

          // Referral details
          referralCause: formData.referral_cause || formData.referralCause || undefined,
          acuteLevel: formData.acute_level || formData.levelOfUrgency || undefined,
          contagious: formData.is_infectious === "true" || formData.is_infectious === true,
          moreDetail: formData.infectious_detail || formData.additionalComments || undefined,
          remark: formData.notes || undefined,
          reasonForSending: formData.notes || undefined,
          // referralStatusDetail is integer in DB — only send if value is numeric (from a select with IDs)
          ...(formData.referral_reason && /^\d+$/.test(String(formData.referral_reason))
            ? { referralStatusDetail: formData.referral_reason }
            : {}),
          equipment: (formData.requiredEquipment || []).map((item: any) => typeof item === "string" ? item : item?.name || "").filter(Boolean),
          isChangeDoctorBranch: false,

          // Patient identifiers
          HN: formData.patient_hn || undefined,
          VN: formData.patient_vn || undefined,
          AN: formData.patient_an || undefined,

          // Nested patient + visit data (matching Nuxt structure)
          data: {
            patient: {
              patient_pid: formData.patient_pid || "",
              patient_prefix: formData.patient_prefix || "",
              patient_firstname: formData.patient_firstname || "",
              patient_lastname: formData.patient_lastname || "",
              patient_birthday: formData.patient_birthday || "",
              patient_sex: formData.patient_sex || "",
              patient_blood_group: formData.patient_blood_group || "",
              patient_treatment: formData.patient_treatment || "",
              patient_treatment_hospital: formData.patient_treatment_hospital || "",
              patient_house: formData.patient_house || "",
              patient_moo: formData.patient_moo || "",
              patient_tambon: formData.patient_tambon || "",
              patient_amphur: formData.patient_amphur || "",
              patient_alley: formData.patient_alley || "",
              patient_road: formData.patient_road || "",
              patient_changwat: formData.patient_changwat || "",
              patient_zip_code: formData.patient_zipcode || "",
              patient_mobile_phone: formData.patient_phone || "",
              patient_contact_full_name: formData.patient_contact_full_name || formData.emergency_contacts?.[0]?.name || "",
              patient_contact_mobile_phone: formData.patient_contact_mobile_phone || formData.emergency_contacts?.[0]?.phone || "",
              patient_contact_relation: formData.patient_contact_relation || formData.emergency_contacts?.[0]?.relation || "",
              patient_personal_disease: "",
            },
            physicalExam: formData.physicalExam || undefined,
            disease: formData.diseases || undefined,
            drugAllergy: formData.drugAllergy || [],
            diagnosis: (formData.icd10 || []).map((item: any) => ({
              icd10_code: item.code || item.icd10_code || "",
              icd10_desc: item.name || item.icd10_desc || "",
            })),
            vaccines: formData.vaccines || [],
            vaccinesCovid: [],
            pre_diagnosis: null,
            visitData: {
              temperature: formData.temperature || "",
              bps: formData.bps || "",
              bpd: formData.bpd || "",
              pulse: formData.pulse || "",
              rr: formData.rr || "",
              visit_primary_symptom_main_symptom: formData.visit_primary_symptom_main_symptom || "",
              visit_primary_symptom_current_illness: formData.visit_primary_symptom_current_illness || "",
              pe: formData.pe || "",
              Imp: formData.Imp || "",
              moreDetail: formData.moreDetail || "",
              icd10Basic: formData.icd10Basic || "",
              icd10: formData.icd10 || "",
              icd10MoreBasic: formData.icd10MoreBasic || "",
              icd10More: formData.icd10More || "",
            },
            drugs: formData.medicines || [],
          },
          referralFiles: (formData.documents || []).map((doc: any) => ({
            // Only preserve real DB IDs (small numbers); timestamps from form are not valid DB IDs
            id: doc.id && typeof doc.id === "number" && doc.id > 0 && doc.id < 1000000 ? doc.id : null,
            isDelete: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: "currentUser",
            code: doc.docCode || undefined,
            name: doc.fileType || undefined,
            detail: doc.detail || undefined,
            url: (doc.files || []).map((f: any) => ({
              url: f.url || "",
              name: f.name || f.fileName || "",
              size: f.size || "",
            })),
            textContent: "",
            clinicName: null,
          })),
        };

        // DEBUG: log payload to compare with Nuxt
        console.log("[SavePayload] draftId:", draftId, "referInfo.id:", referInfo?.id);
        console.log("[SavePayload]", JSON.stringify(payload, null, 2));

        // Run API call + minimum overlay time in parallel
        const overlayMinTime = new Promise((r) => setTimeout(r, 1500));

        if (draftId && referInfo?.id) {
          await Promise.all([updateReferralDocument(referInfo.id, payload), overlayMinTime]);
        } else {
          await Promise.all([createReferralDocument(payload), overlayMinTime]);
        }

        // Hide overlay, show success toast
        setShowLoadingOverlay(false);
        setToastSeverity("success");
        setToastMessage(
          saveType === "draft"
            ? "บันทึกฉบับร่างเรียบร้อย"
            : "บันทึกและส่งตัวเรียบร้อย"
        );
        setToastOpen(true);

        // Navigate after 1.5 second delay so user can see the toast
        setTimeout(() => {
          if (kind === "requestReferOut" || kind === "requestReferBack") {
            router.push("/request-refer-out/all");
          } else {
            router.push("/follow-delivery");
          }
        }, 1500);
      } catch (err: any) {
        console.error("Save error:", err);
        setShowLoadingOverlay(false);
        setToastSeverity("error");
        setToastMessage(err?.response?.data?.message || err?.message || "ไม่สามารถบันทึกข้อมูลได้");
        setToastOpen(true);
      } finally {
        setIsLoading(false);
        setSendData(false);
      }
    },
    [isLoading, sendData, formData, kind, hospitalParam, hospitalIDParam, branchNamesParam, draftId, referInfo, referPointParam, searchParams, createReferralDocument, updateReferralDocument, router, validateRequiredFields]
  );

  const totalPages = Math.max(1, Math.ceil(hospitalTotalCount / limit));

  // Breadcrumbs matching Nuxt original — always show all 5 steps with
  // visited / current / future statuses (like base-breadcrumbs.vue)
  const breadcrumbItems = useMemo(() => {
    // Determine current step index (0..4)
    let currentIdx = 1; // default: "เลือกสถานพยาบาลต้นทาง"
    if (hospitalParam && !deliveryPointParam) currentIdx = 2;
    else if (deliveryPointParam && doctorBranchParam && !branchNamesParam) currentIdx = 3;
    else if (branchNamesParam) currentIdx = 4;

    // Paths for visited steps (clickable)
    const step0Path = "/create";
    const step1Path = `/create/request?kind=${kind}`;
    const step2Path =
      hospitalParam
        ? `/create/request?${buildQuery({ hospital: hospitalParam, hospitalID: hospitalIDParam || "" })}`
        : undefined;
    const step3Path =
      hospitalParam && deliveryPointParam
        ? `/create/request?${buildQuery({
            hospital: hospitalParam,
            hospitalID: hospitalIDParam || "",
            deliveryPoint: "true",
            docter_branch: "true",
          })}`
        : undefined;

    const base: {
      name: string;
      path?: string;
      status: "visited" | "current" | "future";
    }[] = [
      { name: "สร้างการร้องขอส่งตัว", path: step0Path, status: "visited" },
      { name: "เลือกสถานพยาบาลต้นทาง", path: step1Path, status: "visited" },
      { name: "เลือกปลายทางจุดรับใบส่งตัว", path: step2Path, status: "future" },
      { name: "กำหนดสาขา/แผนกและวันเวลานัดหมาย", path: step3Path, status: "future" },
      { name: "เพิ่มรายละเอียดใบส่งตัว", status: "future" },
    ];

    return base.map((item, idx) => {
      if (idx === currentIdx) return { ...item, status: "current" as const };
      if (idx < currentIdx) return { ...item, status: "visited" as const };
      // idx > currentIdx → future (no path, not clickable)
      return { ...item, path: undefined, status: "future" as const };
    });
  }, [kind, hospitalParam, hospitalIDParam, deliveryPointParam, doctorBranchParam, branchNamesParam, buildQuery]);

  const ActionButtons = () => (
    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
      {isFormStep && (
        <>
          <Button variant="outlined" startIcon={isLoading ? <CircularProgress size={18} /> : <SaveIcon />} onClick={() => handleSave("draft")} disabled={isLoading || sendData} sx={{ textTransform: "none" }}>
            {isLoading ? "กำลังบันทึก..." : "บันทึกฉบับร่าง"}
          </Button>
          <Button variant="contained" startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <SendIcon />} onClick={() => handleSave("submit")} disabled={isLoading || sendData}
            sx={{ bgcolor: "#00AF75", "&:hover": { bgcolor: "#036245" }, textTransform: "none" }}>
            {isLoading ? "กำลังบันทึก..." : "บันทึกและส่งคำขอ"}
          </Button>
        </>
      )}
    </Stack>
  );

  // Pagination helpers
  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <Box sx={{ width: "100%" }}>
      {/* ── Full-screen Loading Overlay (shared component) ── */}
      <LoadingOverlay open={showLoadingOverlay} />

      {/* ── Success / Error Toast (matching Nuxt's toast) ── */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToastOpen(false)}
          severity={toastSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>

      {/* Header */}
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button onClick={navigateBack} sx={{ minWidth: 44, width: 44, height: 44, border: "2px solid #bbb", borderRadius: "4px", color: "#000" }}>
            <ArrowBackIcon />
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#00AF75", fontSize: "1.125rem" }}>{title}</Typography>
          {patientInfo?.firstname && (
            <Typography variant="body1">กำลังส่งตัว : {patientInfo.firstname} {patientInfo.lastname}</Typography>
          )}
        </Box>
        <ActionButtons />
      </Box>

      <BreadcrumbsRefer basePath="/create/request" kind={kind} items={breadcrumbItems} />

      {/* Step 1: Hospital selection with filter + table + pagination */}
      {!hospitalParam && !isRequestReferBack && (
        <Box sx={{ mt: 3 }}>
          {/* Filters row - matching Nuxt layout: ค้นหา | โซนสถานพยาบาล | ประเภทสถานพยาบาล | ล้างตัวกรอง */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr auto" },
              gap: 2,
              mb: 3,
            }}
          >
            {/* ค้นหา */}
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                ค้นหา
              </Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="ค้นหาชื่อสถานพยาบาล"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: "#9ca3af" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* โซนสถานพยาบาล */}
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                โซนสถานพยาบาล
              </Typography>
              <FormControl size="small" fullWidth>
                <Select
                  value={zone}
                  displayEmpty
                  onChange={(e) => handleZoneChange(e.target.value)}
                  renderValue={(v) => {
                    if (!v) return <span style={{ color: "#9ca3af" }}>เลือกโซนสถานพยาบาล</span>;
                    return hospitalZones.find((z) => z.value === v)?.name || v;
                  }}
                >
                  <MenuItem value="">ทั้งหมด</MenuItem>
                  {hospitalZones.map((z) => (
                    <MenuItem key={z.value} value={z.value}>{z.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* ประเภทสถานพยาบาล */}
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                ประเภทสถานพยาบาล
              </Typography>
              <FormControl size="small" fullWidth>
                <Select
                  value={subType}
                  displayEmpty
                  onChange={(e) => handleTypeChange(e.target.value)}
                  renderValue={(v) => {
                    if (!v) return <span style={{ color: "#9ca3af" }}>เลือกประเภทสถานพยาบาล</span>;
                    return hospitalTypes.find((t) => String(t.id) === v)?.name || v;
                  }}
                >
                  <MenuItem value="">ทั้งหมด</MenuItem>
                  {hospitalTypes.map((t) => (
                    <MenuItem key={t.id} value={String(t.id)}>{t.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* ล้างตัวกรอง */}
            <Box sx={{ display: "flex", alignItems: "flex-end" }}>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                sx={{
                  height: 40,
                  textTransform: "none",
                  borderColor: "#d1d5db",
                  color: "#374151",
                  whiteSpace: "nowrap",
                  px: 3,
                }}
              >
                ล้างตัวกรอง
              </Button>
            </Box>
          </Box>

          {/* Table - matching Nuxt: green header, columns: No, รูปภาพ, ชื่อสถานพยาบาล, โซน, ประเภท, เบอร์โทรศัพท์, เลือก */}
          <TableContainer component={Paper} sx={{ boxShadow: "none", border: "1px solid #e5e7eb" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#036245" }}>
                  <TableCell sx={{ fontWeight: 600, color: "#fff", textAlign: "center", width: 60 }}>No</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#fff", textAlign: "center", width: 100 }}>รูปภาพ</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#fff", textAlign: "center" }}>ชื่อสถานพยาบาล</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#fff", textAlign: "center" }}>โซน</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#fff", textAlign: "center" }}>ประเภท</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#fff", textAlign: "center" }}>เบอร์โทรศัพท์</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#fff", textAlign: "center", width: 100 }}>เลือก</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hospitals.map((h, i) => (
                  <TableRow
                    key={h.id}
                    hover
                    sx={{
                      cursor: "pointer",
                      borderBottom: "1px solid #e5e7eb",
                      "&:hover": { bgcolor: "#f0fdf4" },
                    }}
                  >
                    <TableCell align="center">{(page - 1) * limit + i + 1}</TableCell>
                    <TableCell align="center">
                      {h.image ? (
                        <Box
                          component="img"
                          src={h.image}
                          alt=""
                          sx={{ width: 35, height: 35, mx: "auto" }}
                        />
                      ) : (
                        <Typography variant="body2" sx={{ color: "#9ca3af" }}>ไม่มีรูปภาพ</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{h.name || "ไม่มีชื่อ"}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{h.zone?.name || "ไม่มีโซน"}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{h.subType?.name || "ไม่มีประเภท"}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{h.phone || "ไม่มีเบอร์โทรศัพท์"}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleSelectHospital(h)}
                        sx={{
                          bgcolor: "#00AF75",
                          "&:hover": { bgcolor: "#036245" },
                          textTransform: "none",
                          minWidth: 60,
                          borderRadius: "6px",
                        }}
                      >
                        เลือก
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {hospitals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        ไม่พบข้อมูลสถานพยาบาล
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination - matching Nuxt: แถวต่อหน้า [select] ทั้งหมด X รายการ  [page numbers] */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              mt: 2,
              gap: 2,
            }}
          >
            {/* Left: rows per page & total */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                แถวต่อหน้า
              </Typography>
              <FormControl size="small" sx={{ minWidth: 70 }}>
                <Select
                  value={limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  sx={{ fontSize: "0.875rem", height: 32 }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                ทั้งหมด {hospitalTotalCount} รายการ
              </Typography>
            </Box>

            {/* Right: page navigation */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Button
                size="small"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                sx={{ minWidth: 32, p: 0.5, color: "#6b7280" }}
              >
                <PrevIcon fontSize="small" />
              </Button>
              {pageNumbers.map((p, idx) =>
                p === "..." ? (
                  <Typography key={`dots-${idx}`} variant="body2" sx={{ px: 0.5, color: "#6b7280" }}>
                    ...
                  </Typography>
                ) : (
                  <Button
                    key={p}
                    size="small"
                    onClick={() => handlePageChange(p as number)}
                    sx={{
                      minWidth: 32,
                      height: 32,
                      p: 0,
                      borderRadius: "6px",
                      fontWeight: page === p ? 700 : 400,
                      bgcolor: page === p ? "#00AF75" : "transparent",
                      color: page === p ? "#fff" : "#374151",
                      "&:hover": {
                        bgcolor: page === p ? "#036245" : "#f3f4f6",
                      },
                    }}
                  >
                    {p}
                  </Button>
                )
              )}
              <Button
                size="small"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                sx={{ minWidth: 32, p: 0.5, color: "#6b7280" }}
              >
                <NextIcon fontSize="small" />
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Step 1 (requestReferBack): Pick an existing referral document to refer back */}
      {!hospitalParam && isRequestReferBack && (
        <Box sx={{ mt: 3 }}>
          {/* Filters row: ค้นหาชื่อผู้ป่วย | ค้นหาหมายเลขใบส่งตัว | ค้นหาสถานพยาบาลปลายทาง | ล้างตัวกรอง */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr auto" },
              gap: 2,
              mb: 3,
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                ค้นหาชื่อผู้ป่วย
              </Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="ค้นหาชื่อผู้ป่วย"
                value={rbSearch}
                onChange={(e) => handleRbSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: "#9ca3af" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                ค้นหาหมายเลขใบส่งตัว
              </Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="ค้นหาหมายเลขใบส่งตัว"
                value={rbRunNumberSearch}
                onChange={(e) => handleRbRunNumberSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: "#9ca3af" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
                ค้นหาสถานพยาบาลปลายทาง
              </Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="ค้นหาสถานพยาบาลปลายทาง"
                value={rbHospitalSearch}
                onChange={(e) => handleRbHospitalSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: "#9ca3af" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box sx={{ display: "flex", alignItems: "flex-end" }}>
              <Button
                variant="outlined"
                onClick={handleRbClearFilters}
                sx={{
                  height: 40,
                  textTransform: "none",
                  borderColor: "#d1d5db",
                  color: "#374151",
                  whiteSpace: "nowrap",
                  px: 3,
                }}
              >
                ล้างตัวกรอง
              </Button>
            </Box>
          </Box>

          {/* Table: No | วันที่/เวลาที่ส่งตัว | ชื่อผู้ป่วย | สถานพยาบาลปลายทาง | ระยะเวลารับรองสิทธิ์ | สถานะใบส่งตัว | เวลาดำเนินการ | เลือก */}
          <TableContainer component={Paper} sx={{ boxShadow: "none", border: "1px solid #e5e7eb" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#036245" }}>
                  <TableCell sx={{ fontWeight: 600, color: "#fff", textAlign: "center", width: 60 }}>No</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#fff", textAlign: "center" }}>วันที่/เวลาที่ส่งตัว</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#fff", textAlign: "center" }}>ชื่อผู้ป่วย</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#fff", textAlign: "center" }}>สถานพยาบาลปลายทาง</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#fff", textAlign: "center" }}>ระยะเวลารับรองสิทธิ์</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#fff", textAlign: "center" }}>สถานะใบส่งตัว</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#fff", textAlign: "center" }}>เวลาดำเนินการ</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#fff", textAlign: "center", width: 100 }}>เลือก</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {referBackList.map((item: any, i: number) => {
                  const fname = item?.data?.patient?.patient_firstname || "";
                  const lname = item?.data?.patient?.patient_lastname || "";
                  const fullName = `${fname} ${lname}`.trim() || "-";
                  const createdAt = item?.createdAt ? new Date(item.createdAt) : null;
                  const dateStr = createdAt
                    ? `${String(createdAt.getDate()).padStart(2, "0")}/${String(
                        createdAt.getMonth() + 1
                      ).padStart(2, "0")}/${createdAt.getFullYear() + 543} ${String(
                        createdAt.getHours()
                      ).padStart(2, "0")}:${String(createdAt.getMinutes()).padStart(2, "0")}`
                    : "-";
                  const elapsed = (() => {
                    if (!item?.createdAt || !item?.updatedAt) return "-";
                    const a = new Date(item.createdAt).getTime();
                    const b = new Date(item.updatedAt).getTime();
                    const diff = Math.max(0, b - a);
                    const mins = Math.floor(diff / 60000);
                    if (mins < 60) return `${mins} นาที`;
                    const hrs = Math.floor(mins / 60);
                    const rm = mins % 60;
                    return `${hrs} ชม. ${rm} นาที`;
                  })();
                  return (
                    <TableRow
                      key={item.id ?? i}
                      hover
                      sx={{
                        borderBottom: "1px solid #e5e7eb",
                        "&:hover": { bgcolor: "#f0fdf4" },
                      }}
                    >
                      <TableCell align="center">
                        {(referBackPage - 1) * referBackLimit + i + 1}
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{item?.runNumber || "-"}</Typography>
                        <Typography variant="caption" sx={{ color: "#6b7280" }}>
                          {dateStr}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{fullName}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{item?.toHospital?.name || "-"}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{item?.subType?.name || "-"}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{item?.referralStatus?.name || "-"}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{elapsed}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleSelectReferBack(item)}
                          sx={{
                            bgcolor: "#00AF75",
                            "&:hover": { bgcolor: "#036245" },
                            textTransform: "none",
                            minWidth: 60,
                            borderRadius: "6px",
                          }}
                        >
                          เลือก
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {referBackList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        ไม่พบข้อมูลใบส่งตัว
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              mt: 2,
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                แถวต่อหน้า
              </Typography>
              <FormControl size="small" sx={{ minWidth: 70 }}>
                <Select
                  value={referBackLimit}
                  onChange={(e) => handleRbLimitChange(Number(e.target.value))}
                  sx={{ fontSize: "0.875rem", height: 32 }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                ทั้งหมด {referBackTotal} รายการ
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Button
                size="small"
                disabled={referBackPage <= 1}
                onClick={() => handleRbPageChange(referBackPage - 1)}
                sx={{ minWidth: 32, p: 0.5, color: "#6b7280" }}
              >
                <PrevIcon fontSize="small" />
              </Button>
              {rbPageNumbers.map((p, idx) =>
                p === "..." ? (
                  <Typography key={`rb-dots-${idx}`} variant="body2" sx={{ px: 0.5, color: "#6b7280" }}>
                    ...
                  </Typography>
                ) : (
                  <Button
                    key={`rb-${p}`}
                    size="small"
                    onClick={() => handleRbPageChange(p as number)}
                    sx={{
                      minWidth: 32,
                      height: 32,
                      p: 0,
                      borderRadius: "6px",
                      fontWeight: referBackPage === p ? 700 : 400,
                      bgcolor: referBackPage === p ? "#00AF75" : "transparent",
                      color: referBackPage === p ? "#fff" : "#374151",
                      "&:hover": {
                        bgcolor: referBackPage === p ? "#036245" : "#f3f4f6",
                      },
                    }}
                  >
                    {p}
                  </Button>
                )
              )}
              <Button
                size="small"
                disabled={referBackPage >= rbTotalPages}
                onClick={() => handleRbPageChange(referBackPage + 1)}
                sx={{ minWidth: 32, p: 0.5, color: "#6b7280" }}
              >
                <NextIcon fontSize="small" />
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Step 2: Delivery Point */}
      {hospitalParam && !deliveryPointParam && (
        <DeliveryPointSelector hospitalId={hospitalIDParam || ""} kind={kind} onNext={handleDeliveryPointNext} onBack={() => router.push(`/create/request?kind=${kind}`)} />
      )}

      {/* Step 3: Doctor Branch */}
      {hospitalParam && deliveryPointParam && doctorBranchParam && !branchNamesParam && (
        <DoctorBranchSelector hospitalId={hospitalIDParam || ""} hospitalName={hospitalParam} kind={kind} onNext={handleDoctorBranchNext}
          onBack={() => router.push(`/create/request?${buildQuery({ hospital: hospitalParam, hospitalID: hospitalIDParam || "" })}`)} />
      )}

      {/* Step 4: Request Form */}
      {isFormStep && (
        <Box sx={{ mt: 3 }}>
          <RequestReferralFormComponent
            kind={kind}
            hospitalName={hospitalParam || ""}
            branchNames={branchNamesParam || ""}
            searchParams={Object.fromEntries(searchParams.entries())}
            formData={formData}
            onUpdate={updateFormData}
            formErrors={formErrors}
            draftLoaded={draftLoaded}
          />
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2, mt: 3 }}>
            <Button variant="outlined" startIcon={<ArrowBackIcon sx={{ color: "#00AF75" }} />} onClick={navigateBack} sx={{ textTransform: "none" }}>ย้อนกลับ</Button>
            <ActionButtons />
          </Box>
        </Box>
      )}
    </Box>
  );
}

/* ---- Page ---- */
export default function RequestReferralPage() {
  return (
    <Suspense fallback={<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress sx={{ color: "#00AF75" }} /></Box>}>
      <RequestReferralInner />
    </Suspense>
  );
}
