"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import { useReferralCreateStore, type DeliveryPointOption } from "@/stores/referralCreateStore";
import { useAuthStore } from "@/stores/authStore"; // accessed via getState() to avoid re-render loops

interface DeliveryPointSelectorProps {
  hospitalId: string | number;
  kind?: string;
  onNext: (deliveryPointId: number, deliveryPointName: string, phone?: string) => void;
  onBack: () => void;
}

/* Green map-pin icon matching Nuxt original */
function MapPinIcon() {
  return (
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        bgcolor: "#f0fdf4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
          fill="#036245"
        />
        <circle cx="12" cy="9" r="2.5" fill="#fff" />
        <path
          d="M12 8.5a.5.5 0 110 1 .5.5 0 010-1z"
          fill="#036245"
        />
        {/* Plus icon inside pin */}
        <rect x="11.25" y="7" width="1.5" height="4" rx="0.5" fill="#036245" />
        <rect x="10" y="8.25" width="4" height="1.5" rx="0.5" fill="#036245" />
      </svg>
    </Box>
  );
}

export default function DeliveryPointSelector({
  hospitalId,
  kind,
  onNext,
  onBack,
}: DeliveryPointSelectorProps) {
  const { deliveryPoints, fetchDeliveryPoints, loading } = useReferralCreateStore();
  const [skipChecked, setSkipChecked] = useState(false);

  useEffect(() => {
    // Nuxt logic for requestReferOut/referOut:
    //   superAdmin → uses optionHospital (navbar dropdown), or undefined if not selected
    //   normal user → uses user's own hospital from profile
    // For requestReferBack/referBack → uses target hospitalId with "จุดสร้างใบส่งตัว"
    const isBackFlow = kind === "requestReferBack" || kind === "referBack";
    const useFor = isBackFlow ? "จุดสร้างใบส่งตัว" : "จุดรับใบส่งตัว";

    let fetchHospitalId: string | undefined;
    if (isBackFlow) {
      // referBack: use target hospital from URL
      fetchHospitalId = String(hospitalId);
    } else {
      // referOut/requestReferOut: use user's own hospital (Nuxt handleAction logic)
      const authState = useAuthStore.getState();
      const roleName = authState.getRoleName();
      if (roleName === "superAdmin") {
        // superAdmin uses optionHospital from navbar dropdown; if not set → no hospital filter
        fetchHospitalId = authState.optionHospital ? String(authState.optionHospital) : undefined;
      } else {
        // Normal user uses their own hospital from profile
        const ownHospitalId = (authState.profile as any)?.permissionGroup?.hospital?.id;
        fetchHospitalId = ownHospitalId ? String(ownHospitalId) : undefined;
      }
    }

    const params: any = { useFor };
    if (fetchHospitalId) params.hospital = fetchHospitalId;
    fetchDeliveryPoints(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalId, kind]);

  const handleSelectPoint = (point: DeliveryPointOption) => {
    onNext(point.id, point.name, point.phone);
  };

  const handleSkip = () => {
    // Skip delivery point selection — pass 0 and empty name
    onNext(0, "");
  };

  return (
    <Box sx={{ mt: 3 }}>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "#00AF75" }} />
        </Box>
      ) : deliveryPoints.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography color="textSecondary">ไม่พบจุดรับใบส่งตัวสำหรับสถานพยาบาลนี้</Typography>
        </Box>
      ) : (
        /* Card grid - 3 columns matching Nuxt */
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "1fr 1fr 1fr",
            },
            gap: 2,
          }}
        >
          {deliveryPoints.map((point) => (
            <Box
              key={point.id}
              onClick={() => handleSelectPoint(point)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                px: 2.5,
                py: 3,
                bgcolor: "#fff",
                borderRadius: "16px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                border: "1px solid transparent",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  borderColor: "#00AF75",
                  transform: "translateY(-1px)",
                },
              }}
            >
              <MapPinIcon />
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 700,
                    color: "#1f2937",
                    lineHeight: 1.3,
                    wordBreak: "break-word",
                  }}
                >
                  {point.name}
                </Typography>
                {point.phone && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#9ca3af",
                      mt: 0.5,
                      display: "block",
                    }}
                  >
                    {point.phone}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Bottom bar - matching Nuxt: ยกเลิก on left, checkbox + ข้าม on right */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          mt: 4,
          pt: 2,
          gap: 2,
        }}
      >
        {/* Left: Cancel */}
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{
            color: "#00AF75",
            borderColor: "#00AF75",
            textTransform: "none",
            borderRadius: "8px",
            "&:hover": { borderColor: "#036245", bgcolor: "#f0fdf4" },
          }}
        >
          ยกเลิก
        </Button>

        {/* Right: Checkbox + Skip */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Checkbox
            checked={skipChecked}
            onChange={(e) => setSkipChecked(e.target.checked)}
            sx={{
              color: "#d1d5db",
              "&.Mui-checked": { color: "#00AF75" },
              p: 0.5,
            }}
          />
          <Typography
            variant="body2"
            sx={{ color: "#374151", mr: 1, userSelect: "none", cursor: "pointer" }}
            onClick={() => setSkipChecked(!skipChecked)}
          >
            ไม่ระบุ/ไม่ทราบจุดรับใบส่งตัวที่แน่ชัด
          </Typography>
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            disabled={!skipChecked}
            onClick={handleSkip}
            sx={{
              bgcolor: "#00AF75",
              "&:hover": { bgcolor: "#036245" },
              "&.Mui-disabled": { bgcolor: "#e5e7eb", color: "#9ca3af" },
              textTransform: "none",
              borderRadius: "8px",
            }}
          >
            ข้าม
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
