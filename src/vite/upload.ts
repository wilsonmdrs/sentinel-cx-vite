import { spawn } from "node:child_process";

export type UploadArgs = {
  privateKey: string;
  app: string;
  version: string;
  env: string;
  folder: string;
};

export function uploadSourceMaps(args: UploadArgs): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd = "npx";
    const cliArgs = [
      "@coralogix/rum-cli",
      "upload-source-maps",
      "-k", args.privateKey,
      "-a", args.app,
      "-v", args.version,
      "-f", args.folder,
      "-e", args.env
    ];

    const child = spawn(cmd, cliArgs, { stdio: "inherit", shell: process.platform === "win32" });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`@sentinel/cx-vite: sourcemap upload failed (${code})`))
    );
    child.on("error", reject);
  });
}
