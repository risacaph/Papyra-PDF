import apiClient from "@app/services/apiClient";
import { useTranslation } from "react-i18next";
import {
  defineCustomTool,
  useToolOperation,
  type CustomProcessorResult,
} from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import {
  AccessibilityParameters,
  defaultParameters,
} from "@app/hooks/tools/accessibility/useAccessibilityParameters";

/** The audit report returned by /api/v1/edit/accessibility/audit. */
export interface AccessibilityAudit {
  title?: string | null;
  language?: string | null;
  tagged: boolean;
  marked: boolean;
  displayDocTitle: boolean;
  encrypted: boolean;
  accessibilityExtractionAllowed: boolean;
  pageCount: number;
}

export async function fetchAccessibilityAudit(
  file: File | Blob,
): Promise<AccessibilityAudit> {
  const formData = new FormData();
  formData.append("fileInput", file);
  const response = await apiClient.post<AccessibilityAudit>(
    "/api/v1/edit/accessibility/audit",
    formData,
    { suppressErrorToast: true },
  );
  return response.data;
}

export const accessibilityOperationConfig = defineCustomTool({
  operationType: "accessibility",
  customProcessor: async (
    parameters: AccessibilityParameters,
    files: File[],
  ): Promise<CustomProcessorResult> => {
    const outputs: File[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("fileInput", file);
      if (parameters.title.trim()) {
        formData.append("title", parameters.title.trim());
      }
      if (parameters.language.trim()) {
        formData.append("language", parameters.language.trim());
      }
      formData.append(
        "setDisplayDocTitle",
        String(parameters.setDisplayDocTitle),
      );
      formData.append(
        "setStructureTabOrder",
        String(parameters.setStructureTabOrder),
      );

      const response = await apiClient.post(
        "/api/v1/edit/accessibility/apply",
        formData,
        { responseType: "blob" },
      );

      const base = (file.name || "document.pdf").replace(/\.[^.]+$/, "");
      outputs.push(
        new File([response.data as Blob], `${base}_accessible.pdf`, {
          type: "application/pdf",
        }),
      );
    }
    return { files: outputs, consumedAllInputs: true };
  },
  defaultParameters,
});

export const useAccessibilityOperation = () => {
  const { t } = useTranslation();
  return useToolOperation<AccessibilityParameters>({
    ...accessibilityOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t(
        "accessibility.error.failed",
        "An error occurred while applying accessibility fixes.",
      ),
    ),
  });
};
