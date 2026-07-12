import { useCallback, useEffect, useState } from "react";
import {
  Paper,
  Stack,
  Group,
  Title,
  Text,
  Select,
  NumberInput,
  TextInput,
  Badge,
  Alert,
  Loader,
  Divider,
  Code,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Button } from "@app/ui/Button";
import {
  licenseKeyService,
  type LicenseKey,
  type LicenseTierName,
} from "@app/services/licenseKeyService";

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

const TIER_VALUES: LicenseTierName[] = ["FREE", "PRO", "ULTIMATE"];

/**
 * Admin panel for minting and revoking distributable license keys. Users redeem a key under
 * Settings → Account to activate or upgrade their plan; the device cap follows the granted plan.
 */
export function AdminLicenseKeys() {
  const { t } = useTranslation();
  const [keys, setKeys] = useState<LicenseKey[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [tier, setTier] = useState<LicenseTierName>("PRO");
  const [durationMonths, setDurationMonths] = useState<number | "">("");
  const [maxRedemptions, setMaxRedemptions] = useState<number>(1);
  const [label, setLabel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const tierLabel = useCallback(
    (value: string) => t(`account.license.tier.${value.toLowerCase()}`, value),
    [t],
  );

  const load = useCallback(() => {
    licenseKeyService
      .adminListKeys()
      .then((data) => {
        setKeys(data);
        setLoadError(null);
      })
      .catch(() =>
        setLoadError(
          t("settings.licenseKeys.loadError", "Could not load license keys."),
        ),
      );
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const generate = useCallback(async () => {
    setGenerating(true);
    setGenerateError(null);
    try {
      await licenseKeyService.adminGenerateKey({
        tier,
        durationMonths: durationMonths === "" ? null : durationMonths,
        maxRedemptions,
        label,
      });
      setLabel("");
      load();
    } catch (err) {
      setGenerateError(
        extractErrorMessage(
          err,
          t(
            "settings.licenseKeys.generateError",
            "Could not generate the key.",
          ),
        ),
      );
    } finally {
      setGenerating(false);
    }
  }, [tier, durationMonths, maxRedemptions, label, load, t]);

  const revoke = useCallback(
    async (id: number) => {
      setRevokingId(id);
      try {
        await licenseKeyService.adminRevokeKey(id);
        load();
      } catch {
        setLoadError(
          t("settings.licenseKeys.revokeError", "Could not revoke the key."),
        );
      } finally {
        setRevokingId(null);
      }
    },
    [load, t],
  );

  const copy = useCallback((id: number, code: string) => {
    if (!navigator.clipboard) {
      return;
    }
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1500);
    });
  }, []);

  return (
    <Paper withBorder p="lg" radius="md">
      <Stack gap="md">
        <Stack gap={4}>
          <Title order={5}>
            {t("settings.licenseKeys.heading", "License keys")}
          </Title>
          <Text size="sm" c="dimmed">
            {t(
              "settings.licenseKeys.description",
              "Generate keys to hand out. A user redeems a key under Settings → Account to activate or upgrade their plan; the device cap follows the granted plan.",
            )}
          </Text>
        </Stack>

        <Group grow align="flex-end" wrap="wrap">
          <Select
            label={t("settings.licenseKeys.tier", "Tier")}
            data={TIER_VALUES.map((value) => ({
              value,
              label: tierLabel(value),
            }))}
            value={tier}
            allowDeselect={false}
            onChange={(value) =>
              setTier((value as LicenseTierName | null) ?? "PRO")
            }
          />
          <NumberInput
            label={t("settings.licenseKeys.duration", "Duration (months)")}
            placeholder={t("settings.licenseKeys.planDefault", "Plan default")}
            value={durationMonths}
            min={1}
            max={1200}
            allowDecimal={false}
            onChange={(value) =>
              setDurationMonths(typeof value === "number" ? value : "")
            }
          />
          <NumberInput
            label={t("settings.licenseKeys.redemptions", "Redemptions")}
            value={maxRedemptions}
            min={1}
            max={100000}
            allowDecimal={false}
            onChange={(value) =>
              setMaxRedemptions(typeof value === "number" ? value : 1)
            }
          />
        </Group>
        <TextInput
          label={t("settings.licenseKeys.label", "Label (optional)")}
          placeholder={t(
            "settings.licenseKeys.labelPlaceholder",
            "e.g. Reseller batch, launch promo",
          )}
          value={label}
          onChange={(event) => setLabel(event.currentTarget.value)}
        />
        {generateError && (
          <Text size="sm" c="red">
            {generateError}
          </Text>
        )}
        <Group>
          <Button onClick={() => void generate()} loading={generating}>
            {t("settings.licenseKeys.generate", "Generate key")}
          </Button>
        </Group>

        <Divider />

        {loadError && <Alert color="red">{loadError}</Alert>}
        {!keys && !loadError && <Loader size="sm" />}
        {keys && keys.length === 0 && (
          <Text size="sm" c="dimmed">
            {t("settings.licenseKeys.none", "No license keys yet.")}
          </Text>
        )}

        {keys?.map((key) => (
          <Paper key={key.id} withBorder p="md" radius="sm">
            <Stack gap="xs">
              <Group
                justify="space-between"
                align="center"
                wrap="wrap"
                gap="sm"
              >
                <Group gap="xs" align="center" wrap="nowrap">
                  <Code>{key.code}</Code>
                  <Button
                    size="sm"
                    variant="tertiary"
                    onClick={() => copy(key.id, key.code)}
                  >
                    {copiedId === key.id
                      ? t("settings.licenseKeys.copied", "Copied")
                      : t("settings.licenseKeys.copy", "Copy")}
                  </Button>
                </Group>
                <Group gap="xs" align="center">
                  <Badge variant="light" color="teal">
                    {tierLabel(key.tier)}
                  </Badge>
                  {key.exhausted && (
                    <Badge variant="light" color="gray">
                      {t("settings.licenseKeys.exhausted", "Used up")}
                    </Badge>
                  )}
                </Group>
              </Group>
              <Group gap="lg" wrap="wrap">
                <Text size="xs" c="dimmed">
                  {key.durationMonths === null
                    ? t("settings.licenseKeys.planDefault", "Plan default")
                    : t("settings.licenseKeys.months", "{{months}} month(s)", {
                        months: key.durationMonths,
                      })}
                </Text>
                <Text size="xs" c="dimmed">
                  {t(
                    "settings.licenseKeys.usage",
                    "{{used}} / {{max}} redeemed",
                    {
                      used: key.redemptionCount,
                      max: key.maxRedemptions,
                    },
                  )}
                </Text>
                {key.label && (
                  <Text size="xs" c="dimmed">
                    {key.label}
                  </Text>
                )}
              </Group>
              <Group>
                <Button
                  size="sm"
                  variant="tertiary"
                  accent="danger"
                  loading={revokingId === key.id}
                  onClick={() => void revoke(key.id)}
                >
                  {t("settings.licenseKeys.revoke", "Revoke")}
                </Button>
              </Group>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Paper>
  );
}
