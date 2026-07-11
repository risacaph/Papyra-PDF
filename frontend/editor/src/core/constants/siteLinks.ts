import { withBasePath } from "@app/constants/app";

/**
 * URLs for the Papyra-owned legal + docs pages.
 *
 * <p>Core/web resolves them to the app's own bundled pages (served by the backend, works offline).
 * The desktop build shadows this module to use absolute URLs, because a Tauri app opens links in
 * the OS browser, which can't resolve app-relative paths.
 */
export const privacyPolicyUrl = (): string =>
  withBasePath("/legal/privacy-policy.html");
export const termsUrl = (): string =>
  withBasePath("/legal/terms-and-conditions.html");
export const docsUrl = (): string => withBasePath("/docs/");
export const analyticsDocsUrl = (): string =>
  withBasePath("/docs/analytics.html");
