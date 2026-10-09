import { copyFile, cp, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(root, "assets", "fixtures");
const appNames = process.argv.slice(2);
const selectedApps = appNames.length ? appNames : ["web", "mvp"];
if (selectedApps.some(app => !["web", "mvp"].includes(app))) throw new Error("Unknown fixture target app");
const publicRoots = selectedApps.map(app => join(root, "apps", app, "public"));
const fixtureFiles = [
  "models/iphone-17-pro-max-dev.glb",
  "models/tablet-dev.glb",
  "models/laptop-dev.glb",
  "screens/dashboard-dark.png",
];

for (const publicRoot of publicRoots) {
  await cp(join(root, "assets/ui"), join(publicRoot, "ui"), { recursive: true });
  await cp(join(root, "assets/fonts"), join(publicRoot, "fonts"), { recursive: true });
  for (const relativePath of fixtureFiles) {
    const destination = join(publicRoot, "fixtures", relativePath);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(join(sourceRoot, relativePath), destination);
  }
  await cp(join(root, "assets/devices/iphone-18-pro-max"), join(publicRoot, "devices/iphone-18-pro-max"), {
    recursive: true,
    filter: source => !source.endsWith(".blend") && !source.endsWith(".blend1") && !source.endsWith("/iphone-18-pro-max.glb"),
  });
  await rm(join(publicRoot, "devices/iphone-18-pro-max/iphone-18-pro-max.glb"), { force: true });
  await rm(join(publicRoot, "devices/iphone-duo"), { recursive: true, force: true });
  await cp(join(root, "assets/devices/iphone-duo"), join(publicRoot, "devices/iphone-duo"), {
    recursive: true,
    filter: source => !source.endsWith(".blend") && !source.endsWith(".blend1") && !source.includes("/renders") && !source.includes("/reference-source"),
  });
}

console.log(`Synced ${fixtureFiles.length} renderer fixtures and iPhone previews to ${publicRoots.length} apps.`);
