import { BaseParameters } from "@app/types/parameters";
import {
  useBaseParameters,
  BaseParametersHook,
} from "@app/hooks/tools/shared/useBaseParameters";

export interface AddQrCodeParameters extends BaseParameters {
  content: string;
  position: number;
  size: number;
  pageNumbers: string;
}

export const defaultParameters: AddQrCodeParameters = {
  content: "",
  position: 9,
  size: 100,
  pageNumbers: "all",
};

export type AddQrCodeParametersHook = BaseParametersHook<AddQrCodeParameters>;

export const useAddQrCodeParameters = (): AddQrCodeParametersHook => {
  return useBaseParameters({
    defaultParameters,
    endpointName: "add-qr-code",
    validateFn: (params) =>
      params.content.trim().length > 0 &&
      Number.isFinite(params.size) &&
      params.size > 0 &&
      params.pageNumbers.trim().length > 0,
  });
};
