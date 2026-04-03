"use client";
import React from "react";
import { Box, Card, Typography, Button, Stack } from "@mui/material";
import { ArrowBack as BackIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";

export default function RequestReferralPage() {
  const router = useRouter();

  return (
    <Box sx={{ width: "100%" }}>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => router.back()}
        >
          กลับ
        </Button>
        <Typography variant="h4">สร้างคำขอส่งตัว</Typography>
      </Stack>

      <Card sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="textSecondary">
          🚀 Coming Soon
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          ส่วนนี้อยู่ระหว่างการพัฒนา
        </Typography>
      </Card>
    </Box>
  );
}
