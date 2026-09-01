import { randomUUID } from "node:crypto";
import { basename } from "node:path";
import type { ImageGrant, PathGrant } from "../shared/desktop-api.js";

type GrantKind = "directory" | "image";

interface StoredGrant {
  path: string;
  kind: GrantKind;
}

export class PathGrantRegistry {
  readonly #grants = new Map<string, StoredGrant>();

  grantDirectories(paths: readonly string[]): PathGrant[] {
    return paths.map((path) => {
      const id = this.#store(path, "directory");
      return { id, path, name: basename(path) || path };
    });
  }

  grantImages(paths: readonly string[]): ImageGrant[] {
    return paths.map((path) => ({ id: this.#store(path, "image"), name: basename(path) }));
  }

  resolveDirectories(ids: readonly string[]): string[] {
    return ids.map((id) => this.#resolve(id, "directory"));
  }

  resolveImages(ids: readonly string[]): string[] {
    return ids.map((id) => this.#resolve(id, "image"));
  }

  #store(path: string, kind: GrantKind): string {
    const id = randomUUID();
    this.#grants.set(id, { path, kind });
    return id;
  }

  #resolve(id: string, expectedKind: GrantKind): string {
    const grant = this.#grants.get(id);
    if (grant === undefined || grant.kind !== expectedKind) {
      throw new Error(`Unknown or invalid ${expectedKind} path grant.`);
    }
    return grant.path;
  }
}

