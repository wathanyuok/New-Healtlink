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
  const [patientInfo, setPatientInfo] = useState<{ firstname?: string; lastname?: string } | null>(null);

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

  const handleSave = useCallback(
    async (saveType: "draft" | "submit") => {
      if (isLoading || sendData) return;
      setIsLoading(true);
      setSendData(true);

      try {
        const payload = {
          ...formData,
          referralType: kind,
          hospital: hospitalParam,
          hospitalID: hospitalIDParam,
          branch_names: branchNamesParam,
          saveType,
        };

        if (draftId && referInfo?.id) {
          await updateReferralDocument(referInfo.id, payload);
        } else {
          await createReferralDocument(payload);
        }
        router.push("/follow-delivery");
      } catch (err: any) {
        console.error("Save error:", err);
        alert(err?.message || "ไม่สามารถบันทึกข้อมูลได้");
      } finally {
        setIsLoading(false);
        setSendData(false);
      }
    },
    [isLoading, sendData, formData, kind, hospitalParam, hospitalIDParam, branchNamesParam, draftId, referInfo, createReferralDocument, updateReferralDocument, router]
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
