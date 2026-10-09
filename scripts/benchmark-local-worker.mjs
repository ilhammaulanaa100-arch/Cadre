import { spawn, execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir, totalmem, cpus, platform, arch } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const runFile = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const evidence = join(root, "docs/evidence/t4-05");
const scratch = await mkdtemp(join(tmpdir(), "forma-benchmark-"));
await mkdir(evidence, { recursive: true });
const jobs = {
  single: join(root, "docs/evidence/t4-03/single-job.json"),
  duo: join(root, "docs/evidence/t4-03/duo-job.json"),
};
const baseUrl = process.env.FORMA_RENDER_URL ?? "http://127.0.0.1:3001";
const ready = await fetch(new URL("/internal/render", baseUrl));
if (!ready.ok) throw new Error(`Start the built app with FORMA_INTERNAL_RENDER=1 first (HTTP ${ready.status})`);
const release = JSON.parse(await readFile(join(root, "packages/catalog/src/render-release.json"), "utf8"));
const repeats = Number(process.env.FORMA_BENCHMARK_REPEATS ?? 5);
const pairs = Number(process.env.FORMA_BENCHMARK_PAIRS ?? 3);
if (![repeats, pairs].every(value => Number.isInteger(value) && value >= 1 && value <= 20)) throw new Error("Invalid benchmark repetition count");
const parseCpuTime = value => {
  const parts = value.split(":").map(Number);
  return parts.reduce((seconds, part) => seconds * 60 + part, 0);
};
async function sampleProcesses(roots) {
  const { stdout } = await runFile("ps", ["-axo", "pid=,ppid=,rss=,time="], { maxBuffer: 4 * 1024 * 1024 });
  const rows = stdout.split("\n").flatMap(line => {
    const fields = line.trim().split(/\s+/);
    return fields.length === 4 ? [{ pid: Number(fields[0]), ppid: Number(fields[1]), rssKiB: Number(fields[2]), cpuSeconds: parseCpuTime(fields[3]) }] : [];
  });
  const descendants = new Set(roots);
  let changed = true;
  while (changed) {
    changed = false;
    for (const row of rows) if (descendants.has(row.ppid) && !descendants.has(row.pid)) { descendants.add(row.pid); changed = true; }
  }
  const selected = rows.filter(row => descendants.has(row.pid));
  return { rssMiB: selected.reduce((sum, row) => sum + row.rssKiB, 0) / 1024,
    cpuSeconds: selected.reduce((sum, row) => sum + row.cpuSeconds, 0), processCount: selected.length };
}
let sequence = 0;
function launch(kind) {
  const id = ++sequence;
  const output = join(scratch, `${kind}-${id}.png`);
  const startedAt = performance.now();
  const child = spawn(process.execPath, [join(root, "scripts/render-local-worker.mjs"), jobs[kind], output], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "", stderr = "";
  child.stdout.on("data", chunk => { stdout += chunk; });
  child.stderr.on("data", chunk => { stderr += chunk; });
  const result = new Promise((resolve, reject) => child.on("exit", async code => {
    if (code !== 0) { reject(new Error(`${kind} worker failed: ${stderr || code}`)); return; }
    try {
      const payload = JSON.parse(stdout.trim());
      const bytes = await readFile(output);
      if (createHash("sha256").update(bytes).digest("hex") !== payload.sha256) throw new Error("Output checksum mismatch");
      resolve({ kind, wallMs: Math.round(performance.now() - startedAt), bytes: bytes.length, actualRenderer: payload.actualRenderer, ...payload.timingsMs });
    } catch (error) { reject(error); }
  }));
  return { child, result };
}
async function batch(kinds) {
  const tasks = kinds.map(launch);
  let peakRssMiB = 0, peakCpuSeconds = 0, peakProcesses = 0, observations = 0;
  let active = true;
  const sampler = (async () => {
    while (active) {
      const sample = await sampleProcesses(tasks.map(task => task.child.pid));
      peakRssMiB = Math.max(peakRssMiB, sample.rssMiB);
      peakCpuSeconds = Math.max(peakCpuSeconds, sample.cpuSeconds);
      peakProcesses = Math.max(peakProcesses, sample.processCount);
      observations++;
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  })();
  try {
    const results = await Promise.all(tasks.map(task => task.result));
    return { kinds, results, peakRssMiB: Math.round(peakRssMiB), sampledCpuSeconds: Number(peakCpuSeconds.toFixed(2)), peakProcesses, observations };
  } finally { active = false; await sampler; }
}
try {
  const chrome = await runFile(process.env.FORMA_CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--version"]);
  const output = {
    measuredAt: new Date().toISOString(),
    host: { platform: platform(), arch: arch(), cpuName: cpus()[0]?.model, logicalCores: cpus().length, memoryGiB: Number((totalmem() / 1024 ** 3).toFixed(1)), node: process.version, chrome: chrome.stdout.trim() },
    rendererRelease: release.rendererRelease,
    conditions: `Next production build on loopback; Chrome backend ${process.env.FORMA_RENDER_BACKEND ?? "default"}; cold Chromium process and profile for each job; PNG 1200x1200; output cache may warm; RSS sums descendant processes and double-counts shared pages; web server is excluded.`,
    runs: [],
  };
  for (const kind of ["single", "duo"]) {
    for (let index = 0; index < repeats; index++) {
      const run = await batch([kind]);
      output.runs.push(run);
      console.log(`${kind} ${index + 1}/${repeats}: ${run.results[0].wallMs} ms, peak RSS sum ${run.peakRssMiB} MiB`);
    }
  }
  for (let index = 0; index < pairs; index++) {
    const run = await batch(["single", "duo"]);
    output.runs.push(run);
    console.log(`parallel pair ${index + 1}/${pairs}: ${run.results.map(result => `${result.kind} ${result.wallMs} ms`).join(", ")}, peak RSS sum ${run.peakRssMiB} MiB`);
  }
  await writeFile(join(evidence, process.env.FORMA_RENDER_BACKEND === "swiftshader" ? "benchmark-swiftshader.json" : "benchmark-local.json"), JSON.stringify(output, null, 2) + "\n");
} finally { await rm(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); }
