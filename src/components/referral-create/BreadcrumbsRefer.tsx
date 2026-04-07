"use client";

import React from "react";
import { Box, Breadcrumbs, Link as MuiLink, Typography } from "@mui/material";
import { NavigateNext } from "@mui/icons-material";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface BreadcrumbItem {
  name: string;
  path?: string;
  isActive?: boolean;
}

interface BreadcrumbsReferProps {
  /** Base path for the create flow, e.g. "/create/er" */
  basePath: string;
  /** The kind query param value, e.g. "referER" */
  kind: string;
  /** Custom breadcrumb items - if not provided, auto-generated from query */
  items?: BreadcrumbItem[];
}

export default function BreadcrumbsRefer({ basePath, kind, items }: BreadcrumbsReferProps) {
  const searchParams = useSearchParams();

  const hasHospitals = !!searchParams.get("hospitals");
  const hasDeliveryPoint = !!searchParams.get("deliveryPoint");
  const hasDoctorBranch = !!searchParams.get("docter_branch");
  const hasBranchNames = !!searchParams.get("branch_names");

  // Auto-generate breadcrumbs based on query state
  const breadcrumbs: BreadcrumbItem[] = items || generateBreadcrumbs();

  function generateBreadcrumbs(): BreadcrumbItem[] {
    const crumbs: BreadcrumbItem[] = [
      { name: "สร้างใบส่งตัว", path: "/create" },
      {
        name: "เลือกสถานพยาบาลปลายทาง",
        path: `${basePath}?kind=${kind}`,
        isActive: !hasHospitals,
      },
    ];

    if (hasHospitals) {
      crumbs.push({
        name: "เพิ่มรายละเอียดใบส่งตัว",
        isActive: true,
      });
    }

    return crumbs;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} aria-label="breadcrumb">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isActive = crumb.isActive || isLast;

          if (crumb.path && !isActive) {
            return (
              <MuiLink
                key={index}
                component={Link}
                href={crumb.path}
                underline="hover"
                sx={{ color: "#6b7280", fontSize: "0.875rem" }}
              >
                {crumb.name}
              </MuiLink>
            );
          }

          return (
            <Typography
              key={index}
              sx={{
                fontSize: "0.875rem",
                color: isActive ? "#00AF75" : "#6b7280",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {crumb.name}
            </Typography>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
}
