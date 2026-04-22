"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
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
  InputAdornment,
  Snackbar,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Send as SendIcon,
  Search as SearchIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  CheckCircle as CheckCircleIcon,
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
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
/** Format ISO string to Thai Buddhist date+time e.g. "12 เม.ย. 2569 23:25 น." */
function formatThaiDateTimeIntl(isoString: string): string {
  if (!isoString) return "-";
  try {
    const date = new Date(isoString);
    const opts: Intl.DateTimeFormatOptions = {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Bangkok",
    };
    const formatted = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", opts).format(date);
    return formatted.replace(",", "") + " น.";
  } catch { return "-"; }
}

/** Format ISO string to Thai Buddhist date only e.g. "12 เม.ย. 2569" */
function formatStartDateThai(isoString: string): string {
  if (!isoString) return "-";
  try {
    const date = new Date(isoString);
    const opts: Intl.DateTimeFormatOptions = {
      day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Bangkok",
    };
    return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", opts).format(date);
  } catch { return "-"; }
}

/** Extract time HH:mm from ISO string */
function extractTimeFromISO(isoString: string): string {
  if (!isoString) return "-";
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Bangkok" });
  } catch { return "-"; }
}

/** Format end time from ISO string e.g. "23:59" */
function formatEndTime(isoString: string): string {
  return extractTimeFromISO(isoString);
}

