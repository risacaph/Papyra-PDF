import { useTranslation } from "react-i18next";
import { createToolFlow } from "@app/components/tools/shared/createToolFlow";
import AccessibilitySettings from "@app/components/tools/accessibility/AccessibilitySettings";
import { useAccessibilityParameters } from "@app/hooks/tools/accessibility/useAccessibilityParameters";
import { useAccessibilityOperation } from "@app/hooks/tools/accessibility/useAccessibilityOperation";
import { useBaseTool } from "@app/hooks/tools/shared/useBaseTool";
import { BaseToolProps, ToolComponent } from "@app/types/tool";

const Accessibility = (props: BaseToolProps) => {
  const { t } = useTranslation();

  const base = useBaseTool(
    "accessibility",
    useAccessibilityParameters,
    useAccessibilityOperation,
    props,
  );

  return createToolFlow({
    files: {
      selectedFiles: base.selectedFiles,
      isCollapsed: base.hasResults,
    },
    steps: [
      {
        title: t("accessibility.labels.settings", "Check & fix"),
        isCollapsed: base.settingsCollapsed,
        onCollapsedClick: base.settingsCollapsed
          ? base.handleSettingsReset
          : undefined,
        content: (
          <AccessibilitySettings
            parameters={base.params.parameters}
            onParameterChange={base.params.updateParameter}
            selectedFiles={base.selectedFiles}
            disabled={base.endpointLoading || base.operation.isLoading}
          />
        ),
      },
    ],
    executeButton: {
      text: t("accessibility.submit", "Apply fixes"),
      isVisible: !base.hasResults,
      loadingText: t("loading"),
      onClick: base.handleExecute,
      endpointEnabled: base.endpointEnabled,
      paramsValid: base.params.validateParameters(),
    },
    review: {
      isVisible: base.hasResults,
      operation: base.operation,
      title: t("accessibility.title", "Accessibility fixes applied"),
      onFileClick: base.handleThumbnailClick,
      onUndo: base.handleUndo,
    },
  });
};

export default Accessibility as ToolComponent;
