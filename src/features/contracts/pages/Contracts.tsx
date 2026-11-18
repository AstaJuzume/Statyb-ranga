import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Alert,
  Anchor,
  Badge,
  Button,
  FileButton,
  Group,
  MultiSelect,
  Select,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  ActionIcon,
} from "@mantine/core";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  CheckCircle2,
  Download,
  FileSignature,
  FileText,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  X,
  Pencil,
} from "lucide-react";
import { notifications } from "@mantine/notifications";
import { z } from "zod";
import { useApp } from "../../../lib/i18n";
import { useDatabase, useSave } from "../api";
import {
  categoryLabels,
  contractStatuses,
  money,
  statusLabels,
  type Attachment,
} from "../../../lib/types";
import {
  CategoryBadge,
  ConfirmDelete,
  DataTable,
  Empty,
  Initials,
  Loading,
  PageHeader,
  ProjectFilter,
  SearchField,
  StatusBadge,
  Surface,
} from "../../../components/ui";
import { EntityEditor } from "../../../components/EntityEditor";
import { readAttachment } from "../../../components/Comments";
export function Contracts({
  projectId,
  embedded = false,
}: {
  projectId?: string;
  embedded?: boolean;
}) {
  const { data: db } = useDatabase();
  const { t, lang } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [project, setProject] = useState<string | null>(projectId || null);
  const [supplier, setSupplier] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [create, setCreate] = useState(false);
  if (!db) return <Loading />;
  const data = db.contracts.filter(
    (x) =>
      (!project || x.projectId === project) &&
      (!supplier || x.supplierId === supplier) &&
      (!category || x.category === category) &&
      (!status || x.status === status) &&
      (x.name[lang] + x.number).toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      {!embedded && (
        <PageHeader
          eyebrow={t("SUTARČIŲ VALDYMAS", "CONTRACT MANAGEMENT")}
          title={t("Sutartys", "Contracts")}
          description={t(
            "Nuo sutarties projekto iki paskutinio parašo.",
            "From the first draft to the final signature.",
          )}
          actions={
            <Button
              leftSection={<Plus size={17} />}
              onClick={() => setCreate(true)}
            >
              {t("Nauja sutartis", "New contract")}
            </Button>
          }
        />
      )}
      <div className="list-toolbar">
        <SearchField value={q} onChange={setQ} />
        {!projectId && (
          <ProjectFilter db={db} value={project} onChange={setProject} />
        )}
        <Select
          clearable
          searchable
          placeholder={t("Visi tiekėjai", "All suppliers")}
          data={db.suppliers.map((s) => ({ value: s.id, label: s.name }))}
          value={supplier}
          onChange={setSupplier}
        />
        <Select
          clearable
          placeholder={t("Visos kategorijos", "All categories")}
          data={Object.entries(categoryLabels).map(([value, label]) => ({
            value,
            label: label[lang],
          }))}
          value={category}
          onChange={setCategory}
        />
        <Select
          clearable
          placeholder={t("Visos būsenos", "All statuses")}
          data={contractStatuses.map((value) => ({
            value,
            label: statusLabels[value][lang],
          }))}
          value={status}
          onChange={setStatus}
        />
        {embedded && (
          <Button size="xs" onClick={() => setCreate(true)}>
            {t("Pridėti", "Add")}
          </Button>
        )}
      </div>
      <Surface>
        <DataTable
          data={data}
          onRowClick={(x) => navigate(`/contracts/${x.id}`)}
          columns={[
            {
              accessorKey: "number",
              header: t("Sutartis", "Contract"),
              cell: ({ row }) => (
                <div>
                  <Text fw={500} size="sm">
                    {row.original.number}
                  </Text>
                  <Text c="dimmed" size="xs">
                    {row.original.name[lang]}
                  </Text>
                </div>
              ),
            },
            {
              accessorKey: "projectId",
              header: t("Projektas / tiekėjas", "Project / supplier"),
              cell: ({ row }) => (
                <div>
                  <Text size="sm">
                    {
                      db.projects.find((p) => p.id === row.original.projectId)
                        ?.name[lang]
                    }
                  </Text>
                  <Text c="dimmed" size="xs">
                    {
                      db.suppliers.find((p) => p.id === row.original.supplierId)
                        ?.name
                    }
                  </Text>
                </div>
              ),
            },
            {
              accessorKey: "category",
              header: t("Kategorija", "Category"),
              cell: ({ row }) => (
                <CategoryBadge category={row.original.category} />
              ),
            },
            {
              accessorKey: "amount",
              header: t("Vertė be PVM", "Value excl. VAT"),
              cell: ({ row }) => money(row.original.amount),
            },
            { accessorKey: "deadline", header: t("Terminas", "Deadline") },
            {
              accessorKey: "status",
              header: t("Būsena", "Status"),
              cell: ({ row }) => <StatusBadge status={row.original.status} />,
            },
          ]}
        />
      </Surface>
      {create && (
        <EntityEditor
          kind="contract"
          projectId={project || ""}
          onClose={() => setCreate(false)}
        />
      )}
    </>
  );
}
export function ContractDetail() {
  const { id } = useParams();
  const { data: db } = useDatabase();
  const { t, lang } = useApp();
  const save = useSave();
  const navigate = useNavigate();
  const [edit, setEdit] = useState(false);
  const [remove, setRemove] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  if (!db) return <Loading />;
  const contract = db.contracts.find((c) => c.id === id);
  if (!contract)
    return (
      <Empty
        action={
          <Button onClick={() => navigate("/contracts")}>
            {t("Grįžti", "Back")}
          </Button>
        }
      />
    );
  const project = db.projects.find((p) => p.id === contract.projectId);
  const supplier = db.suppliers.find((s) => s.id === contract.supplierId);
  const draft = ["draft", "rejected"].includes(contract.status);
  const upload = async (file: File | null, signed = false) => {
    if (!file) return;
    try {
      const attachment = await readAttachment(file);
      save.mutate((d) => ({
        ...d,
        contracts: d.contracts.map((x) =>
          x.id === id
            ? {
                ...x,
                ...(signed
                  ? {
                      signedAttachment: attachment,
                      status: "signed" as const,
                      signers: x.signers.map((s) => ({
                        ...s,
                        status: "signed" as const,
                      })),
                    }
                  : { attachment }),
              }
            : x,
        ),
      }));
    } catch {
      notifications.show({
        message: t(
          "Failas turi būti iki 1 MB.",
          "File must be 1 MB or smaller.",
        ),
        color: "red",
      });
    }
  };
  const demoDoc = (signed: boolean): Attachment => ({
    name: `${contract.number}${signed ? "_signed" : ""}.txt`,
    url:
      "data:text/plain;charset=utf-8," +
      encodeURIComponent(
        `${t("DEMONSTRACINĖ SUTARTIS", "DEMO CONTRACT")}\n${contract.number}\n${contract.name[lang]}\n${project?.name[lang]}\n${supplier?.name}\n${money(contract.amount)}\n${signed ? t("Demonstraciniai parašai užregistruoti. Tai nėra teisiškai pasirašytas dokumentas.", "Demo signatures recorded. This is not a legally signed document.") : t("Sutarties projekto demonstracija.", "Contract draft demonstration.")}`,
      ),
  });
  return (
    <>
      <Button
        variant="subtle"
        color="gray"
        size="xs"
        leftSection={<ArrowLeft size={14} />}
        mb="md"
        onClick={() => navigate("/contracts")}
      >
        {t("Visos sutartys", "All contracts")}
      </Button>
      <PageHeader
        eyebrow={contract.number}
        title={contract.name[lang]}
        description={`${project?.name[lang]} · ${supplier?.name}`}
        actions={
          <>
            <Button
              variant="default"
              leftSection={<Pencil size={16} />}
              onClick={() => setEdit(true)}
              disabled={!draft}
            >
              {t("Redaguoti", "Edit")}
            </Button>
            <FileButton
              accept=".pdf,.docx,.asice,.adoc,.txt"
              onChange={(f) => upload(f, true)}
            >
              {(props) => (
                <Button
                  {...props}
                  variant="default"
                  leftSection={<Upload size={16} />}
                  disabled={contract.status === "signed"}
                >
                  {t("Įkelti jau pasirašytą", "Upload already signed")}
                </Button>
              )}
            </FileButton>
          </>
        }
      />
      <div className="detail-summary">
        <StatusBadge status={contract.status} />
        <CategoryBadge category={contract.category} />
        <Text size="sm">
          {t("Vertė be PVM", "Value excl. VAT")}:{" "}
          <b>{money(contract.amount)}</b>
        </Text>
        <Text size="sm">
          {t("Terminas", "Deadline")}: {contract.deadline}
        </Text>
        {contract.tenderId && (
          <Anchor
            size="sm"
            onClick={() => navigate(`/tenders/${contract.tenderId}`)}
          >
            {t("Susijęs konkursas", "Linked tender")}
          </Anchor>
        )}
      </div>
      <div className="contract-flow">
        {[
          { label: t("Projektas", "Draft"), done: contract.status !== "draft" },
          {
            label: t("Vidinis derinimas", "Internal approval"),
            done: ["approved", "signing", "signed"].includes(contract.status),
          },
          {
            label: t("Pasirašymas", "Signing"),
            done: contract.status === "signed",
          },
          {
            label: t("Pasirašyta sutartis", "Signed document"),
            done: contract.status === "signed",
          },
        ].map((step, i) => (
          <div
            key={step.label}
            className={`contract-step ${step.done ? "completed" : ""}`}
          >
            <span>{step.done ? <Check size={16} /> : i + 1}</span>
            <Text size="sm">{step.label}</Text>
          </div>
        ))}
      </div>
      {contract.status === "signed" && (
        <Alert
          color="green"
          mb="lg"
          icon={<CheckCircle2 size={22} />}
          title={t("Sutartis pasirašyta", "Contract signed")}
        >
          {t(
            "Pasirašytas dokumentas išsaugotas sutarties kortelėje.",
            "The signed document is saved with this contract.",
          )}
        </Alert>
      )}
      {contract.status === "rejected" && (
        <Alert
          color="red"
          mb="lg"
          title={t("Sutartis atmesta", "Contract rejected")}
        >
          {t(
            "Pakoreguokite sutartį ir pateikite derinti iš naujo.",
            "Revise the contract and submit it for approval again.",
          )}
        </Alert>
      )}
      <div className="detail-two-columns">
        <Surface>
          <div className="section-heading">
            <Text className="section-title">
              {t("Sutarties dokumentas", "Contract document")}
            </Text>
            <FileText size={19} />
          </div>
          <Stack p="lg">
            {contract.attachment ? (
              <div className="file-download">
                <ThemeIcon variant="light" size={46} radius={8}>
                  <FileText size={24} />
                </ThemeIcon>
                <div>
                  <Text fw={500} size="sm">
                    {contract.attachment.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t("Sutarties projektas", "Contract draft")}
                  </Text>
                </div>
                <Anchor
                  href={contract.attachment.url}
                  download={contract.attachment.name}
                  aria-label={t("Atsisiųsti", "Download")}
                >
                  <Download size={20} />
                </Anchor>
              </div>
            ) : (
              <Text size="sm" c="dimmed">
                {t(
                  "Įkelkite dokumentą arba sukurkite demonstracinį projektą.",
                  "Upload a document or generate a demo draft.",
                )}
              </Text>
            )}
            <Group>
              <FileButton accept=".pdf,.docx,.txt" onChange={(f) => upload(f)}>
                {(props) => (
                  <Button
                    {...props}
                    variant="default"
                    size="xs"
                    leftSection={<Upload size={15} />}
                    disabled={!draft}
                  >
                    {t("Įkelti dokumentą", "Upload document")}
                  </Button>
                )}
              </FileButton>
              {!contract.attachment && (
                <Button
                  size="xs"
                  variant="light"
                  onClick={() =>
                    save.mutate((d) => ({
                      ...d,
                      contracts: d.contracts.map((x) =>
                        x.id === id ? { ...x, attachment: demoDoc(false) } : x,
                      ),
                    }))
                  }
                >
                  {t("Parengti demo dokumentą", "Generate demo draft")}
                </Button>
              )}
            </Group>
            {contract.signedAttachment && (
              <>
                <Text fw={500} mt="lg" size="sm">
                  {t("Pasirašytas dokumentas", "Signed document")}
                </Text>
                <Anchor
                  href={contract.signedAttachment.url}
                  download={contract.signedAttachment.name}
                  size="sm"
                >
                  <Download size={15} /> {contract.signedAttachment.name}
                </Anchor>
              </>
            )}
            {draft && (
              <Button
                mt="sm"
                leftSection={<Send size={15} />}
                disabled={!contract.attachment || !contract.approvers.length}
                onClick={() =>
                  save.mutate((d) => ({
                    ...d,
                    contracts: d.contracts.map((x) =>
                      x.id === id
                        ? {
                            ...x,
                            status: "review",
                            approvers: x.approvers.map((a) => ({
                              ...a,
                              status: "pending",
                            })),
                          }
                        : x,
                    ),
                  }))
                }
              >
                {t(
                  "Pateikti vidiniam derinimui",
                  "Submit for internal approval",
                )}
              </Button>
            )}
          </Stack>
        </Surface>
        <Surface>
          <div className="section-heading">
            <Text className="section-title">
              {t("Vidinio derinimo grandinė", "Internal approval chain")}
            </Text>
            <ShieldCheck size={19} />
          </div>
          <Stack p="lg">
            {draft && (
              <MultiSelect
                label={t("Derintojai eilės tvarka", "Approvers in order")}
                data={db.people
                  .filter((p) => p.role !== "worker")
                  .map((p) => ({ value: p.id, label: p.name }))}
                value={contract.approvers.map((a) => a.personId)}
                onChange={(ids) =>
                  save.mutate((d) => ({
                    ...d,
                    contracts: d.contracts.map((x) =>
                      x.id === id
                        ? {
                            ...x,
                            approvers: ids.map((personId) => ({
                              personId,
                              status: "pending",
                            })),
                          }
                        : x,
                    ),
                  }))
                }
              />
            )}{" "}
            {contract.approvers.map((approval, i) => {
              const person = db.people.find((p) => p.id === approval.personId);
              const firstPending = contract.approvers.findIndex(
                (a) => a.status === "pending",
              );
              return (
                <div className="approval-row" key={approval.personId}>
                  <span className="order-number">{i + 1}</span>
                  <Initials name={person?.name || ""} />
                  <div className="approval-person">
                    <Text size="sm" fw={500}>
                      {person?.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t("Vidinis derintojas", "Internal approver")}
                    </Text>
                  </div>
                  {approval.status === "approved" ? (
                    <Badge color="green">{t("Patvirtinta", "Approved")}</Badge>
                  ) : approval.status === "rejected" ? (
                    <Badge color="red">{t("Atmesta", "Rejected")}</Badge>
                  ) : contract.status === "review" && firstPending === i ? (
                    <Group gap={5}>
                      <Button
                        size="compact-xs"
                        variant="light"
                        leftSection={<Check size={13} />}
                        onClick={() =>
                          save.mutate((d) => ({
                            ...d,
                            contracts: d.contracts.map((x) => {
                              if (x.id !== id) return x;
                              const approvers = x.approvers.map((a, j) =>
                                j === i
                                  ? { ...a, status: "approved" as const }
                                  : a,
                              );
                              return {
                                ...x,
                                approvers,
                                status: approvers.every(
                                  (a) => a.status === "approved",
                                )
                                  ? "approved"
                                  : "review",
                              };
                            }),
                          }))
                        }
                      >
                        {t("Patvirtinti (demo)", "Approve (demo)")}
                      </Button>
                      <ActionIcon
                        color="red"
                        variant="light"
                        aria-label={t("Atmesti", "Reject")}
                        onClick={() =>
                          save.mutate((d) => ({
                            ...d,
                            contracts: d.contracts.map((x) =>
                              x.id === id
                                ? {
                                    ...x,
                                    status: "rejected",
                                    approvers: x.approvers.map((a, j) =>
                                      j === i
                                        ? { ...a, status: "rejected" }
                                        : a,
                                    ),
                                  }
                                : x,
                            ),
                          }))
                        }
                      >
                        <X size={14} />
                      </ActionIcon>
                    </Group>
                  ) : (
                    <Badge color="gray">{t("Laukiama", "Pending")}</Badge>
                  )}
                </div>
              );
            })}
            {contract.status === "approved" && (
              <Button
                leftSection={<FileSignature size={16} />}
                onClick={() =>
                  save.mutate((d) => ({
                    ...d,
                    contracts: d.contracts.map((x) =>
                      x.id === id
                        ? {
                            ...x,
                            status: "signing",
                            signers: x.signers.map((s) => ({
                              ...s,
                              status: "pending",
                            })),
                          }
                        : x,
                    ),
                  }))
                }
                disabled={!contract.signers.length}
              >
                {t(
                  "Siųsti į Dokobit (simuliacija)",
                  "Send to Dokobit (simulation)",
                )}
              </Button>
            )}
          </Stack>
        </Surface>
      </div>
      <Surface>
        <div className="section-heading">
          <div>
            <Text className="section-title">
              {t("Pasirašantieji", "Signers")}
            </Text>
            <Text size="xs" c="dimmed">
              {t(
                "Pasirašoma nurodyta eilės tvarka. Dokobit integracija simuliuojama.",
                "Signing follows the specified order. The Dokobit integration is simulated.",
              )}
            </Text>
          </div>
          <FileSignature size={20} />
        </div>
        <Stack p="lg">
          {contract.signers.map((signer, i) => (
            <div className="approval-row" key={i}>
              <span className="order-number">{i + 1}</span>
              <div className="approval-person">
                <Text size="sm" fw={500}>
                  {signer.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {signer.email}
                </Text>
              </div>
              {signer.status === "signed" ? (
                <Badge color="green">{t("Pasirašyta", "Signed")}</Badge>
              ) : contract.status === "signing" &&
                contract.signers.findIndex((s) => s.status === "pending") ===
                  i ? (
                <Button
                  size="xs"
                  variant="light"
                  onClick={() =>
                    save.mutate((d) => ({
                      ...d,
                      contracts: d.contracts.map((x) => {
                        if (x.id !== id) return x;
                        const signers = x.signers.map((s, j) =>
                          j === i ? { ...s, status: "signed" as const } : s,
                        );
                        const done = signers.every(
                          (s) => s.status === "signed",
                        );
                        return {
                          ...x,
                          signers,
                          status: done ? "signed" : "signing",
                          signedAttachment: done ? demoDoc(true) : null,
                        };
                      }),
                    }))
                  }
                >
                  {t("Simuliuoti parašą", "Simulate signature")}
                </Button>
              ) : (
                <Badge color="gray">{t("Laukiama", "Pending")}</Badge>
              )}
              {["draft", "approved", "rejected"].includes(contract.status) && (
                <Group gap={3}>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    disabled={i === 0}
                    aria-label={t("Perkelti aukštyn", "Move up")}
                    onClick={() =>
                      save.mutate((d) => ({
                        ...d,
                        contracts: d.contracts.map((x) => {
                          if (x.id !== id) return x;
                          const signers = [...x.signers];
                          [signers[i - 1], signers[i]] = [
                            signers[i],
                            signers[i - 1],
                          ];
                          return { ...x, signers };
                        }),
                      }))
                    }
                  >
                    <ArrowUp size={15} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    disabled={i === contract.signers.length - 1}
                    aria-label={t("Perkelti žemyn", "Move down")}
                    onClick={() =>
                      save.mutate((d) => ({
                        ...d,
                        contracts: d.contracts.map((x) => {
                          if (x.id !== id) return x;
                          const signers = [...x.signers];
                          [signers[i + 1], signers[i]] = [
                            signers[i],
                            signers[i + 1],
                          ];
                          return { ...x, signers };
                        }),
                      }))
                    }
                  >
                    <ArrowDown size={15} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    aria-label={t("Pašalinti pasirašantįjį", "Remove signer")}
                    onClick={() =>
                      save.mutate((d) => ({
                        ...d,
                        contracts: d.contracts.map((x) =>
                          x.id === id
                            ? {
                                ...x,
                                signers: x.signers.filter((_, j) => j !== i),
                              }
                            : x,
                        ),
                      }))
                    }
                  >
                    <Trash2 size={14} />
                  </ActionIcon>
                </Group>
              )}
            </div>
          ))}
          {["draft", "approved", "rejected"].includes(contract.status) && (
            <Group align="flex-end">
              <TextInput
                label={t("Pasirašančiojo vardas", "Signer name")}
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
              />
              <TextInput
                label={t("El. paštas", "Email")}
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
              />
              <Button
                variant="default"
                size="sm"
                disabled={
                  !signerName.trim() ||
                  !z.email().safeParse(signerEmail).success
                }
                onClick={() =>
                  save.mutate(
                    (d) => ({
                      ...d,
                      contracts: d.contracts.map((x) =>
                        x.id === id
                          ? {
                              ...x,
                              signers: [
                                ...x.signers,
                                {
                                  name: signerName.trim(),
                                  email: signerEmail,
                                  status: "pending",
                                },
                              ],
                            }
                          : x,
                      ),
                    }),
                    {
                      onSuccess: () => {
                        setSignerName("");
                        setSignerEmail("");
                      },
                    },
                  )
                }
                leftSection={<Plus size={15} />}
              >
                {t("Pridėti", "Add")}
              </Button>
            </Group>
          )}
        </Stack>
      </Surface>
      <Button
        color="red"
        variant="subtle"
        size="xs"
        mt="lg"
        leftSection={<Trash2 size={14} />}
        onClick={() => setRemove(true)}
      >
        {t("Pašalinti sutartį", "Delete contract")}
      </Button>
      {edit && (
        <EntityEditor kind="contract" id={id} onClose={() => setEdit(false)} />
      )}
      <ConfirmDelete
        opened={remove}
        onClose={() => setRemove(false)}
        label={contract.number}
        onConfirm={() =>
          save.mutate(
            (d) => ({
              ...d,
              contracts: d.contracts.filter((x) => x.id !== id),
            }),
            { onSuccess: () => navigate("/contracts") },
          )
        }
      />
    </>
  );
}
