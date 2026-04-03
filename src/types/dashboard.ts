export interface FilterOption {
  value: string | number;
  name: string;
}

export interface Filters {
  zone: number | null;
  type: number | null;
  name: number | null;
  region: string | null;
  level: string | null;
}

export interface BreakdownItem {
  name: string;
  value: number;
  percent: string;
}

export interface ReferData {
  value: number;
  percent: string;
}

export interface CardProps {
  name: string;
  color: string;
  total: number;
  referIn: number;
  referOut: number;
  icon?: string;
}

export interface ReferSummaryCardProps {
  title: string;
  total: number;
  percent: string;
  referIn: ReferData;
  referOut: ReferData;
  breakdown: BreakdownItem[];
  icon?: string;
}

export interface ChartDataItem {
  name: string;
  value: number;
  color: string;
  percentage?: number;
}

export type DashboardType = "all" | "refer-in" | "refer-out";
