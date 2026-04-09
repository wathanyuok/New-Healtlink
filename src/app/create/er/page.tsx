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
