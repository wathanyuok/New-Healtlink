"use client";

import { useMemo, useCallback } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import { FilterAltOff as ClearIcon } from "@mui/icons-material";
import { useDashboardStore } from "@/stores/dashboardStore";
import { isDashboardFilterVisible } from "@/utils/dashboard";
import type { Filters, FilterOption } from "@/types/dashboard";

interface Props {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onClear: () => void;
  hideHospitalFilter?: boolean;
  role?: string;
  /** Extra filter rendered at the FRONT of the filter row */
  extraFilter?: React.ReactNode;
}

const MENU_PROPS = {
  PaperProps: {
    sx: { maxHeight: 300 },
  },
  anchorOrigin: { vertical: "bottom" as const, horizontal: "left" as const },
  transformOrigin: { vertical: "top" as const, horizontal: "left" as const },
};

const SELECT_SX = {
  "& .MuiSelect-select": {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};

const MENU_ITEM_SX = { whiteSpace: "normal", wordBreak: "break-word" };

/* helper: renderValue ที่แสดง "ทั้งหมด" เมื่อ value ว่าง, หรือชื่อ option ที่เลือก */
function makeRenderValue(options: FilterOption[]) {
  return (selected: unknown) => {
    if (selected === "" || selected === null || selected === undefined) return "ทั้งหมด";
    const found = options.find((o) => o.value === selected);
    return found ? found.name : String(selected);
  };
}

export default function FilterSection({ filters, onFilterChange, onClear, hideHospitalFilter = false, role = "", extraFilter }: Props) {
  const { hospitalData, hospitalZone, hospitalSubType, hospitalAffiliation, hospitalServiceLevel } = useDashboardStore();

  // Role-based visibility check (matching Nuxt FilterSection behavior)
  const isVisible = useCallback(
    (filterName: string) => {
      if (!role) return true; // If no role provided, show all (backward compatible)
      return isDashboardFilterVisible(role, filterName);
    },
    [role],
  );

  // Check if the entire filter section should be visible
  const showFilters = isVisible("main");

  const updateFilter = useCallback(
    (field: keyof Filters, value: any) => {
      onFilterChange({ ...filters, [field]: value === "" ? null : value });
    },
    [filters, onFilterChange],
  );

  // Filtered options based on current selections
  const zoneOptions = useMemo(() => {
    let hospitals = [...hospitalData];
    if (filters.type !== null) hospitals = hospitals.filter((h: any) => h.subType?.id === filters.type);
    if (filters.name !== null) hospitals = hospitals.filter((h: any) => h.id === filters.name);
    if (filters.region !== null) hospitals = hospitals.filter((h: any) => h.affiliation === filters.region);
    if (filters.level !== null) hospitals = hospitals.filter((h: any) => h.serviceLevel === filters.level);
    const ids = [...new Set(hospitals.map((h: any) => h.zone?.id).filter(Boolean))];
    return hospitalZone.filter((z) => ids.includes(z.value));
  }, [hospitalData, hospitalZone, filters]);

  const typeOptions = useMemo(() => {
    let hospitals = [...hospitalData];
    if (filters.zone !== null) hospitals = hospitals.filter((h: any) => h.zone?.id === filters.zone);
    if (filters.name !== null) hospitals = hospitals.filter((h: any) => h.id === filters.name);
    if (filters.region !== null) hospitals = hospitals.filter((h: any) => h.affiliation === filters.region);
    if (filters.level !== null) hospitals = hospitals.filter((h: any) => h.serviceLevel === filters.level);
    const ids = [...new Set(hospitals.map((h: any) => h.subType?.id).filter(Boolean))];
    return hospitalSubType.filter((t) => ids.includes(t.value));
  }, [hospitalData, hospitalSubType, filters]);

  const hospitalOptions = useMemo(() => {
    let hospitals = [...hospitalData];
    if (filters.zone !== null) hospitals = hospitals.filter((h: any) => h.zone?.id === filters.zone);
    if (filters.type !== null) hospitals = hospitals.filter((h: any) => h.subType?.id === filters.type);
    if (filters.region !== null) hospitals = hospitals.filter((h: any) => h.affiliation === filters.region);
    if (filters.level !== null) hospitals = hospitals.filter((h: any) => h.serviceLevel === filters.level);
    return hospitals.map((h: any) => ({ value: h.id, name: h.name }));
  }, [hospitalData, filters]);

  const regionOptions = useMemo(() => {
    let hospitals = [...hospitalData];
    if (filters.zone !== null) hospitals = hospitals.filter((h: any) => h.zone?.id === filters.zone);
    if (filters.type !== null) hospitals = hospitals.filter((h: any) => h.subType?.id === filters.type);
    if (filters.name !== null) hospitals = hospitals.filter((h: any) => h.id === filters.name);
    if (filters.level !== null) hospitals = hospitals.filter((h: any) => h.serviceLevel === filters.level);
    const vals = [...new Set(hospitals.map((h: any) => h.affiliation).filter(Boolean))];
    return hospitalAffiliation.filter((r) => vals.includes(r.value));
  }, [hospitalData, hospitalAffiliation, filters]);

  const levelOptions = useMemo(() => {
    let hospitals = [...hospitalData];
    if (filters.zone !== null) hospitals = hospitals.filter((h: any) => h.zone?.id === filters.zone);
    if (filters.type !== null) hospitals = hospitals.filter((h: any) => h.subType?.id === filters.type);
    if (filters.name !== null) hospitals = hospitals.filter((h: any) => h.id === filters.name);
    if (filters.region !== null) hospitals = hospitals.filter((h: any) => h.affiliation === filters.region);
    const vals = [...new Set(hospitals.map((h: any) => h.serviceLevel).filter(Boolean))];
    return hospitalServiceLevel.filter((l) => vals.includes(l.value));
  }, [hospitalData, hospitalServiceLevel, filters]);

  // Count visible filters for grid columns
  const visibleCount = useMemo(() => {
    let count = 0;
    if (extraFilter) count++;
    if (isVisible("zone")) count++;
    if (isVisible("type")) count++;
    if (!hideHospitalFilter && isVisible("name")) count++;
    if (isVisible("region")) count++;
    if (isVisible("level")) count++;
    if (isVisible("clearButton")) count++;
    return count;
  }, [isVisible, hideHospitalFilter, extraFilter]);

  if (!showFilters || visibleCount === 0) return null;

  return (
    <Box sx={{ px: 2, py: 2, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: `repeat(${visibleCount}, 1fr)` }, gap: 1.5, alignItems: "end" }}>
      {extraFilter}
      {isVisible("zone") && (
        <FormControl size="small" fullWidth>
          <InputLabel shrink>โซนสถานพยาบาล</InputLabel>
          <Select
            value={filters.zone ?? ""}
            label="โซนสถานพยาบาล"
            displayEmpty
            renderValue={makeRenderValue(zoneOptions)}
            onChange={(e) => updateFilter("zone", e.target.value)}
            MenuProps={MENU_PROPS}
            sx={SELECT_SX}
            notched
          >
            <MenuItem value="">ทั้งหมด</MenuItem>
            {zoneOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} sx={MENU_ITEM_SX}>{opt.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {isVisible("type") && (
        <FormControl size="small" fullWidth>
          <InputLabel shrink>ประเภทสถานพยาบาล</InputLabel>
          <Select
            value={filters.type ?? ""}
            label="ประเภทสถานพยาบาล"
            displayEmpty
            renderValue={makeRenderValue(typeOptions)}
            onChange={(e) => updateFilter("type", e.target.value)}
            MenuProps={MENU_PROPS}
            sx={SELECT_SX}
            notched
          >
            <MenuItem value="">ทั้งหมด</MenuItem>
            {typeOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} sx={MENU_ITEM_SX}>{opt.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {!hideHospitalFilter && isVisible("name") && (
        <FormControl size="small" fullWidth>
          <InputLabel shrink>สถานพยาบาล</InputLabel>
          <Select
            value={filters.name ?? ""}
            label="สถานพยาบาล"
            displayEmpty
            renderValue={makeRenderValue(hospitalOptions)}
            onChange={(e) => updateFilter("name", e.target.value)}
            MenuProps={MENU_PROPS}
            sx={SELECT_SX}
            notched
          >
            <MenuItem value="">ทั้งหมด</MenuItem>
            {hospitalOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} sx={MENU_ITEM_SX}>{opt.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {isVisible("region") && (
        <FormControl size="small" fullWidth>
          <InputLabel shrink>สังกัดสถานพยาบาล</InputLabel>
          <Select
            value={filters.region ?? ""}
            label="สังกัดสถานพยาบาล"
            displayEmpty
            renderValue={makeRenderValue(regionOptions)}
            onChange={(e) => updateFilter("region", e.target.value)}
            MenuProps={MENU_PROPS}
            sx={SELECT_SX}
            notched
          >
            <MenuItem value="">ทั้งหมด</MenuItem>
            {regionOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} sx={MENU_ITEM_SX}>{opt.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {isVisible("level") && (
        <FormControl size="small" fullWidth>
          <InputLabel shrink>ระดับการให้บริการ</InputLabel>
          <Select
            value={filters.level ?? ""}
            label="ระดับการให้บริการ"
            displayEmpty
            renderValue={makeRenderValue(levelOptions)}
            onChange={(e) => updateFilter("level", e.target.value)}
            MenuProps={MENU_PROPS}
            sx={SELECT_SX}
            notched
          >
            <MenuItem value="">ทั้งหมด</MenuItem>
            {levelOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} sx={MENU_ITEM_SX}>{opt.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {isVisible("clearButton") && (
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<ClearIcon />}
          onClick={onClear}
          size="small"
          sx={{ height: 40, color: "text.secondary", borderColor: "divider" }}
        >
          ล้างตัวกรอง
        </Button>
      )}
    </Box>
  );
}
