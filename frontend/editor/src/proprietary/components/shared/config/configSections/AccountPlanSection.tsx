import React from "react";
import { Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import MyPlanCard from "@app/components/shared/config/configSections/MyPlanCard";
import { AccountRedeemKey } from "@app/components/shared/config/configSections/AccountRedeemKey";
import { AccountDevices } from "@app/components/shared/config/configSections/AccountDevices";

/**
 * Self-service "My Plan" settings page: shows the current access plan, lets the user redeem a
 * license key and manage their registered devices. These entitlement-related panels live here
 * (rather than in the Account section, which now focuses on credentials and two-factor auth) so
 * plan and security concerns are cleanly separated.
 */
const AccountPlanSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Stack gap="md">
      <div>
        <Text fw={600} size="lg">
          {t("account.plan.title", "My Plan")}
        </Text>
        <Text size="sm" c="dimmed">
          {t(
            "account.plan.description",
            "View your access plan, manage your devices and redeem a license key.",
          )}
        </Text>
      </div>

      <MyPlanCard />

      <AccountRedeemKey />

      <AccountDevices />
    </Stack>
  );
};

export default AccountPlanSection;