/** Elapsed time — matches Nuxt getElapsedTime logic exactly */
function getElapsedTime(createdAt: string, updatedAt: string, referralStatus: string): string {
  const now = Date.now();

  // "ฉบับร่าง" → count from createdAt
  if (referralStatus === "ฉบับร่าง") {
    if (!createdAt) return "-";
    const diff = now - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "น้อยกว่าหนึ่งนาที";
    if (mins < 60) return `${mins} นาทีที่แล้ว`;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
    return `${Math.floor(diff / 86400000)} วันที่แล้ว`;
  }

  // "รอตอบรับ" → count from updatedAt, red after 15 min
  if (referralStatus === "รอตอบรับ") {
    if (!updatedAt) return "-";
    const diff = now - new Date(updatedAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "น้อยกว่าหนึ่งนาที";
    if (mins >= 15) {
      if (mins < 60) return `${mins} นาทีที่แล้ว`;
      const hrs = Math.floor(diff / 3600000);
      if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
      return `${Math.floor(diff / 86400000)} วันที่แล้ว`;
    }
    return `${mins} นาที`;
  }

  // Other statuses (รับเข้ารักษา, ยกเลิก, etc.) → count from updatedAt
  if (!updatedAt) return "-";
  const diff = now - new Date(updatedAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "น้อยกว่าหนึ่งนาที";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
  return `${Math.floor(diff / 86400000)} วันที่แล้ว`;
}

/* ------------------------------------------------------------------ */
/*  OPD Inner (wrapped in Suspense)                                    */
/* ------------------------------------------------------------------ */
function OPDReferralInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const kind = searchParams.get("kind") || "referOut";
  const hospitalParam = searchParams.get("hospital");
  const hospitalIDParam = searchParams.get("hospitalID");
  const deliveryPointParam = searchParams.get("deliveryPoint");
  const doctorBranchParam = searchParams.get("docter_branch");
  const branchNamesParam = searchParams.get("branch_names");
  const draftId = searchParams.get("draft");
  const groupCaseParam = searchParams.get("groupCase");

  // Store
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

  // Auth store — for fromHospital (user's own hospital)
  const { profile, optionHospital } = useAuthStore();

  // Referral store — for referBack list
  const { findAndCountReferral, checkReferPointHospital, findGroupCase } = useReferralStore();

  // Local state — hospital table
  const [search, setSearch] = useState("");
  const [zone, setZone] = useState("");
  const [subType, setSubType] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // default 10 rows per page
  const [isLoading, setIsLoading] = useState(false);
  const [sendData, setSendData] = useState(false);
  const [patientInfo, setPatientInfo] = useState<{ firstname?: string; lastname?: string } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successToast, setSuccessToast] = useState({ open: false, message: "" });
  const [draftLoaded, setDraftLoaded] = useState(0);

  // ReferBack groupCase state
  const [referGroupCase, setReferGroupCase] = useState<any>(null);
  const [referGroupCasePatient, setReferGroupCasePatient] = useState<any>(null);
  // ReferBack referPoint selection state (for when multiple referPoints exist)
  const [rbReferPoints, setRbReferPoints] = useState<any[]>([]);

  // ReferBack-specific state — server-side pagination (matches Nuxt)
  const isReferBack = kind === "referBack";
  const [rbItems, setRbItems] = useState<any[]>([]);
  const [rbTotal, setRbTotal] = useState(0);
  const [rbPage, setRbPage] = useState(1);
  const [rbLimit, setRbLimit] = useState(10);
  const [rbSearchName, setRbSearchName] = useState("");
  const [rbSearchNo, setRbSearchNo] = useState("");
  const [rbSearchHospital, setRbSearchHospital] = useState("");

  // Fetch referBack list with server-side pagination (matches Nuxt paramReferBack)
  const fetchReferBackList = useCallback(async (
    pageOverride?: number,
    limitOverride?: number,
    searchNameOverride?: string,
    searchNoOverride?: string,
    searchHospitalOverride?: string,
  ) => {
    try {
      const myHospitalId = optionHospital || (profile as any)?.hospital?.id || (profile as any)?.permissionGroup?.hospital?.id;
      const p: any = {
        limit: limitOverride ?? rbLimit,
        offset: pageOverride ?? rbPage,
        search: searchNameOverride ?? rbSearchName,
        isTransferred: false,
        referralType: 3,
        referralKind: 3,
        referralStatus: 2,
        runNumberSearch: searchNoOverride ?? rbSearchNo,
        toHospitalSearch: searchHospitalOverride ?? rbSearchHospital,
      };
      // Send toHospital (matches Nuxt: option_hospital or permissionGroup hospital)
      if (myHospitalId) {
        p.toHospital = myHospitalId;
      }
      const res = await findAndCountReferral(p);
      let items = res?.referralDocuments || res?.data || [];
      const count = res?.count ?? items.length;

      // Client-side filter: exclude own hospital from fromHospital (matches Nuxt getReferInData)
      const excludedIds = myHospitalId;
      if (excludedIds && Array.isArray(items)) {
        items = items.filter((item: any) => {
          const fromId = item.fromHospital?.id || item.fromHospital;
          return fromId !== Number(excludedIds);
        });
      }

      setRbItems(items);
      setRbTotal(count);
    } catch (err) {
      console.error("fetchReferBackList error:", err);
      setRbItems([]);
      setRbTotal(0);
    }
  }, [findAndCountReferral, optionHospital, profile, rbLimit, rbPage, rbSearchName, rbSearchNo, rbSearchHospital]);

  // Load referBack list on mount
  useEffect(() => {
    if (isReferBack && !hospitalParam) {
      fetchReferBackList();
    }
  }, [isReferBack, hospitalParam]); // eslint-disable-line react-hooks/exhaustive-deps

  // ReferBack search handlers — trigger server-side search (matches Nuxt)
  const handleRbSearchName = (val: string) => {
    setRbSearchName(val);
    setRbPage(1);
    fetchReferBackList(1, rbLimit, val, rbSearchNo, rbSearchHospital);
  };
  const handleRbSearchNo = (val: string) => {
    setRbSearchNo(val);
    setRbPage(1);
    fetchReferBackList(1, rbLimit, rbSearchName, val, rbSearchHospital);
  };
  const handleRbSearchHospital = (val: string) => {
    setRbSearchHospital(val);
    setRbPage(1);
    fetchReferBackList(1, rbLimit, rbSearchName, rbSearchNo, val);
  };
  const handleRbClearFilters = () => {
    setRbSearchName(""); setRbSearchNo(""); setRbSearchHospital(""); setRbPage(1);
    fetchReferBackList(1, rbLimit, "", "", "");
  };
  const handleRbPageChange = (newPage: number) => {
    setRbPage(newPage);
    fetchReferBackList(newPage, rbLimit);
  };
  const handleRbLimitChange = (newLimit: number) => {
    setRbLimit(newLimit); setRbPage(1);
    fetchReferBackList(1, newLimit);
  };

  // ReferBack select handler — matches Nuxt checkReferPoint_ReferBack logic
  const handleSelectReferBack = async (item: any) => {
    setIsLoading(true);
    try {
      const hospitalId = item.fromHospital?.id;
      const apiResponse = await checkReferPointHospital({
        hospital: hospitalId, useFor: "จุดรับใบส่งตัว", isOpd: true, isActive: true,
      });

      let baseParams: Record<string, string> = {
        kind: "referBack",
        hospital: item.fromHospital?.name || "",
        hospitalID: String(hospitalId || ""),
        deliveryPoint: "true",
        groupCase: String(item.groupCase?.id || ""),
      };

      const points = Array.isArray(apiResponse) ? apiResponse : [];
      setRbReferPoints(points); // store for SelectReferPoints step
      if (points.length === 0) {
        // No referPoint — skip to docter_branch
        baseParams.docter_branch = "true";
      } else if (points.length === 1) {
        // Single referPoint — auto-select and skip to docter_branch
        baseParams.referPoint = String(points[0].id);
        baseParams.docter_branch = "true";
        // Pass referPoint info for form display (matches Nuxt localreferPointData)
        if (points[0].name) baseParams.referPointName = points[0].name;
        if (points[0].phone) baseParams.referPointPhone = points[0].phone;
        if (points[0].phone2) baseParams.referPointPhone2 = points[0].phone2;
      } else {
        // Multiple referPoints — show SelectReferPoints step (no docter_branch)
      }

      router.push(`/create/opd?${buildQuery(baseParams)}`);
    } catch (err) {
      console.error("handleSelectReferBack error:", err);
      alert("ไม่สามารถดึงข้อมูลจุดรับใบส่งตัวได้");
    } finally {
      setIsLoading(false);
    }
  };

  // ReferBack: handle referPoint selection (from SelectReferPoints step)
  const handleSelectReferPoint = (point: any) => {
    const groupCaseVal = searchParams.get("groupCase") || "";
    const q: Record<string, string> = {
      kind: "referBack",
      hospital: hospitalParam || "",
      hospitalID: hospitalIDParam || "",
      referPoint: String(point.id),
      deliveryPoint: "true",
      docter_branch: "true",
      groupCase: groupCaseVal,
    };
    // Pass referPoint info for form display
    if (point.name) q.referPointName = point.name;
    if (point.phone) q.referPointPhone = point.phone;
    if (point.phone2) q.referPointPhone2 = point.phone2;
    router.push(`/create/opd?${buildQuery(q)}`);
  };

  // ReferBack: re-fetch referPoints when landing on the refer point selection step
  const referPointParam = searchParams.get("referPoint");
  const showReferPointStep = !!(isReferBack && hospitalParam && deliveryPointParam && !doctorBranchParam && !branchNamesParam);
  useEffect(() => {
    if (showReferPointStep && rbReferPoints.length === 0 && hospitalIDParam) {
      // Page was reloaded — re-fetch referPoint data
      checkReferPointHospital({ hospital: hospitalIDParam, useFor: "จุดรับใบส่งตัว", isOpd: true, isActive: true })
        .then((res: any) => { setRbReferPoints(Array.isArray(res) ? res : []); })
        .catch(() => { setRbReferPoints([]); });
    }
  }, [showReferPointStep, hospitalIDParam]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wrap updateFormData to clear validation errors on field change
  const handleUpdateFormData = useCallback((data: any) => {
    updateFormData(data);
    // Clear errors for the changed fields
    if (data && typeof data === "object") {
      setFormErrors((prev) => {
        const next = { ...prev };
        Object.keys(data).forEach((key) => {
          if (next[key]) delete next[key];
        });
        return next;
      });
    }
  }, [updateFormData]);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Determine current step
  const isFormStep = !!(branchNamesParam && doctorBranchParam);

  // Title
  const title = useMemo(() => {
    if (kind === "referOut") return "ส่งตัวผู้ป่วยนอก (OPD)";
    if (kind === "referBack") return "ส่งตัวผู้ป่วยกลับ OPD";
    return "สร้างใบส่งตัว OPD";
  }, [kind]);

  // Load initial data
  useEffect(() => {
    fetchHospitalFilters();
    if (!hospitalParam) {
      fetchHospitals({ offset: 1, limit, search: "", zone: null, subType: null });
    }
  }, [hospitalParam, fetchHospitalFilters, fetchHospitals, limit]);

  // Load patient info
  useEffect(() => {
    if (typeof window !== "undefined") {
      const info = localStorage.getItem("patient_info");
      if (info) try { setPatientInfo(JSON.parse(info)); } catch { /* */ }
    }
  }, []);

  // Load groupCase data for referBack (matches Nuxt getFindOneGroupCase)
  useEffect(() => {
    if (!groupCaseParam || !isReferBack) return;
    (async () => {
      try {
        const res = await findGroupCase(groupCaseParam);
        const docs = res?.referralDocuments;
        const doc = Array.isArray(docs) ? docs[0] : docs;
        if (doc) {
          setReferGroupCase(doc);
          const patient = doc.data?.patient;
          const hcodeSub = doc.data?.visitData?.hcode_sub;
          setReferGroupCasePatient({
            ...patient,
            hcode_sub: hcodeSub,
            patient_hn: doc.HN,
            patient_vn: doc.AN,
            patient_an: doc.VN,
          });
        }
      } catch (err) {
        console.error("getFindOneGroupCase error:", err);
      }
    })();
  }, [groupCaseParam, isReferBack, findGroupCase]);

  // Parse draft ID from JSON string (e.g. '{"id":123}') or plain number string
  const parsedDraftId = useMemo(() => {
    if (!draftId) return null;
    try {
      const parsed = JSON.parse(draftId);
      return parsed?.id ? String(parsed.id) : null;
    } catch {
      return draftId; // already a plain ID string
    }
  }, [draftId]);

  // Load draft data if editing — map referInfo back into formData
  useEffect(() => {
    if (parsedDraftId) {
      findOneReferral(parsedDraftId).then((res: any) => {
        const doc = res?.referralDocument || res;
        if (!doc || !doc.data) {
          console.warn("[OPD Draft] No valid document found in response");
          return;
        }
        setReferInfo(doc);

        // Set optionHospital from draft's fromHospital so dropdown APIs load
        const fromHospitalId = doc.fromHospital?.id || doc.fromHospital;
        if (fromHospitalId) {
          const authState = useAuthStore.getState();
          const roleName = (authState.profile as any)?.permissionGroup?.role?.name;
          if (roleName !== "superAdminHospital") {
            authState.setOptionHospital(typeof fromHospitalId === "number" ? fromHospitalId : Number(fromHospitalId));
          }
        }

        // Map nested API structure back to flat formData fields
        const patient = doc.data?.patient || {};
        const visitData = doc.data?.visitData || {};
        const draftFormData: Record<string, any> = {
          // Patient info
          patient_pid: patient.patient_pid || "",
          patient_prefix: patient.patient_prefix || "",
          patient_firstname: patient.patient_firstname || "",
          patient_lastname: patient.patient_lastname || "",
          patient_birthday: patient.patient_birthday || "",
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
          // Emergency contact
          patient_contact_full_name: patient.patient_contact_full_name || "",
          patient_contact_mobile_phone: patient.patient_contact_mobile_phone || "",
          patient_contact_relation: patient.patient_contact_relation || "",
          emergency_contacts: patient.patient_contact_full_name
            ? [{ name: patient.patient_contact_full_name, phone: patient.patient_contact_mobile_phone || "", relation: patient.patient_contact_relation || "" }]
            : [],
          // Doctor info
          prescribingDoctor: String(doc.doctor?.id || doc.doctor || ""),
          docterName: doc.doctorName || "",
          doctorCode: doc.doctorIdentifyNumber || "",
          medicalDepartment: doc.doctorDepartment || "",
          doctorContactNumber: doc.doctorPhone || "",
          // Referral info
          referralCreationPoint: String(doc.deliveryPointTypeStart?.id || doc.deliveryPointTypeStart || ""),
          referral_cause: String(doc.referralCause?.id || doc.referralCause || ""),
          referral_reason: String(doc.referralStatusDetail?.id || doc.referralStatusDetail || ""),
          acute_level: doc.acuteLevel ? String(doc.acuteLevel?.id ?? doc.acuteLevel) : "",
          icu_level: doc.icuLevel ? String(doc.icuLevel?.id ?? doc.icuLevel) : "",
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
          // Equipment
          requiredEquipment: (doc.equipment || []).map((name: string) => ({ name })),
          // Delivery period
          certificationPeriod: doc.referralDeliveryPeriod?.id ?? doc.referralDeliveryPeriod ?? "",
          // Parse deliveryPeriod: API stores ISO strings, form needs date + time separately
          deliveryPeriod: (doc.deliveryPeriod || []).map((dp: any) => {
            const parseDate = (iso: string) => {
              if (!iso) return "";
              // Extract date part (YYYY-MM-DD)
              const match = iso.match(/^(\d{4}-\d{2}-\d{2})/);
              return match ? match[1] : iso;
            };
            const parseTime = (iso: string) => {
              if (!iso) return "";
              // Extract time part (HH:MM)
              const match = iso.match(/T(\d{2}:\d{2})/);
              return match ? match[1] : iso;
            };
            return {
              startDelivery: parseDate(dp.startDelivery),
              endDelivery: parseTime(dp.startDelivery), // endDelivery = time of startDelivery
              startDelivery2: parseDate(dp.endDelivery),
              endDelivery2: parseTime(dp.endDelivery),
            };
          }),
          // Files
          referralFiles: doc.referralFiles || [],
          // Draft references for RequestReferralForm
          _draftDoctor: doc.doctor?.id ? {
            id: doc.doctor.id,
            name: doc.doctorName || `${doc.doctor?.firstName || ""} ${doc.doctor?.lastName || ""}`.trim(),
            licenseNumber: doc.doctorIdentifyNumber || "",
          } : null,
          _draftCause: doc.referralCause?.id ? {
            id: doc.referralCause.id,
            name: doc.referralCause.name || "",
          } : null,
        };

        updateFormData(draftFormData);
        setDraftLoaded((c) => c + 1);
      }).catch((err) => {
        console.error("[OPD Draft] Error loading draft:", err);
      });
    }
  }, [parsedDraftId, findOneReferral, setReferInfo, updateFormData]);

  // Hospital search/filter handlers
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

  // Debounced search (500ms)
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchHospitals({ offset: 1, limit, search: val, zone: zone || null, subType: subType || null });
    }, 500);
  };

  const handleZoneChange = (val: string) => { setZone(val); setPage(1); reloadHospitals(1, search, val, subType); };
  const handleTypeChange = (val: string) => { setSubType(val); setPage(1); reloadHospitals(1, search, zone, val); };

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

  // Navigation helpers
  const buildQuery = useCallback((params: Record<string, string>) => {
    const q = new URLSearchParams({ kind, ...params });
    if (draftId) q.set("draft", draftId);
    return q.toString();
  }, [kind, draftId]);

  const navigateBack = () => {
    if (isFormStep) {
      router.push(`/create/opd?${buildQuery({
        hospital: hospitalParam!,
        hospitalID: hospitalIDParam || "",
        deliveryPoint: "true",
        docter_branch: "true",
      })}`);
    } else if (doctorBranchParam) {
      router.push(`/create/opd?${buildQuery({
        hospital: hospitalParam!,
        hospitalID: hospitalIDParam || "",
        deliveryPoint: "true",
      })}`);
    } else if (deliveryPointParam || hospitalParam) {
      router.push(`/create/opd?kind=${kind}`);
    } else {
      router.push("/create");
    }
  };

  // Hospital selection
  const handleSelectHospital = (hospital: HospitalOption) => {
    router.push(`/create/opd?${buildQuery({
      hospital: hospital.name,
      hospitalID: String(hospital.id),
    })}`);
  };

  // Delivery point next
  const handleDeliveryPointNext = (_id: number, _name: string) => {
    router.push(`/create/opd?${buildQuery({
      hospital: hospitalParam!,
      hospitalID: hospitalIDParam || "",
      deliveryPoint: "true",
      docter_branch: "true",
    })}`);
  };

  // Doctor branch next — matches Nuxt: preserves all existing URL params + adds branch_names/branch_ids
  const handleDoctorBranchNext = (branches: DoctorBranchOption[]) => {
    const branchNames = branches.map((b) => b.name).join(",");
    const branchIds = branches.map((b) => String(b.value || "")).join(",");
    // Preserve all existing search params (kind, groupCase, referPoint, hospital, etc.)
    const existing: Record<string, string> = {};
    searchParams.forEach((value, key) => { existing[key] = value; });
    const q: Record<string, string> = {
      ...existing,
      branch_names: branchNames || "ไม่ระบุสาขา",
    };
    if (branchIds) q.branch_ids = branchIds;
    router.push(`/create/opd?${buildQuery(q)}`);
  };

  // Save
  const handleSave = useCallback(
    async (saveType: "draft" | "submit") => {
      if (isLoading || sendData) return;

      // Client-side validation — highlight required fields in red
      const errors: Record<string, string> = {};

      // ข้อมูลผู้ป่วย
      if (!formData.patient_pid) errors.patient_pid = "กรุณากรอกเลขบัตรประชาชน";
      if (!formData.patient_hn) errors.patient_hn = "กรุณากรอก HN";
      if (!formData.patient_prefix) errors.patient_prefix = "กรุณาเลือกคำนำหน้า";
      if (!formData.patient_firstname) errors.patient_firstname = "กรุณากรอกชื่อ";
      if (!formData.patient_lastname) errors.patient_lastname = "กรุณากรอกนามสกุล";
      if (!formData.patient_sex) errors.patient_sex = "กรุณาเลือกเพศ";
      if (!formData.patient_age) errors.patient_age = "กรุณากรอกอายุ";
      if (!formData.patient_treatment) errors.patient_treatment = "กรุณาเลือกสิทธิ์การรักษา";

      // ข้อมูลผู้สร้างใบส่งตัว
      if (!formData.prescribingDoctor) errors.prescribingDoctor = "กรุณาเลือกแพทย์ผู้ที่สั่ง";
      if (!formData.doctorCode) errors.doctorCode = "กรุณากรอกรหัสแพทย์";

      // ข้อมูลการส่งตัว
      if (!formData.referral_cause) errors.referral_cause = "กรุณาเลือกสาเหตุการส่งตัว";
      if (!formData.acute_level) errors.acute_level = "กรุณาเลือกระดับความเฉียบพลัน";

      // อาการ
      if (!formData.visit_primary_symptom_main_symptom) errors.visit_primary_symptom_main_symptom = "กรุณากรอกอาการนำ";
      if (!formData.visit_primary_symptom_current_illness) errors.visit_primary_symptom_current_illness = "กรุณากรอกรายละเอียดอาการป่วยปัจจุบัน";

      setFormErrors(errors);

      if (Object.keys(errors).length > 0) {
        // Scroll to first error field
        const firstErrorKey = Object.keys(errors)[0];
        const el = document.querySelector(`[name="${firstErrorKey}"], [data-field="${firstErrorKey}"]`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      setIsLoading(true);
      setSendData(true);

      try {
        // Filter out empty icd10/icd10More entries before sending
        const cleanIcd10 = (formData.icd10 || []).filter(
          (item: any) => item.icd_10_tm || item.diagetname || item.diagename
        );
        const cleanIcd10More = (formData.icd10More || []).filter(
          (item: any) => item.icd_10_tm || item.diagetname || item.diagename
        );

        // Map saveType to referralStatus (draft=1, submit=3)
        const referralStatusMap: Record<string, number> = {
          draft: 1,
          submit: 3,
        };
        const referralStatus = referralStatusMap[saveType] || 3;

        // Helper to combine date/time arrays for delivery period
        const combineDateTimeArray = (
          deliveryPeriodArray: any[],
          referralDeliveryPeriod: number | string
        ) => {
          if (!Array.isArray(deliveryPeriodArray)) return [];

          const periodNum = typeof referralDeliveryPeriod === "string"
            ? parseInt(referralDeliveryPeriod, 10)
            : referralDeliveryPeriod;

          return deliveryPeriodArray.map((item) => {
            if (!item) return null;

            // For periods 3-7 (and others), combine dates and times
            const startDeliveryDate = item.startDelivery
              ? new Date(item.startDelivery).toISOString().split("T")[0]
              : "";
            const startDelivery2Date = item.startDelivery2
              ? new Date(item.startDelivery2).toISOString().split("T")[0]
              : "";

            if (periodNum === 1) {
              // Single day
              const dateOnly = startDeliveryDate;
              const timeOnly = item.endDelivery || "00:00:00";
              const combined = `${dateOnly}T${timeOnly}.000Z`;
              return { startDelivery: combined, endDelivery: combined };
            } else if (periodNum === 2) {
              // Date range with times
              const startDelivery = startDeliveryDate
                ? `${startDeliveryDate}T${item.endDelivery || "00:00:00"}.000Z`
                : undefined;
              const endDelivery = startDelivery2Date
                ? `${startDelivery2Date}T${item.endDelivery2 || "00:00:00"}.000Z`
                : undefined;
              return { startDelivery, endDelivery };
            } else {
              // Periods 3-7+ default behavior
              const startDelivery = startDeliveryDate
                ? `${startDeliveryDate}T${item.endDelivery || "00:00:00"}.000Z`
                : undefined;
              const endDelivery = startDelivery2Date
                ? `${startDelivery2Date}T${item.endDelivery2 || "00:00:00"}.000Z`
                : undefined;
              return { startDelivery, endDelivery };
            }
          }).filter(Boolean);
        };

        // Helper to get equipment names array
        const getEquipment = (equipmentNames?: any): string[] => {
          if (!equipmentNames) return [];
          return (Array.isArray(equipmentNames) ? equipmentNames : [])
            .filter((item): item is string => !!item);
        };

        // Helper to get appointment data from branch names and IDs (matches Nuxt logic)
        const getAppointmentData = () => {
          const branchNames = searchParams.get("branch_names");
          const branchIds = searchParams.get("branch_ids");
          const doctorBranchFlag = searchParams.get("docter_branch");
          // If no branch names/IDs, doctor_branch is false, or only placeholder name → return empty (matches Nuxt)
          if (!branchNames || !branchIds || doctorBranchFlag === "false") return [];
          // "ไม่ระบุสาขา" alone means no real branch was selected — don't send fake IDs
          if (branchNames.trim() === "ไม่ระบุสาขา") return [];

          const namesArray = String(branchNames)
            .split(",")
            .map((name) => name.trim());
          const idsArray = String(branchIds)
            .split(",")
            .map((id) => id.trim());

          const maxLength = Math.min(namesArray.length, idsArray.length);
          const appointmentData = [];
          for (let i = 0; i < maxLength; i++) {
            appointmentData.push({
              doctorBranch: Number(idsArray[i]),
              doctorBranchName: namesArray[i],
            });
          }
          return appointmentData;
        };

        // Map the flat formData to nested Nuxt API structure
        const payload = {
          // Basic referral info
          groupCase: undefined, // OPD referOut doesn't use groupCase
          referralDeliveryPeriod: formData.certificationPeriod || undefined,
          deliveryPeriod: combineDateTimeArray(
            formData.deliveryPeriod || [],
            formData.certificationPeriod || 0
          ),
          isEndAccept: false,

          // Hospital info — fromHospital = user's own hospital (or navbar selection), toHospital = destination from URL
          fromHospital: (() => {
            const roleName = (profile as any)?.permissionGroup?.role?.name;
            if (roleName === "superAdminHospital") {
              return (profile as any)?.permissionGroup?.hospital?.id;
            } else if (roleName === "superAdmin" || roleName === "superAdminZone") {
              // superAdmin uses the navbar hospital selector (optionHospital)
              return optionHospital || (hospitalIDParam ? parseInt(hospitalIDParam, 10) : undefined);
            }
            // Fallback for unknown roles
            return (profile as any)?.permissionGroup?.hospital?.id
              || optionHospital
              || (hospitalIDParam ? parseInt(hospitalIDParam, 10) : undefined);
          })(),
          toHospital: hospitalIDParam ? parseInt(hospitalIDParam, 10) : undefined,

          // Referral type & status
          referralKind: 3, // OPD
          referralType: (() => {
            switch (kind) {
              case "referOut": return 1;
              case "referBack": return 2;
              case "referresiv": return 3;
              case "REFER_IN": return 4;
              default: return 0;
            }
          })(),
          referralStatus,

          // Delivery points
          deliveryPointTypeEnd: undefined,
          deliveryPointTypeStart: formData.referralCreationPoint ? (Number(formData.referralCreationPoint) || undefined) : undefined,

          // Appointment data — always build from URL params (matches Nuxt behavior)
          // If updating a draft and URL has no valid branch data, send [] to clear any fake data
          appointmentData: getAppointmentData(),

          // Doctor info — doctor is an integer ID, doctorName is display name
          doctor: formData.prescribingDoctor ? Number(formData.prescribingDoctor) || undefined : undefined,
          doctorName: formData.docterName || formData.prescribingDoctor || undefined,
          doctorIdentifyNumber: formData.doctorCode || undefined,
          doctorDepartment: formData.medicalDepartment || undefined,
          doctorPhone: formData.doctorContactNumber?.toString() || undefined,

          // Referral details — referralStatusDetail is an integer ID from dropdown
          referralStatusDetail: formData.referral_reason ? (Number(formData.referral_reason) || undefined) : undefined,
          remark: formData.additionalComments || undefined,
          referralCause: formData.referral_cause ? (Number(formData.referral_cause) || undefined) : undefined,

          // Urgency & infectious status
          acuteLevel: formData.acute_level ? (Number(formData.acute_level) || undefined) : undefined,
          contagious: formData.is_infectious === "true" || formData.is_infectious === true,
          moreDetail: formData.moreDetail || undefined,

          // Equipment
          equipment: getEquipment(formData.requiredEquipment?.map((e: any) => e.name)),

          // Patient identifiers
          HN: formData.patient_hn || undefined,
          VN: formData.patient_vn || undefined,
          AN: formData.patient_an || undefined,

          // Nested patient & visit data
          data: {
            patient: {
              t_patient_id: formData.patient_pid || undefined,
              patient_pid: formData.patient_pid || undefined,
              patient_prefix: formData.patient_prefix || undefined,
              patient_firstname: formData.patient_firstname || undefined,
              patient_lastname: formData.patient_lastname || undefined,
              patient_birthday: formData.patient_birthday || undefined,
              patient_sex: formData.patient_sex || undefined,
              patient_blood_group: formData.patient_blood_group || undefined,
              patient_treatment: formData.patient_treatment || undefined,
              patient_treatment_hospital: formData.patient_treatment_hospital || undefined,

              // Address
              patient_house: formData.patient_house || undefined,
              patient_moo: formData.patient_moo || undefined,
              patient_tambon: formData.patient_tambon || undefined,
              patient_amphur: formData.patient_amphur || undefined,
              patient_alley: formData.patient_alley || undefined,
              patient_road: formData.patient_road || undefined,
              patient_changwat: formData.patient_changwat || undefined,
              patient_zip_code: formData.patient_zipcode || undefined,
              patient_mobile_phone: formData.patient_phone || undefined,

              // Emergency contact
              patient_contact_full_name: formData.patient_contact_full_name || undefined,
              patient_contact_mobile_phone: formData.patient_contact_mobile_phone || undefined,
              patient_contact_relation: formData.patient_contact_relation || undefined,
            },

            // Physical exam & health
            physicalExam: formData.physicalExam || undefined,
            disease: formData.diseases || undefined,
            drugAllergy: formData.drugAllergy || [],
            vaccines: formData.vaccines || [],
            vaccinesCovid: [],

            // Visit data (vital signs, symptoms, diagnosis)
            visitData: {
              temperature: formData.temperature || undefined,
              bps: formData.bps || undefined,
              bpd: formData.bpd || undefined,
              pulse: formData.pulse || undefined,
              rr: formData.rr || undefined,
              visit_primary_symptom_main_symptom:
                formData.visit_primary_symptom_main_symptom || undefined,
              visit_primary_symptom_current_illness:
                formData.visit_primary_symptom_current_illness || undefined,
              pe: formData.pe || undefined,
              Imp: formData.Imp || undefined,
              moreDetail: formData.moreDetail || undefined,
              icd10Basic: formData.icd10Basic || undefined,
              icd10: cleanIcd10,
              icd10MoreBasic: formData.icd10MoreBasic || undefined,
              icd10More: cleanIcd10More,
            },

            // Medicines
            drugs: formData.medicines || [],
          },

          // Files
          referralFiles: [],
        };

        // Debug payload can be re-enabled if needed
        // console.log("📦 Payload:", JSON.stringify(payload, null, 2));

        if (parsedDraftId && referInfo?.id) {
          await updateReferralDocument(referInfo.id, payload);
        } else {
          await createReferralDocument(payload);
        }

        // Show success toast then redirect based on kind
        const msg = saveType === "draft" ? "บันทึกฉบับร่างเรียบร้อย" : "บันทึกและส่งตัวเรียบร้อย";
        setSuccessToast({ open: true, message: msg });
        const redirectPath = kind === "referBack" ? "/refer-back/all" : "/refer-out/all";
        setTimeout(() => {
          router.push(redirectPath);
        }, 1500);
      } catch (err: any) {
        console.error("Save error:", err);
        if (err?.response?.data) {
          console.error("API error details:", JSON.stringify(err.response.data, null, 2));
        }
        alert(err?.message || "ไม่สามารถบันทึกข้อมูลได้");
      } finally {
        setIsLoading(false);
        setSendData(false);
      }
    },
    [isLoading, sendData, formData, kind, hospitalParam, hospitalIDParam, branchNamesParam, searchParams, draftId, referInfo, createReferralDocument, updateReferralDocument, router, profile, optionHospital]
  );

  const totalPages = Math.max(1, Math.ceil(hospitalTotalCount / limit));

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

  // Breadcrumbs — always show all 5 steps like Nuxt
  const breadcrumbItems = useMemo(() => {
    // Determine current step index (0-based)
    let currentStep = 0; // step 1: เลือกสถานพยาบาล
    if (hospitalParam && deliveryPointParam && !doctorBranchParam) currentStep = 1; // step 2: เลือกปลายทางจุดรับใบส่งตัว
    if (hospitalParam && deliveryPointParam && doctorBranchParam && !branchNamesParam) currentStep = 2; // step 3: กำหนดสาขา/แผนกที่จะส่งไป
    if (branchNamesParam) currentStep = 3; // step 4: เพิ่มรายละเอียดใบส่งตัว

    const baseQueryHospital = hospitalParam ? buildQuery({ hospital: hospitalParam, hospitalID: hospitalIDParam || "" }) : "";
    const baseQueryDelivery = hospitalParam ? buildQuery({ hospital: hospitalParam, hospitalID: hospitalIDParam || "", deliveryPoint: "true" }) : "";
    const baseQueryBranch = hospitalParam ? buildQuery({ hospital: hospitalParam, hospitalID: hospitalIDParam || "", deliveryPoint: "true", docter_branch: "true" }) : "";

    const allSteps = [
      {
        name: "สร้างใบส่งตัว",
        path: "/create",
      },
      {
        name: "เลือกสถานพยาบาล",
        path: `/create/opd?kind=${kind}`,
        isActive: currentStep === 0,
      },
      {
        name: "เลือกปลายทางจุดรับใบส่งตัว",
        path: currentStep > 1 ? `/create/opd?${baseQueryHospital}` : undefined,
        isActive: currentStep === 1,
      },
      {
        name: "กำหนดสาขา/แผนกที่จะส่งไป",
        path: currentStep > 2 ? `/create/opd?${baseQueryDelivery}` : undefined,
        isActive: currentStep === 2,
      },
      {
        name: "เพิ่มรายละเอียดใบส่งตัว",
        path: undefined,
        isActive: currentStep === 3,
      },
    ];

    return allSteps;
  }, [kind, hospitalParam, hospitalIDParam, deliveryPointParam, doctorBranchParam, branchNamesParam, buildQuery]);

  // Action buttons for form step
  const ActionButtons = () => (
    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
      {isFormStep && (
        <>
          <Button variant="outlined" startIcon={isLoading ? <CircularProgress size={18} /> : <SaveIcon />} onClick={() => handleSave("draft")} disabled={isLoading || sendData} sx={{ textTransform: "none" }}>
            {isLoading ? "กำลังบันทึก..." : "บันทึกฉบับร่าง"}
          </Button>
          <Button variant="contained" startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <SendIcon />} onClick={() => handleSave("submit")} disabled={isLoading || sendData}
            sx={{ bgcolor: "#00AF75", "&:hover": { bgcolor: "#036245" }, textTransform: "none" }}>
            {isLoading ? "กำลังบันทึก..." : "บันทึกและส่งตัว"}
          </Button>
        </>
      )}
    </Stack>
  );

  return (
    <Box sx={{ width: "100%" }}>
      <LoadingOverlay open={isLoading || loading} />
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

      {/* Breadcrumbs */}
      <BreadcrumbsRefer basePath="/create/opd" kind={kind} items={breadcrumbItems} />

      {/* Step 1 (referBack): Referral list selection */}
      {isReferBack && !hospitalParam && (() => {
        const rbTotalPages = Math.max(1, Math.ceil(rbTotal / rbLimit));
        const rbPageNumbers: (number | "...")[] = [];
        if (rbTotalPages <= 7) {
          for (let i = 1; i <= rbTotalPages; i++) rbPageNumbers.push(i);
        } else {
          rbPageNumbers.push(1);
          if (rbPage > 3) rbPageNumbers.push("...");
          const start = Math.max(2, rbPage - 1);
          const end = Math.min(rbTotalPages - 1, rbPage + 1);
          for (let i = start; i <= end; i++) rbPageNumbers.push(i);
          if (rbPage < rbTotalPages - 2) rbPageNumbers.push("...");
          rbPageNumbers.push(rbTotalPages);
        }
        return (
          <Box sx={{ mt: 3 }}>
            {/* Filters */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr auto" }, gap: 2, mb: 3 }}>
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>ค้นหาชื่อผู้ป่วย</Typography>
                <TextField size="small" fullWidth placeholder="ชื่อ-นามสกุล, HN" value={rbSearchName} onChange={(e) => handleRbSearchName(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: "#9ca3af" }} /></InputAdornment> }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>ค้นหาหมายเลขใบส่งตัว</Typography>
                <TextField size="small" fullWidth placeholder="ค้นหา No" value={rbSearchNo} onChange={(e) => handleRbSearchNo(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: "#9ca3af" }} /></InputAdornment> }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>ค้นหาสถานพยาบาลต้นทาง</Typography>
                <TextField size="small" fullWidth placeholder="ค้นหาสถานพยาบาล" value={rbSearchHospital} onChange={(e) => handleRbSearchHospital(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: "#9ca3af" }} /></InputAdornment> }} />
              </Box>
              <Box sx={{ display: "flex", alignItems: "flex-end" }}>
                <Button variant="outlined" onClick={handleRbClearFilters} sx={{ height: 40, textTransform: "none", borderColor: "#d1d5db", color: "#374151", whiteSpace: "nowrap", px: 3 }}>
                  ล้างตัวกรอง
                </Button>
              </Box>
            </Box>

            {/* Table */}
            <TableContainer component={Paper} sx={{ boxShadow: "none", border: "1px solid #e5e7eb" }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#036245" }}>
                    <TableCell sx={{ fontWeight: 600, color: "#fff", textAlign: "center", width: 180 }}>No</TableCell>
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
                  {rbItems.map((item: any) => {
                    const patient = item.data?.patient || {};
                    const patientName = `${patient.patient_firstname || ""} ${patient.patient_lastname || ""}`.trim() || "-";
                    const elapsed = getElapsedTime(item.createdAt, item.updatedAt, item.referralStatus?.name || "");
                    const isOverdue = item.referralStatus?.name === "รอตอบรับ" && elapsed.includes("ที่แล้ว");
                    return (
                      <TableRow key={item.id} hover sx={{ borderBottom: "1px solid #e5e7eb", "&:hover": { bgcolor: "#f0fdf4" } }}>
                        <TableCell align="center"><Typography variant="body2">{item.runNumber || "-"}</Typography></TableCell>
                        <TableCell align="center"><Typography variant="body2">{formatThaiDateTimeIntl(item.createdAt)}</Typography></TableCell>
                        <TableCell align="center"><Typography variant="body2">{patientName}</Typography></TableCell>
                        <TableCell align="center"><Typography variant="body2">{item.fromHospital?.name || "-"}</Typography></TableCell>
                        <TableCell align="center"><Typography variant="body2">{item.subType?.name || "ไม่มีประเภท"}</Typography></TableCell>
                        <TableCell align="center">
                          {item.referralStatus?.name && (
                            <Box component="span" sx={{
                              display: "inline-block", px: 1.5, py: 0.5, borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600,
                              ...(item.referralStatus.name === "รับเข้ารักษา"
                                ? { bgcolor: "#22C55E", color: "#fff" }
                                : item.referralStatus.name === "รอตอบรับ"
                                  ? { bgcolor: "#FEFCE8", color: "#EAB308" }
                                  : item.referralStatus.name === "ยกเลิก"
                                    ? { bgcolor: "#FEF2F2", color: "#EF4444" }
                                    : { bgcolor: "#EFF6FF", color: "#3B82F6" }),
                            }}>
                              {item.referralStatus.name}
                            </Box>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ color: isOverdue ? "#EF4444" : "inherit" }}>{elapsed}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Button variant="contained" size="small" onClick={() => handleSelectReferBack(item)}
                            sx={{ bgcolor: "#00AF75", "&:hover": { bgcolor: "#036245" }, textTransform: "none", minWidth: 60, borderRadius: "6px" }}>
                            เลือก
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {rbItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="textSecondary">ไม่พบข้อมูลใบส่งตัว</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", mt: 2, gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" sx={{ color: "#6b7280" }}>แถวต่อหน้า</Typography>
                <FormControl size="small" sx={{ minWidth: 70 }}>
                  <Select value={rbLimit} onChange={(e) => handleRbLimitChange(Number(e.target.value))} sx={{ fontSize: "0.875rem", height: 32 }}>
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                  </Select>
                </FormControl>
                <Typography variant="body2" sx={{ color: "#6b7280" }}>ทั้งหมด {rbTotal} รายการ</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Button size="small" disabled={rbPage <= 1} onClick={() => handleRbPageChange(rbPage - 1)} sx={{ minWidth: 32, p: 0.5, color: "#6b7280" }}>
                  <PrevIcon fontSize="small" />
                </Button>
                {rbPageNumbers.map((p, idx) =>
                  p === "..." ? (
                    <Typography key={`dots-${idx}`} variant="body2" sx={{ px: 0.5, color: "#6b7280" }}>...</Typography>
                  ) : (
                    <Button key={p} size="small" onClick={() => handleRbPageChange(p as number)}
                      sx={{ minWidth: 32, height: 32, p: 0, borderRadius: "6px", fontWeight: rbPage === p ? 700 : 400,
                        bgcolor: rbPage === p ? "#00AF75" : "transparent", color: rbPage === p ? "#fff" : "#374151",
                        "&:hover": { bgcolor: rbPage === p ? "#036245" : "#f3f4f6" } }}>
                      {p}
                    </Button>
                  )
                )}
                <Button size="small" disabled={rbPage >= rbTotalPages} onClick={() => handleRbPageChange(rbPage + 1)} sx={{ minWidth: 32, p: 0.5, color: "#6b7280" }}>
                  <NextIcon fontSize="small" />
                </Button>
              </Box>
            </Box>
          </Box>
        );
      })()}

      {/* Step 1 (referOut): Hospital selection with filter + table + pagination */}
      {!isReferBack && !hospitalParam && (
        <Box sx={{ mt: 3 }}>
          {/* Filters row - matching Nuxt layout */}
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
                  MenuProps={{
                    PaperProps: {
                      sx: { maxHeight: 350, minWidth: 320 },
                    },
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
                  MenuProps={{
                    PaperProps: {
                      sx: { maxHeight: 350, minWidth: 320 },
                    },
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

          {/* Table - green header matching Nuxt */}
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
                        <Box component="img" src={h.image} alt="" sx={{ width: 35, height: 35, mx: "auto" }} />
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

          {/* Pagination - matching Nuxt: แถวต่อหน้า [select] ทั้งหมด X รายการ [page numbers] */}
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

          <Box sx={{ mt: 2 }}>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push("/create")} sx={{ color: "#6b7280", borderColor: "#d1d5db", textTransform: "none" }}>
              ยกเลิก
            </Button>
          </Box>
        </Box>
      )}

      {/* Step 2: Delivery Point */}
      {hospitalParam && !deliveryPointParam && (
        <DeliveryPointSelector hospitalId={hospitalIDParam || ""} kind={kind} onNext={handleDeliveryPointNext} onBack={() => router.push(`/create/opd?kind=${kind}`)} />
      )}

      {/* Step 2.5 (ReferBack only): Select ReferPoint — matches Nuxt SelectReferPoints */}
      {showReferPointStep && (
        <Box sx={{ mt: 3, pb: 16 }}>
          {rbReferPoints.length > 0 ? (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 2, mt: 2 }}>
              {rbReferPoints.map((point: any) => (
                <Box
                  key={point.id}
                  onClick={() => handleSelectReferPoint(point)}
                  sx={{
                    display: "flex", alignItems: "center", p: 3, borderRadius: "16px", bgcolor: "#fff", cursor: "pointer",
                    boxShadow: "0px 10px 8px rgba(0,0,0,0.04), 0px 4px 3px rgba(0,0,0,0.1)",
                    "&:hover": { boxShadow: "0px 10px 15px rgba(0,0,0,0.1)" },
                  }}
                >
                  {/* Map pin icon */}
                  <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mr: 2 }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#036245" />
                      <circle cx="12" cy="9" r="2.5" fill="#fff" />
                      <rect x="11.25" y="7" width="1.5" height="4" rx="0.5" fill="#036245" />
                      <rect x="10" y="8.25" width="4" height="1.5" rx="0.5" fill="#036245" />
                    </svg>
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: "#111827" }}>{point.name}</Typography>
                    <Typography variant="caption" sx={{ color: "#9ca3af" }}>{point.phone || ""}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", py: 8, bgcolor: "#f9fafb", borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 600, color: "#6b7280", mb: 1 }}>ไม่พบจุดรับใบส่งตัว</Typography>
              <Typography variant="body2" color="textSecondary">โรงพยาบาลนี้ยังไม่มีจุดรับใบส่งตัวที่กำหนดไว้</Typography>
            </Box>
          )}
          <Box sx={{ mt: 3 }}>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(`/create/opd?kind=referBack`)}
              sx={{ color: "#6b7280", borderColor: "#d1d5db", textTransform: "none" }}>ยกเลิก</Button>
          </Box>
        </Box>
      )}

      {/* Step 3: Doctor Branch */}
      {hospitalParam && deliveryPointParam && doctorBranchParam && !branchNamesParam && (
        <DoctorBranchSelector hospitalId={hospitalIDParam || ""} hospitalName={hospitalParam} kind={kind} onNext={handleDoctorBranchNext}
          onBack={() => router.push(`/create/opd?${buildQuery({ hospital: hospitalParam, hospitalID: hospitalIDParam || "", deliveryPoint: "true" })}`)} />
      )}

      {/* ReferBack: "ใบส่งตัวเดิม" panel — matches Nuxt ReferGroupCasePanel */}
      {isFormStep && isReferBack && referGroupCase && referInfo?.referralStatus?.name !== "ฉบับร่าง" && (
        <Paper sx={{ mt: 3, p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 500, color: "#111827", mb: 2 }}>ใบส่งตัวเดิม</Typography>
          <TableContainer sx={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ borderBottom: "1px solid #e5e7eb" }}>
                  <TableCell sx={{ fontWeight: 600, color: "#374151" }}>No</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#374151" }}>วัน/เวลาที่ส่งตัว</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#374151" }}>เลขบัตรประชาชน</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#374151" }}>ชื่อผู้ป่วย</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#374151" }}>สถานพยาบาลต้นทาง</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#374151" }}>ระยะเวลารับรองสิทธิ์</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#374151" }}>สถานะใบส่งตัว</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>{referGroupCase.runNumber || "-"}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatStartDateThai(referGroupCase.createdAt)}</Typography>
                    <Typography variant="caption" sx={{ color: "#6b7280" }}>{extractTimeFromISO(referGroupCase.createdAt)}</Typography>
                  </TableCell>
                  <TableCell sx={{ color: "#2563eb" }}>{referGroupCase.data?.patient?.patient_pid || "-"}</TableCell>
                  <TableCell>
                    {[referGroupCase.data?.patient?.patient_firstname, referGroupCase.data?.patient?.patient_lastname].filter(Boolean).join(" ") || "-"}
                  </TableCell>
                  <TableCell>{referGroupCase.fromHospital?.name || "-"}</TableCell>
                  <TableCell>
                    {referGroupCase.deliveryPeriod?.length > 0 ? referGroupCase.deliveryPeriod.map((period: any, idx: number) => (
                      <Box key={idx} sx={{ mb: idx < referGroupCase.deliveryPeriod.length - 1 ? 1 : 0 }}>
                        <Typography variant="body2">เริ่มต้น : {formatStartDateThai(period.startDelivery)}-{formatEndTime(period.startDelivery)}</Typography>
                        <Typography variant="body2">หมดอายุ : {formatStartDateThai(period.endDelivery)}-{formatEndTime(period.endDelivery)}</Typography>
                      </Box>
                    )) : (
                      <Box>
                        <Typography variant="body2">เริ่มต้น : -</Typography>
                        <Typography variant="body2">หมดอายุ : -</Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    {referGroupCase.referralStatus?.name && (
                      <Box component="span" sx={{
                        display: "inline-block", px: 1.5, py: 0.5, borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600,
                        ...(referGroupCase.referralStatus.name === "รับเข้ารักษา"
                          ? { bgcolor: "#22C55E", color: "#fff" }
                          : referGroupCase.referralStatus.name === "รอตอบรับ"
                            ? { bgcolor: "#FEFCE8", color: "#EAB308" }
                            : referGroupCase.referralStatus.name === "ยกเลิก"
                              ? { bgcolor: "#FEF2F2", color: "#EF4444" }
                              : { bgcolor: "#EFF6FF", color: "#3B82F6" }),
                      }}>
                        {referGroupCase.referralStatus.name}
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Step 4: Referral Form — reuse the full RequestReferralForm component (matching Nuxt layout) */}
      {isFormStep && (
        <Box sx={{ mt: 3 }}>
          <RequestReferralFormComponent
            kind={kind}
            hospitalName={hospitalParam || ""}
            branchNames={branchNamesParam || ""}
            searchParams={Object.fromEntries(searchParams.entries())}
            formData={formData}
            onUpdate={handleUpdateFormData}
            formErrors={formErrors}
            draftLoaded={draftLoaded}
            referGroupCasePatient={isReferBack ? referGroupCasePatient : undefined}
            referGroupCase={isReferBack ? referGroupCase : undefined}
          />
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2, mt: 3 }}>
            <Button variant="outlined" startIcon={<ArrowBackIcon sx={{ color: "#00AF75" }} />} onClick={navigateBack} sx={{ textTransform: "none" }}>ย้อนกลับ</Button>
            <ActionButtons />
          </Box>
        </Box>
      )}

      {/* Success toast — matching Nuxt green toast */}
      <Snackbar
        open={successToast.open}
        autoHideDuration={3000}
        onClose={() => setSuccessToast((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ mt: 2, zIndex: (t) => t.zIndex.modal + 100 }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
            bgcolor: "#d1fae5",
            border: "1px solid #a7f3d0",
            borderRadius: "10px",
            px: 2.5,
            py: 2,
            minWidth: 320,
            maxWidth: 420,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            fontFamily: "Sarabun, sans-serif",
          }}
        >
          <CheckCircleIcon
            sx={{ color: "#16a34a", fontSize: 26, mt: 0.25, flexShrink: 0 }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                color: "#16a34a",
                fontWeight: 700,
                fontSize: "1rem",
                fontFamily: "Sarabun, sans-serif",
                lineHeight: 1.3,
              }}
            >
              ระบบ
            </Typography>
            <Typography
              sx={{
                color: "#374151",
                fontSize: "0.875rem",
                mt: 0.5,
                fontFamily: "Sarabun, sans-serif",
                lineHeight: 1.5,
              }}
            >
              {successToast.message}
            </Typography>
          </Box>
        </Box>
      </Snackbar>
    </Box>
  );
}

/* ---- (OPD now uses the shared RequestReferralForm component) ---- */

/* ---- Page ---- */
export default function OPDReferralPage() {
  return (
    <Suspense fallback={<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress sx={{ color: "#00AF75" }} /></Box>}>
      <OPDReferralInner />
    </Suspense>
  );
}
