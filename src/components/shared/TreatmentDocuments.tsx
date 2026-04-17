"use client";

import React, { useState, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  Dialog,
  DialogContent,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface UploadedFileItem {
  id: number;
  name: string;
  size: string;
  file: File | null;
  url: string;
}

export interface DocumentItem {
  id: number;
  fileName: string;
  fileType: string; // "X-ray" | "Lab" | "MRI" | "อื่นๆ"
  docCode: string;
  docName: string;
  detail: string;
  dateTime: string;
  files: UploadedFileItem[];
}

interface Props {
  documents: DocumentItem[];
  onAddDocument: (doc: DocumentItem) => void;
  onRemoveDocument?: (index: number) => void; // if undefined → hide "จัดการ" column
  /** Optional: upload file to server immediately (for detail page) */
  uploadFileToServer?: (file: File) => Promise<{ url?: string; data?: string }>;
}

/* ------------------------------------------------------------------ */
/*  SectionHeader (same green header used everywhere)                 */
/* ------------------------------------------------------------------ */
function SectionHeader({ title }: { title: string }) {
  return (
    <Box sx={{ bgcolor: "#BBF7D0", px: "16px", py: "8px" }}>
      <Typography sx={{ fontWeight: 600, fontSize: "1.125rem", color: "#036245" }}>
        {title}
      </Typography>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatThaiDateTime(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear() + 543;
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min} น.`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function TreatmentDocuments({
  documents,
  onAddDocument,
  onRemoveDocument,
  uploadFileToServer,
}: Props) {
  const showManageColumn = !!onRemoveDocument;

  // ── Upload modal state ──
  const [showDocModal, setShowDocModal] = useState(false);
  const [docModalData, setDocModalData] = useState({
    docCode: "",
    docName: "",
    detail: "",
    docType: "",
    otherTypeDetail: "",
    files: [] as UploadedFileItem[],
  });
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ── Detail view modal state ──
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailViewData, setDetailViewData] = useState<DocumentItem | null>(null);

  const resetDocModal = () => {
    setDocModalData({ docCode: "", docName: "", detail: "", docType: "", otherTypeDetail: "", files: [] });
  };

  /* ---------- File handling ---------- */
  const handleDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    if (uploadFileToServer) {
      // Detail page mode: upload immediately to server
      setIsUploading(true);
      try {
        for (let i = 0; i < fileList.length; i++) {
          const file = fileList[i];
          if (file.size > 10 * 1024 * 1024) {
            alert(`ไฟล์ "${file.name}" ขนาดเกิน 10 MB`);
            continue;
          }
          try {
            const res = await uploadFileToServer(file);
            const uploadedUrl = res.url || res.data || "";
            setDocModalData((prev) => ({
              ...prev,
              files: [
                ...prev.files,
                {
                  id: Date.now() + i,
                  name: file.name,
                  size: formatFileSize(file.size),
                  file,
                  url: uploadedUrl,
                },
              ],
            }));
          } catch {
            alert(`อัพโหลดไฟล์ ${file.name} ไม่สำเร็จ`);
          }
        }
      } finally {
        setIsUploading(false);
      }
    } else {
      // Create page mode: store locally
      const newFiles: UploadedFileItem[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.size > 10 * 1024 * 1024) {
          alert(`ไฟล์ "${file.name}" ขนาดเกิน 10 MB`);
          continue;
        }
        newFiles.push({
          id: Date.now() + i,
          name: file.name,
          size: formatFileSize(file.size),
          file,
          url: URL.createObjectURL(file),
        });
      }
      setDocModalData((prev) => ({ ...prev, files: [...prev.files, ...newFiles] }));
    }

    if (docFileInputRef.current) docFileInputRef.current.value = "";
  };

  const removeDocFile = (fileId: number) => {
    setDocModalData((prev) => ({ ...prev, files: prev.files.filter((f) => f.id !== fileId) }));
  };

  /* ---------- Save document ---------- */
  const handleDocModalSave = () => {
    if (!docModalData.docType) {
      alert("กรุณาเลือกประเภทเอกสาร");
      return;
    }
    if (docModalData.docType === "อื่นๆ" && !docModalData.otherTypeDetail.trim()) {
      alert("กรุณาระบุรายละเอียดสำหรับประเภทเอกสาร \"อื่นๆ\"");
      return;
    }
    if (docModalData.docType !== "อื่นๆ" && docModalData.files.length === 0) {
      alert("กรุณาอัพโหลดไฟล์ก่อน");
      return;
    }

    const newDoc: DocumentItem = {
      id: Date.now(),
      fileName: docModalData.files.map((f) => f.name).join(", ") || "-",
      fileType: docModalData.docType,
      docCode: docModalData.docCode,
      docName: docModalData.docName,
      detail: docModalData.docType === "อื่นๆ" ? docModalData.otherTypeDetail : docModalData.detail,
      dateTime: formatThaiDateTime(),
      files: docModalData.files,
    };

    onAddDocument(newDoc);
    resetDocModal();
    setShowDocModal(false);
  };

  /* ================================================================== */
  /*  Render                                                             */
  /* ================================================================== */
  const colCount = showManageColumn ? 8 : 7;

  return (
    <>
      <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 2, overflow: "hidden", mb: 2 }}>
        <SectionHeader title="เอกสารประกอบการรักษา" />

        <Box sx={{ p: 2 }}>
          {/* Sub-header row */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography sx={{ fontWeight: 600, fontSize: "1.125rem", color: "#036245" }}>
              อัพโหลดเอกสารเพิ่มเติม
            </Typography>
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={() => { resetDocModal(); setShowDocModal(true); }}
              sx={{
                textTransform: "none",
                borderColor: "#00AF75",
                color: "#00AF75",
                "&:hover": { borderColor: "#036245", color: "#036245" },
              }}
            >
              เพิ่มรายการ
            </Button>
          </Box>

          {/* Table */}
          <TableContainer sx={{ boxShadow: "none", border: "1px solid #e5e7eb", borderRadius: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f9fafb" }}>
                  <TableCell sx={{ fontWeight: 600, textAlign: "center", width: 60 }}>ลำดับ</TableCell>
                  <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>ไฟล์แนบ</TableCell>
                  <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>ประเภทเอกสาร</TableCell>
                  <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>รหัสเอกสาร</TableCell>
                  <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>ชื่อเอกสาร</TableCell>
                  <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>รายละเอียด</TableCell>
                  <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>วัน/เวลา</TableCell>
                  {showManageColumn && (
                    <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>จัดการ</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colCount} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="textSecondary">
                        ไม่มีข้อมูลเอกสาร{showManageColumn ? ' คลิก "เพิ่มรายการ" เพื่อเพิ่มเอกสารใหม่' : ""}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc, index) => (
                    <TableRow key={doc.id ?? index}>
                      <TableCell align="center">{index + 1}</TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => { setDetailViewData(doc); setShowDetailModal(true); }}
                          sx={{
                            textTransform: "none",
                            fontSize: "0.75rem",
                            borderColor: "#6b7280",
                            color: "#374151",
                            "&:hover": { borderColor: "#374151" },
                            minWidth: 0,
                            px: 1.5,
                          }}
                          startIcon={
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          }
                        >
                          เปิดดู
                        </Button>
                      </TableCell>
                      <TableCell align="center">{doc.fileType}</TableCell>
                      <TableCell align="center">{doc.docCode || "-"}</TableCell>
                      <TableCell align="center">{doc.docName || "-"}</TableCell>
                      <TableCell align="center">{doc.detail || "-"}</TableCell>
                      <TableCell align="center">{doc.dateTime}</TableCell>
                      {showManageColumn && (
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => onRemoveDocument!(index)}
                            sx={{ bgcolor: "#ef4444", color: "#fff", "&:hover": { bgcolor: "#dc2626" }, width: 32, height: 32 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {documents.length > 0 && (
            <Box sx={{ bgcolor: "#e5e7eb", px: 2, py: 0.75, borderRadius: "0 0 4px 4px" }}>
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 500 }}>
                ทั้งหมด {documents.length} เอกสาร
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* ========== Document Detail View Modal ========== */}
      <Dialog
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, overflow: "hidden" } }}
      >
        <Box sx={{ bgcolor: "#00AF75", px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "1.1rem" }}>
            รายละเอียดไฟล์แนบ
          </Typography>
          <IconButton onClick={() => setShowDetailModal(false)} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          {detailViewData && (
            <Box>
              <Box sx={{ bgcolor: "#dcfce7", px: 2, py: 1, borderRadius: 1, mb: 1 }}>
                <Typography sx={{ fontWeight: 600, color: "#036245" }}>รายละเอียด</Typography>
              </Box>
              <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 1, p: 2, mb: 2 }}>
                <Typography>{detailViewData.detail || "-"}</Typography>
              </Box>
              {detailViewData.files && detailViewData.files.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ bgcolor: "#dcfce7", px: 2, py: 1, borderRadius: 1, mb: 1 }}>
                    <Typography sx={{ fontWeight: 600, color: "#036245" }}>
                      ไฟล์แนบ ({detailViewData.files.length} ไฟล์)
                    </Typography>
                  </Box>
                  {detailViewData.files.map((f) => (
                    <Box key={f.id} sx={{ border: "1px solid #e5e7eb", borderRadius: 1, p: 2, mb: 1 }}>
                      {f.name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ? (
                        <Box sx={{ textAlign: "center" }}>
                          <img src={f.url} alt={f.name} style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 4 }} />
                          <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#6b7280" }}>
                            {f.name} ({f.size})
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography sx={{ flex: 1 }}>{f.name} ({f.size})</Typography>
                          <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ color: "#00AF75", fontWeight: 600 }}>
                            เปิดไฟล์
                          </a>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => setShowDetailModal(false)}
              sx={{ textTransform: "none", borderColor: "#00AF75", color: "#00AF75", "&:hover": { borderColor: "#036245", color: "#036245" } }}
            >
              ยกเลิก
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* ========== Document Upload Modal ========== */}
      <Dialog
        open={showDocModal}
        onClose={() => setShowDocModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, overflow: "hidden" } }}
      >
        {/* Header */}
        <Box sx={{ bgcolor: "#00AF75", px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "1.1rem" }}>
            เพิ่มไฟล์เอกสารประกอบการรักษา
          </Typography>
          <IconButton onClick={() => setShowDocModal(false)} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          {/* เลขที่เอกสาร */}
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 500, mb: 0.5 }}>เลขที่เอกสาร</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="เลขที่เอกสาร(ถ้ามี)"
              value={docModalData.docCode}
              onChange={(e) => setDocModalData((p) => ({ ...p, docCode: e.target.value }))}
            />
          </Box>

          {/* ชื่อเอกสาร */}
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 500, mb: 0.5 }}>ชื่อเอกสาร</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="ชื่อเอกสาร(ถ้าต้องการระบุ)"
              value={docModalData.docName}
              onChange={(e) => setDocModalData((p) => ({ ...p, docName: e.target.value }))}
            />
          </Box>

          {/* รายละเอียด */}
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 500, mb: 0.5 }}>รายละเอียด</Typography>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={3}
              placeholder="รายละเอียด"
              value={docModalData.detail}
              onChange={(e) => setDocModalData((p) => ({ ...p, detail: e.target.value }))}
            />
          </Box>

          {/* ประเภทเอกสาร */}
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 500, mb: 0.5 }}>
              ประเภทเอกสาร <span style={{ color: "#ef4444" }}>*</span>
            </Typography>
            <RadioGroup
              row
              value={docModalData.docType}
              onChange={(e) => setDocModalData((p) => ({ ...p, docType: e.target.value }))}
            >
              <FormControlLabel value="X-ray" control={<Radio size="small" />} label="X-ray" />
              <FormControlLabel value="Lab" control={<Radio size="small" />} label="Lab" />
              <FormControlLabel value="MRI" control={<Radio size="small" />} label="MRI" />
              <FormControlLabel value="อื่นๆ" control={<Radio size="small" />} label="อื่นๆ" />
            </RadioGroup>
            {docModalData.docType === "อื่นๆ" && (
              <Box sx={{ mt: 1, border: !docModalData.otherTypeDetail.trim() ? "1px solid #ef4444" : "1px solid #e5e7eb", borderRadius: 1, p: 0 }}>
                <Typography sx={{ fontWeight: 500, fontSize: "0.85rem", mb: 0.5, px: 1.5, pt: 1 }}>
                  ระบุรายละเอียด <span style={{ color: "#ef4444" }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  placeholder="ขอความอื่นๆ"
                  value={docModalData.otherTypeDetail}
                  onChange={(e) => setDocModalData((p) => ({ ...p, otherTypeDetail: e.target.value }))}
                  sx={{ "& .MuiOutlinedInput-notchedOutline": { border: "none" } }}
                />
              </Box>
            )}
          </Box>

          {/* Uploaded files list */}
          {docModalData.files.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 500, mb: 1 }}>
                ไฟล์ที่อัพโหลด ({docModalData.files.length} ไฟล์)
              </Typography>
              {docModalData.files.map((f) => (
                <Box
                  key={f.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid #e5e7eb",
                    borderRadius: 1,
                    p: 1.5,
                    mb: 1,
                    bgcolor: "#f9fafb",
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: "#9ca3af", flexShrink: 0, marginRight: 12 }}>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: "0.9rem", fontWeight: 500 }}>{f.name}</Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: "#9ca3af" }}>{f.size}</Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => removeDocFile(f.id)}
                    sx={{ bgcolor: "#ef4444", color: "#fff", "&:hover": { bgcolor: "#dc2626" }, width: 32, height: 32 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          {/* File upload area */}
          <Box
            onClick={() => !isUploading && docFileInputRef.current?.click()}
            sx={{
              border: "2px dashed #CBD5E1",
              borderRadius: 1,
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              cursor: isUploading ? "wait" : "pointer",
              bgcolor: "#f9fafb",
              "&:hover": { bgcolor: "#f0fdf4" },
              mb: 1,
            }}
          >
            {isUploading ? (
              <Typography sx={{ color: "#6b7280" }}>กำลังอัพโหลด...</Typography>
            ) : (
              <>
                <CloudUploadIcon sx={{ color: "#6b7280" }} />
                <Typography sx={{ color: "#374151" }}>เลือกอัพโหลดไฟล์</Typography>
              </>
            )}
          </Box>
          <input
            ref={docFileInputRef}
            type="file"
            hidden
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleDocFileChange}
          />
          <Typography variant="caption" sx={{ color: "#9ca3af" }}>
            กำหนดขนาดไฟล์แนบสูงสุด 10 MB
          </Typography>

          {/* Footer buttons */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => setShowDocModal(false)}
              sx={{
                textTransform: "none",
                borderColor: "#00AF75",
                color: "#00AF75",
                "&:hover": { borderColor: "#036245", color: "#036245" },
              }}
            >
              ยกเลิก
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleDocModalSave}
              disabled={isUploading}
              sx={{
                textTransform: "none",
                bgcolor: "#00AF75",
                "&:hover": { bgcolor: "#036245" },
              }}
            >
              บันทึกข้อมูล
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
