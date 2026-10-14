/** Pure registrar rules shared by the dashboard and tests (mirrors the database). */

export const REGISTRAR_ROLES = ["super_admin", "admin", "provost", "deputy_provost", "registrar"] as const;

/** Roles a registrar-level user may grant/revoke; anything else needs a super administrator. */
export const OPERATIONAL_ROLES = ["lecturer", "hod", "staff", "admissions_officer"] as const;

export function canUseRegistrar(roles: string[]) {
  return roles.some((r) => (REGISTRAR_ROLES as readonly string[]).includes(r));
}

export function canGrantRole(actorRoles: string[], role: string) {
  if (actorRoles.includes("super_admin") || actorRoles.includes("admin")) return true;
  return canUseRegistrar(actorRoles) && (OPERATIONAL_ROLES as readonly string[]).includes(role);
}

/** Same format the database function `registrar_next_matric` produces. */
export function formatMatric(prefix: string, separator: string, year: number, serial: number, length: number) {
  return `${prefix}${separator}${year}${separator}${String(serial).padStart(length, "0")}`;
}
