import { BaseParameters } from "@app/types/parameters";
import {
  useBaseParameters,
  BaseParametersHook,
} from "@app/hooks/tools/shared/useBaseParameters";

export interface GrayscaleParameters extends BaseParameters {
  dpi: number;
}

export const defaultParameters: GrayscaleParameters = {
  dpi: 300,
};

export type GrayscaleParametersHook = BaseParametersHook<GrayscaleParameters>;

export const useGrayscaleParameters = (): GrayscaleParametersHook => {
  return useBaseParameters({
    defaultParameters,
    endpointName: "pdf-to-grayscale",
    validateFn: (params) => Number.isFinite(params.dpi) && params.dpi > 0,
  });
};
