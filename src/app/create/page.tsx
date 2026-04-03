"use client";
import React from "react";
import { Box, Card, Typography, Grid, Button, Stack } from "@mui/material";
import Link from "next/link";
import {
  LocalHospital as OPDIcon,
  Hotel as IPDIcon,
  AirlineSeatFlat as ERIcon,
  Assignment as RequestIcon,
} from "@mui/icons-material";

export default function CreateReferralPage() {
  const referralTypes = [
    {
      title: "OPD",
      description: "สร้างรายการส่งตัวผู้ป่วยนอก",
      icon: OPDIcon,
      path: "/create/opd",
    },
    {
      title: "IPD",
      description: "สร้างรายการส่งตัวผู้ป่วยใน",
      icon: IPDIcon,
      path: "/create/ipd",
    },
    {
      title: "ER",
      description: "สร้างรายการส่งตัวฉุกเฉิน",
      icon: ERIcon,
      path: "/create/er",
    },
    {
      title: "คำขอส่งตัว",
      description: "สร้างคำขอส่งตัวผู้ป่วย",
      icon: RequestIcon,
      path: "/create/request",
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        สร้างรายการส่งตัว
      </Typography>

      <Grid container spacing={3}>
        {referralTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Grid item xs={12} sm={6} md={3} key={type.path}>
              <Link href={type.path} style={{ textDecoration: "none" }}>
                <Card
                  sx={{
                    p: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: 3,
                    },
                  }}
                >
                  <Icon
                    sx={{
                      fontSize: 64,
                      color: "primary.main",
                      mb: 2,
                    }}
                  />
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
                    {type.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {type.description}
                  </Typography>
                </Card>
              </Link>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
