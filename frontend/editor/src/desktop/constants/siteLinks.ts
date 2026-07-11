/**
 * Desktop override of the site-links seam. A Tauri app opens external links in the OS browser,
 * which can't load app-relative paths — so the desktop build points at the Papyra pages published
 * to GitHub Pages (absolute URLs). Update PAPYRA_SITE_URL if you host the docs/legal elsewhere.
 */
const PAPYRA_SITE_URL = "https://risacaph.github.io/Papyra-PDF";

export const privacyPolicyUrl = (): string =>
  `${PAPYRA_SITE_URL}/legal/privacy-policy.html`;
export const termsUrl = (): string =>
  `${PAPYRA_SITE_URL}/legal/terms-and-conditions.html`;
export const docsUrl = (): string => `${PAPYRA_SITE_URL}/docs/`;
export const analyticsDocsUrl = (): string =>
  `${PAPYRA_SITE_URL}/docs/analytics.html`;
