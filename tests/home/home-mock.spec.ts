import { test, expect } from "@playwright/test";

type PetProfileLike = {
  id: number;
  name: string;
  species: "dog" | "cat" | "other";
  breed: string;
  age: string;
  weight_kg: number | null;
};

const pet: PetProfileLike = {
  id: 42,
  name: "毛球",
  species: "cat",
  breed: "英短",
  age: "2岁",
  weight_kg: 4.5,
};

const FIXED_DATE_ISO = "2026-06-22T10:00:00.000Z";

test.describe("Plan B — Mock 数据层", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/__viz/home-mock-host.html", { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="ready"]:not([hidden])');
    // 每个测试前清空 localStorage，避免互相污染
    await page.evaluate(() => localStorage.clear());
  });

  test("零数据态：getDailyDigest 返回空 insights + 默认问候", async ({ page }) => {
    const digest = await page.evaluate(
      async ({ pet, iso }) => {
        const w = window as any;
        return await w.__homeMock.getDailyDigest(pet, new Date(iso));
      },
      { pet, iso: FIXED_DATE_ISO }
    );
    expect(digest.speaks).toBe("今天还没见到你呢");
    expect(digest.speaksMood).toBe("normal");
    expect(digest.insights).toEqual([]);
    expect(typeof digest.generatedAt).toBe("string");
  });

  test("零数据态：getDailyTip 提示去拍照", async ({ page }) => {
    const tip = await page.evaluate(
      async ({ pet, iso }) => {
        const w = window as any;
        return await w.__homeMock.getDailyTip(pet, new Date(iso));
      },
      { pet, iso: FIXED_DATE_ISO }
    );
    expect(tip.text).toBe("拍张照片让我们认识一下吧");
    expect(tip.category).toBe("environment");
  });

  test("getCheckInStatus 初始全为 null", async ({ page }) => {
    const status = await page.evaluate(
      async ({ petId, iso }) => {
        const w = window as any;
        return await w.__homeMock.getCheckInStatus(petId, new Date(iso));
      },
      { petId: pet.id, iso: FIXED_DATE_ISO }
    );
    expect(status).toEqual({
      photoToday: null,
      ate: null,
      active: null,
      mood: null,
    });
  });

  test("postCheckIn 三选全勾选 → speaks 与 insights 都被合成", async ({ page }) => {
    const digest = await page.evaluate(
      async ({ pet, iso }) => {
        const w = window as any;
        return await w.__homeMock.postCheckIn(
          pet,
          { ate: "less", active: "normal", mood: "low" },
          new Date(iso)
        );
      },
      { pet, iso: FIXED_DATE_ISO }
    );
    expect(digest.speaks).toBe("今天没什么胃口，懒洋洋的");
    expect(digest.speaksMood).toBe("tired");
    expect(digest.insights.length).toBeGreaterThan(0);
    expect(digest.insights[0]).toContain("毛球");
  });

  test("postCheckIn 是增量合并，不会清空已存在的字段", async ({ page }) => {
    const result = await page.evaluate(
      async ({ pet, iso }) => {
        const w = window as any;
        await w.__homeMock.postCheckIn(pet, { ate: "normal" }, new Date(iso));
        await w.__homeMock.postCheckIn(pet, { active: "much" }, new Date(iso));
        const status = await w.__homeMock.getCheckInStatus(pet.id, new Date(iso));
        return status;
      },
      { pet, iso: FIXED_DATE_ISO }
    );
    expect(result.ate).toBe("normal");
    expect(result.active).toBe("much");
    expect(result.mood).toBeNull();
  });

  test("localStorage key 按宠物 + 当地日期分桶", async ({ page }) => {
    const keys = await page.evaluate(
      async ({ petId, iso }) => {
        const w = window as any;
        const d = new Date(iso);
        return {
          today: w.__homeMock.__checkInKey(petId, d),
          tomorrow: w.__homeMock.__checkInKey(
            petId,
            new Date(d.getTime() + 24 * 3600 * 1000)
          ),
        };
      },
      { petId: pet.id, iso: FIXED_DATE_ISO }
    );
    expect(keys.today).toMatch(/^checkin:42:\d{4}-\d{2}-\d{2}$/);
    expect(keys.tomorrow).not.toBe(keys.today);
  });

  test("跨天读取：今天的数据不会出现在明天", async ({ page }) => {
    const next = await page.evaluate(
      async ({ pet, iso }) => {
        const w = window as any;
        const today = new Date(iso);
        const tomorrow = new Date(today.getTime() + 24 * 3600 * 1000);
        await w.__homeMock.postCheckIn(pet, { ate: "less", active: "less", mood: "low" }, today);
        return await w.__homeMock.getCheckInStatus(pet.id, tomorrow);
      },
      { pet, iso: FIXED_DATE_ISO }
    );
    expect(next).toEqual({
      photoToday: null,
      ate: null,
      active: null,
      mood: null,
    });
  });

  test("getDailyDigest 在拍照单字段已填时返回 happy 心情", async ({ page }) => {
    const digest = await page.evaluate(
      async ({ pet, iso }) => {
        const w = window as any;
        await w.__homeMock.postCheckIn(
          pet,
          { photoToday: { url: "data:image/png;base64,AAA", takenAt: iso } },
          new Date(iso)
        );
        return await w.__homeMock.getDailyDigest(pet, new Date(iso));
      },
      { pet, iso: FIXED_DATE_ISO }
    );
    expect(digest.speaks).toBe("你拍了我啦，看我今天怎么样？");
    expect(digest.speaksMood).toBe("happy");
  });
});
