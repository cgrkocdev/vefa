import type { UserRole } from "@/lib/constants";

export type Permission =
  | "donation:create"
  | "donation:view"
  | "donation:update"
  | "donation:delete"
  | "sacrifice:manage"
  | "report:view"
  | "sms:send"
  | "user:manage"
  | "settings:manage";

const rolePermissions: Record<UserRole, readonly Permission[]> = {
  ADMIN: [
    "donation:create",
    "donation:view",
    "donation:update",
    "donation:delete",
    "sacrifice:manage",
    "report:view",
    "sms:send",
    "user:manage",
    "settings:manage",
  ],
  DONATION_STAFF: ["donation:create", "donation:view", "sacrifice:manage", "sms:send"],
  REPORT_VIEWER: ["donation:view", "report:view"],
};

export function hasPermission(role: UserRole, permission: Permission) {
  return rolePermissions[role].includes(permission);
}

export const routePermissions: Record<string, Permission> = {
  "/bagislar/yeni": "donation:create",
  "/kurbanlar": "sacrifice:manage",
  "/bagiscilar": "donation:view",
  "/whatsapp": "sms:send",
  "/raporlar": "report:view",
  "/kullanicilar": "user:manage",
  "/ayarlar": "settings:manage",
};
