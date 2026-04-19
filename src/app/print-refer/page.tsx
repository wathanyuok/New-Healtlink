"use client";

import React, { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useReferralStore } from "@/stores/referralStore";
import { useAuthStore } from "@/stores/authStore";

/* ── helpers ── */
function fmtDateThai(d: any) {
  if (!d) return "-";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return String(d);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear() + 543;
    return `${dd}/${mm}/${yyyy}`;
  } catch { return String(d); }
}
function fmtTimeThai(d: any) {
  if (!d) return "-";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return "-";
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  } catch { return "-"; }
}
function calcAge(birthday: string | undefined | null): string {
  if (!birthday) return "-";
  try {
    const b = new Date(birthday);
    if (isNaN(b.getTime())) return "-";
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--;
    return `${Math.max(0, age)} ปี`;
  } catch { return "-"; }
}

/* ── styles (inline for PDF capture) ── */
const S = {
  page: { width: "210mm", minHeight: "280mm", padding: "7mm", background: "#fff", margin: "8px auto", fontFamily: "Sarabun, sans-serif", fontSize: "10px", color: "#111827", lineHeight: 1.4 } as React.CSSProperties,
  sectionTitle: { fontFamily: "Sarabun, sans-serif", fontSize: "10px", fontWeight: 400, lineHeight: "24px", color: "#00AF75", borderBottom: "1px solid #00AF75", marginBottom: "4px" } as React.CSSProperties,
  label: { color: "#6b7280", marginRight: "4px" } as React.CSSProperties,
  row: { display: "flex", flexWrap: "wrap" as const, lineHeight: 1.4 },
  half: { width: "50%", padding: "0" } as React.CSSProperties,
  third: { width: "33.33%" } as React.CSSProperties,
  sixth: { width: "16.66%" } as React.CSSProperties,
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" } as React.CSSProperties,
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px" } as React.CSSProperties,
  grid6: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" } as React.CSSProperties,
  separator: { borderTop: "1px solid #e5e7eb", marginTop: "4px" } as React.CSSProperties,
  table: { width: "100%", fontSize: "10px", borderCollapse: "collapse" as const } as React.CSSProperties,
  th: { textAlign: "left" as const, fontWeight: 400, color: "#6b7280", padding: "2px 0" } as React.CSSProperties,
  td: { padding: "1px 0" } as React.CSSProperties,
  pageBreak: { pageBreakAfter: "always" as const, breakAfter: "page" as const } as React.CSSProperties,
};

function PrintReferPageInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const pdfRef = useRef<HTMLDivElement>(null);

  const { findOneReferral } = useReferralStore();
  const { profile } = useAuthStore();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const res = await findOneReferral(id, true);
      setData(res?.referralDocument || res);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [id, findOneReferral]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-generate PDF once data loads
  useEffect(() => {
    if (!data || !pdfRef.current || generating) return;
    const timer = setTimeout(() => generatePdf(), 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  /* ── embed Thai font into jsPDF for footer ── */
  const embedFooterFont = async (pdf: any) => {
    try {
      const res = await fetch("/fonts/Sarabun-Regular.ttf");
      const buf = await res.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buf).reduce((d, byte) => d + String.fromCharCode(byte), "")
      );
      pdf.addFileToVFS("Sarabun.ttf", base64);
      pdf.addFont("Sarabun.ttf", "Sarabun", "normal");
      pdf.setFont("Sarabun", "normal");
    } catch {
      pdf.setFont("helvetica", "normal");
    }
  };

  /* ── add footer to every page: "Print by: …" left,  "หน้า X / Y" right ── */
  const addFooterToPages = async (pdf: any, footerName: string) => {
    await embedFooterFont(pdf);

    const pageCount = pdf.internal.getNumberOfPages();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.setFontSize(9);
    pdf.setTextColor("#2563eb"); // blue like Nuxt

    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      // Left: "Print by: username"
      if (footerName) {
        pdf.text(`Print by: ${footerName}`, 10, pageHeight - 8, { align: "left" });
      }
      // Right: "หน้า X / Y"
      pdf.text(`หน้า ${i} / ${pageCount}`, pageWidth - 10, pageHeight - 8, { align: "right" });
    }
  };

  const generatePdf = async () => {
    if (!pdfRef.current) return;
    setGenerating(true);
    setProgress(10);

    try {
      // Dynamic import html2pdf (client-only)
      const html2pdf = (await import("html2pdf.js")).default;
      setProgress(30);

      const el = pdfRef.current;
      // Preserve original styles
      const prevOverflow = el.style.overflow;
      const prevHeight = el.style.height;
      const prevMinHeight = el.style.minHeight;
      const prevPadding = el.style.padding;
      // Prepare for capture — expand to full content
      el.style.overflow = "visible";
      el.style.height = "auto";
      el.style.minHeight = "auto";
      el.style.padding = "5mm";

      // Wait for layout to settle
      await new Promise((r) => setTimeout(r, 300));

      setProgress(50);

      const userFullName = profile?.fullName || profile?.username || "";
      const fileName = `ใบส่งตัว_${data?.runNumber || data?.id || "referral"}.pdf`;

      const opt = {
        margin: [0, 0, 0, 0],
        filename: fileName,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
        pagebreak: { mode: ["css", "legacy"] },
      };

      setProgress(70);

      // Generate PDF, add footer, then output as blob
      const pdfBlob: Blob = await html2pdf()
        .set(opt)
        .from(el)
        .toPdf()
        .get("pdf")
        .then(async (pdf: any) => {
          await addFooterToPages(pdf, userFullName);
          return pdf.output("blob") as Blob;
        });

      setProgress(90);

      // Restore original styles
      el.style.overflow = prevOverflow;
      el.style.height = prevHeight;
      el.style.minHeight = prevMinHeight;
      el.style.padding = prevPadding;

      const pdfUrl = URL.createObjectURL(pdfBlob);
      // Open blob in new tab (same as Nuxt's printPdf)
      // User needs to allow popups for localhost:3002 in Chrome
      const printWindow = window.open(pdfUrl, "_blank");
      if (printWindow) {
        printWindow.addEventListener("load", () => {
          setTimeout(() => {
            printWindow.print();
            setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
          }, 1000);
        });
      }

      setProgress(100);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "Sarabun, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "18px", marginBottom: "12px" }}>กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div style={{ textAlign: "center", padding: "40px", fontFamily: "Sarabun, sans-serif" }}>ไม่พบข้อมูลใบส่งตัว</div>;
  }

  /* ── data shortcuts ── */
  const p = data.data?.patient || {};
  const v = data.data?.visitData || {};
  const diseases = Array.isArray(data.data?.disease) ? data.data.disease : [];
  const drugAllergy = Array.isArray(data.data?.drugAllergy) ? data.data.drugAllergy : [];
  const vaccines = Array.isArray(data.data?.vaccines) ? data.data.vaccines : [];
  const vaccinesCovid = Array.isArray(data.data?.vaccinesCovid) ? data.data.vaccinesCovid : [];
  const drugs = Array.isArray(data.data?.drugs) ? data.data.drugs : [];
  const icd10 = Array.isArray(v.icd10) ? v.icd10 : [];
  const icd10More = Array.isArray(v.icd10More) ? v.icd10More : [];
  const appointments = Array.isArray(data.appointmentData) ? data.appointmentData : [];
  // Print page uses referraltype query to decide which hospital is header/origin
  // For refer-out: fromHospital = origin (header), toHospital = destination (ส่งถึง)
  const referralType = searchParams.get("referraltype") || "refer-out";
  const fromHosp = data.fromHospital || {};
  const toHosp = data.toHospital || {};
  // Header hospital (origin) — matches Nuxt getHospitalNameByPath
  const headerHosp = referralType === "refer-in" ? toHosp : fromHosp;
  // Destination hospital — matches Nuxt geToHospitalNameByPath
  const destHosp = referralType === "refer-in" ? fromHosp : toHosp;
  const doctor = data.doctor || {};
  const createdByUser = data.createdBy ? `${data.createdBy.prefix || ""} ${data.createdBy.firstName || ""} ${data.createdBy.lastName || ""}`.trim() : "-";
  const doctorName = `${doctor.prefix || ""} ${doctor.firstName || ""} ${doctor.lastName || ""}`.trim() || "-";

  return (
    <>
      {/* Loading overlay — only visible while generating PDF */}
      {generating && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", padding: "2rem", borderRadius: "12px", textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.3)", minWidth: "300px" }}>
            <div style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>กำลังสร้าง PDF...</div>
            <div style={{ width: "200px", height: "6px", background: "#e5e7eb", borderRadius: "3px", overflow: "hidden", margin: "0 auto" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "#00AF75", transition: "width 0.3s" }} />
            </div>
          </div>
        </div>
      )}

      <div ref={pdfRef} style={{ ...S.page, overflow: "visible" }}>
        {/* ══════ HEADER ══════ */}
        <div style={{ paddingBottom: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
            {/* Left: hospital info */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img src="/images/logo2.png" alt="Logo" style={{ width: "48px", height: "48px", objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <div style={{ fontSize: "10px", lineHeight: 1.3 }}>
                <div style={{ fontWeight: 600, marginBottom: "2px" }}>{headerHosp.name || "-"}</div>
                {[headerHosp.address, headerHosp.subDistrict, headerHosp.district, headerHosp.province, headerHosp.postalCode].filter(Boolean).length > 0 && (
                  <div style={{ fontSize: "9px" }}>{[headerHosp.address, headerHosp.subDistrict, headerHosp.district, headerHosp.province, headerHosp.postalCode].filter(Boolean).join(" ")}</div>
                )}
                <div style={{ fontSize: "9px" }}>โทรศัพท์ {headerHosp.phone || "-"}</div>
              </div>
            </div>
            {/* Right: document info */}
            <div style={{ textAlign: "right", fontSize: "10px", lineHeight: 1.3 }}>
              <div>เลขที่ใบส่งตัว : {data.runNumber || "-"}</div>
              <div style={{ fontSize: "9px" }}>วันที่สร้างใบส่งตัว : {fmtDateThai(data.createdAt)}</div>
              <div style={{ fontSize: "9px" }}>เวลาสร้างใบส่งตัว : {fmtTimeThai(data.createdAt)} น.</div>
            </div>
          </div>
          <div style={{ textAlign: "center", margin: "4px 0" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>ใบรับรองสำหรับรับส่งผู้ป่วยไปรับการตรวจหรือรักษาต่อ</h2>
          </div>
        </div>

        {/* ══════ DOCUMENT INFO ══════ */}
        <div style={S.sectionTitle}>ข้อมูลเกี่ยวกับเอกสาร</div>
        <div style={S.row}>
          <div style={S.half}><span style={S.label}>จาก :</span>{headerHosp.name || "-"}</div>
          <div style={S.half}><span style={S.label}>ส่งถึง :</span>{destHosp.name || "-"}</div>
          <div style={S.half}><span style={S.label}>โทรศัพท์ :</span>{headerHosp.phone || "-"}</div>
          <div style={S.half}><span style={S.label}>โทรศัพท์ :</span>{destHosp.phone || "-"}</div>
          <div style={S.half}><span style={S.label}>จุดสร้างใบส่งตัว :</span>{data.deliveryPointTypeStart?.name || "-"}</div>
          <div style={S.half}><span style={S.label}>จุดรับใบส่งตัว :</span>{data.deliveryPointTypeEnd?.name || "-"}</div>
          <div style={S.half}><span style={S.label}>เบอร์โทรจุดสร้างใบส่งตัว :</span>{data.deliveryPointTypeStart?.phone || "-"}</div>
          <div style={S.half}><span style={S.label}>เบอร์โทรจุดรับใบส่งตัว :</span>{data.deliveryPointTypeEnd?.phone || "-"}</div>
        </div>
        <div style={{ ...S.separator, paddingTop: "4px" }}>
          <div style={S.row}>
            <div style={S.half}><span style={S.label}>ประเภทผู้ป่วยที่ส่งตัว :</span>{data.referralKind?.name || "-"}</div>
            <div style={S.half}><span style={S.label}>คนไข้เป็นโรคติดต่อ :</span>{data.contagious ? "ใช่" : "ไม่"}</div>
            <div style={S.half}><span style={S.label}>ความเห็นเพิ่มเติม :</span>{data.moreDetail || "-"}</div>
          </div>
        </div>
        <div style={S.separator}>
          <div style={S.grid3}>
            <div><div style={S.label}>เหตุผลการส่งตัว</div><div>{data.referralStatusDetail?.name || "-"}</div></div>
            <div><div style={S.label}>สาเหตุการส่งตัว</div><div>{data.referralCause?.name || "-"}</div></div>
            <div><div style={S.label}>หมายเหตุ</div><div>{data.remark || "-"}</div></div>
          </div>
        </div>
        {appointments.length > 0 && (
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <div style={{ flex: 1 }}>
              <div style={S.label}>สาขา/แผนกที่ส่งต่อ</div>
              {appointments.map((a: any, i: number) => <div key={i} style={{ marginBottom: "4px" }}>{a.doctorBranchName || "-"}</div>)}
            </div>
            {data.referralStatus?.name !== "รอตอบรับ" && (
              <>
                <div style={{ flex: 1 }}>
                  <div style={S.label}>วัน/เวลานัดหมาย</div>
                  {appointments.map((a: any, i: number) => <div key={i} style={{ marginBottom: "4px" }}>{a.appointmentType === "รอนัดรักษาต่อเนื่อง" ? "รอนัดรักษาต่อเนื่อง" : fmtDateThai(a.appointmentDate)}</div>)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={S.label}>หมายเหตุ</div>
                  {appointments.map((a: any, i: number) => <div key={i} style={{ marginBottom: "4px" }}>{a.remark || "-"}</div>)}
                </div>
              </>
            )}
          </div>
        )}
        <div style={S.separator} />

        {/* ══════ PATIENT INFO ══════ */}
        <div style={S.sectionTitle}>ข้อมูลผู้ป่วย</div>
        <div style={{ display: "flex", gap: "8px", margin: "4px" }}>
          <div style={{ width: "80px", height: "96px", border: "1px solid #d1d5db", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: "9px", color: "#6b7280", textAlign: "center" }}>ไม่มี<br />รูปภาพ</span>
          </div>
          <div style={{ ...S.grid2, flex: 1 }}>
            <div>
              <div><span style={S.label}>เลขที่บัตรประชาชน/หนังสือเดินทาง :</span>{p.patient_pid || "-"}</div>
              <div style={S.grid3}>
                <div><span style={S.label}>คำนำหน้า :</span><br />{p.patient_prefix || "-"}</div>
                <div><span style={S.label}>ชื่อ :</span><br />{p.patient_firstname || "-"}</div>
                <div><span style={S.label}>นามสกุล :</span><br />{p.patient_lastname || "-"}</div>
                <div><span style={S.label}>เพศ :</span><br />{p.patient_sex || "-"}</div>
              </div>
              <div style={S.grid3}>
                <div><span style={S.label}>วันเกิด :</span><br />{fmtDateThai(p.patient_birthday)}</div>
                <div><span style={S.label}>อายุ :</span><br />{calcAge(p.patient_birthday)}</div>
                <div><span style={S.label}>กรุ๊ปเลือด :</span><br />{p.patient_blood_group || "-"}</div>
              </div>
            </div>
            <div>
              <div style={S.grid3}>
                <div><span style={S.label}>HN :</span><br />{data.HN || "-"}</div>
                <div><span style={S.label}>AN :</span><br />{data.AN || "-"}</div>
                <div><span style={S.label}>VN ล่าสุด :</span><br />{data.VN || "-"}</div>
              </div>
              <div style={S.grid2}>
                <div><span style={S.label}>สิทธิการรักษา :</span><br />{p.patient_treatment || "-"}</div>
                <div><span style={S.label}>สิทธิ์สถานพยาบาล :</span><br />{p.patient_treatment_hospital || "-"}</div>
              </div>
              <div><span style={S.label}>เบอร์โทรผู้ป่วย :</span>{p.patient_mobile_phone || "-"}</div>
            </div>
          </div>
        </div>
        {/* Address */}
        <div style={{ ...S.separator, paddingTop: "4px" }}>
          <div style={S.grid6}>
            <div><span style={S.label}>บ้านเลขที่ :</span> {p.patient_house || "-"}</div>
            <div><span style={S.label}>หมู่ :</span> {p.patient_moo || "-"}</div>
            <div><span style={S.label}>ตำบล/แขวง :</span> {p.patient_tambon || "-"}</div>
            <div><span style={S.label}>อำเภอ/เขต :</span> {p.patient_amphur || "-"}</div>
            <div><span style={S.label}>ถนน/สาย :</span> {p.patient_road || "-"}</div>
            <div><span style={S.label}>ซอย/ตรอก :</span> {p.patient_alley || "-"}</div>
          </div>
          <div style={{ ...S.grid3, marginTop: "8px" }}>
            <div><span style={S.label}>จังหวัด :</span> {p.patient_changwat || "-"}</div>
            <div><span style={S.label}>รหัสไปรษณีย์ :</span> {p.patient_zip_code || "-"}</div>
          </div>
          <div style={{ ...S.grid3, marginTop: "8px" }}>
            <div><span style={S.label}>ติดต่อในกรณีฉุกเฉิน :</span> {p.patient_contact_full_name || "-"}</div>
            <div><span style={S.label}>เบอร์โทร :</span> {p.patient_contact_mobile_phone || "-"}</div>
            <div><span style={S.label}>เกี่ยวข้องเป็น :</span> {p.patient_contact_relation || "-"}</div>
          </div>
        </div>

        {/* ══════ HEALTH HISTORY ══════ */}
        <div style={{ ...S.sectionTitle, marginTop: "8px" }}>ข้อมูลสุขภาพที่ประจำตัวผู้ป่วย</div>
        <div style={{ ...S.grid2, margin: "4px", gap: "16px" }}>
          <div>
            <div style={S.label}>โรคประจำตัว</div>
            {diseases.length > 0 ? diseases.map((d: any, i: number) => <div key={i}>{i + 1}. {d.name || "-"}</div>) : <div>-</div>}
          </div>
          <div>
            <div style={S.label}>ประวัติการแพ้</div>
            {drugAllergy.length > 0 ? drugAllergy.map((d: any, i: number) => <div key={i}>{i + 1}. {d.name || "-"}</div>) : <div>-</div>}
          </div>
        </div>
        {vaccines.length > 0 && (
          <div style={S.separator}>
            <table style={S.table}>
              <thead><tr><th style={S.th}>วัคซีนล่าสุด</th><th style={S.th}>วันที่ได้รับ</th><th style={S.th}>สถานที่รับ</th></tr></thead>
              <tbody>{vaccines.map((vc: any, i: number) => <tr key={i}><td style={S.td}>{i + 1}. {vc.vaccineName || "-"}</td><td style={S.td}>{vc.date ? fmtDateThai(vc.date) : "-"}</td><td style={S.td}>{vc.location || "-"}</td></tr>)}</tbody>
            </table>
          </div>
        )}
        {vaccinesCovid.length > 0 && (
          <table style={{ ...S.table, marginBottom: "8px" }}>
            <thead><tr><th style={S.th}>วัคซีนโควิด</th><th style={S.th}>วันที่ได้รับ</th><th style={S.th}>สถานที่รับ</th></tr></thead>
            <tbody>{vaccinesCovid.map((vc: any, i: number) => <tr key={i}><td style={S.td}>{i + 1}. {vc.name || vc.vaccineName || "-"}</td><td style={S.td}>{vc.date ? fmtDateThai(vc.date) : "-"}</td><td style={S.td}>{vc.location || "-"}</td></tr>)}</tbody>
          </table>
        )}
        <div style={S.separator} />

        {/* ══════ MEDICAL INFO ══════ */}
        <div style={S.sectionTitle}>ข้อมูลทางการแพทย์</div>
        <div style={{ display: "flex", justifyContent: "space-between", margin: "4px 0" }}>
          <div><span style={S.label}>อุณหภูมิ :</span> {v.temperature || "-"}°C</div>
          <div><span style={S.label}>BP :</span> {v.bps || "-"} / {v.bpd || "-"}</div>
          <div><span style={S.label}>PR :</span> {v.pulse || "-"} / min</div>
          <div><span style={S.label}>RR :</span> {v.rr || "-"} / min</div>
        </div>
        <div style={S.separator} />
        <div style={{ marginTop: "4px" }}>
          <div><span style={S.label}>อาการนำ :</span> {v.visit_primary_symptom_main_symptom || "-"}</div>
          <div style={{ display: "flex" }}><span style={{ ...S.label, whiteSpace: "nowrap" }}>รายละเอียดการป่วยปัจจุบัน :</span> {v.visit_primary_symptom_current_illness || "-"}</div>
          <div style={{ display: "flex" }}><span style={{ ...S.label, whiteSpace: "nowrap" }}>การรักษาที่ทำแล้ว :</span> {v.pe || "-"}</div>
          <div style={{ display: "flex" }}><span style={{ ...S.label, whiteSpace: "nowrap" }}>วินิจฉัยโรคเบื้องต้น :</span> {v.Imp || "-"}</div>
          <div><span style={S.label}>ข้อมูลเพิ่มเติมอื่นๆ :</span> {v.moreDetail || "-"}</div>
        </div>
        <div style={S.separator} />

        {/* ICD-10 */}
        <table style={S.table}>
          <thead><tr style={{ color: "#6b7280" }}><th style={S.th}>โรคหลักที่ต้องการให้รักษา (ICD-10)</th><th style={S.th}>ชื่อโรคภาษาไทย</th><th style={S.th}>ชื่อโรคภาษาอังกฤษ</th></tr></thead>
          <tbody>
            {icd10.length > 0 ? icd10.map((item: any, i: number) => <tr key={i}><td style={S.td}>{i + 1}. {item.icd_10_tm || "-"}</td><td style={S.td}>{item.diagetname || "-"}</td><td style={S.td}>{item.diagename || "-"}</td></tr>)
            : <tr><td style={{ ...S.td, textAlign: "center" }} colSpan={3}>-</td></tr>}
          </tbody>
        </table>
        {icd10More.length > 0 && (
          <table style={S.table}>
            <thead><tr style={{ color: "#6b7280" }}><th style={S.th}>โรคร่วมที่ต้องการให้รักษา (ICD-10)</th><th style={S.th}>ชื่อโรคภาษาไทย</th><th style={S.th}>ชื่อโรคภาษาอังกฤษ</th></tr></thead>
            <tbody>{icd10More.map((item: any, i: number) => <tr key={i}><td style={S.td}>{i + 1}. {item.icd_10_tm || "-"}</td><td style={S.td}>{item.diagetname || "-"}</td><td style={S.td}>{item.diagename || "-"}</td></tr>)}</tbody>
          </table>
        )}

        {/* Medications */}
        <table style={{ ...S.table, borderTop: "1px solid #e5e7eb", marginBottom: "8px" }}>
          <thead><tr style={{ color: "#6b7280" }}><th style={S.th}>รายการยา</th><th style={S.th}>จำนวน</th><th style={S.th}>วิธีใช้</th><th style={S.th}>Memo</th></tr></thead>
          <tbody>
            {drugs.length > 0 ? drugs.map((d: any, i: number) => <tr key={i}><td style={S.td}>{i + 1}. {d.drugname || "-"}</td><td style={S.td}>{d.qty || "-"}</td><td style={S.td}>{d.drugusage || "-"}</td><td style={S.td}>{d.strength || "-"}</td></tr>)
            : <tr><td style={{ ...S.td, textAlign: "center" }} colSpan={4}>-</td></tr>}
          </tbody>
        </table>

        {/* Page break */}
        <div className="html2pdf__page-break" style={S.pageBreak} />

        {/* ══════ DOCTOR INFO + DELIVERY PERIOD ══════ */}
        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
          {/* Left: Doctor info */}
          <div style={{ flex: 1, fontSize: "10px", lineHeight: 1.4 }}>
            <div style={S.sectionTitle}>ข้อมูลผู้สร้างใบส่งตัว</div>
            <div style={{ color: "#6b7280", marginTop: "2px" }}>เรียนมาเพื่อโปรดทราบและกรุณาดำเนินการตามความเหมาะสมต่อไป</div>
            <div style={{ marginTop: "8px" }}><span style={S.label}>เจ้าหน้าที่ผู้ส่ง:</span> {createdByUser}</div>
            <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
              <div style={{ flex: 1 }}><span style={S.label}>แพทย์ผู้ส่ง:</span> {doctorName}</div>
              <div style={{ flex: 1 }}><span style={S.label}>รหัสแพทย์:</span> {doctor.identifyNumber || "-"}</div>
            </div>
            <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
              <div style={{ flex: 1 }} />
              <div style={{ flex: 1 }}><span style={S.label}>ภาควิชาแพทย์:</span> {doctor.department || "-"}</div>
            </div>
            <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
              <div style={{ flex: 1 }}>(............................................)</div>
              <div style={{ flex: 1 }}><span style={S.label}>เบอร์ติดต่อ:</span> {doctor.phone || "-"}</div>
            </div>
            <div style={{ borderTop: "1px solid #e5e7eb", marginTop: "4px" }} />
            <div style={{ marginTop: "4px" }}><span style={S.label}>วันที่:</span> {fmtDateThai(new Date().toISOString())}</div>
          </div>

          {/* Right: Delivery period — matches Nuxt layout exactly */}
          <div style={{ flex: 1, fontSize: "10px", lineHeight: 1.4 }}>
            <div style={S.sectionTitle}>ระยะเวลารับรองสิทธิ์</div>
            {(() => {
              const dp = Array.isArray(data.deliveryPeriod) && data.deliveryPeriod.length > 0 ? data.deliveryPeriod[0] : null;
              return (
                <div style={{ borderBottom: "1px solid #e5e7eb", padding: "2px" }}>
                  <div style={{ marginBottom: "2px" }}>
                    <span style={S.label}>รูปแบบ</span>
                    <span>: {data.referralDeliveryPeriod?.name || "-"}</span>
                  </div>
                  <div style={{ display: "flex", gap: "2px", marginBottom: "2px" }}>
                    <div style={{ flex: 1 }}><span style={S.label}>วันที่เริ่มต้น</span><span>: {dp ? fmtDateThai(dp.startDelivery) : "-"}</span></div>
                    <div style={{ flex: 1 }}><span style={S.label}>เวลาเริ่มต้น</span><span>: {dp ? fmtTimeThai(dp.startDelivery) + " น." : "-"}</span></div>
                  </div>
                  <div style={{ display: "flex", gap: "2px" }}>
                    <div style={{ flex: 1 }}><span style={S.label}>วันที่สิ้นสุด</span><span>: {dp ? fmtDateThai(dp.endDelivery) : "-"}</span></div>
                    <div style={{ flex: 1 }}><span style={S.label}>เวลาสิ้นสุด</span><span>: {dp ? fmtTimeThai(dp.endDelivery) + " น." : "-"}</span></div>
                  </div>
                </div>
              );
            })()}
            <div style={{ marginTop: "2px", color: "#6b7280", fontSize: "10px" }}>
              กรุณาใช้สิทธิ์การรักษาตามระยะเวลาดังกล่าว
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function PrintReferPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "40px" }}>กำลังโหลด...</div>}>
      <PrintReferPageInner />
    </Suspense>
  );
}
