import { existsSync, copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

// Windows Google Drive EBUSY fix
if (process.platform === "win32") {
  const localAppData = process.env.LOCALAPPDATA || process.env.TEMP || "";
  const esbuildDir = join(localAppData, "esbuild-bin");
  const localEsbuild = join(esbuildDir, "esbuild.exe");

  if (!existsSync(localEsbuild)) {
    try {
      mkdirSync(esbuildDir, { recursive: true });
      const sourceEsbuild = join(process.cwd(), "node_modules", "@esbuild", "win32-x64", "esbuild.exe");
      if (existsSync(sourceEsbuild)) {
        copyFileSync(sourceEsbuild, localEsbuild);
      }
    } catch {}
  }

  if (existsSync(localEsbuild)) {
    process.env.ESBUILD_BINARY_PATH = localEsbuild;
  }
}

const isWindows = process.platform === "win32";
const astroCmd = isWindows ? "npx.cmd" : "npx";
const child = spawn(astroCmd, ["astro", "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
  env: process.env
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
