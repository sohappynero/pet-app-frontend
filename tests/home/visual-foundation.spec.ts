import { test, expect } from "@playwright/test";

test.describe("Plan A — 视觉系统打底", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14 视口
    await page.goto("/__viz/visual-foundation.html", { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="viz-title"]');
  });

  test("tokens 已注入：CSS 变量在 :root 可读", async ({ page }) => {
    const primary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim()
    );
    expect(primary.toUpperCase()).toBe("#FFB84D");

    const radiusMd = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--radius-md").trim()
    );
    expect(radiusMd).toBe("16px");

    const space5 = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--space-5").trim()
    );
    expect(space5).toBe("24px");
  });

  test("色板：5 色样块渲染且无空白", async ({ page }) => {
    const count = await page.locator('[data-testid="viz-swatches"] .swatch').count();
    expect(count).toBe(5);
    await expect(page.locator('[data-testid="viz-swatches"]')).toHaveScreenshot(
      "swatches.png",
      { maxDiffPixels: 50 }
    );
  });

  test("Card 基底：flat 与 elevated 视觉稳定", async ({ page }) => {
    await expect(page.locator('[data-testid="viz-card-flat"]')).toHaveScreenshot(
      "card-flat.png",
      { maxDiffPixels: 50 }
    );
    await expect(page.locator('[data-testid="viz-card-elevated"]')).toHaveScreenshot(
      "card-elevated.png",
      { maxDiffPixels: 50 }
    );
  });

  test("SpeechBubble 基底：气泡视觉稳定", async ({ page }) => {
    await expect(page.locator('[data-testid="viz-bubble"]')).toHaveScreenshot(
      "bubble.png",
      { maxDiffPixels: 50 }
    );
  });
});
