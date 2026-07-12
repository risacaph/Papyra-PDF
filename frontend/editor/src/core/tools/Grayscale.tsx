import { useTranslation } from "react-i18next";
import { createToolFlow } from "@app/components/tools/shared/createToolFlow";
import GrayscaleSettings from "@app/components/tools/grayscale/GrayscaleSettings";
import { useGrayscaleParameters } from "@app/hooks/tools/grayscale/useGrayscaleParameters";
import { useGrayscaleOperation } from "@app/hooks/tools/grayscale/useGrayscaleOperation";
import { useBaseTool } from "@app/hooks/tools/shared/useBaseTool";
import { BaseToolProps, ToolComponent } from "@app/types/tool";
import { useGrayscaleTips } from "@app/components/tooltips/useGrayscaleTips";

const Grayscale = (props: BaseToolProps) => {
  const { t } = useTranslation();
  const grayscaleTips = useGrayscaleTips();

  const base = useBaseTool(
    "grayscale",
    useGrayscaleParameters,
    useGrayscaleOperation,
    props,
  );

  return createToolFlow({
    files: {
      selectedFiles: base.selectedFiles,
      isCollapsed: base.hasResults,
    },
    steps: [
      {
        title: t("grayscale.labels.settings", "Settings"),
        isCollapsed: base.settingsCollapsed,
        onCollapsedClick: base.settingsCollapsed
          ? base.handleSettingsReset
          : undefined,
        tooltip: grayscaleTips,
        content: (
          <GrayscaleSettings
            parameters={base.params.parameters}
            onParameterChange={base.params.updateParameter}
            disabled={base.endpointLoading}
          />
        ),
      },
    ],
    executeButton: {
      text: t("grayscale.submit", "Convert to grayscale"),
      isVisible: !base.hasResults,
      loadingText: t("loading"),
      onClick: base.handleExecute,
      endpointEnabled: base.endpointEnabled,
      paramsValid: base.params.validateParameters(),
    },
    review: {
      isVisible: base.hasResults,
      operation: base.operation,
      title: t("grayscale.title", "Grayscale / Ink-Saver"),
      onFileClick: base.handleThumbnailClick,
      onUndo: base.handleUndo,
    },
  });
};

export default Grayscale as ToolComponent;
