import dayjs from "dayjs";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Alert,
  Anchor,
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
  Badge,
} from "@mantine/core";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  FileSignature,
  Link2,
  Mail,
  Plus,
  Send,
  Trash2,
  Trophy,
  Pencil,
} from "lucide-react";
import { notifications } from "@mantine/notifications";
import { useDatabase, useSave } from "../api";
import { useApp } from "../../../lib/i18n";
import {
  money,
  statusLabels,
  tenderStatuses,
  uid,
  today,
  nextContractNumber,
  type Database,
  type Offer,
} from "../../../lib/types";
import {
  CategoryBadge,
  ConfirmDelete,
  DataTable,
  Empty,
  Loading,
  PageHeader,
  ProjectFilter,
  SearchField,
  StatusBadge,
  Surface,
} from "../../../components/ui";
import { EntityEditor } from "../../../components/EntityEditor";
export function Tenders({
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
  const [status, setStatus] = useState<string | null>(null);
  const [create, setCreate] = useState(false);
  if (!db) return <Loading />;
  const data = db.tenders.filter(
    (x) =>
      (!project || x.projectId === project) &&
      (!status || x.status === status) &&
      x.name[lang].toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      {!embedded && (
        <PageHeader
          eyebrow={t("PIRKIMŲ VALDYMAS", "PROCUREMENT")}
          title={t("Konkursai", "Tenders")}
          description={t(
            "Tiekėjų pasiūlymai, aiškus palyginimas ir pagrįsti sprendimai.",
            "Supplier offers, clear comparisons and informed decisions.",
          )}
          actions={
            <Button
              leftSection={<Plus size={17} />}
              onClick={() => setCreate(true)}
            >
              {t("Naujas konkursas", "New tender")}
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
          placeholder={t("Visos būsenos", "All statuses")}
          value={status}
          onChange={setStatus}
          data={tenderStatuses.map((value) => ({
            value,
            label: statusLabels[value][lang],
          }))}
        />
        {embedded && (
          <Button
            size="xs"
            onClick={() => setCreate(true)}
            leftSection={<Plus size={14} />}
          >
            {t("Naujas konkursas", "New tender")}
          </Button>
        )}
      </div>
      <Surface>
        <DataTable
          data={data}
          onRowClick={(x) => navigate(`/tenders/${x.id}`)}
          columns={[
            {
              accessorFn: (x) => x.name[lang],
              header: t("Konkursas", "Tender"),
              cell: ({ row }) => (
                <Text size="sm" fw={500}>
                  {row.original.name[lang]}
                </Text>
              ),
            },
            {
              accessorKey: "projectId",
              header: t("Projektas", "Project"),
              cell: ({ row }) =>
                db.projects.find((p) => p.id === row.original.projectId)?.name[
                  lang
                ],
            },
            {
              accessorKey: "category",
              header: t("Kategorija", "Category"),
              cell: ({ row }) => (
                <CategoryBadge category={row.original.category} />
              ),
            },
            {
              id: "offers",
              header: t("Pasiūlymai", "Offers"),
              accessorFn: (x) => x.offers.length,
              cell: ({ row }) =>
                `${row.original.offers.filter((o) => o.price > 0).length} / ${row.original.supplierIds.length}`,
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
          kind="tender"
          projectId={project || ""}
          onClose={() => setCreate(false)}
        />
      )}
    </>
  );
}
export function TenderDetail() {
  const { id } = useParams();
  const { data: db } = useDatabase();
  const { t, lang } = useApp();
  const navigate = useNavigate();
  const save = useSave();
  const [edit, setEdit] = useState(false);
  const [remove, setRemove] = useState(false);
  const [letter, setLetter] = useState(false);
  const [template, setTemplate] = useState("standard");
  const [message, setMessage] = useState("");
  if (!db) return <Loading />;
  const tender = db.tenders.find((x) => x.id === id);
  if (!tender)
    return (
      <Empty
        action={
          <Button onClick={() => navigate("/tenders")}>
            {t("Grįžti", "Go back")}
          </Button>
        }
      />
    );
  const project = db.projects.find((p) => p.id === tender.projectId);
  const work = db.works.find((w) => w.id === tender.workId);
  const offers = tender.supplierIds.map(
    (supplierId) =>
      tender.offers.find((o) => o.supplierId === supplierId) || {
        supplierId,
        price: 0,
        days: 0,
        note: "",
      },
  );
  const lowest = Math.min(
    ...offers.filter((o) => o.price > 0).map((o) => o.price),
  );
  const existing = db.contracts.find((c) => c.tenderId === id);
  const createContract = () => {
    if (existing) {
      navigate(`/contracts/${existing.id}`);
      return;
    }
    const offer = offers.find((o) => o.supplierId === tender.winnerId);
    const supplier = db.suppliers.find((s) => s.id === tender.winnerId);
    if (!offer || !supplier) return;
    const newId = uid();
    save.mutate(
      (d) => ({
        ...d,
        contracts: [
          ...d.contracts,
          {
            id: newId,
            number: nextContractNumber(d.contracts),
            name: tender.name,
            projectId: tender.projectId,
            supplierId: supplier.id,
            tenderId: tender.id,
            category: tender.category,
            amount: offer.price,
            deadline: dayjs(today).add(14, "day").format("YYYY-MM-DD"),
            status: "draft",
            approvers: [
              { personId: project!.managerId, status: "pending" },
              { personId: "u4", status: "pending" },
            ],
            signers: [
              {
                name: "Ieva Vaitkutė",
                email: "ieva.vaitkute@rangosimone.lt",
                status: "pending",
              },
              {
                name: supplier.contact,
                email: supplier.email,
                status: "pending",
              },
            ],
            attachment: null,
            signedAttachment: null,
          },
        ],
      }),
      { onSuccess: () => navigate(`/contracts/${newId}`) },
    );
  };
  const letterText = t(
    `Sveiki,\n\nKviečiame pateikti pasiūlymą konkursui „${tender.name.lt}“.\nProjektas: ${project?.name.lt}.\nDarbai: ${work?.name.lt || tender.name.lt}.\nPasiūlymo terminas: ${tender.deadline}.\n${template === "detailed" ? "Prašome nurodyti kainą be PVM, darbų trukmę, garantijas ir mokėjimo sąlygas." : "Prašome nurodyti kainą be PVM ir darbų atlikimo terminą."}\n\nDokumentai:\n${tender.documentIds
      .map((id) => db.documents.find((d) => d.id === id))
      .filter(Boolean)
      .map((d) => `${d!.name.lt}: ${d!.url}`)
      .join("\n")}\n\nPagarbiai,\nStatybų rangos įmonė`,
    `Hello,\n\nPlease submit an offer for “${tender.name.en}”.\nProject: ${project?.name.en}.\nScope: ${work?.name.en || tender.name.en}.\nOffer deadline: ${tender.deadline}.\n${template === "detailed" ? "Please include the price excluding VAT, lead time, warranties and payment terms." : "Please include your price excluding VAT and lead time."}\n\nDocuments:\n${tender.documentIds
      .map((id) => db.documents.find((d) => d.id === id))
      .filter(Boolean)
      .map((d) => `${d!.name.en}: ${d!.url}`)
      .join("\n")}\n\nKind regards,\nStatybų rangos įmonė`,
  );
  return (
    <>
      <Button
        variant="subtle"
        color="gray"
        size="xs"
        leftSection={<ArrowLeft size={14} />}
        mb="md"
        onClick={() => navigate("/tenders")}
      >
        {t("Visi konkursai", "All tenders")}
      </Button>
      <PageHeader
        title={tender.name[lang]}
        description={`${project?.name[lang]} · ${work?.name[lang] || ""}`}
        actions={
          <>
            <Button
              variant="default"
              leftSection={<Pencil size={15} />}
              disabled={["awarded", "closed"].includes(tender.status)}
              onClick={() => setEdit(true)}
            >
              {t("Redaguoti", "Edit")}
            </Button>
            <Button
              leftSection={<Mail size={16} />}
              onClick={() => {
                setMessage("");
                setLetter(true);
              }}
              disabled={["awarded", "closed"].includes(tender.status)}
            >
              {t("Siųsti užklausą", "Send inquiry")}
            </Button>
          </>
        }
      />
      <div className="detail-summary">
        <StatusBadge status={tender.status} />
        <CategoryBadge category={tender.category} />
        <Text size="sm">
          {t("Terminas", "Deadline")}: {tender.deadline}
        </Text>
        <Text size="sm">
          {t("Gavėjai", "Recipients")}: {tender.supplierIds.length}
        </Text>
      </div>
      {tender.winnerId && (
        <Alert
          color="green"
          icon={<Trophy size={21} />}
          mb="lg"
          title={t("Laimėtojas pasirinktas", "Winner selected")}
        >
          <Group justify="space-between">
            <Text size="sm">
              {db.suppliers.find((s) => s.id === tender.winnerId)?.name} ·{" "}
              {money(
                offers.find((o) => o.supplierId === tender.winnerId)?.price ||
                  0,
              )}
            </Text>
            <Button
              size="xs"
              leftSection={<FileSignature size={15} />}
              onClick={createContract}
            >
              {existing
                ? t("Atidaryti sutartį", "Open contract")
                : t("Kurti sutartį", "Create contract")}
            </Button>
          </Group>
        </Alert>
      )}
      <Surface>
        <div className="section-heading">
          <div>
            <Text className="section-title">
              {t("Pasiūlymų palyginimas", "Offer comparison")}
            </Text>
            <Text size="xs" c="dimmed">
              {t(
                "Kainos be PVM. Mažiausia kaina pažymėta žaliai.",
                "Prices exclude VAT. The lowest price is highlighted in green.",
              )}
            </Text>
          </div>
          <Badge color="gray">
            {offers.filter((o) => o.price > 0).length}{" "}
            {t("pasiūlymai", "offers")}
          </Badge>
        </div>
        <div className="table-scroll">
          <Table
            verticalSpacing="md"
            horizontalSpacing="lg"
            className="data-table"
          >
            <Table.Thead>
              <Table.Tr>
                {[
                  t("Tiekėjas", "Supplier"),
                  t("Kaina (€)", "Price (€)"),
                  t("Trukmė (d.)", "Lead time (days)"),
                  t("Pastaba", "Note"),
                  t("Veiksmai", "Actions"),
                ].map((h) => (
                  <Table.Th key={h}>{h}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {offers.map((o) => (
                <OfferRow
                  key={`${id}-${o.supplierId}`}
                  db={db}
                  offer={o}
                  tenderId={tender.id}
                  lowest={lowest}
                  winnerId={tender.winnerId}
                  locked={["awarded", "closed"].includes(tender.status)}
                />
              ))}
            </Table.Tbody>
          </Table>
        </div>
        {!offers.length && (
          <Empty
            action={
              <Button onClick={() => setEdit(true)}>
                {t("Pasirinkti tiekėjus", "Select suppliers")}
              </Button>
            }
          />
        )}
      </Surface>
      <div className="detail-two-columns">
        <Surface>
          <div className="section-heading">
            <Text className="section-title">
              {t("Konkurso dokumentai", "Tender documents")}
            </Text>
            <Link2 size={17} />
          </div>
          <Stack p="lg">
            {tender.documentIds.length ? (
              tender.documentIds.map((id) => {
                const d = db.documents.find((d) => d.id === id);
                return (
                  d && (
                    <Anchor
                      key={id}
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="sm"
                    >
                      {d.name[lang]} <ArrowUpRight size={14} />
                    </Anchor>
                  )
                );
              })
            ) : (
              <Text size="sm" c="dimmed">
                {t(
                  "Dokumentus galite pridėti redagavimo lange.",
                  "Add documents by editing this tender.",
                )}
              </Text>
            )}
          </Stack>
        </Surface>
        <Surface>
          <div className="section-heading">
            <Text className="section-title">
              {t("Konkurso eiga", "Tender activity")}
            </Text>
          </div>
          <Stack p="lg">
            <Text size="sm">
              1.{" "}
              {t(
                "Tiekėjų parinkimas pagal kategoriją",
                "Choose suppliers by category",
              )}
            </Text>
            <Text size="sm">
              2.{" "}
              {t(
                "Užklausų siuntimas ir pasiūlymų registravimas",
                "Send inquiries and record offers",
              )}
            </Text>
            <Text size="sm">
              3.{" "}
              {t(
                "Palyginimas, laimėtojas ir sutartis",
                "Compare, award and create a contract",
              )}
            </Text>
            {tender.status === "sent" && (
              <Badge variant="light" color="blue">
                {t(
                  "Užklausos išsiųstos (simuliacija)",
                  "Inquiries sent (simulation)",
                )}
              </Badge>
            )}
          </Stack>
        </Surface>
      </div>
      <Group mt="lg" justify="space-between">
        <Button
          color="red"
          variant="subtle"
          size="xs"
          leftSection={<Trash2 size={14} />}
          onClick={() => setRemove(true)}
        >
          {t("Pašalinti konkursą", "Delete tender")}
        </Button>
        {tender.status === "awarded" && (
          <Button
            variant="default"
            size="xs"
            onClick={() =>
              save.mutate((d) => ({
                ...d,
                tenders: d.tenders.map((x) =>
                  x.id === id ? { ...x, status: "closed" } : x,
                ),
              }))
            }
          >
            {t("Užbaigti konkursą", "Close tender")}
          </Button>
        )}
      </Group>
      {edit && (
        <EntityEditor kind="tender" id={id} onClose={() => setEdit(false)} />
      )}
      <ConfirmDelete
        opened={remove}
        onClose={() => setRemove(false)}
        label={tender.name[lang]}
        onConfirm={() =>
          save.mutate(
            (d) => ({
              ...d,
              tenders: d.tenders.filter((x) => x.id !== id),
              contracts: d.contracts.map((x) =>
                x.tenderId === id ? { ...x, tenderId: "" } : x,
              ),
            }),
            { onSuccess: () => navigate("/tenders") },
          )
        }
      />
      <Modal
        opened={letter}
        onClose={() => setLetter(false)}
        title={t("Užklausos laiško peržiūra", "Inquiry letter preview")}
        size="lg"
      >
        <Stack>
          <Select
            label={t("Laiško šablonas", "Letter template")}
            value={template}
            onChange={(v) => {
              setTemplate(v || "standard");
              setMessage("");
            }}
            data={[
              {
                value: "standard",
                label: t("Standartinė užklausa", "Standard inquiry"),
              },
              {
                value: "detailed",
                label: t(
                  "Išsami rangos užklausa",
                  "Detailed subcontract inquiry",
                ),
              },
            ]}
          />
          <Text size="sm">
            <b>{t("Gavėjai", "Recipients")}:</b>{" "}
            {tender.supplierIds
              .map((id) => db.suppliers.find((s) => s.id === id)?.email)
              .join(", ")}
          </Text>
          <Textarea
            label={t("Laiško tekstas", "Letter body")}
            value={message || letterText}
            onChange={(e) => setMessage(e.target.value)}
            minRows={12}
            autosize
          />
          <Alert color="blue" icon={<Mail size={17} />}>
            {t(
              "Demonstracija: el. laiškai nebus siunčiami tikriems gavėjams.",
              "Simulation: emails will not be sent to real recipients.",
            )}
          </Alert>
          <Button
            leftSection={<Send size={16} />}
            disabled={!tender.supplierIds.length}
            onClick={() =>
              save.mutate(
                (d) => ({
                  ...d,
                  tenders: d.tenders.map((x) =>
                    x.id === id ? { ...x, status: "sent", template } : x,
                  ),
                }),
                {
                  onSuccess: () => {
                    setLetter(false);
                    notifications.show({
                      title: t(
                        "Užklausos išsiųstos (simuliacija)",
                        "Inquiries sent (simulation)",
                      ),
                      message: t(
                        `${tender.supplierIds.length} tiekėjai pakviesti pateikti pasiūlymus.`,
                        `${tender.supplierIds.length} suppliers invited to submit offers.`,
                      ),
                    });
                  },
                },
              )
            }
          >
            {t("Siųsti užklausą (simuliacija)", "Send inquiry (simulation)")}
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
function OfferRow({
  db,
  offer,
  tenderId,
  lowest,
  winnerId,
  locked,
}: {
  db: Database;
  offer: Offer;
  tenderId: string;
  lowest: number;
  winnerId: string;
  locked: boolean;
}) {
  const { t } = useApp();
  const save = useSave();
  const [price, setPrice] = useState<string | number>(offer.price);
  const [days, setDays] = useState<string | number>(offer.days);
  const [note, setNote] = useState(offer.note);
  const supplier = db.suppliers.find((x) => x.id === offer.supplierId);
  const dirty =
    Number(price) !== offer.price ||
    Number(days) !== offer.days ||
    note !== offer.note;
  return (
    <Table.Tr className={offer.price === lowest ? "lowest-offer" : ""}>
      <Table.Td>
        <Text fw={500} size="sm">
          {supplier?.name}
        </Text>
        <Text c="dimmed" size="xs">
          {supplier?.contact}
        </Text>
        {offer.price === lowest && (
          <Badge color="green" size="xs" mt={5}>
            {t("Mažiausia kaina", "Lowest price")}
          </Badge>
        )}
      </Table.Td>
      <Table.Td>
        <NumberInput
          aria-label={`${t("Kaina", "Price")} ${supplier?.name}`}
          value={price}
          onChange={setPrice}
          min={0}
          disabled={locked}
          w={130}
        />
      </Table.Td>
      <Table.Td>
        <NumberInput
          aria-label={`${t("Trukmė", "Lead time")} ${supplier?.name}`}
          value={days}
          onChange={setDays}
          min={0}
          w={85}
          disabled={locked}
        />
      </Table.Td>
      <Table.Td>
        <Textarea
          aria-label={t("Pastaba", "Note")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={locked}
          autosize
          minRows={1}
        />
      </Table.Td>
      <Table.Td>
        <Stack gap={5}>
          {dirty && (
            <Button
              size="compact-xs"
              onClick={() =>
                save.mutate((d) => ({
                  ...d,
                  tenders: d.tenders.map((x) =>
                    x.id === tenderId
                      ? {
                          ...x,
                          status: "evaluating",
                          offers: [
                            ...x.offers.filter(
                              (o) => o.supplierId !== offer.supplierId,
                            ),
                            {
                              supplierId: offer.supplierId,
                              price: Number(price),
                              days: Number(days),
                              note,
                            },
                          ],
                        }
                      : x,
                  ),
                }))
              }
            >
              {t("Išsaugoti", "Save")}
            </Button>
          )}
          {winnerId === offer.supplierId ? (
            <Badge color="green" leftSection={<Check size={12} />}>
              {t("Laimėtojas", "Winner")}
            </Badge>
          ) : (
            <Button
              size="compact-xs"
              variant="light"
              disabled={locked || !offer.price || dirty}
              onClick={() =>
                save.mutate((d) => ({
                  ...d,
                  tenders: d.tenders.map((x) =>
                    x.id === tenderId
                      ? { ...x, status: "awarded", winnerId: offer.supplierId }
                      : x,
                  ),
                }))
              }
            >
              {t("Pasirinkti", "Choose")}
            </Button>
          )}
        </Stack>
      </Table.Td>
    </Table.Tr>
  );
}
