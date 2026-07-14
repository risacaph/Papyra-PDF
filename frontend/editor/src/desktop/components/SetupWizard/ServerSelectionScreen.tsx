import React from "react";
import { useTranslation } from "react-i18next";
import LoginHeader from "@app/routes/login/LoginHeader";
import ErrorMessage from "@app/auth/ui/ErrorMessage";
import { ServerSelection } from "@app/components/SetupWizard/ServerSelection";
import { ServerConfig } from "@app/services/connectionModeService";
import { Button } from "@app/ui/Button";
import "@app/auth/ui/auth.css";

interface ServerSelectionScreenProps {
  onSelect: (config: ServerConfig) => void;
  onUseLocal: () => void;
  onClose?: () => void;
  loading: boolean;
  error: string | null;
}

export const ServerSelectionScreen: React.FC<ServerSelectionScreenProps> = ({
  onSelect,
  onUseLocal,
  onClose,
  loading,
  error,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <LoginHeader
        title={t("setup.server.title", "Connect to Server")}
        subtitle={t(
          "setup.server.subtitle",
          "Enter your self-hosted server URL",
        )}
        onClose={onClose}
      />

      <ErrorMessage error={error} />

      <ServerSelection onSelect={onSelect} loading={loading} />

      <div
        className="navigation-link-container"
        style={{ marginTop: "1.5rem" }}
      >
        <Button
          variant="tertiary"
          onClick={onUseLocal}
          className="navigation-link-button"
          disabled={loading}
        >
          {t("setup.selfhosted.switchToLocal", "Use local tools instead")}
        </Button>
      </div>
    </>
  );
};
