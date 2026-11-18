import { useState } from "react";
import {
  Button,
  Group,
  Modal,
  MultiSelect,
  Select,
  Stack,
  TextInput,
  Textarea,
  SimpleGrid,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { z } from "zod";
import { useApp } from "../lib/i18n";
import { useDatabase, useSave } from "../lib/store";
import {
  categoryLabels,
  roleLabels,
  statusLabels,
  processStatuses,
  uid,
  today,
  nextContractNumber,
  type Database,
  type Status,
  type Category,
  type Role,
} from "../lib/types";
export type EntityKind =
  | "project"
  | "process"
  | "task"
  | "supplier"
  | "tender"
  | "contract"
  | "document"
  | "handover"
  | "person"
  | "work";
const collections = {
  project: "projects",
  process: "processes",
  task: "tasks",
  supplier: "suppliers",
  tender: "tenders",
  contract: "contracts",
  document: "documents",
  handover: "handovers",
  person: "people",
  work: "works",
} as const;
const labels: Record<EntityKind, [string, string]> = {
  project: ["projektą", "project"],
  process: ["procesą", "process"],
  task: ["užduotį", "task"],
  supplier: ["tiekėją", "supplier"],
  tender: ["konkursą", "tender"],
  contract: ["sutartį", "contract"],
  document: ["dokumentą", "document"],
  handover: ["pridavimo etapą", "handover stage"],
  person: ["naudotoją", "user"],
  work: ["darbų poziciją", "work position"],
};
type Values = Record<string, string | string[]>;
interface Field {
  key: string;
  lt: string;
  en: string;
  type?: "select" | "multi" | "date" | "number" | "textarea" | "email" | "url";
  data?: { value: string; label: string }[];
  required?: boolean;
}
export function EntityEditor({
  kind,
  id,
  projectId = "",
  workId = "",
  onClose,
}: {
  kind: EntityKind;
  id?: string;
  projectId?: string;
  workId?: string;
  onClose: () => void;
}) {
  const { data: db } = useDatabase();
  if (!db) return null;
  return (
    <Editor
      key={`${kind}-${id || "new"}`}
      db={db}
      kind={kind}
      id={id}
      projectId={projectId}
      workId={workId}
      onClose={onClose}
    />
  );
}
function Editor({
  db,
  kind,
  id,
  projectId,
  workId,
  onClose,
}: {
  db: Database;
  kind: EntityKind;
  id?: string;
  projectId: string;
  workId: string;
  onClose: () => void;
}) {
  const { t, lang, role, personId } = useApp();
  const save = useSave();
  const [submitError, setSubmitError] = useState("");
  const collection = collections[kind];
  const item = id ? db[collection].find((x) => x.id === id) : undefined;
  const raw = (item || {}) as unknown as Record<string, unknown>;
  const rawName = raw.name;
  const name =
    typeof rawName === "object" && rawName
      ? (rawName as { lt: string; en: string })
      : {
          lt: typeof rawName === "string" ? rawName : "",
          en: typeof rawName === "string" ? rawName : "",
        };
  const initialValues: Values = {
    nameLt: name.lt,
    nameEn: name.en,
    projectId: typeof raw.projectId === "string" ? raw.projectId : projectId,
    workId: typeof raw.workId === "string" ? raw.workId : workId,
    processId: "",
    assigneeId: role === "worker" ? personId : "u5",
    supplierId: "",
    managerId: "u1",
    worksManagerId: "u5",
    start: today,
    deadline: "2026-12-18",
    status: "planned",
    budget: "0",
    quantity: "1",
    unit: "m²",
    rate: "0",
    groupLt: "",
    groupEn: "",
    email: "",
    phone: "",
    contact: "",
    address: "",
    client: "",
    code: "",
    url: "https://drive.google.com/drive/u/0/my-drive",
    category: "general",
    categories: [],
    supplierIds: [],
    documentIds: [],
    team: [],
    role: "worker",
    number: nextContractNumber(db.contracts),
    amount: "0",
    tenderId: "",
    dependencies: [],
  };
  Object.entries(raw).forEach(([k, v]) => {
    if (k === "name" || k === "group") return;
    if (typeof v === "string" || typeof v === "number")
      initialValues[k] = String(v);
    else if (Array.isArray(v) && v.every((x) => typeof x === "string"))
      initialValues[k] = v as string[];
  });
  if (raw.group && typeof raw.group === "object") {
    const g = raw.group as { lt: string; en: string };
    initialValues.groupLt = g.lt;
    initialValues.groupEn = g.en;
  }
  const opts = {
    projects: db.projects.map((p) => ({ value: p.id, label: p.name[lang] })),
    people: db.people.map((p) => ({ value: p.id, label: p.name })),
    suppliers: db.suppliers.map((p) => ({ value: p.id, label: p.name })),
    categories: Object.entries(categoryLabels).map(([value, l]) => ({
      value,
      label: l[lang],
    })),
    statuses: processStatuses.map((value) => ({
      value,
      label: statusLabels[value][lang],
    })),
  };
  const projectField: Field = {
    key: "projectId",
    lt: "Projektas",
    en: "Project",
    type: "select",
    data: opts.projects,
    required: true,
  };
  const assignee: Field = {
    key: "assigneeId",
    lt: "Atsakingas asmuo",
    en: "Assignee",
    type: "select",
    data: opts.people,
    required: true,
  };
  const deadline: Field = {
    key: "deadline",
    lt: "Terminas",
    en: "Deadline",
    type: "date",
    required: true,
  };
  const status: Field = {
    key: "status",
    lt: "Būsena",
    en: "Status",
    type: "select",
    data: opts.statuses,
    required: true,
  };
  const category: Field = {
    key: "category",
    lt: "Kategorija",
    en: "Category",
    type: "select",
    data: opts.categories,
    required: true,
  };
  const fields: Field[] = [];
  if (kind === "person" || kind === "supplier")
    fields.push({
      key: "nameLt",
      lt: kind === "person" ? "Vardas ir pavardė" : "Įmonės pavadinimas",
      en: kind === "person" ? "Full name" : "Company name",
      required: true,
    });
  else
    fields.push(
      {
        key: "nameLt",
        lt: "Pavadinimas lietuviškai",
        en: "Name in Lithuanian",
        required: true,
      },
      {
        key: "nameEn",
        lt: "Pavadinimas angliškai",
        en: "Name in English",
        required: true,
      },
    );
  if (kind === "project")
    fields.push(
      { key: "address", lt: "Adresas", en: "Address", required: true },
      { key: "client", lt: "Užsakovas", en: "Client", required: true },
      {
        key: "managerId",
        lt: "Projekto vadovas",
        en: "Project manager",
        type: "select",
        data: opts.people,
        required: true,
      },
      {
        key: "worksManagerId",
        lt: "Darbų vadovas",
        en: "Works manager",
        type: "select",
        data: opts.people,
        required: true,
      },
      {
        key: "team",
        lt: "Komanda",
        en: "Team",
        type: "multi",
        data: opts.people,
      },
      {
        key: "start",
        lt: "Pradžia",
        en: "Start date",
        type: "date",
        required: true,
      },
      deadline,
      status,
      {
        key: "budget",
        lt: "Biudžetas (€)",
        en: "Budget (€)",
        type: "number",
        required: true,
      },
    );
  if (
    [
      "process",
      "task",
      "tender",
      "contract",
      "document",
      "handover",
      "work",
    ].includes(kind)
  )
    fields.push(projectField);
  const form = useForm<Values>({
    initialValues,
    validate: (values) => {
      const errors: Record<string, string> = {};
      for (const f of fields) {
        const v = values[f.key];
        if (
          f.required &&
          (Array.isArray(v) ? !v.length : !String(v || "").trim())
        )
          errors[f.key] = t("Šis laukas privalomas", "This field is required");
        if (f.type === "email" && v && !z.email().safeParse(v).success)
          errors[f.key] = t(
            "Įveskite teisingą el. pašto adresą",
            "Enter a valid email address",
          );
        if (f.type === "url" && v) {
          const r = z.url({ protocol: /^https?$/ }).safeParse(v);
          if (!r.success)
            errors[f.key] = t(
              "Įveskite https:// arba http:// nuorodą",
              "Enter an https:// or http:// URL",
            );
        }
        if (
          f.type === "number" &&
          (!Number.isFinite(Number(v)) || Number(v) < 0)
        )
          errors[f.key] = t(
            "Įveskite neneigiamą skaičių",
            "Enter a non-negative number",
          );
        if (f.type === "date" && v && !z.iso.date().safeParse(v).success)
          errors[f.key] = t(
            "Data turi būti YYYY-MM-DD formatu",
            "Date must use YYYY-MM-DD",
          );
      }
      if (
        ["project", "process"].includes(kind) &&
        String(values.start) > String(values.deadline)
      )
        errors.deadline = t(
          "Terminas negali būti ankstesnis už pradžią",
          "Deadline cannot be before the start date",
        );
      return errors;
    },
  });
  const selectedProject = String(form.values.projectId);
  const selectedWork = String(form.values.workId);
  const linkedWork: Field = {
    key: "workId",
    lt: "Sąmatos pozicija",
    en: "Work position",
    type: "select",
    data: db.works
      .filter((w) => w.projectId === selectedProject)
      .map((w) => ({ value: w.id, label: w.name[lang] })),
    required: kind === "process" || kind === "tender",
  };
  if (["process", "task", "tender"].includes(kind)) fields.push(linkedWork);
  if (kind === "process")
    fields.push(
      assignee,
      {
        key: "start",
        lt: "Pradžia",
        en: "Start",
        type: "date",
        required: true,
      },
      deadline,
      status,
      {
        key: "dependencies",
        lt: "Priklausomybės (ankstesni procesai)",
        en: "Dependencies (predecessor processes)",
        type: "multi",
        data: db.processes
          .filter((p) => p.projectId === selectedProject && p.id !== id)
          .map((p) => ({
            value: p.id,
            label:
              p.name[lang] +
              " · " +
              db.works.find((w) => w.id === p.workId)?.name[lang],
          })),
      },
    );
  if (kind === "task")
    fields.push(
      {
        key: "processId",
        lt: "Susijęs procesas",
        en: "Linked process",
        type: "select",
        data: db.processes
          .filter(
            (p) =>
              p.projectId === selectedProject &&
              (!selectedWork || p.workId === selectedWork),
          )
          .map((p) => ({ value: p.id, label: p.name[lang] })),
      },
      assignee,
      {
        key: "supplierId",
        lt: "Subrangovas (neprivaloma)",
        en: "Subcontractor (optional)",
        type: "select",
        data: opts.suppliers,
      },
      deadline,
      status,
    );
  if (kind === "tender")
    fields.push(
      category,
      {
        key: "supplierIds",
        lt: "Užklausos gavėjai",
        en: "Inquiry recipients",
        type: "multi",
        data: db.suppliers
          .filter((s) =>
            s.categories.includes(form.values.category as Category),
          )
          .map((s) => ({ value: s.id, label: s.name })),
        required: true,
      },
      deadline,
      {
        key: "documentIds",
        lt: "Google Drive dokumentai",
        en: "Google Drive documents",
        type: "multi",
        data: db.documents
          .filter((d) => d.projectId === selectedProject)
          .map((d) => ({ value: d.id, label: d.name[lang] })),
      },
    );
  if (kind === "supplier")
    fields.push(
      {
        key: "code",
        lt: "Įmonės kodas",
        en: "Company registration number",
        required: true,
      },
      {
        key: "contact",
        lt: "Kontaktinis asmuo",
        en: "Contact person",
        required: true,
      },
      {
        key: "email",
        lt: "El. paštas",
        en: "Email",
        type: "email",
        required: true,
      },
      { key: "phone", lt: "Telefonas", en: "Phone", required: true },
      { key: "address", lt: "Adresas", en: "Address" },
      {
        key: "categories",
        lt: "Darbų / medžiagų kategorijos",
        en: "Work / material categories",
        type: "multi",
        data: opts.categories,
        required: true,
      },
    );
  if (kind === "contract")
    fields.push(
      {
        key: "number",
        lt: "Sutarties numeris",
        en: "Contract number",
        required: true,
      },
      {
        key: "supplierId",
        lt: "Tiekėjas",
        en: "Supplier",
        type: "select",
        data: opts.suppliers,
        required: true,
      },
      {
        key: "tenderId",
        lt: "Susijęs konkursas",
        en: "Linked tender",
        type: "select",
        data: db.tenders
          .filter((x) => x.projectId === selectedProject)
          .map((x) => ({ value: x.id, label: x.name[lang] })),
      },
      category,
      {
        key: "amount",
        lt: "Suma be PVM (€)",
        en: "Amount excl. VAT (€)",
        type: "number",
        required: true,
      },
      deadline,
    );
  if (kind === "document")
    fields.push(category, {
      key: "url",
      lt: "Google Drive nuoroda",
      en: "Google Drive link",
      type: "url",
      required: true,
    });
  if (kind === "handover")
    fields.push(assignee, deadline, status, {
      key: "documentIds",
      lt: "Dokumentai",
      en: "Documents",
      type: "multi",
      data: db.documents
        .filter((d) => d.projectId === selectedProject)
        .map((d) => ({ value: d.id, label: d.name[lang] })),
    });
  if (kind === "person")
    fields.push(
      {
        key: "email",
        lt: "El. paštas",
        en: "Email",
        type: "email",
        required: true,
      },
      { key: "phone", lt: "Telefonas", en: "Phone" },
      {
        key: "role",
        lt: "Rolė",
        en: "Role",
        type: "select",
        required: true,
        data: Object.entries(roleLabels).map(([value, l]) => ({
          value,
          label: l[lang],
        })),
      },
    );
  if (kind === "work")
    fields.push(
      {
        key: "groupLt",
        lt: "Darbų grupė lietuviškai",
        en: "Work group in Lithuanian",
        required: true,
      },
      {
        key: "groupEn",
        lt: "Darbų grupė angliškai",
        en: "Work group in English",
        required: true,
      },
      {
        key: "quantity",
        lt: "Kiekis",
        en: "Quantity",
        type: "number",
        required: true,
      },
      { key: "unit", lt: "Matavimo vienetas", en: "Unit", required: true },
      {
        key: "rate",
        lt: "Vieneto kaina (€)",
        en: "Unit rate (€)",
        type: "number",
        required: true,
      },
    );
  const submit = (v: Values) => {
    setSubmitError("");
    const s = (k: string) => String(v[k] || "");
    const arr = (k: string) => (Array.isArray(v[k]) ? v[k] : []) as string[];
    const name = { lt: s("nameLt"), en: s("nameEn") };
    const base = { id: id || uid() };
    const projectId = s("projectId");
    const deadline = s("deadline");
    let next: unknown;
    if (
      kind === "contract" &&
      db.contracts.some((c) => c.number === s("number") && c.id !== id)
    ) {
      form.setFieldError(
        "number",
        t(
          "Sutarties numeris jau naudojamas.",
          "Contract number is already in use.",
        ),
      );
      return;
    }
    if (kind === "process") {
      const predecessors = arr("dependencies");
      const descendants = new Set<string>();
      const collect = (target: string) => {
        db.processes
          .filter((p) => p.dependencies.includes(target))
          .forEach((p) => {
            if (!descendants.has(p.id)) {
              descendants.add(p.id);
              collect(p.id);
            }
          });
      };
      if (id) collect(id);
      if (predecessors.some((p) => descendants.has(p))) {
        setSubmitError(
          t(
            "Priklausomybės negali sudaryti ciklo.",
            "Dependencies cannot form a cycle.",
          ),
        );
        return;
      }
      const later = db.processes.find(
        (p) => predecessors.includes(p.id) && p.deadline > s("start"),
      );
      if (later) {
        form.setFieldError(
          "start",
          t(
            "Pradžia turi būti po ankstesnio proceso pabaigos.",
            "Start must be after predecessor completion.",
          ),
        );
        return;
      }
    }
    if (kind === "project")
      next = {
        ...base,
        name,
        address: s("address"),
        client: s("client"),
        managerId: s("managerId"),
        worksManagerId: s("worksManagerId"),
        team: arr("team"),
        start: s("start"),
        deadline,
        status: s("status") as Status,
        budget: Number(v.budget),
      };
    if (kind === "process")
      next = {
        ...base,
        projectId,
        workId: s("workId"),
        name,
        assigneeId: s("assigneeId"),
        start: s("start"),
        deadline,
        status: s("status"),
        dependencies: arr("dependencies"),
        comments: raw.comments || [],
      };
    if (kind === "task")
      next = {
        ...base,
        projectId,
        workId: s("workId"),
        processId: s("processId"),
        name,
        assigneeId: s("assigneeId"),
        supplierId: s("supplierId"),
        deadline,
        status: s("status"),
        comments: raw.comments || [],
        attachments: raw.attachments || [],
      };
    if (kind === "supplier")
      next = {
        ...base,
        name: s("nameLt"),
        code: s("code"),
        contact: s("contact"),
        email: s("email"),
        phone: s("phone"),
        address: s("address"),
        categories: arr("categories"),
      };
    if (kind === "tender")
      next = {
        ...base,
        projectId,
        workId: s("workId"),
        name,
        category: s("category"),
        supplierIds: arr("supplierIds"),
        deadline,
        status: raw.status || "draft",
        documentIds: arr("documentIds"),
        template: raw.template || "standard",
        offers: raw.offers || [],
        winnerId: raw.winnerId || "",
      };
    if (kind === "contract")
      next = {
        ...base,
        name,
        number: s("number"),
        projectId,
        supplierId: s("supplierId"),
        tenderId: s("tenderId"),
        category: s("category"),
        amount: Number(v.amount),
        deadline,
        status: raw.status || "draft",
        approvers: raw.approvers || [
          { personId: "u1", status: "pending" },
          { personId: "u4", status: "pending" },
        ],
        signers: raw.signers || [
          {
            name: db.people.find((p) => p.id === "u4")!.name,
            email: db.people.find((p) => p.id === "u4")!.email,
            status: "pending",
          },
          {
            name: db.suppliers.find((p) => p.id === s("supplierId"))!.contact,
            email: db.suppliers.find((p) => p.id === s("supplierId"))!.email,
            status: "pending",
          },
        ],
        attachment: raw.attachment || null,
        signedAttachment: raw.signedAttachment || null,
      };
    if (kind === "document")
      next = {
        ...base,
        name,
        projectId,
        category: s("category"),
        url: s("url"),
        date: today,
        personId: "u1",
      };
    if (kind === "handover")
      next = {
        ...base,
        name,
        projectId,
        assigneeId: s("assigneeId"),
        deadline,
        status: s("status"),
        documentIds: arr("documentIds"),
      };
    if (kind === "person") {
      if (
        db.people.some(
          (p) =>
            p.email.toLowerCase() === s("email").toLowerCase() && p.id !== id,
        )
      ) {
        form.setFieldError(
          "email",
          t(
            "Toks el. pašto adresas jau naudojamas.",
            "This email address is already in use.",
          ),
        );
        return;
      }
      next = {
        ...base,
        name: s("nameLt"),
        email: s("email"),
        phone: s("phone"),
        role: s("role") as Role,
      };
    }
    if (kind === "work")
      next = {
        ...base,
        projectId,
        name,
        group: { lt: s("groupLt"), en: s("groupEn") },
        quantity: Number(v.quantity),
        unit: s("unit"),
        rate: Number(v.rate),
      };
    save.mutate(
      (d) => {
        const list = d[collection] as unknown as { id: string }[];
        const updated = id
          ? list.map((x) => (x.id === id ? next : x))
          : [...list, next];
        return { ...d, [collection]: updated };
      },
      { onSuccess: onClose },
    );
  };
  return (
    <Modal
      opened
      onClose={onClose}
      title={`${id ? t("Redaguoti", "Edit") : t("Sukurti", "Create")} ${t(...labels[kind])}`}
      size="lg"
      centered
    >
      <form noValidate onSubmit={form.onSubmit(submit)}>
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {fields.map((f) => {
              const props = {
                label: t(f.lt, f.en),
                required: f.required,
                ...form.getInputProps(f.key),
              };
              if (f.type === "select")
                return (
                  <Select
                    key={f.key}
                    {...props}
                    searchable
                    clearable={!f.required}
                    data={f.data || []}
                    onChange={(value) => {
                      form.setFieldValue(f.key, value || "");
                      if (f.key === "projectId") {
                        form.setFieldValue("workId", "");
                        form.setFieldValue("processId", "");
                        form.setFieldValue("documentIds", []);
                      }
                      if (f.key === "workId")
                        form.setFieldValue("processId", "");
                      if (f.key === "category" && kind === "tender")
                        form.setFieldValue("supplierIds", []);
                    }}
                    nothingFoundMessage={t("Nerasta", "No results")}
                  />
                );
              if (f.type === "multi")
                return (
                  <MultiSelect
                    key={f.key}
                    {...props}
                    searchable
                    clearable
                    data={f.data || []}
                    nothingFoundMessage={t("Nerasta", "No results")}
                  />
                );
              if (f.type === "textarea")
                return <Textarea key={f.key} {...props} />;
              return (
                <TextInput
                  key={f.key}
                  {...props}
                  type={
                    f.type === "number"
                      ? "number"
                      : f.type === "date"
                        ? "date"
                        : f.type === "email"
                          ? "email"
                          : "text"
                  }
                  min={f.type === "number" ? 0 : undefined}
                  step={f.type === "number" ? "any" : undefined}
                />
              );
            })}
          </SimpleGrid>
          {submitError && (
            <Text c="red" size="sm">
              {submitError}
            </Text>
          )}
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              {t("Atšaukti", "Cancel")}
            </Button>
            <Button type="submit" loading={save.isPending}>
              {t("Išsaugoti", "Save")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
