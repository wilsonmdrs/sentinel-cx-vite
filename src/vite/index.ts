import type { Plugin } from "vite";
import { uploadSourceMaps } from "./upload.js";

export type CoralogixSourcemapsPluginOptions = {
  enabled?: boolean;

  privateKey?: string;
  app?: string;
  env?: string;
  version?: string;

  folder?: string; // default dist/assets
};

export function coralogixSourcemapsPlugin(
  opts: CoralogixSourcemapsPluginOptions,
): Plugin {
  return {
    name: "@sentinel/cx-vite-sourcemaps",
    apply: "build",
    async closeBundle() {
      if (!opts.enabled) return;

      const privateKey = opts.privateKey;
      const app = opts.app;
      const env = opts.env;
      const version = opts.version;
      const folder = opts.folder ?? "dist/assets";

      if (!privateKey || !app || !env || !version) {
        throw new Error(
          "@sentinel/cx-vite: coralogixSourcemapsPlugin requires privateKey, app, env, version when enabled=true",
        );
      }

      await uploadSourceMaps({ privateKey, app, env, version, folder });
    },
  };
}
