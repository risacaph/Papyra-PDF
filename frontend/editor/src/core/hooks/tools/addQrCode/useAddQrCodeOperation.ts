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
  AddQrCodeParameters,
  defaultParameters,
} from "@app/hooks/tools/addQrCode/useAddQrCodeParameters";

const ENDPOINT = "/api/v1/misc/add-qr-code" satisfies ToolEndpoint;
type AddQrCodeApiParams = ToolApiParams[typeof ENDPOINT];

export const addQrCodeToApiParams = (
  parameters: AddQrCodeParameters,
): AddQrCodeApiParams => ({
  content: parameters.content,
  pageNumbers: parameters.pageNumbers,
  position: parameters.position,
  size: parameters.size,
});

export const addQrCodeFromApiParams = (
  apiParams: AddQrCodeApiParams,
): Partial<AddQrCodeParameters> => {
  const result: Partial<AddQrCodeParameters> = {};
  if (apiParams.content !== undefined) {
    result.content = apiParams.content;
  }
  if (apiParams.pageNumbers !== undefined) {
    result.pageNumbers = apiParams.pageNumbers;
  }
  if (apiParams.position !== undefined) {
    result.position = apiParams.position;
  }
  if (apiParams.size !== undefined) {
    result.size = apiParams.size;
  }
  return result;
};

export const buildAddQrCodeFormData = (
  parameters: AddQrCodeParameters,
  file: File,
): FormData =>
  objectToFormData(addQrCodeToApiParams(parameters), { fileInput: file });

export const addQrCodeOperationConfig = defineSingleFileTool({
  buildFormData: buildAddQrCodeFormData,
  toApiParams: addQrCodeToApiParams,
  fromApiParams: addQrCodeFromApiParams,
  operationType: "addQrCode",
  endpoint: ENDPOINT,
  defaultParameters,
});

export const useAddQrCodeOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<AddQrCodeParameters>({
    ...addQrCodeOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t(
        "addQrCode.error.failed",
        "An error occurred while adding the QR code to the PDF.",
      ),
    ),
  });
};
