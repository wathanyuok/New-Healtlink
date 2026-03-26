// Role-based visibility utilities for dashboard

export function isDashboardSectionVisible(
  userRoleName: string,
  sectionName: string
): boolean {
  switch (sectionName) {
    case "hospital":
      return isAdminZone(userRoleName) || isSuperAdmin(userRoleName);
    default:
      return false;
  }
}

export function isDashboardFilterVisible(
  userRoleName: string,
  filterName: string
): boolean {
  switch (filterName) {
    case "main":
      return isAdminZone(userRoleName) || isSuperAdmin(userRoleName);
    case "zone":
      return isSuperAdmin(userRoleName);
    case "type":
    case "name":
    case "region":
    case "level":
    case "clearButton":
      return isAdminZone(userRoleName) || isSuperAdmin(userRoleName);
    default:
      return false;
  }
}

export function isAdminZone(userRoleName: string): boolean {
  if (!userRoleName) return false;
  return userRoleName === "superAdminZone";
}

export function isSuperAdmin(userRoleName: string): boolean {
  if (!userRoleName) return false;
  return userRoleName === "superAdmin";
}

export function isAnyAdmin(userRoleName: string): boolean {
  return isSuperAdmin(userRoleName) || isAdminZone(userRoleName);
}
