import { BaseParameters } from "@app/types/parameters";
import {
  useBaseParameters,
  type BaseParametersHook,
} from "@app/hooks/tools/shared/useBaseParameters";

export type LinkTargetType = "uri" | "page";

/**
 * A link to add. Geometry (x, y, width, height) is stored as fractions (0-1) of the page,
 * measured from the top-left corner — the same space the placement canvas works in and the
 * backend's /api/v1/edit/links/apply endpoint expects.
 */
export interface NewLink {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  target: LinkTargetType;
  uri: string;
  /** 1-based target page for internal links. */
  targetPage: number;
}

/** Reference to an existing link annotation scheduled for removal. */
export interface ExistingLinkRef {
  pageIndex: number;
  annotationIndex: number;
}

export interface LinkEditorParameters extends BaseParameters {
  additions: NewLink[];
  removals: ExistingLinkRef[];
}

export const defaultParameters: LinkEditorParameters = {
  additions: [],
  removals: [],
};

export type LinkEditorParametersHook = BaseParametersHook<LinkEditorParameters>;

const isValidAddition = (link: NewLink): boolean =>
  link.target === "uri" ? link.uri.trim().length > 0 : link.targetPage >= 1;

export const useLinkEditorParameters = (): LinkEditorParametersHook =>
  useBaseParameters<LinkEditorParameters>({
    defaultParameters,
    // Not a config-gated backend endpoint; the edit controller is always available.
    endpointName: "",
    validateFn: (params): boolean =>
      (params.additions.length > 0 || params.removals.length > 0) &&
      params.additions.every(isValidAddition),
  });
