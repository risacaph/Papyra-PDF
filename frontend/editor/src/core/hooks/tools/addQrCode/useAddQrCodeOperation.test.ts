import { describe, expect, test } from "vitest";
import {
  buildAddQrCodeFormData,
  addQrCodeFromApiParams,
  addQrCodeToApiParams,
  addQrCodeOperationConfig,
} from "@app/hooks/tools/addQrCode/useAddQrCodeOperation";
import {
  AddQrCodeParameters,
  defaultParameters,
} from "@app/hooks/tools/addQrCode/useAddQrCodeParameters";

const params = (
  overrides: Partial<AddQrCodeParameters>,
): AddQrCodeParameters => ({
  ...defaultParameters,
  ...overrides,
});

describe("addQrCodeOperationConfig", () => {
  test("targets the add-qr-code endpoint", () => {
    expect(addQrCodeOperationConfig.endpoint).toBe("/api/v1/misc/add-qr-code");
    expect(addQrCodeOperationConfig.operationType).toBe("addQrCode");
  });
});

describe("addQrCodeToApiParams", () => {
  test("passes content, page selection, position and size through", () => {
    expect(
      addQrCodeToApiParams(
        params({
          content: "https://example.com",
          position: 3,
          size: 120,
          pageNumbers: "1-2",
        }),
      ),
    ).toEqual({
      content: "https://example.com",
      pageNumbers: "1-2",
      position: 3,
      size: 120,
    });
  });
});

describe("addQrCodeFromApiParams", () => {
  test("maps fields back to parameters", () => {
    expect(
      addQrCodeFromApiParams({
        content: "hello",
        position: 5,
        size: 60,
        pageNumbers: "all",
      }),
    ).toEqual({ content: "hello", pageNumbers: "all", position: 5, size: 60 });
  });

  test("omits fields that are absent", () => {
    expect(addQrCodeFromApiParams({ content: "hi" })).toEqual({
      content: "hi",
    });
  });
});

describe("buildAddQrCodeFormData", () => {
  test("appends the file and serialized params", () => {
    const file = new File(["x"], "test.pdf", { type: "application/pdf" });
    const formData = buildAddQrCodeFormData(
      params({ content: "abc", position: 9, size: 100 }),
      file,
    );

    expect(formData.get("fileInput")).toBe(file);
    expect(formData.get("content")).toBe("abc");
    expect(formData.get("position")).toBe("9");
    expect(formData.get("size")).toBe("100");
  });
});
