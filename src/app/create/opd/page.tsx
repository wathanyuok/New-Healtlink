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
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
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
import LoadingOverlay from "@/components/common/LoadingOverlay";
import {
  useReferralCreateStore,
  type HospitalOption,
  type DoctorBranchOption,
} from "@/stores/referralCreateStore";

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

  // Local state
  const [search, setSearch] = useState("");
  const [zone, setZone] = useState("");
  const [subType, setSubType] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // default 10 rows per page
  const [isLoading, setIsLoading] = useState(false);
  const [sendData, setSendData] = useState(false);
  const [patientInfo, setPatientInfo] = useState<{ firstname?: string; lastname?: string } | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Determine current step
  const isFormStep = !!(branchNamesParam && doctorBranchParam);

  // Title
  const title = useMemo(() => {
    if (kind === "referOut") return "ส่งตัวผู้ป่วยนอก (OPD)";
    if (kind === "referBack") return "ส่งตัวผู้ป่วยกลับ (OPD)";
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

  // Load draft
  useEffect(() => {
    if (draftId) {
      findOneReferral(draftId).then((res: any) => {
        if (res?.referralDocument) setReferInfo(res.referralDocument);
      }).catch(console.error);
    }
  }, [draftId, findOneReferral, setReferInfo]);

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

  // Doctor branch next
  const handleDoctorBranchNext = (branches: DoctorBranchOption[]) => {
    const branchNames = branches.map((b) => b.name).join(",");
    router.push(`/create/opd?${buildQuery({
      hospital: hospitalParam!,
      hospitalID: hospitalIDParam || "",
      deliveryPoint: "true",
      docter_branch: "true",
      branch_names: branchNames,
    })}`);
  };

  // Save
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

  // Breadcrumbs
  const breadcrumbItems = useMemo(() => {
    const items: { name: string; path?: string; isActive?: boolean }[] = [
      { name: "สร้างใบส่งตัว", path: "/create" },
      { name: "เลือกสถานพยาบาลปลายทาง", path: `/create/opd?kind=${kind}`, isActive: !hospitalParam },
    ];
    if (hospitalParam && !deliveryPointParam) {
      items.push({ name: "เลือกจุดส่งต่อ", isActive: true });
    }
    if (deliveryPointParam && doctorBranchParam && !branchNamesParam) {
      items.push({ name: "เลือกจุดส่งต่อ", path: `/create/opd?${buildQuery({ hospital: hospitalParam!, hospitalID: hospitalIDParam || "" })}` });
      items.push({ name: "เลือกสาขา/แผนก", isActive: true });
    }
    if (branchNamesParam) {
      items.push({ name: "เลือกจุดส่งต่อ", path: `/create/opd?${buildQuery({ hospital: hospitalParam!, hospitalID: hospitalIDParam || "" })}` });
      items.push({ name: "เลือกสาขา/แผนก", path: `/create/opd?${buildQuery({ hospital: hospitalParam!, hospitalID: hospitalIDParam || "", deliveryPoint: "true", docter_branch: "true" })}` });
      items.push({ name: "เพิ่มรายละเอียดใบส่งตัว", isActive: true });
    }
    return items;
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

      {/* Step 1: Hospital selection with filter + table + pagination */}
      {!hospitalParam && (
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

      {/* Step 3: Doctor Branch */}
      {hospitalParam && deliveryPointParam && doctorBranchParam && !branchNamesParam && (
        <DoctorBranchSelector hospitalId={hospitalIDParam || ""} hospitalName={hospitalParam} kind={kind} onNext={handleDoctorBranchNext}
          onBack={() => router.push(`/create/opd?${buildQuery({ hospital: hospitalParam, hospitalID: hospitalIDParam || "", deliveryPoint: "true" })}`)} />
      )}

      {/* Step 4: Referral Form */}
      {isFormStep && (
        <Box sx={{ mt: 3 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <OPDReferralForm kind={kind} hospitalName={hospitalParam || ""} branchNames={branchNamesParam || ""} formData={formData} onUpdate={updateFormData} />
          </Paper>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2, mt: 3 }}>
            <Button variant="outlined" startIcon={<ArrowBackIcon sx={{ color: "#00AF75" }} />} onClick={navigateBack} sx={{ textTransform: "none" }}>ย้อนกลับ</Button>
            <ActionButtons />
          </Box>
        </Box>
      )}
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  OPD Referral Form                                                  */
/* ------------------------------------------------------------------ */

interface OPDFormProps { kind: string; hospitalName: string; branchNames: string; formData: Record<string, any>; onUpdate: (partial: Record<string, any>) => void; }

function OPDReferralForm({ kind, hospitalName, branchNames, formData, onUpdate }: OPDFormProps) {
  return (
    <Box>
      <Box sx={{ mb: 3, p: 2, bgcolor: "#f0fdf4", borderRadius: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>สถานพยาบาลปลายทาง: {hospitalName}</Typography>
        <Typography variant="body2" sx={{ color: "#6b7280" }}>สาขา/แผนก: {branchNames}</Typography>
      </Box>
      <SectionTitle title="1. ข้อมูลผู้ป่วย" />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 2, mb: 3 }}>
        <FormField label="เลขบัตรประชาชน *" value={formData.patient_pid || ""} onChange={(v) => onUpdate({ patient_pid: v })} placeholder="กรอกเลขบัตรประชาชน 13 หลัก" />
        <FormField label="HN" value={formData.patient_hn || ""} onChange={(v) => onUpdate({ patient_hn: v })} />
        <FormField label="VN" value={formData.patient_vn || ""} onChange={(v) => onUpdate({ patient_vn: v })} />
        <FormField label="คำนำหน้า" value={formData.patient_prefix || ""} onChange={(v) => onUpdate({ patient_prefix: v })} />
        <FormField label="ชื่อ" value={formData.patient_firstname || ""} onChange={(v) => onUpdate({ patient_firstname: v })} />
        <FormField label="นามสกุล" value={formData.patient_lastname || ""} onChange={(v) => onUpdate({ patient_lastname: v })} />
        <FormField label="วันเกิด" value={formData.patient_birthday || ""} onChange={(v) => onUpdate({ patient_birthday: v })} type="date" />
      </Box>
      <SectionTitle title="2. ข้อมูลการส่งตัว" />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 3 }}>
        <FormField label="ระยะเวลาการรับรอง" value={formData.certificationPeriod || ""} onChange={(v) => onUpdate({ certificationPeriod: v })} />
        <FormField label="วันที่เริ่ม" value={formData.startDate || ""} onChange={(v) => onUpdate({ startDate: v })} type="date" />
        <FormField label="เวลาเริ่ม" value={formData.startTime || ""} onChange={(v) => onUpdate({ startTime: v })} type="time" />
        <FormField label="จุดสร้างใบส่งตัว" value={formData.referralCreationPoint || ""} onChange={(v) => onUpdate({ referralCreationPoint: v })} />
        <FormField label="แพทย์ผู้สั่ง" value={formData.prescribingDoctor || ""} onChange={(v) => onUpdate({ prescribingDoctor: v })} />
      </Box>
      <SectionTitle title="3. สาเหตุการส่งตัว" />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 3 }}>
        <FormField label="สาเหตุการส่งตัว *" value={formData.referralCause || ""} onChange={(v) => onUpdate({ referralCause: v })} />
        <FormField label="ระดับความเร่งด่วน *" value={formData.levelOfUrgency || ""} onChange={(v) => onUpdate({ levelOfUrgency: v })} />
      </Box>
      <SectionTitle title="4. อาการและการวินิจฉัย" />
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2, mb: 3 }}>
        <FormField label="อาการสำคัญ *" value={formData.visit_primary_symptom_main_symptom || ""} onChange={(v) => onUpdate({ visit_primary_symptom_main_symptom: v })} multiline rows={3} />
        <FormField label="ประวัติการเจ็บป่วยปัจจุบัน *" value={formData.visit_primary_symptom_current_illness || ""} onChange={(v) => onUpdate({ visit_primary_symptom_current_illness: v })} multiline rows={3} />
        <FormField label="PE *" value={formData.pe || ""} onChange={(v) => onUpdate({ pe: v })} multiline rows={3} />
        <FormField label="Imp *" value={formData.Imp || ""} onChange={(v) => onUpdate({ Imp: v })} multiline rows={2} />
      </Box>
      <SectionTitle title="5. การรักษาและข้อมูลเพิ่มเติม" />
      <Box sx={{ mb: 3 }}><FormField label="การรักษา" value={formData.treatment || ""} onChange={(v) => onUpdate({ treatment: v })} multiline rows={3} /></Box>
    </Box>
  );
}

/* ---- Shared UI ---- */
function SectionTitle({ title }: { title: string }) {
  return <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#036245", mb: 1.5, pb: 0.5, borderBottom: "2px solid #00AF75" }}>{title}</Typography>;
}
interface FormFieldProps { label: string; value: string; onChange: (val: string) => void; placeholder?: string; type?: string; multiline?: boolean; rows?: number; }
function FormField({ label, value, onChange, placeholder, type = "text", multiline = false, rows }: FormFieldProps) {
  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: "#374151" }}>{label}</Typography>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows || 3}
          style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: "0.875rem", fontFamily: "inherit", resize: "vertical" }} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: "0.875rem", fontFamily: "inherit" }} />
      )}
    </Box>
  );
}

/* ---- Page ---- */
export default function OPDReferralPage() {
  return (
    <Suspense fallback={<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress sx={{ color: "#00AF75" }} /></Box>}>
      <OPDReferralInner />
    </Suspense>
  );
}
