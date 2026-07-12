import apiClient from "@app/services/apiClient";

export type LicenseTierName = "FREE" | "PRO" | "ULTIMATE";

/** A distributable license key as shown to admins. */
export interface LicenseKey {
  id: number;
  code: string;
  tier: LicenseTierName;
  durationMonths: number | null;
  maxRedemptions: number;
  redemptionCount: number;
  label: string | null;
  createdBy: string | null;
  createdAt: string | null;
  lastRedeemedAt: string | null;
  exhausted: boolean;
}

export interface GenerateKeyRequest {
  tier: LicenseTierName;
  /** null = use the tier's configured plan duration. */
  durationMonths: number | null;
  maxRedemptions: number;
  label?: string;
}

/** Result of a successful redemption. */
export interface RedemptionResult {
  message: string;
  tier: LicenseTierName;
  expiresAt: string | null;
}

/**
 * Admin-generated, user-redeemable license keys. Admins mint and manage keys; any signed-in user
 * can redeem a code to activate or upgrade their access plan.
 */
export const licenseKeyService = {
  /** List all generated keys (admin only). */
  async adminListKeys(): Promise<LicenseKey[]> {
    const response = await apiClient.get<LicenseKey[]>(
      "/api/v1/user/license-keys",
    );
    return response.data;
  },

  /** Mint a new key (admin only). */
  async adminGenerateKey(request: GenerateKeyRequest): Promise<LicenseKey> {
    const formData = new FormData();
    formData.append("tier", request.tier);
    if (request.durationMonths !== null) {
      formData.append("durationMonths", String(request.durationMonths));
    }
    formData.append("maxRedemptions", String(request.maxRedemptions));
    if (request.label && request.label.trim()) {
      formData.append("label", request.label.trim());
    }
    const response = await apiClient.post<LicenseKey>(
      "/api/v1/user/license-keys",
      formData,
      { suppressErrorToast: true },
    );
    return response.data;
  },

  /** Revoke (delete) a key (admin only). */
  async adminRevokeKey(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/user/license-keys/${id}`, {
      suppressErrorToast: true,
    });
  },

  /** Redeem a key for the current user. */
  async redeemKey(code: string): Promise<RedemptionResult> {
    const formData = new FormData();
    formData.append("code", code);
    const response = await apiClient.post<RedemptionResult>(
      "/api/v1/user/license-keys/redeem",
      formData,
      { suppressErrorToast: true },
    );
    return response.data;
  },
};
