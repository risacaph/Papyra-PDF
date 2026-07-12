import { useCallback, useState } from "react";
import { Paper, Stack, Group, Text, TextInput, Alert } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Button } from "@app/ui/Button";
import { licenseKeyService } from "@app/services/licenseKeyService";
import { refreshUserLicense } from "@app/hooks/useUserLicense";

/** Best-effort extraction of the backend's error message from an apiClient failure. */
function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { error?: unknown } } })
      .response;
    const message = response?.data?.error;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return fallback;
}

const TIER_LABELS: Record<string, string> = {
  FREE: "Free",
  PRO: "Pro",
  ULTIMATE: "Ultimate",
};

/**
 * Lets the signed-in user redeem a distributable license key to activate or upgrade their access
 * plan. On success the shared license cache is refreshed so the plan card updates in place.
 */
export function AccountRedeemKey() {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const redeem = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError(t("account.redeem.empty", "Enter a license key."));
      setSuccess(null);
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await licenseKeyService.redeemKey(trimmed);
      const tierLabel = TIER_LABELS[result.tier] ?? result.tier;
      setSuccess(
        t(
          "account.redeem.success",
          "Key redeemed — your plan is now {{tier}}.",
          {
            tier: tierLabel,
          },
        ),
      );
      setCode("");
      refreshUserLicense();
    } catch (err) {
      setError(
        extractErrorMessage(
          err,
          t("account.redeem.error", "Could not redeem that key."),
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }, [code, t]);

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="sm">
        <Text fw={600}>
          {t("account.redeem.title", "Redeem a license key")}
        </Text>
        <Text size="xs" c="dimmed">
          {t(
            "account.redeem.description",
            "Have a license key? Enter it to activate or upgrade your plan.",
          )}
        </Text>

        {error && (
          <Alert color="red" variant="light">
            {error}
          </Alert>
        )}
        {success && (
          <Alert color="teal" variant="light">
            {success}
          </Alert>
        )}

        <Group gap="sm" align="flex-end" wrap="wrap">
          <TextInput
            style={{ flex: 1, minWidth: 220 }}
            label={t("account.redeem.label", "License key")}
            placeholder="PAPYRA-XXXXX-XXXXX-XXXXX"
            value={code}
            onChange={(event) => setCode(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void redeem();
              }
            }}
          />
          <Button onClick={() => void redeem()} loading={submitting}>
            {t("account.redeem.button", "Redeem")}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
