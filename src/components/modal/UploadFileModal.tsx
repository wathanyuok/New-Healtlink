"use client";

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useHospitalStore } from "@/stores/hospitalStore";

export interface MedicalDocument {
  id: number | null;
  isDelete: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  code: string;
  name: string;
  type: string;
  detail: string;
  url: any[];
  textContent: string;
  clinicName: string | null;
}

interface UploadedFile {
  id: number;
  name: string;
  size: string;
  type: string;
  file: File;
  url?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (doc: MedicalDocument) => void;
}

const documentTypeOptions = [
  { value: "X-ray", name: "X-ray" },
  { value: "Lab", name: "Lab" },
  { value: "MRI", name: "MRI" },
  { value: "อื่นๆ", name: "อื่นๆ" },
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function UploadFileModal({ open, onClose, onSave }: Props) {
  const { uploadFile } = useHospitalStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documentType, setDocumentType] = useState("");
  const [otherType, setOtherType] = useState("");
  const [documentCode, setDocumentCode] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [detail, setDetail] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setDocumentType("");
    setOtherType("");
    setDocumentCode("");
    setDocumentName("");
    setDetail("");
    setUploadedFiles([]);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let uploadedUrl = "";
        try {
          const res = await uploadFile(file);
          uploadedUrl = res.url || res.data || "";
        } catch (err) {
          setError(`อัพโหลดไฟล์ ${file.name} ไม่สำเร็จ`);
          continue;
        }
        setUploadedFiles((prev) => [
          ...prev,
          {
            id: Date.now() + i,
            name: file.name,
            size: formatFileSize(file.size),
            type: file.type,
            file,
            url: uploadedUrl,
          },
        ]);
      }
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const removeFile = (id: number) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSave = () => {
    if (!documentType) {
      setError("กรุณาเลือกประเภทเอกสาร");
      return;
    }
    if (documentType !== "อื่นๆ" && uploadedFiles.length === 0) {
      setError("กรุณาอัพโหลดไฟล์ก่อน");
      return;
    }
    if (documentType === "อื่นๆ" && !otherType.trim()) {
      setError("กรุณาระบุรายละเอียดสำหรับประเภทเอกสาร 'อื่นๆ'");
      return;
    }

    const doc: MedicalDocument = {
      id: null,
      isDelete: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "currentUser",
      code: documentCode,
      name: documentName,
      type: documentType,
      detail,
      url: uploadedFiles.map((f) => ({
        url: f.url || "",
        name: f.name,
        size: f.size,
      })),
      textContent: otherType,
      clinicName: null,
    };

    onSave(doc);
    resetForm();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography sx={{ fontWeight: 600, fontSize: "1.125rem" }}>เพิ่มเอกสาร</Typography>
        <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Typography sx={{ color: "#EF4444", fontSize: "0.875rem", mb: 2 }}>{error}</Typography>
        )}

        {/* ประเภทเอกสาร */}
        <Typography sx={{ fontWeight: 500, mb: 1 }}>ประเภทเอกสาร *</Typography>
        <RadioGroup row value={documentType} onChange={(e) => { setDocumentType(e.target.value); setError(""); }}>
          {documentTypeOptions.map((opt) => (
            <FormControlLabel key={opt.value} value={opt.value} control={<Radio size="small" />} label={opt.name} />
          ))}
        </RadioGroup>

        {documentType === "อื่นๆ" && (
          <TextField
            fullWidth size="small" placeholder="ระบุประเภทเอกสาร"
            value={otherType} onChange={(e) => setOtherType(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
        )}

        {/* ชื่อเอกสาร */}
        <TextField
          fullWidth size="small" label="ชื่อเอกสาร"
          value={documentName} onChange={(e) => setDocumentName(e.target.value)}
          sx={{ mt: 2, mb: 2 }}
        />

        {/* เลขที่เอกสาร */}
        <TextField
          fullWidth size="small" label="เลขที่เอกสาร"
          value={documentCode} onChange={(e) => setDocumentCode(e.target.value)}
          sx={{ mb: 2 }}
        />

        {/* รายละเอียด */}
        <TextField
          fullWidth size="small" label="รายละเอียด" multiline rows={2}
          value={detail} onChange={(e) => setDetail(e.target.value)}
          sx={{ mb: 2 }}
        />

        {/* Upload area */}
        <Box
          sx={{
            border: "2px dashed #d1d5db", borderRadius: "8px", p: 3,
            textAlign: "center", cursor: "pointer",
            "&:hover": { borderColor: "#00AF75", bgcolor: "#f0fdf4" },
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const dt = e.dataTransfer;
            if (dt?.files) {
              const fakeEvent = { target: { files: dt.files, value: "" } } as any;
              handleFileSelect(fakeEvent);
            }
          }}
        >
          {isUploading ? (
            <CircularProgress size={24} />
          ) : (
            <Typography sx={{ color: "#6b7280" }}>
              คลิกหรือลากไฟล์มาวางที่นี่
            </Typography>
          )}
        </Box>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={handleFileSelect}
        />

        {/* Uploaded files list */}
        {uploadedFiles.length > 0 && (
          <Box sx={{ mt: 2 }}>
            {uploadedFiles.map((f) => (
              <Box key={f.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.5, borderBottom: "1px solid #f3f4f6" }}>
                <Typography sx={{ fontSize: "0.875rem" }}>{f.name} ({f.size})</Typography>
                <IconButton size="small" onClick={() => removeFile(f.id)} sx={{ color: "#EF4444" }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} sx={{ textTransform: "none", color: "#6b7280" }}>ยกเลิก</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isUploading}
          sx={{ bgcolor: "#00AF75", "&:hover": { bgcolor: "#059669" }, textTransform: "none" }}
        >
          บันทึก
        </Button>
      </DialogActions>
    </Dialog>
  );
}
