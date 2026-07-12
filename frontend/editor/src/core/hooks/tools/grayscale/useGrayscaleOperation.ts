import { useTranslation } from "react-i18next";
import {
  useToolOperation,
  defineSingleFileTool,
} from "@app/hooks/tools/shared/useToolOperation";
import {
  objectToFormData,
  type ToolApiParams,
  type ToolEndpoint,
} from "@app/hooks/tools/shared/toolApiMapping";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import {
  GrayscaleParameters,
  defaultParameters,
} from "@app/hooks/tools/grayscale/useGrayscaleParameters";

const ENDPOINT = "/api/v1/misc/pdf-to-grayscale" satisfies ToolEndpoint;
type GrayscaleApiParams = ToolApiParams[typeof ENDPOINT];

export const grayscaleToApiParams = (
  parameters: GrayscaleParameters,
): GrayscaleApiParams => ({
  dpi: parameters.dpi,
});

export const grayscaleFromApiParams = (
  apiParams: GrayscaleApiParams,
): Partial<GrayscaleParameters> => {
  const result: Partial<GrayscaleParameters> = {};
  if (apiParams.dpi !== undefined) {
    result.dpi = apiParams.dpi;
  }
  return result;
};

export const buildGrayscaleFormData = (
  parameters: GrayscaleParameters,
  file: File,
): FormData =>
  objectToFormData(grayscaleToApiParams(parameters), { fileInput: file });

export const grayscaleOperationConfig = defineSingleFileTool({
  buildFormData: buildGrayscaleFormData,
  toApiParams: grayscaleToApiParams,
  fromApiParams: grayscaleFromApiParams,
  operationType: "grayscale",
  endpoint: ENDPOINT,
  defaultParameters,
});

export const useGrayscaleOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<GrayscaleParameters>({
    ...grayscaleOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t(
        "grayscale.error.failed",
        "An error occurred while converting the PDF to grayscale.",
      ),
    ),
  });
};
