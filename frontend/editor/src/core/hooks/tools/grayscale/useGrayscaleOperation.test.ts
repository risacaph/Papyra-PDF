import { describe, expect, test } from "vitest";
import {
  buildGrayscaleFormData,
  grayscaleFromApiParams,
  grayscaleToApiParams,
  grayscaleOperationConfig,
} from "@app/hooks/tools/grayscale/useGrayscaleOperation";
import {
  GrayscaleParameters,
  defaultParameters,
} from "@app/hooks/tools/grayscale/useGrayscaleParameters";

const params = (
  overrides: Partial<GrayscaleParameters>,
): GrayscaleParameters => ({
  ...defaultParameters,
  ...overrides,
});

describe("grayscaleOperationConfig", () => {
  test("targets the pdf-to-grayscale endpoint", () => {
    expect(grayscaleOperationConfig.endpoint).toBe(
      "/api/v1/misc/pdf-to-grayscale",
    );
    expect(grayscaleOperationConfig.operationType).toBe("grayscale");
  });
});

describe("grayscaleToApiParams", () => {
  test("passes the DPI through", () => {
    expect(grayscaleToApiParams(params({ dpi: 150 }))).toEqual({ dpi: 150 });
  });

  test("defaults produce dpi 300", () => {
    expect(grayscaleToApiParams(defaultParameters)).toEqual({ dpi: 300 });
  });
});

describe("grayscaleFromApiParams", () => {
  test("maps dpi back to parameters", () => {
    expect(grayscaleFromApiParams({ dpi: 200 })).toEqual({ dpi: 200 });
  });

  test("omits dpi when absent", () => {
    expect(grayscaleFromApiParams({})).toEqual({});
  });
});

describe("grayscale round-trip", () => {
  test.each<Partial<GrayscaleParameters>>([
    { dpi: 72 },
    { dpi: 300 },
    { dpi: 600 },
  ])("toApiParams(fromApiParams(x)) reproduces x %o", (overrides) => {
    const api = grayscaleToApiParams(params(overrides));
    const roundTripped = grayscaleToApiParams(
      params(grayscaleFromApiParams(api)),
    );
    expect(roundTripped).toEqual(api);
  });
});

describe("buildGrayscaleFormData", () => {
  test("appends the file and serialized dpi", () => {
    const file = new File(["x"], "test.pdf", { type: "application/pdf" });
    const formData = buildGrayscaleFormData(params({ dpi: 150 }), file);

    expect(formData.get("fileInput")).toBe(file);
    expect(formData.get("dpi")).toBe("150");
  });
});
