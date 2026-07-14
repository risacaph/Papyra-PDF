import apiClient from "@app/services/apiClient";
import { useTranslation } from "react-i18next";
import {
  defineCustomTool,
  useToolOperation,
  type CustomProcessorResult,
} from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import {
  LinkEditorParameters,
  defaultParameters,
} from "@app/hooks/tools/linkEditor/useLinkEditorParameters";

/** Prefix bare host names with https:// so typed links like "example.com" work. */
export const normalizeUri = (uri: string): string => {
  const trimmed = uri.trim();
  return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

// Shape sent to /api/v1/edit/links/apply. Geometry is fractional (0-1), top-left origin;
// the backend converts it to PDF user space against each page's CropBox.
interface LinkOperationsPayload {
  removals: { pageIndex: number; annotationIndex: number }[];
  additions: {
    pageIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
    type: string;
    uri: string | null;
    targetPage: number | null;
  }[];
}

export const linkEditorOperationConfig = defineCustomTool({
  operationType: "linkEditor",
  customProcessor: async (
    parameters: LinkEditorParameters,
    files: File[],
  ): Promise<CustomProcessorResult> => {
    const payload: LinkOperationsPayload = {
      removals: parameters.removals.map((removal) => ({
        pageIndex: removal.pageIndex,
        annotationIndex: removal.annotationIndex,
      })),
      additions: parameters.additions.map((link) => ({
        pageIndex: link.pageIndex,
        x: link.x,
        y: link.y,
        width: link.width,
        height: link.height,
        type: link.target,
        uri: link.target === "uri" ? normalizeUri(link.uri) : null,
        targetPage: link.target === "page" ? link.targetPage : null,
      })),
    };

    const outputs: File[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("fileInput", file);
      formData.append("operations", JSON.stringify(payload));

      const response = await apiClient.post(
        "/api/v1/edit/links/apply",
        formData,
        {
          responseType: "blob",
        },
      );

      const base = (file.name || "document.pdf").replace(/\.[^.]+$/, "");
      outputs.push(
        new File([response.data as Blob], `${base}_links.pdf`, {
          type: "application/pdf",
        }),
      );
    }
    return { files: outputs, consumedAllInputs: true };
  },
  defaultParameters,
});

export const useLinkEditorOperation = () => {
  const { t } = useTranslation();
  return useToolOperation<LinkEditorParameters>({
    ...linkEditorOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("linkEditor.error.failed", "An error occurred while editing links."),
    ),
  });
};
