"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Stack,
  Paper,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  ListAlt as ListIcon,
  Save as SaveIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import { useRouter, useSearchParams } from "next/navigation";

import BreadcrumbsRefer from "@/components/referral-create/BreadcrumbsRefer";
import HospitalSelectorPanel from "@/components/referral-create/HospitalSelectorPanel";
import ViewSelectedHospitalsModal from "@/components/referral-create/ViewSelectedHospitalsModal";
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
  const draftId = searchParams.get("draft");
  const groupCase = searchParams.get("groupCase");

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

  // Load draft data if editing
  useEffect(() => {
    if (draftId) {
      findOneReferral(draftId).then((res: any) => {
        if (res?.referralDocument) {
          setReferInfo(res.referralDocument);
        }
      }).catch(console.error);
    }
  }, [draftId, findOneReferral, setReferInfo]);

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
          // Draft: only require PID and HN
          const requiredForDraft = ["patient_pid"];
          const missing = requiredForDraft.filter((f) => !formData[f]);
          if (missing.length > 0) {
            alert("กรุณากรอกเลขบัตรประชาชนและ HN");
            return;
          }
        }

        // Build payload
        const payload = {
          ...formData,
          referralType: kind,
          hospitals: parsedHospitals,
          saveType,
        };

        if (isDraftStatus && referInfo?.id) {
          await updateReferralDocument(referInfo.id, payload);
        } else {
          await createReferralDocument(payload);
        }

        // Success
        router.push("/follow-delivery");
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
      createReferralDocument,
      updateReferralDocument,
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
            <ERReferralForm
              kind={kind}
              hospitals={parsedHospitals}
              isDraft={isDraftStatus}
              referInfo={referInfo}
              formData={formData}
              onUpdate={updateFormData}
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
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  ER Referral Form (Step 2)                                          */
/* ------------------------------------------------------------------ */

interface ERReferralFormProps {
  kind: string;
  hospitals: SelectedHospital[];
  isDraft: boolean;
  referInfo: any;
  formData: Record<string, any>;
  onUpdate: (partial: Record<string, any>) => void;
}

