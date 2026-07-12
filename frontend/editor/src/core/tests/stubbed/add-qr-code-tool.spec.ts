import { test, expect } from "@app/tests/helpers/stub-test-base";
import { uploadFiles } from "@app/tests/helpers/ui-helpers";
import path from "path";

const SAMPLE_PDF = path.join(
  import.meta.dirname,
  "../test-fixtures/sample.pdf",
);

/**
 * Add QR Code requires non-empty content, so the run button must stay disabled
 * both before a file is uploaded and after upload while the content field is
 * still empty. This guards the config-validation wiring.
 */
test.describe("Add QR Code tool — config validation", () => {
  test("run button stays disabled until content is provided", async ({
    page,
  }) => {
    await page.goto("/add-qr-code");
    await page.waitForLoadState("domcontentloaded");

    const runBtn = page.locator('[data-tour="run-button"]');
    await expect(runBtn).toBeVisible({ timeout: 5_000 });
    await expect(runBtn).toBeDisabled();

    await uploadFiles(page, SAMPLE_PDF);

    // Still disabled: QR content is required and empty by default.
    await expect(runBtn).toBeDisabled();
  });
});
