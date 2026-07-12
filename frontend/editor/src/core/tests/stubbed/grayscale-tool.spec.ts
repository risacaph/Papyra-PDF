import { test, expect } from "@app/tests/helpers/stub-test-base";
import { uploadFiles } from "@app/tests/helpers/ui-helpers";
import path from "path";

const SAMPLE_PDF = path.join(
  import.meta.dirname,
  "../test-fixtures/sample.pdf",
);

/**
 * Grayscale / Ink-Saver has a single settings step (DPI) with a sensible
 * default, so the run button should be disabled until a PDF is uploaded and
 * then enable immediately (parameters are valid by default). This catches the
 * common regression where a config-validation effect fails to mark the form
 * valid.
 */
test.describe("Grayscale tool — config validation", () => {
  test("run button stays disabled until a PDF is uploaded", async ({
    page,
  }) => {
    await page.goto("/grayscale");
    await page.waitForLoadState("domcontentloaded");

    const runBtn = page.locator('[data-tour="run-button"]');
    await expect(runBtn).toBeVisible({ timeout: 5_000 });
    await expect(runBtn).toBeDisabled();

    await uploadFiles(page, SAMPLE_PDF);

    // After upload the run button should enable (default DPI is valid)
    await expect(runBtn).toBeEnabled({ timeout: 5_000 });
  });
});
