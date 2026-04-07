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
import {
  useReferralCreateStore,
  type HospitalOption,
  type DoctorBranchOption,
} from "@/stores/referralCreateStore";
import { useAuthStore } from "@/stores/authStore";

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
  const draftId = searchParams.get("draft");

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

  const isFormStep = !!(branchNamesParam && doctorBranchParam);

  // Title matches Nuxt: default = "สร้างการร้องขอส่งตัวผู้ป่วยนอก"
  const title = useMemo(() => {
    if (kind === "referOut") return "ส่งตัวผู้ป่วย OPD";
    if (kind === "referBack") return "ส่งตัวผู้ป่วยกลับ OPD";
    return "สร้างการร้องขอส่งตัวผู้ป่วยนอก";
  }, [kind]);

  // Load initial data
  useEffect(() => {
    fetchHospitalFilters();
    if (!hospitalParam) {
      fetchHospitals({ offset: 1, limit, search: "", zone: null, subType: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const info = localStorage.getItem("patient_info");
      if (info) try { setPatientInfo(JSON.parse(info)); } catch { /* */ }
    }
  }, []);

  useEffect(() => {
    if (draftId) {
      findOneReferral(draftId).then((res: any) => {
        if (res?.referralDocument) setReferInfo(res.referralDocument);
      }).catch(console.error);
    }
  }, [draftId, findOneReferral, setReferInfo]);

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
          fromHospitalId = authState.optionHospital ?? undefined;
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

          // Delivery points
          deliveryPointTypeEnd: deliveryPointTypeEnd || undefined,
          deliveryPointTypeStart: formData.referralCreationPoint || undefined,

          // Appointment
          appointmentData,

          // Doctor info
          doctor: formData.prescribingDoctor || undefined,
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
              patient_contact_full_name: formData.emergency_contacts?.[0]?.name || "",
              patient_contact_mobile_phone: formData.emergency_contacts?.[0]?.phone || "",
              patient_contact_relation: formData.emergency_contacts?.[0]?.relation || "",
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
            id: null, // New documents get null ID; server assigns real ID
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

  // Breadcrumbs matching Nuxt original (5 steps)
  const breadcrumbItems = useMemo(() => {
    const items: { name: string; path?: string; isActive?: boolean }[] = [
      { name: "สร้างการร้องขอส่งตัว", path: "/create" },
      { name: "เลือกสถานพยาบาลต้นทาง", path: `/create/request?kind=${kind}`, isActive: !hospitalParam },
    ];
    if (hospitalParam && !deliveryPointParam) {
      items.push({ name: "เลือกปลายทางจุดรับใบส่งตัว", isActive: true });
    }
    if (deliveryPointParam && doctorBranchParam && !branchNamesParam) {
      items.push({
        name: "เลือกปลายทางจุดรับใบส่งตัว",
        path: `/create/request?${buildQuery({ hospital: hospitalParam!, hospitalID: hospitalIDParam || "" })}`,
      });
      items.push({ name: "กำหนดสาขา/แผนกและวันเวลานัดหมาย", isActive: true });
    }
    if (branchNamesParam) {
      items.push({
        name: "เลือกปลายทางจุดรับใบส่งตัว",
        path: `/create/request?${buildQuery({ hospital: hospitalParam!, hospitalID: hospitalIDParam || "" })}`,
      });
      items.push({
        name: "กำหนดสาขา/แผนกและวันเวลานัดหมาย",
        path: `/create/request?${buildQuery({ hospital: hospitalParam!, hospitalID: hospitalIDParam || "", deliveryPoint: "true", docter_branch: "true" })}`,
      });
      items.push({ name: "เพิ่มรายละเอียดใบส่งตัว", isActive: true });
    }
    return items;
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
      {/* ── Full-screen Loading Overlay (ECG heartbeat animation matching Nuxt) ── */}
      {showLoadingOverlay && (
        <>
          <style>{`
            @keyframes ecgPulse {
              0% { clip: rect(0, 0, 100px, 0); opacity: 0.4; }
              4% { clip: rect(0, 66.667px, 100px, 0); opacity: 0.6; }
              15% { clip: rect(0, 133.333px, 100px, 0); opacity: 0.8; }
              20% { clip: rect(0, 300px, 100px, 0); opacity: 1; }
              80% { clip: rect(0, 300px, 100px, 0); opacity: 0; }
              90% { opacity: 0; }
              100% { clip: rect(0, 300px, 100px, 0); opacity: 0; }
            }
          `}</style>
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              bgcolor: "rgba(0, 0, 0, 0.7)",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* ECG Pulse animation */}
            <div
              style={{
                height: 100,
                width: 200,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "block",
                  background: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><polyline fill="none" stroke-width="3px" stroke="%232fd897" points="2.4,58.7 70.8,58.7 76.1,46.2 81.1,58.7 89.9,58.7 93.8,66.5 102.8,22.7 110.6,78.7 115.3,58.7 126.4,58.7 134.4,54.7 142.4,58.7 197.8,58.7"/></svg>') 0 0 no-repeat`,
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  animation: "ecgPulse 2s linear infinite",
                  clip: "rect(0, 0, 100px, 0)",
                }}
              />
            </div>
            <Typography sx={{ color: "#2fd897", fontSize: "1rem", mt: 1 }}>
              กำลังโหลดข้อมูล กรุณารอสักครู่
            </Typography>
          </Box>
        </>
      )}

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
      {!hospitalParam && (
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