function ERReferralForm({ kind, hospitals, isDraft, referInfo, formData, onUpdate }: ERReferralFormProps) {
  // This is a placeholder for the full form.
  // The actual form will be built with the same sections as the Nuxt version:
  // 1. ข้อมูลผู้ป่วย (Patient info) - PID, HN, VN, name, birthday
  // 2. ข้อมูลการส่งตัว (Referral info) - certification period, start date/time, creation point, doctor
  // 3. สาเหตุการส่งตัว (Referral cause) - cause dropdown, urgency level, ICU level
  // 4. อาการและการวินิจฉัย (Symptoms & diagnosis) - main symptom, current illness, PE, Imp, ICD-10
  // 5. การรักษาและข้อมูลเพิ่มเติม (Treatment) - treatment details, delivery period, attachments

  return (
    <Box>
      {/* Section 1: ข้อมูลผู้ป่วย */}
      <SectionTitle title="1. ข้อมูลผู้ป่วย" />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 2, mb: 3 }}>
        <FormField
          label="เลขบัตรประชาชน *"
          value={formData.patient_pid || ""}
          onChange={(v) => onUpdate({ patient_pid: v })}
          placeholder="กรอกเลขบัตรประชาชน 13 หลัก"
        />
        <FormField
          label="HN"
          value={formData.patient_hn || ""}
          onChange={(v) => onUpdate({ patient_hn: v })}
          placeholder="กรอก HN"
        />
        <FormField
          label="VN"
          value={formData.patient_vn || ""}
          onChange={(v) => onUpdate({ patient_vn: v })}
          placeholder="กรอก VN"
        />
        <FormField
          label="คำนำหน้า"
          value={formData.patient_prefix || ""}
          onChange={(v) => onUpdate({ patient_prefix: v })}
        />
        <FormField
          label="ชื่อ"
          value={formData.patient_firstname || ""}
          onChange={(v) => onUpdate({ patient_firstname: v })}
        />
        <FormField
          label="นามสกุล"
          value={formData.patient_lastname || ""}
          onChange={(v) => onUpdate({ patient_lastname: v })}
        />
        <FormField
          label="วันเกิด"
          value={formData.patient_birthday || ""}
          onChange={(v) => onUpdate({ patient_birthday: v })}
          type="date"
        />
      </Box>

      {/* Section 2: ข้อมูลการส่งตัว */}
      <SectionTitle title="2. ข้อมูลการส่งตัว" />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 3 }}>
        <FormField
          label="ระยะเวลาการรับรอง"
          value={formData.certificationPeriod || ""}
          onChange={(v) => onUpdate({ certificationPeriod: v })}
        />
        <FormField
          label="วันที่เริ่ม"
          value={formData.startDate || ""}
          onChange={(v) => onUpdate({ startDate: v })}
          type="date"
        />
        <FormField
          label="เวลาเริ่ม"
          value={formData.startTime || ""}
          onChange={(v) => onUpdate({ startTime: v })}
          type="time"
        />
        <FormField
          label="จุดสร้างใบส่งตัว"
          value={formData.referralCreationPoint || ""}
          onChange={(v) => onUpdate({ referralCreationPoint: v })}
        />
        <FormField
          label="แพทย์ผู้สั่ง"
          value={formData.prescribingDoctor || ""}
          onChange={(v) => onUpdate({ prescribingDoctor: v })}
        />
      </Box>

      {/* Section 3: สาเหตุการส่งตัว */}
      <SectionTitle title="3. สาเหตุการส่งตัว" />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 2, mb: 3 }}>
        <FormField
          label="สาเหตุการส่งตัว *"
          value={formData.referralCause || ""}
          onChange={(v) => onUpdate({ referralCause: v })}
        />
        <FormField
          label="ระดับความเร่งด่วน *"
          value={formData.levelOfUrgency || ""}
          onChange={(v) => onUpdate({ levelOfUrgency: v })}
        />
        <FormField
          label="ระดับ ICU"
          value={formData.icuLevel || ""}
          onChange={(v) => onUpdate({ icuLevel: v })}
        />
      </Box>

      {/* Section 4: อาการและการวินิจฉัย */}
      <SectionTitle title="4. อาการและการวินิจฉัย" />
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2, mb: 3 }}>
        <FormField
          label="อาการสำคัญ *"
          value={formData.visit_primary_symptom_main_symptom || ""}
          onChange={(v) => onUpdate({ visit_primary_symptom_main_symptom: v })}
          multiline
          rows={3}
        />
        <FormField
          label="ประวัติการเจ็บป่วยปัจจุบัน *"
          value={formData.visit_primary_symptom_current_illness || ""}
          onChange={(v) => onUpdate({ visit_primary_symptom_current_illness: v })}
          multiline
          rows={3}
        />
        <FormField
          label="PE *"
          value={formData.pe || ""}
          onChange={(v) => onUpdate({ pe: v })}
          multiline
          rows={3}
        />
        <FormField
          label="Imp (การวินิจฉัยเบื้องต้น) *"
          value={formData.Imp || ""}
          onChange={(v) => onUpdate({ Imp: v })}
          multiline
          rows={2}
        />
      </Box>

      {/* Section 5: การรักษา */}
      <SectionTitle title="5. การรักษาและข้อมูลเพิ่มเติม" />
      <Box sx={{ mb: 3 }}>
        <FormField
          label="การรักษา"
          value={formData.treatment || ""}
          onChange={(v) => onUpdate({ treatment: v })}
          multiline
          rows={3}
        />
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared UI helpers                                                  */
/* ------------------------------------------------------------------ */

function SectionTitle({ title }: { title: string }) {
  return (
    <Typography
      variant="subtitle1"
      sx={{
        fontWeight: 700,
        color: "#036245",
        mb: 1.5,
        pb: 0.5,
        borderBottom: "2px solid #00AF75",
      }}
    >
      {title}
    </Typography>
  );
}

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
  rows?: number;
}

function FormField({ label, value, onChange, placeholder, type = "text", multiline = false, rows }: FormFieldProps) {
  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>
        {label}
      </Typography>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows || 3}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            fontSize: "0.875rem",
            fontFamily: "inherit",
            resize: "vertical",
          }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            fontSize: "0.875rem",
            fontFamily: "inherit",
          }}
        />
      )}
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
