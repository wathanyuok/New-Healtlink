"use client";

import React from "react";
import { Box, Breadcrumbs, Link as MuiLink, Typography } from "@mui/material";
import { NavigateNext } from "@mui/icons-material";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type BreadcrumbStatus = "visited" | "current" | "future";

interface BreadcrumbItem {
  name: string;
  path?: string;
  isActive?: boolean;
  status?: BreadcrumbStatus;
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

  // Determine the current step index: first item with status "current" OR with isActive
  const currentIdx = (() => {
    const byStatus = breadcrumbs.findIndex((c) => c.status === "current");
    if (byStatus !== -1) return byStatus;
    const byActive = breadcrumbs.findIndex((c) => c.isActive);
    return byActive !== -1 ? byActive : breadcrumbs.length - 1;
  })();

  const resolveStatus = (crumb: BreadcrumbItem, index: number): BreadcrumbStatus => {
    if (crumb.status) return crumb.status;
    if (index === currentIdx) return "current";
    if (index < currentIdx) return "visited";
    return "future";
  };

  const styleFor = (status: BreadcrumbStatus) => {
    if (status === "current") {
      return { color: "#111827", fontWeight: 600 };
    }
    if (status === "visited") {
      return { color: "#00AF75", fontWeight: 500 };
    }
    return { color: "#9ca3af", fontWeight: 400 };
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Breadcrumbs separator={<NavigateNext fontSize="small" sx={{ color: "#9ca3af" }} />} aria-label="breadcrumb">
        {breadcrumbs.map((crumb, index) => {
          const status = resolveStatus(crumb, index);
          const style = styleFor(status);

          // Clickable only when visited and has a path
          if (status === "visited" && crumb.path) {
            return (
              <MuiLink
                key={index}
                component={Link}
                href={crumb.path}
                underline="hover"
                sx={{
                  fontSize: "0.875rem",
                  fontFamily: "Sarabun, sans-serif",
                  ...style,
                  "&:hover": { color: "#036245" },
                }}
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
                fontFamily: "Sarabun, sans-serif",
                ...style,
                cursor: status === "future" ? "default" : undefined,
                pointerEvents: status === "future" ? "none" : undefined,
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
