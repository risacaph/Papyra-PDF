import { BaseParameters } from "@app/types/parameters";
import {
  useBaseParameters,
  type BaseParametersHook,
} from "@app/hooks/tools/shared/useBaseParameters";

export interface AccessibilityParameters extends BaseParameters {
  /** Document title to set; blank leaves the existing title untouched. */
  title: string;
  /** Document language (e.g. en-US); blank leaves the existing language untouched. */
  language: string;
  /** Set the viewer preference so the window shows the document title. */
  setDisplayDocTitle: boolean;
  /** Set every page's tab order to follow the document structure. */
  setStructureTabOrder: boolean;
}

export const defaultParameters: AccessibilityParameters = {
  title: "",
  language: "",
  setDisplayDocTitle: true,
  setStructureTabOrder: false,
};

export type AccessibilityParametersHook =
  BaseParametersHook<AccessibilityParameters>;

export const useAccessibilityParameters = (): AccessibilityParametersHook =>
  useBaseParameters<AccessibilityParameters>({
    defaultParameters,
    // Not a config-gated backend endpoint; the edit controller is always available.
    endpointName: "",
    validateFn: (params): boolean =>
      params.title.trim().length > 0 ||
      params.language.trim().length > 0 ||
      params.setDisplayDocTitle ||
      params.setStructureTabOrder,
  });
