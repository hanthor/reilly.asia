// Public API paths shared by the Worker router and the browser data layer.
// Keep this module dependency-free so both bundles can import it.

export const INFRA_API_PREFIX = "/infra/api";

export const INFRA_API_PATHS = {
  status: `${INFRA_API_PREFIX}/status`,
  activity: `${INFRA_API_PREFIX}/activity`,
  fleet: `${INFRA_API_PREFIX}/fleet`,
} as const;
