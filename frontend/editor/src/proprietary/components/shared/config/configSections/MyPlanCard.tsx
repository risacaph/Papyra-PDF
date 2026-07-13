import React from "react";
import { Alert, Badge, Group, Paper, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import LocalIcon from "@app/components/shared/LocalIcon";
import { useUserLicense } from "@app/hooks/useUserLicense";

/**
 * Read-only summary of the current user's admin-managed access plan: tier, expiry and days
 * remaining. Self-contained (reads the shared license cache via {@link useUserLicense}) so it can be
 * dropped onto the My Plan page or anywhere else. Renders nothing until the license has loaded, or
 * if it could not be read.
 */
const MyPlanCard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const license = useUserLicense();

  if (!license) {
    return null;
  }

  const licenseTierLabels: Record<string, string> = {
    FREE: t("account.license.tier.free", "Free"),
    PRO: t("account.license.tier.pro", "Pro"),
    ULTIMATE: t("account.license.tier.ultimate", "Ultimate"),
  };
  const licenseTierColors: Record<string, string> = {
    FREE: "gray",
    PRO: "blue",
    ULTIMATE: "teal",
  };

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Text fw={600}>{t("account.license.title", "Access plan")}</Text>
          <Badge
            color={licenseTierColors[license.tier] ?? "gray"}
            variant="light"
            size="lg"
          >
            {licenseTierLabels[license.tier] ?? license.tier}
          </Badge>
        </Group>

        {license.expired ? (
          <Alert
            icon={<LocalIcon icon="info" width="1rem" height="1rem" />}
            color="blue"
            variant="light"
          >
            {t(
              "account.license.expired",
              "Your plan has ended — you're now on the Free plan.",
            )}
          </Alert>
        ) : license.expiresAt ? (
          <Group gap="xs" align="center">
            <Text size="sm" c="dimmed">
              {t("account.license.expiresOn", "Expires on {{date}}", {
                date: new Date(license.expiresAt).toLocaleDateString(
                  i18n.language,
                ),
              })}
            </Text>
            {license.daysRemaining >= 0 && (
              <Badge
                color={license.daysRemaining <= 7 ? "orange" : "gray"}
                variant="light"
              >
                {t("account.license.daysRemaining", "{{count}} days left", {
                  count: license.daysRemaining,
                })}
              </Badge>
            )}
          </Group>
        ) : (
          <Text size="sm" c="dimmed">
            {t("account.license.noExpiry", "No expiry")}
          </Text>
        )}

        <Text size="xs" c="dimmed">
          {t(
            "account.license.managedByAdmin",
            "Your access plan is managed by your administrator.",
          )}
        </Text>
      </Stack>
    </Paper>
  );
};

export default MyPlanCard;
