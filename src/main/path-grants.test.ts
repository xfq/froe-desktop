import { describe, expect, test } from "vitest";
import { PathGrantRegistry } from "./path-grants.js";

describe("PathGrantRegistry", () => {
  test("resolves only paths granted for the expected purpose", () => {
    const registry = new PathGrantRegistry();
    const [directory] = registry.grantDirectories(["/tmp/workspace"]);
    const [image] = registry.grantImages(["/tmp/screenshot.png"]);

    expect(registry.resolveDirectories([directory!.id])).toEqual(["/tmp/workspace"]);
    expect(registry.resolveImages([image!.id])).toEqual(["/tmp/screenshot.png"]);
    expect(() => registry.resolveImages([directory!.id])).toThrow(/invalid image path grant/);
    expect(() => registry.resolveDirectories(["missing"])).toThrow(/directory path grant/);
  });
});

