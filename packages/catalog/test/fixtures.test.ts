import { validateDeviceManifest, validateSceneDocument } from "@mockup-3d/contracts";
import { describe, expect, it } from "vitest";

import { iphone17ProMaxManifestFixture, iphone17ProMaxSceneFixture } from "../src";

describe("iPhone 17 Pro Max metadata fixture", () => {
  it("can be read without UI or renderer", () => {
    expect(validateDeviceManifest(iphone17ProMaxManifestFixture).ok).toBe(true);
    expect(validateSceneDocument(iphone17ProMaxSceneFixture).ok).toBe(true);
  });

  it("pins the project-owned render asset by hash", () => {
    expect(iphone17ProMaxManifestFixture.lifecycleStatus).toBe("ready");
    expect(iphone17ProMaxManifestFixture.previewAsset?.sha256).toBe(
      "7534e52ca53ef8c95a0d883e8d8402a70d4d905f0a0da4e482aba735384ee0c5",
    );
  });
});
