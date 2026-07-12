import { useTranslation } from "react-i18next";
import { createToolFlow } from "@app/components/tools/shared/createToolFlow";
import AddQrCodeSettings from "@app/components/tools/addQrCode/AddQrCodeSettings";
import { useAddQrCodeParameters } from "@app/hooks/tools/addQrCode/useAddQrCodeParameters";
import { useAddQrCodeOperation } from "@app/hooks/tools/addQrCode/useAddQrCodeOperation";
import { useBaseTool } from "@app/hooks/tools/shared/useBaseTool";
import { BaseToolProps, ToolComponent } from "@app/types/tool";
import { useAddQrCodeTips } from "@app/components/tooltips/useAddQrCodeTips";

const AddQrCode = (props: BaseToolProps) => {
  const { t } = useTranslation();
  const addQrCodeTips = useAddQrCodeTips();

  const base = useBaseTool(
    "addQrCode",
    useAddQrCodeParameters,
    useAddQrCodeOperation,
    props,
  );

  return createToolFlow({
    files: {
      selectedFiles: base.selectedFiles,
      isCollapsed: base.hasResults,
    },
    steps: [
      {
        title: t("addQrCode.labels.settings", "Settings"),
        isCollapsed: base.settingsCollapsed,
        onCollapsedClick: base.settingsCollapsed
          ? base.handleSettingsReset
          : undefined,
        tooltip: addQrCodeTips,
        content: (
          <AddQrCodeSettings
            parameters={base.params.parameters}
            onParameterChange={base.params.updateParameter}
            disabled={base.endpointLoading}
          />
        ),
      },
    ],
    executeButton: {
      text: t("addQrCode.submit", "Add QR code"),
      isVisible: !base.hasResults,
      loadingText: t("loading"),
      onClick: base.handleExecute,
      endpointEnabled: base.endpointEnabled,
      paramsValid: base.params.validateParameters(),
    },
    review: {
      isVisible: base.hasResults,
      operation: base.operation,
      title: t("addQrCode.title", "Add QR Code"),
      onFileClick: base.handleThumbnailClick,
      onUndo: base.handleUndo,
    },
  });
};

export default AddQrCode as ToolComponent;
