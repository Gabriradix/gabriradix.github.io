import { existsSync, copyFileSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

// Windows Google Drive EBUSY fix: sync native binary to local app data
if (process.platform === "win32") {
  const localAppData = process.env.LOCALAPPDATA || process.env.TEMP || "";
  const esbuildDir = join(localAppData, "esbuild-bin");
  const localEsbuild = join(esbuildDir, "esbuild.exe");
  const sourceEsbuild = join(process.cwd(), "node_modules", "@esbuild", "win32-x64", "esbuild.exe");

  try {
    mkdirSync(esbuildDir, { recursive: true });
    if (existsSync(sourceEsbuild)) {
      if (!existsSync(localEsbuild) || statSync(sourceEsbuild).size !== statSync(localEsbuild).size) {
        copyFileSync(sourceEsbuild, localEsbuild);
      }
    }
  } catch {}

  if (existsSync(localEsbuild)) {
    process.env.ESBUILD_BINARY_PATH = localEsbuild;
  }
}

const astroCli = join(process.cwd(), "node_modules", "astro", "bin", "astro.mjs");
const child = spawn(process.execPath, [astroCli, "build", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: false,
  env: process.env
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
