import { useState } from "react";
import {
  Accordion,
  ActionIcon,
  Button,
  Group,
  Menu,
  Modal,
  NumberInput,
  Select,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  ChevronRight,
  Download,
  FileSpreadsheet,
  Plus,
  MoreHorizontal,
  Workflow,
  Trash2,
  CopyPlus,
} from "lucide-react";
import { useNavigate } from "react-router";
import dayjs from "dayjs";
import { useApp } from "../../../lib/i18n";
import { useSave } from "../../../lib/store";
import {
  money,
  uid,
  today,
  type Database,
  type Work,
} from "../../../lib/types";
import { Empty, PersonCell, StatusBadge } from "../../../components/ui";
import { EntityEditor } from "../../../components/EntityEditor";
import { WorkDetail } from "../../../components/WorkDetail";
import { exportWorkbook } from "../../../lib/export";
export function Estimate({
  db,
  projectId,
}: {
  db: Database;
  projectId: string;
}) {
  const { t, lang } = useApp();
  const save = useSave();
  const navigate = useNavigate();
  const [edit, setEdit] = useState<string | true | null>(null);
  const [processWork, setProcessWork] = useState<string | null>(null);
  const [tenderWork, setTenderWork] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [importOpen, setImport] = useState(false);
  const [templateWork, setTemplateWork] = useState<Work | null>(null);
  const [template, setTemplate] = useState("full");
  const [quantity, setQuantity] = useState<string | number>(250);
  const works = db.works.filter((w) => w.projectId === projectId);
  const groups = [...new Set(works.map((w) => w.group[lang]))];
  const total = works.reduce((s, w) => s + w.quantity * w.rate, 0);
  const deleteWork = (id: string) =>
    save.mutate((d) => {
      const ids = d.processes.filter((p) => p.workId === id).map((p) => p.id);
      return {
        ...d,
        works: d.works.filter((w) => w.id !== id),
        processes: d.processes
          .filter((p) => p.workId !== id)
          .map((p) => ({
            ...p,
            dependencies: p.dependencies.filter((x) => !ids.includes(x)),
          })),
        tasks: d.tasks.map((x) =>
          x.workId === id ? { ...x, workId: "", processId: "" } : x,
        ),
        tenders: d.tenders.map((x) =>
          x.workId === id ? { ...x, workId: "" } : x,
        ),
      };
    });
  return (
    <>
      <div className="workspace-toolbar">
        <div>
          <Text fw={500}>{t("Darbų sąmata", "Work estimate")}</Text>
          <Text size="xs" c="dimmed">
            {works.length} {t("darbų pozicijos", "work positions")} ·{" "}
            {groups.length} {t("darbų grupės", "work groups")}
          </Text>
        </div>
        <Group>
          <Button
            variant="default"
            size="xs"
            leftSection={<FileSpreadsheet size={15} />}
            onClick={() => setImport(true)}
          >
            {t("Importuoti Excel", "Import Excel")}
          </Button>
          <Button
            variant="default"
            size="xs"
            leftSection={<Download size={15} />}
            onClick={() =>
              exportWorkbook(
                works.map((w) => ({
                  [t("Grupė", "Group")]: w.group[lang],
                  [t("Darbas", "Work")]: w.name[lang],
                  [t("Kiekis", "Quantity")]: w.quantity,
                  [t("Vienetas", "Unit")]: w.unit,
                  [t("Įkainis", "Rate")]: w.rate,
                  [t("Suma", "Amount")]: w.quantity * w.rate,
                })),
                t("Sąmata", "Estimate"),
              )
            }
          >
            {t("Eksportuoti", "Export")}
          </Button>
          <Button
            size="xs"
            leftSection={<Plus size={15} />}
            onClick={() => setEdit(true)}
          >
            {t("Pridėti poziciją", "Add position")}
          </Button>
        </Group>
      </div>
      <div className="estimate-total">
        <Text size="sm" c="dimmed">
          {t("Sąmatos vertė be PVM", "Estimate value excl. VAT")}
        </Text>
        <Text size="xl" fw={500}>
          {money(total)}
        </Text>
        <Text size="xs" c="dimmed">
          {t(
            "Kiekis × vieneto kaina kiekvienoje pozicijoje",
            "Quantity × unit rate for every position",
          )}
        </Text>
      </div>
      {groups.length ? (
        <Accordion multiple defaultValue={groups} variant="separated">
          {groups.map((group) => (
            <Accordion.Item key={group} value={group}>
              <Accordion.Control>
                <Group justify="space-between" pr={16}>
                  <Text fw={500} size="sm">
                    {group}
                  </Text>
                  <Text size="sm" fw={500}>
                    {money(
                      works
                        .filter((w) => w.group[lang] === group)
                        .reduce((s, w) => s + w.quantity * w.rate, 0),
                    )}
                  </Text>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                {works
                  .filter((w) => w.group[lang] === group)
                  .map((w) => (
                    <div className="estimate-position" key={w.id}>
                      <div className="work-position-head">
                        <div>
                          <Text fw={500} size="sm">
                            {w.name[lang]}
                          </Text>
                          <Text size="xs" c="dimmed" mt={5}>
                            {w.quantity.toLocaleString(lang)}{" "}
                            {w.unit === "kompl." ? t("kompl.", "set") : w.unit}{" "}
                            × {money(w.rate)}
                          </Text>
                        </div>
                        <Group>
                          <Text fw={500} size="sm">
                            {money(w.quantity * w.rate)}
                          </Text>
                          <Menu position="bottom-end">
                            <Menu.Target>
                              <ActionIcon
                                variant="subtle"
                                color="gray"
                                aria-label={t(
                                  "Pozicijos veiksmai",
                                  "Position actions",
                                )}
                              >
                                <MoreHorizontal size={18} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item onClick={() => setEdit(w.id)}>
                                {t("Redaguoti poziciją", "Edit position")}
                              </Menu.Item>
                              <Menu.Item
                                leftSection={<Workflow size={15} />}
                                onClick={() => setTemplateWork(w)}
                              >
                                {t(
                                  "Taikyti procesų šabloną",
                                  "Apply process template",
                                )}
                              </Menu.Item>
                              <Menu.Item onClick={() => setTenderWork(w.id)}>
                                {t("Sukurti konkursą", "Create tender")}
                              </Menu.Item>
                              <Menu.Item
                                color="red"
                                leftSection={<Trash2 size={15} />}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      t(
                                        "Pašalinti poziciją ir jos procesus?",
                                        "Delete position and its processes?",
                                      ),
                                    )
                                  )
                                    deleteWork(w.id);
                                }}
                              >
                                {t("Pašalinti", "Delete")}
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      </div>
                      <div className="table-scroll">
                        <Table
                          className="process-mini-table"
                          verticalSpacing="sm"
                        >
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>
                                {t("Susijęs procesas", "Linked process")}
                              </Table.Th>
                              <Table.Th>{t("Atsakingas", "Assignee")}</Table.Th>
                              <Table.Th>{t("Pradžia", "Start")}</Table.Th>
                              <Table.Th>{t("Terminas", "Deadline")}</Table.Th>
                              <Table.Th>{t("Būsena", "Status")}</Table.Th>
                              <Table.Th>{t("Komentarai", "Comments")}</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {db.processes
                              .filter((p) => p.workId === w.id)
                              .map((p) => (
                                <Table.Tr
                                  key={p.id}
                                  className="click-row"
                                  onClick={() => setDetail(p.id)}
                                >
                                  <Table.Td>
                                    <Group gap={6}>
                                      <ChevronRight size={13} />
                                      <Text size="xs">{p.name[lang]}</Text>
                                    </Group>
                                  </Table.Td>
                                  <Table.Td>
                                    <PersonCell db={db} id={p.assigneeId} />
                                  </Table.Td>
                                  <Table.Td>{p.start}</Table.Td>
                                  <Table.Td>{p.deadline}</Table.Td>
                                  <Table.Td>
                                    <StatusBadge
                                      status={p.status}
                                      date={p.deadline}
                                    />
                                  </Table.Td>
                                  <Table.Td>{p.comments.length}</Table.Td>
                                </Table.Tr>
                              ))}
                          </Table.Tbody>
                        </Table>
                      </div>
                      <Group mt={10} gap={8}>
                        <Button
                          size="compact-xs"
                          variant="subtle"
                          leftSection={<Plus size={13} />}
                          onClick={() => setProcessWork(w.id)}
                        >
                          {t("Pridėti procesą", "Add process")}
                        </Button>
                        <Tooltip
                          label={t(
                            "Paruošimas, vykdymas ir priėmimas",
                            "Preparation, execution and acceptance",
                          )}
                        >
                          <Button
                            size="compact-xs"
                            variant="subtle"
                            color="gray"
                            leftSection={<CopyPlus size={13} />}
                            onClick={() => setTemplateWork(w)}
                          >
                            {t("Procesų šablonas", "Process template")}
                          </Button>
                        </Tooltip>
                        <Button
                          size="compact-xs"
                          variant="subtle"
                          color="gray"
                          onClick={() => {
                            const tender = db.tenders.find(
                              (t) => t.workId === w.id,
                            );
                            if (tender) navigate(`/tenders/${tender.id}`);
                            else setTenderWork(w.id);
                          }}
                        >
                          {t("Konkursas", "Tender")}
                        </Button>
                      </Group>
                    </div>
                  ))}
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      ) : (
        <Empty />
      )}
      {edit && (
        <EntityEditor
          kind="work"
          id={typeof edit === "string" ? edit : undefined}
          projectId={projectId}
          onClose={() => setEdit(null)}
        />
      )}{" "}
      {processWork && (
        <EntityEditor
          kind="process"
          projectId={projectId}
          workId={processWork}
          onClose={() => setProcessWork(null)}
        />
      )}{" "}
      {tenderWork && (
        <EntityEditor
          kind="tender"
          projectId={projectId}
          workId={tenderWork}
          onClose={() => setTenderWork(null)}
        />
      )}{" "}
      {detail && (
        <WorkDetail
          id={detail}
          entity="processes"
          onClose={() => setDetail(null)}
        />
      )}
      <Modal
        opened={importOpen}
        onClose={() => setImport(false)}
        title={t("Excel importo peržiūra", "Excel import preview")}
        centered
      >
        <Stack>
          <Text size="sm" c="dimmed">
            {t(
              "Simuliuojamas importas iš „Papildomi_darbai.xlsx“. Patvirtinus į sąmatą bus įtrauktos 3 pozicijos.",
              "Simulated import from “Additional_works.xlsx”. Confirm to add 3 positions to the estimate.",
            )}
          </Text>
          <NumberInput
            label={t(
              "Papildomos apdailos kiekis (m²)",
              "Additional finishing quantity (m²)",
            )}
            value={quantity}
            onChange={setQuantity}
            min={1}
          />
          {[
            [
              "Papildoma sienų apdaila",
              "Additional wall finishing",
              Number(quantity),
              24,
            ],
            ["Durų montavimas", "Door installation", 12, 180],
            ["Palangių įrengimas", "Window sill installation", 24, 65],
          ].map((row, i) => (
            <Group key={i} justify="space-between">
              <Text size="sm">{String(lang === "lt" ? row[0] : row[1])}</Text>
              <Text size="sm">{money(Number(row[2]) * Number(row[3]))}</Text>
            </Group>
          ))}
          <Button
            disabled={!quantity || Number(quantity) <= 0}
            onClick={() =>
              save.mutate(
                (d) => ({
                  ...d,
                  works: [
                    ...d.works,
                    ...[
                      [
                        {
                          lt: "Papildoma sienų apdaila",
                          en: "Additional wall finishing",
                        },
                        Number(quantity),
                        "m²",
                        24,
                      ],
                      [
                        { lt: "Durų montavimas", en: "Door installation" },
                        12,
                        "vnt.",
                        180,
                      ],
                      [
                        {
                          lt: "Palangių įrengimas",
                          en: "Window sill installation",
                        },
                        24,
                        "vnt.",
                        65,
                      ],
                    ].map((row) => ({
                      id: uid(),
                      projectId,
                      group: {
                        lt: "04 · Papildomi darbai",
                        en: "04 · Additional works",
                      },
                      name: row[0] as Work["name"],
                      quantity: row[1] as number,
                      unit: row[2] as string,
                      rate: row[3] as number,
                    })),
                  ],
                }),
                { onSuccess: () => setImport(false) },
              )
            }
          >
            {t("Importuoti 3 pozicijas", "Import 3 positions")}
          </Button>
        </Stack>
      </Modal>
      <Modal
        opened={!!templateWork}
        onClose={() => setTemplateWork(null)}
        title={t("Procesų šablonas", "Process template")}
        centered
      >
        <Stack>
          <Text size="sm">{templateWork?.name[lang]}</Text>
          <Select
            label={t("Šablonas", "Template")}
            value={template}
            onChange={(v) => setTemplate(v || "full")}
            data={[
              {
                value: "full",
                label: t(
                  "Rangos darbai: paruošimas → vykdymas → priėmimas",
                  "Construction: preparation → execution → acceptance",
                ),
              },
              {
                value: "supply",
                label: t(
                  "Tiekimas: užsakymas → pristatymas",
                  "Supply: order → delivery",
                ),
              },
            ]}
          />
          <Text size="sm" c="dimmed">
            {t(
              "Procesai bus priskirti projekto vadovui, pradedant atskaitos data. Priklausomybės sukuriamos automatiškai.",
              "Processes will be assigned to the project manager, starting from the reference date. Dependencies are created automatically.",
            )}
          </Text>
          <Button
            onClick={() => {
              if (!templateWork) return;
              const ids = [uid(), uid(), uid()];
              const titles =
                template === "full"
                  ? [
                      { lt: "Darbų paruošimas", en: "Work preparation" },
                      { lt: "Darbų vykdymas", en: "Work execution" },
                      {
                        lt: "Kokybės patikra ir priėmimas",
                        en: "Quality inspection and acceptance",
                      },
                    ]
                  : [
                      { lt: "Medžiagų užsakymas", en: "Material ordering" },
                      { lt: "Pristatymas į objektą", en: "Delivery to site" },
                    ];
              save.mutate(
                (d) => ({
                  ...d,
                  processes: [
                    ...d.processes,
                    ...titles.map((name, i) => ({
                      id: ids[i],
                      projectId,
                      workId: templateWork.id,
                      name,
                      assigneeId: db.projects.find((p) => p.id === projectId)!
                        .managerId,
                      start: dayjs(today)
                        .add(i * 7, "day")
                        .format("YYYY-MM-DD"),
                      deadline: dayjs(today)
                        .add(i * 7 + 6, "day")
                        .format("YYYY-MM-DD"),
                      status: "planned" as const,
                      dependencies: i ? [ids[i - 1]] : [],
                      comments: [],
                    })),
                  ],
                }),
                { onSuccess: () => setTemplateWork(null) },
              );
            }}
          >
            {t("Taikyti šabloną", "Apply template")}
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
