"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Stack,
  Paper,
  Snackbar,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  ListAlt as ListIcon,
  Save as SaveIcon,
  Send as SendIcon,
  CheckCircleOutline as CheckCircleIcon,
} from "@mui/icons-material";
import { useRouter, useSearchParams } from "next/navigation";

import BreadcrumbsRefer from "@/components/referral-create/BreadcrumbsRefer";
import HospitalSelectorPanel from "@/components/referral-create/HospitalSelectorPanel";
import ViewSelectedHospitalsModal from "@/components/referral-create/ViewSelectedHospitalsModal";
import RequestReferralFormComponent from "@/components/referral-create/RequestReferralForm";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import { useReferralCreateStore, type SelectedHospital } from "@/stores/referralCreateStore";
import { useAuthStore } from "@/stores/authStore";

/* ------------------------------------------------------------------ */
/*  Inner component (needs useSearchParams in Suspense)                */
/* ------------------------------------------------------------------ */
function ERReferralInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kind = searchParams.get("kind") || "referER";
  const hospitalsParam = searchParams.get("hospitals");
  const draftParam = searchParams.get("draft");
  const groupCase = searchParams.get("groupCase") || searchParams.get("groupCaseId");

  // draft param can be JSON string like '{"id":123}' or plain id
  const draftId = useMemo(() => {
    if (!draftParam) return null;
    try {
      const parsed = JSON.parse(draftParam);
      return parsed?.id?.toString() || draftParam;
    } catch {
      return draftParam;
    }
  }, [draftParam]);

  // Store
  const {
    loading,
    formData,
    referInfo,
    setFormData,
    updateFormData,
    resetFormData,
    setReferInfo,
    createReferralDocument,
    updateReferralDocument,
    findOneReferral,
    findGroupCase: findGroupCaseFn,
  } = useReferralCreateStore();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [sendData, setSendData] = useState(false);
  const [viewHospitalsOpen, setViewHospitalsOpen] = useState(false);
  const [patientInfo, setPatientInfo] = useState<{ firstname?: string; lastname?: string } | null>(
    null
  );
  const [successToast, setSuccessToast] = useState({ open: false, message: "" });

  // Parse hospitals from query
  const parsedHospitals: SelectedHospital[] = useMemo(() => {
    if (!hospitalsParam) return [];
    try {
      return JSON.parse(hospitalsParam);
    } catch {
      return [];
    }
  }, [hospitalsParam]);

  const hasHospital = parsedHospitals.length > 0;
  const isDraftStatus = !!draftId;

  // Load patient info from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const info = localStorage.getItem("patient_info");
      if (info) {
        try {
          setPatientInfo(JSON.parse(info));
        } catch { /* ignore */ }
      }
    }
  }, []);

  // Track draft loaded state to signal form component
  const [draftLoaded, setDraftLoaded] = useState(0);

  // Load draft data if editing — map referInfo back into formData
  useEffect(() => {
    if (draftId) {
      findOneReferral(draftId).then((res: any) => {
        // Handle both possible structures
        const doc = res?.referralDocument || res;
        if (!doc || !doc.data) {
          console.warn("[ER Draft] No valid document found in response");
          return;
        }
        setReferInfo(doc);

        // Set optionHospital from draft's fromHospital so dropdown APIs load
        const fromHospitalId = doc.fromHospital?.id || doc.fromHospital;
        if (fromHospitalId) {
          const authState = useAuthStore.getState();
          const roleName = authState.getRoleName();
          // For superAdmin / superAdminZone, set optionHospital from draft
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
          an: doc.AN || "",
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
          // Emergency contact — form uses emergency_contacts array
          patient_contact_full_name: patient.patient_contact_full_name || "",
          patient_contact_mobile_phone: patient.patient_contact_mobile_phone || "",
          patient_contact_relation: patient.patient_contact_relation || "",
          emergency_contacts: patient.patient_contact_full_name
            ? [{ name: patient.patient_contact_full_name, phone: patient.patient_contact_mobile_phone || "", relation: patient.patient_contact_relation || "" }]
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
          referral_reason: String(doc.referralStatusDetail?.id || doc.referralStatusDetail || ""),
          acute_level: doc.acuteLevel ? String(doc.acuteLevel?.id ?? doc.acuteLevel) : "",
          icu_level: doc.icuLevel ? String(doc.icuLevel?.id ?? doc.icuLevel) : "",
          icuLevel: doc.icuLevel ? String(doc.icuLevel?.id ?? doc.icuLevel) : "",
          additionalUrgencyValue: doc.contagious ? "true" : "false",
          car_refer: doc.carRefer ? "true" : "false",
          carRefer: doc.carRefer ? "true" : "false",
          use_nurse: doc.useNurse ? "true" : "false",
          useNurse: doc.useNurse ? "true" : "false",
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
          // Drugs, allergies, etc. — map to form field names
          drugs: doc.data?.drugs || [],
          medicines: doc.data?.drugs || [], // form uses "medicines" not "drugs"
          drugAllergy: doc.data?.drugAllergy || [],
          vaccines: doc.data?.vaccines || [],
          vaccinesCovid: doc.data?.vaccinesCovid || [],
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
          certificationPeriod: doc.referralDeliveryPeriod || "",
          deliveryPeriod: doc.deliveryPeriod || [],
          // Files
          referralFiles: doc.referralFiles || [],
        };
        updateFormData(draftFormData);
        // Signal form to pick up changes
        setDraftLoaded((c) => c + 1);
      }).catch((err) => {
        console.error("[ER Draft] Error loading draft:", err);
      });
    }
  }, [draftId, findOneReferral, setReferInfo, updateFormData]);

  // Load group case data
  useEffect(() => {
    if (groupCase) {
      findGroupCaseFn(groupCase).catch(console.error);
    }
  }, [groupCase, findGroupCaseFn]);

  // Title
  const title = useMemo(() => {
    if (kind === "referER") return "ส่งตัวผู้ป่วย Emergency";
    if (kind === "referBack") return "ส่งตัวผู้ป่วยกลับ OPD";
    return "สร้างการร้องขอส่งตัวผู้ป่วยนอก";
  }, [kind]);

  // Navigate back
  const navigateBack = useCallback(() => {
    if (hasHospital) {
      // Go back to hospital selection
      router.push(`/create/er?kind=${kind}`);
    } else {
      router.push("/create");
    }
  }, [router, kind, hasHospital]);

  // Handle hospital selection complete → navigate with query
  const handleHospitalNext = useCallback(
    (hospitals: SelectedHospital[]) => {
      const query = new URLSearchParams();
      query.set("kind", kind);
      query.set("hospitals", JSON.stringify(hospitals));
      if (draftId) query.set("draft", draftId);
      router.push(`/create/er?${query.toString()}`);
    },
    [router, kind, draftId]
  );

  // ---- Helper functions to match Nuxt payload structure ----

  // Get referralType number from kind string (matching Nuxt's computed referralType)
  const getReferralTypeNumber = useCallback((kindStr: string) => {
    switch (kindStr) {
      case "referER": return 1;
      case "referBack": return 2;
      case "requestReferOut": return 5;
      case "requestReferBack": return 6;
      case "REFER_IN": return 4;
      default: return 0;
    }
  }, []);

  // Get fromHospital based on role (matching Nuxt's getDataFromHospital)
  const getFromHospital = useCallback(() => {
    const roleName = useAuthStore.getState().getRoleName();
    const profile = useAuthStore.getState().profile;
    const optHospital = useAuthStore.getState().optionHospital;
    if (roleName === "superAdminHospital") {
      return profile?.permissionGroup?.id || profile?.hospital?.id;
    } else if (roleName === "superAdmin" || roleName === "superAdminZone") {
      return optHospital;
    }
    return null;
  }, []);

  // Parse toManyHospital from parsedHospitals (matching Nuxt's parseToManyHospital)
  const buildToManyHospital = useCallback(() => {
    return parsedHospitals.map((hos) => ({
      toHospital: hos.id,
      appointmentData: (hos.selectedBranches || []).map((branch) => ({
        doctorBranch: branch.value,
        doctorBranchName: branch.name,
        appointmentType: branch.appointment || undefined,
        appointmentDate: branch.appointmentDate || undefined,
        appointmentTime: branch.appointmentTime || undefined,
        remark: branch.remark || undefined,
      })),
    }));
  }, [parsedHospitals]);

  // Get equipment names array (matching Nuxt's getEquipment)
  const getEquipment = useCallback((): string[] => {
    const equipmentList = formData.requiredEquipment || [];
    return equipmentList
      .map((item: any) => item?.name || item)
      .filter((item: any): item is string => !!item);
  }, [formData]);

  // Build appointmentData from query params (matching Nuxt's getAppointmentData)
  const getAppointmentData = useCallback(() => {
    const branchNames = searchParams.get("branch_names");
    const branchType = searchParams.get("branch_type");
    const branchDatetime = searchParams.get("datetime");
    const branchRemark = searchParams.get("remark");

    if (!branchNames || !branchType) return [];

    const namesArray = branchNames.split(",").map((s) => s.trim());
    const typeArray = branchType.split(",").map((s) => s.trim());
    const dateArray = branchDatetime ? branchDatetime.split(",").map((s) => s.trim()) : [];
    const remarkArray = branchRemark ? branchRemark.split(",").map((s) => s.trim()) : [];

    const maxLength = Math.min(namesArray.length, typeArray.length);
    const appointmentData = [];
    for (let i = 0; i < maxLength; i++) {
      appointmentData.push({
        appointmentType: typeArray[i],
        doctorBranchName: namesArray[i],
        appointmentDate: dateArray[i],
        remark: remarkArray[i],
      });
    }
    return appointmentData;
  }, [searchParams]);

  // Save data
  const handleSave = useCallback(
    async (saveType: "draft" | "submit") => {
      if (isLoading || sendData) return;

      setIsLoading(true);
      setSendData(true);

      try {
        if (saveType === "submit") {
          // Validate required fields
          const requiredFields = [
            "patient_pid",
            "visit_primary_symptom_main_symptom",
            "visit_primary_symptom_current_illness",
            "pe",
            "Imp",
          ];
          const missing = requiredFields.filter((f) => !formData[f]);
          if (missing.length > 0) {
            alert("กรุณาตรวจสอบข้อมูลและกรอกให้ครบถ้วน");
            return;
          }
        } else {
          // Draft: only require PID
          const requiredForDraft = ["patient_pid"];
          const missing = requiredForDraft.filter((f) => !formData[f]);
          if (missing.length > 0) {
            alert("กรุณากรอกเลขบัตรประชาชน");
            return;
          }
        }

        // referralStatus: 1 = ฉบับร่าง (draft), 3 = รอการตอบรับ (submit)
        const referralStatusMap = { draft: 1, submit: 3 } as const;
        const referralStatus = referralStatusMap[saveType] ?? 3;

        const fromHospital = getFromHospital();
        const toManyHospital = buildToManyHospital();
        const referralDeliveryPeriod = formData.certificationPeriod || undefined;

        // Build payload matching Nuxt's ER form structure
        const payload: Record<string, any> = {
          // --- Top-level fields (matching Nuxt referral-er-form.vue) ---
          groupCase: groupCase ? parseInt(groupCase, 10) : undefined,
          referralDeliveryPeriod,
          deliveryPeriod: formData.deliveryPeriod || [],
          isEndAccept: formData.responseRequired || undefined,
          fromHospital,
          toManyHospital,
          referralKind: 1, // 1 = EMERGENCY / 2 = FAST_TRACK / 3 = OPD / 4 = IPD
          // referralType: only send when NOT draft (matching Nuxt logic)
          ...(referInfo?.referralStatus?.name !== "ฉบับร่าง" && {
            referralType: getReferralTypeNumber(kind),
          }),
          referralStatus,
          deliveryPointTypeStart: formData.referralCreationPoint ? Number(formData.referralCreationPoint) : undefined,
          appointmentData: getAppointmentData(),

          // Doctor info
          doctor: formData.prescribingDoctor ? Number(formData.prescribingDoctor) : undefined,
          doctorName: formData.docterName || formData.doctorName || undefined,
          doctorIdentifyNumber: formData.doctorCode || undefined,
          doctorDepartment: formData.medicalDepartment || undefined,
          doctorPhone: formData.doctorContactNumber ? String(formData.doctorContactNumber) : undefined,

          // Referral details
          referralStatusDetail: formData.referral_reason ? Number(formData.referral_reason) : undefined,
          remark: formData.notes || undefined,
          referralCause: formData.referral_cause || formData.referralCause ? Number(formData.referral_cause || formData.referralCause) : undefined,
          reasonForSending: formData.notes || undefined,
          acuteLevel: formData.acute_level || formData.levelOfUrgency ? Number(formData.acute_level || formData.levelOfUrgency) : undefined,
          icuLevel: formData.icuLevel || formData.icu_level ? Number(formData.icuLevel || formData.icu_level) : undefined,
          contagious: Boolean(formData.additionalUrgencyValue === "true"),
          carRefer: Boolean(formData.carRefer === "true"),
          useNurse: Boolean(formData.useNurse === "true"),
          moreDetail: formData.additionalComments || undefined,

          // Equipment
          equipment: getEquipment(),

          // Patient identifiers
          HN: formData.patient_hn || undefined,
          VN: formData.patient_vn || undefined,
          AN: formData.an || formData.patient_an || undefined,

          // Nested data object (matching Nuxt structure)
          data: {
            patient: {
              patient_pid: formData.patient_pid,
              patient_firstname: formData.patient_firstname,
              patient_prefix: formData.patient_prefix,
              patient_lastname: formData.patient_lastname,
              patient_birthday: formData.patient_birthday,
              patient_sex: formData.patient_sex,
              patient_blood_group: formData.patient_blood_group,
              patient_treatment: formData.patient_treatment || "",
              patient_treatment_hospital: formData.patient_treatment_hospital || "",
              // Address
              patient_house: formData.patient_house,
              patient_moo: formData.patient_moo,
              patient_tambon: formData.patient_tambon,
              patient_amphur: formData.patient_amphur,
              patient_alley: formData.patient_alley,
              patient_road: formData.patient_road,
              patient_changwat: formData.patient_changwat,
              patient_zip_code: formData.patient_zip_code || formData.patient_zipcode,
              patient_mobile_phone: formData.patient_phone || formData.patient_mobile_phone,
              // Emergency contact
              patient_contact_full_name: formData.patient_contact_full_name,
              patient_contact_mobile_phone: formData.patient_contact_mobile_phone,
              patient_contact_relation: formData.patient_contact_relation,
              // Disease history
              patient_personal_disease: formData.patient_personal_disease || "",
            },
            physicalExam: formData.physicalExam || undefined,
            disease: formData.disease || undefined,
            drugAllergy: formData.drugAllergy || [],
            diagnosis: [],
            pre_diagnosis: null,
            vaccines: formData.vaccines || [],
            vaccinesCovid: formData.vaccinesCovid || [],
            visitData: {
              temperature: formData.temperature || "",
              bps: formData.bps,
              bpd: formData.bpd,
              pulse: formData.pulse,
              rr: formData.rr || "",
              visit_primary_symptom_main_symptom: formData.visit_primary_symptom_main_symptom || "",
              visit_primary_symptom_current_illness: formData.visit_primary_symptom_current_illness || "",
              pe: formData.pe || undefined,
              Imp: formData.Imp || "",
              moreDetail: formData.moreDetail || "",
              icd10Basic: formData.icd10Basic || "",
              icd10: formData.icd10 || "",
              icd10MoreBasic: formData.icd10MoreBasic || "",
              icd10More: formData.icd10More || "",
            },
            drugs: formData.drugs || formData.medicines || [],
          },
          referralFiles: formData.referralFiles || [],
        };

        console.log("[ER Save] payload:", JSON.stringify(payload, null, 2));

        if (isDraftStatus && referInfo?.id) {
          await updateReferralDocument(referInfo.id, payload);
        } else {
          await createReferralDocument(payload);
        }

        // Show success toast then redirect (matching Nuxt)
        const msg = saveType === "draft" ? "บันทึกฉบับร่างเรียบร้อย" : "บันทึกและส่งตัวเรียบร้อย";
        setSuccessToast({ open: true, message: msg });
        setTimeout(() => {
          router.push("/refer-out/all");
        }, 1500);
      } catch (err: any) {
        console.error("Save error:", err);
        alert(err?.message || "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
      } finally {
        setIsLoading(false);
        setSendData(false);
      }
    },
    [
      isLoading,
      sendData,
      formData,
      parsedHospitals,
      isDraftStatus,
      referInfo,
      kind,
      groupCase,
      searchParams,
      createReferralDocument,
      updateReferralDocument,
      getFromHospital,
      buildToManyHospital,
      getEquipment,
      getAppointmentData,
      getReferralTypeNumber,
      router,
    ]
  );

  // ---- Action Buttons ----
  const ActionButtons = () => (
    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
      {hasHospital && (
        <>
          {/* View selected hospitals */}
          <Button
            variant="contained"
            startIcon={<ListIcon />}
            onClick={() => setViewHospitalsOpen(true)}
            disabled={isLoading}
            sx={{
              bgcolor: "#3b82f6",
              "&:hover": { bgcolor: "#091b63" },
              textTransform: "none",
            }}
          >
            ดูรายการสถานพยาบาลที่ส่งไป
          </Button>

          {/* Draft save */}
          {!isDraftStatus && (
            <Button
              variant="outlined"
              startIcon={isLoading ? <CircularProgress size={18} /> : <SaveIcon />}
              onClick={() => handleSave("draft")}
              disabled={isLoading || sendData}
              sx={{ textTransform: "none" }}
            >
              {isLoading ? "กำลังบันทึก..." : "บันทึกฉบับร่าง"}
            </Button>
          )}

          {/* Submit */}
          {!isDraftStatus && (
            <Button
              variant="contained"
              startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
              onClick={() => handleSave("submit")}
              disabled={isLoading || sendData}
              sx={{
                bgcolor: "#00AF75",
                "&:hover": { bgcolor: "#036245" },
                textTransform: "none",
              }}
            >
              {isLoading ? "กำลังบันทึก..." : "บันทึกและส่งตัว"}
            </Button>
          )}

          {/* Draft edit mode buttons */}
          {isDraftStatus && referInfo?.referralStatus?.name === "ฉบับร่าง" && (
            <>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={() => handleSave("draft")}
                disabled={isLoading || sendData}
                sx={{ textTransform: "none" }}
              >
                {isLoading ? "กำลังบันทึก..." : "บันทึกและแก้ไขฉบับร่าง"}
              </Button>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={() => handleSave("submit")}
                disabled={isLoading || sendData}
                sx={{
                  bgcolor: "#00AF75",
                  "&:hover": { bgcolor: "#036245" },
                  textTransform: "none",
                }}
              >
                {isLoading ? "กำลังบันทึก..." : "บันทึกส่งตัว"}
              </Button>
            </>
          )}

          {/* รอตอบรับ edit mode */}
          {isDraftStatus && referInfo?.referralStatus?.name === "รอตอบรับ" && (
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={() => handleSave("submit")}
              disabled={isLoading || sendData}
              sx={{ textTransform: "none" }}
            >
              {isLoading ? "กำลังบันทึก..." : "บันทึกและแก้ไข"}
            </Button>
          )}
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
          <Button
            onClick={navigateBack}
            sx={{
              minWidth: 44,
              width: 44,
              height: 44,
              border: "2px solid #bbb",
              borderRadius: "4px",
              color: "#000",
            }}
          >
            <ArrowBackIcon />
          </Button>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#00AF75", fontSize: "1.125rem" }}
          >
            {title}
          </Typography>
          {patientInfo?.firstname && patientInfo?.lastname && (
            <Typography variant="body1">
              กำลังส่งตัว : {patientInfo.firstname} {patientInfo.lastname}
            </Typography>
          )}
        </Box>
        <ActionButtons />
      </Box>

      {/* Breadcrumbs */}
      <BreadcrumbsRefer basePath="/create/er" kind={kind} />

      {/* Step 1: Hospital Selection */}
      {!hasHospital && (
        <HospitalSelectorPanel
          kind={kind}
          isEr={true}
          onNext={handleHospitalNext}
          onCancel={() => router.push("/create")}
        />
      )}

      {/* Step 2: Referral Form */}
      {hasHospital && (
        <Box sx={{ mt: 3 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <RequestReferralFormComponent
              kind={kind}
              hospitalName={parsedHospitals[0]?.name || ""}
              branchNames={
                (parsedHospitals[0] as any)?.selectedBranches
                  ?.map((b: any) => b?.name || b)
                  .join(", ") || ""
              }
              searchParams={Object.fromEntries(searchParams.entries())}
              formData={formData}
              onUpdate={updateFormData}
              draftLoaded={draftLoaded}
            />
          </Paper>

          {/* Bottom action buttons */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              mt: 3,
            }}
          >
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon sx={{ color: "#00AF75" }} />}
              onClick={navigateBack}
              sx={{ textTransform: "none" }}
            >
              ย้อนกลับ
            </Button>
            <ActionButtons />
          </Box>
        </Box>
      )}

      {/* View hospitals modal */}
      <ViewSelectedHospitalsModal
        open={viewHospitalsOpen}
        onClose={() => setViewHospitalsOpen(false)}
        hospitals={parsedHospitals}
      />

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

/* ------------------------------------------------------------------ */
/*  Page export with Suspense                                          */
/* ------------------------------------------------------------------ */

export default function ERReferralPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "#00AF75" }} />
        </Box>
      }
    >
      <ERReferralInner />
    </Suspense>
  );
}
