import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
import ts from "typescript";
const temporary = path.resolve("node_modules/.cache/sr-qa");
await fs.mkdir(temporary, { recursive: true });
async function load(file, name) {
  const source = await fs.readFile(file, "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const output = path.join(temporary, name + ".mjs");
  await fs.writeFile(output, code);
  return import(pathToFileURL(output).href);
}
const { seed } = await load("src/features/projects/fixtures/seed.ts", "seed");
const { statusLabels, categoryLabels, roleLabels } = await load(
  "src/lib/types.ts",
  "types",
);
const db = seed();
const project = (id) => db.projects.find((p) => p.id === id);
for (const collection of Object.values(db))
  assert.equal(
    new Set(collection.map((x) => x.id)).size,
    collection.length,
    "Unique entity ids",
  );
for (const p of db.processes) {
  assert(p.start <= p.deadline, "Process chronology");
  assert(
    p.start >= project(p.projectId).start,
    "Process starts within project",
  );
  assert(
    p.deadline <= project(p.projectId).deadline,
    "Process ends within project",
  );
  assert(
    db.works.some((w) => w.id === p.workId && w.projectId === p.projectId),
    "Process/work link",
  );
  for (const id of p.dependencies) {
    const dependency = db.processes.find((x) => x.id === id);
    assert(dependency, "Dependency exists");
    assert(dependency.deadline < p.start, "Dependency chronology");
  }
}
for (const task of db.tasks) {
  assert(
    db.people.some((p) => p.id === task.assigneeId),
    "Task assignee exists",
  );
  assert(
    db.works.some(
      (w) => w.id === task.workId && w.projectId === task.projectId,
    ),
    "Task/work link",
  );
  assert(
    task.deadline >= project(task.projectId).start,
    "Task after project start",
  );
  assert(
    task.deadline <= project(task.projectId).deadline,
    "Task before project end",
  );
}
for (const tender of db.tenders) {
  for (const id of tender.supplierIds) {
    const supplier = db.suppliers.find((s) => s.id === id);
    assert(
      supplier.categories.includes(tender.category),
      "Supplier matches tender category",
    );
  }
  assert(
    !tender.winnerId ||
      tender.offers.some(
        (o) => o.supplierId === tender.winnerId && o.price > 0,
      ),
    "Winner has a valid offer",
  );
}
for (const c of db.contracts) {
  if (c.tenderId) {
    const tender = db.tenders.find((t) => t.id === c.tenderId);
    assert.equal(
      tender.winnerId,
      c.supplierId,
      "Contract supplier matches award",
    );
    assert.equal(
      tender.offers.find((o) => o.supplierId === c.supplierId).price,
      c.amount,
      "Contract price matches award",
    );
  }
  if (c.status === "signed")
    assert(
      c.signedAttachment && c.signers.every((s) => s.status === "signed"),
      "Signed artifact and signature state",
    );
}
for (const w of db.works)
  assert(
    w.quantity > 0 && w.rate >= 0 && Number.isFinite(w.quantity * w.rate),
    "Estimate arithmetic",
  );
const represented = new Set(
  [
    ...db.projects,
    ...db.processes,
    ...db.tasks,
    ...db.tenders,
    ...db.contracts,
    ...db.handovers,
  ].map((x) => x.status),
);
for (const status of Object.keys(statusLabels))
  assert(
    represented.has(status),
    "Every domain status is represented: " + status,
  );
for (const map of [statusLabels, categoryLabels, roleLabels])
  for (const value of Object.values(map))
    assert(value.lt && value.en, "Complete domain translations");
assert.equal(db.projects.length, 7);
assert(db.processes.length >= 30);
assert(db.tasks.length >= 15);
assert(db.suppliers.length >= 8);
assert(db.contracts.length >= 5);
console.log(
  "Seed integrity passed:",
  Object.fromEntries(Object.entries(db).map(([k, v]) => [k, v.length])),
);
