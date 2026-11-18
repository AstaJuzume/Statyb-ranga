import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
  Button,
  Group,
  Menu,
  MultiSelect,
  Progress,
  Stack,
  Tabs,
  Text,
  Select,
  Anchor,
} from "@mantine/core";
import {
  ArrowLeft,
  CalendarDays,
  ChartNoAxesGantt,
  ClipboardCheck,
  FileSignature,
  FolderOpen,
  HardHat,
  Handshake,
  ListChecks,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  Users,
} from "lucide-react";
import { useApp } from "../../../lib/i18n";
import { cascadeProject, useDatabase, useSave } from "../../../lib/store";
import {
  money,
  processStatuses,
  roleLabels,
  statusLabels,
} from "../../../lib/types";
import {
  ConfirmDelete,
  DataTable,
  Empty,
  Initials,
  Loading,
  PageHeader,
  PersonCell,
  SearchField,
  StatusBadge,
  Surface,
} from "../../../components/ui";
import { EntityEditor } from "../../../components/EntityEditor";
import { WorkDetail } from "../../../components/WorkDetail";
import { Estimate } from "../components/Estimate";
import { Gantt } from "../../planning/components/Gantt";
import { Tasks } from "../../tasks/pages/Tasks";
import { Tenders } from "../../tenders/pages/Tenders";
import { Contracts } from "../../contracts/pages/Contracts";
import { Documents } from "../../documents/pages/Documents";
import { Handover } from "../../handover/pages/Handover";
export function ProjectWorkspace() {
  const { id } = useParams();
  const { data: db } = useDatabase();
  const { t, lang } = useApp();
  const navigate = useNavigate();
  const save = useSave();
  const [params, setParams] = useSearchParams();
  const [edit, setEdit] = useState(false);
  const [remove, setRemove] = useState(false);
  const [addProcess, setAddProcess] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const tab = params.get("tab") || "estimate";
  if (!db) return <Loading />;
  const project = db.projects.find((p) => p.id === id);
  if (!project)
    return (
      <Empty
        action={
          <Button onClick={() => navigate("/projects")}>
            {t("Grįžti į projektus", "Back to projects")}
          </Button>
        }
      />
    );
  const processes = db.processes.filter((p) => p.projectId === id);
  const valid = processes.filter((p) => p.status !== "cancelled");
  const progress = valid.length
    ? Math.round(
        (valid.filter((p) => p.status === "done").length / valid.length) * 100,
      )
    : 0;
  const tabs = [
    ["estimate", t("Sąmata", "Estimate"), ReceiptText],
    ["processes", t("Procesai", "Processes"), ListChecks],
    ["gantt", t("Gantt", "Gantt"), ChartNoAxesGantt],
    ["tasks", t("Kasdienės užduotys", "Daily tasks"), ClipboardCheck],
    ["tenders", t("Konkursai", "Tenders"), Handshake],
    ["contracts", t("Sutartys", "Contracts"), FileSignature],
    ["documents", t("Dokumentai", "Documents"), FolderOpen],
    ["handover", t("Pridavimas", "Handover"), HardHat],
    ["team", t("Komanda", "Team"), Users],
  ] as const;
  return (
    <>
      <Button
        variant="subtle"
        color="gray"
        size="xs"
        leftSection={<ArrowLeft size={14} />}
        mb="md"
        onClick={() => navigate("/projects")}
      >
        {t("Visi projektai", "All projects")}
      </Button>
      <PageHeader
        eyebrow={project.client}
        title={project.name[lang]}
        description={project.address}
        actions={
          <>
            <StatusBadge status={project.status} />
            <Button
              variant="default"
              leftSection={<Pencil size={15} />}
              onClick={() => setEdit(true)}
            >
              {t("Redaguoti", "Edit")}
            </Button>
            <Menu position="bottom-end">
              <Menu.Target>
                <Button
                  variant="default"
                  px={9}
                  aria-label={t("Daugiau veiksmų", "More actions")}
                >
                  <MoreHorizontal size={18} />
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  color="red"
                  leftSection={<Trash2 size={15} />}
                  onClick={() => setRemove(true)}
                >
                  {t("Pašalinti projektą", "Delete project")}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </>
        }
      />
      <Surface className="project-overview">
        <div>
          <Text size="xs" c="dimmed" mb={8}>
            {t("Projekto vadovas", "Project manager")}
          </Text>
          <PersonCell db={db} id={project.managerId} />
        </div>
        <div>
          <Text size="xs" c="dimmed" mb={8}>
            {t("Darbų vadovas", "Works manager")}
          </Text>
          <PersonCell db={db} id={project.worksManagerId} />
        </div>
        <div>
          <Text size="xs" c="dimmed" mb={8}>
            {t("Laikotarpis", "Project period")}
          </Text>
          <Text size="sm">
            <CalendarDays size={14} /> {project.start} → {project.deadline}
          </Text>
        </div>
        <div>
          <Text size="xs" c="dimmed" mb={8}>
            {t("Biudžetas be PVM", "Budget excl. VAT")}
          </Text>
          <Text size="sm" fw={500}>
            {money(project.budget)}
          </Text>
        </div>
        <div>
          <Group justify="space-between" mb={10}>
            <Text size="xs" c="dimmed">
              {t("Bendra pažanga", "Overall progress")}
            </Text>
            <Text size="sm">{progress}%</Text>
          </Group>
          <Progress
            value={progress}
            size={6}
            color={progress === 100 ? "green" : "blue"}
          />
        </div>
      </Surface>
      <Tabs
        value={tab}
        onChange={(value) => setParams({ tab: value || "estimate" })}
        className="project-tabs"
      >
        <Tabs.List>
          {tabs.map(([value, label, Icon]) => (
            <Tabs.Tab
              key={value}
              value={value}
              leftSection={<Icon size={15} />}
            >
              {label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <div className="project-tab-content">
          {tab === "estimate" && <Estimate db={db} projectId={project.id} />}{" "}
          {tab === "processes" && (
            <>
              <div className="workspace-toolbar">
                <Group>
                  <SearchField value={q} onChange={setQ} />
                  <Select
                    clearable
                    placeholder={t("Visos būsenos", "All statuses")}
                    value={status}
                    onChange={setStatus}
                    data={processStatuses.map((value) => ({
                      value,
                      label: statusLabels[value][lang],
                    }))}
                  />
                </Group>
                <Button
                  size="xs"
                  leftSection={<Plus size={15} />}
                  onClick={() => setAddProcess(true)}
                >
                  {t("Naujas procesas", "New process")}
                </Button>
              </div>
              <Surface>
                <DataTable
                  data={processes.filter(
                    (p) =>
                      p.name[lang].toLowerCase().includes(q.toLowerCase()) &&
                      (!status || p.status === status),
                  )}
                  onRowClick={(p) => setDetail(p.id)}
                  columns={[
                    {
                      accessorFn: (p) => p.name[lang],
                      header: t("Procesas", "Process"),
                      cell: ({ row }) => (
                        <div>
                          <Text size="sm" fw={500}>
                            {row.original.name[lang]}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {
                              db.works.find((w) => w.id === row.original.workId)
                                ?.name[lang]
                            }
                          </Text>
                        </div>
                      ),
                    },
                    {
                      accessorKey: "assigneeId",
                      header: t("Atsakingas", "Assignee"),
                      cell: ({ row }) => (
                        <PersonCell db={db} id={row.original.assigneeId} />
                      ),
                    },
                    { accessorKey: "start", header: t("Pradžia", "Start") },
                    {
                      accessorKey: "deadline",
                      header: t("Terminas", "Deadline"),
                    },
                    {
                      accessorKey: "status",
                      header: t("Būsena", "Status"),
                      cell: ({ row }) => (
                        <StatusBadge
                          status={row.original.status}
                          date={row.original.deadline}
                        />
                      ),
                    },
                  ]}
                />
              </Surface>
            </>
          )}{" "}
          {tab === "gantt" && (
            <Surface className="planning-surface">
              <Gantt db={db} projectId={project.id} onDetail={setDetail} />
            </Surface>
          )}{" "}
          {tab === "tasks" && <Tasks embedded projectId={project.id} />}{" "}
          {tab === "tenders" && <Tenders embedded projectId={project.id} />}{" "}
          {tab === "contracts" && <Contracts embedded projectId={project.id} />}{" "}
          {tab === "documents" && <Documents embedded projectId={project.id} />}{" "}
          {tab === "handover" && <Handover embedded projectId={project.id} />}{" "}
          {tab === "team" && (
            <>
              <div className="workspace-toolbar">
                <Text fw={500}>
                  {t("Projekto komanda", "Project team")} ·{" "}
                  {project.team.length}
                </Text>
                <MultiSelect
                  w={360}
                  aria-label={t(
                    "Redaguoti komandos narius",
                    "Edit team members",
                  )}
                  placeholder={t("Pridėti komandos narį", "Add team member")}
                  searchable
                  value={project.team}
                  data={db.people.map((p) => ({ value: p.id, label: p.name }))}
                  onChange={(team) =>
                    save.mutate((d) => ({
                      ...d,
                      projects: d.projects.map((p) =>
                        p.id === id ? { ...p, team } : p,
                      ),
                    }))
                  }
                />
              </div>
              <div className="team-grid">
                {project.team.map((id) => {
                  const p = db.people.find((p) => p.id === id);
                  return (
                    p && (
                      <Surface className="team-card" key={id}>
                        <Initials name={p.name} size={48} />
                        <Stack gap={4} mt="md">
                          <Text fw={500}>{p.name}</Text>
                          <Text size="xs" c="dimmed">
                            {roleLabels[p.role][lang]}
                          </Text>
                          <Anchor size="xs" href={`mailto:${p.email}`}>
                            {p.email}
                          </Anchor>
                          <Text size="xs" c="dimmed">
                            <MapPin size={12} /> {p.phone}
                          </Text>
                        </Stack>
                      </Surface>
                    )
                  );
                })}
              </div>
            </>
          )}
        </div>
      </Tabs>
      {edit && (
        <EntityEditor kind="project" id={id} onClose={() => setEdit(false)} />
      )}{" "}
      {addProcess && (
        <EntityEditor
          kind="process"
          projectId={project.id}
          onClose={() => setAddProcess(false)}
        />
      )}{" "}
      {detail && (
        <WorkDetail
          entity="processes"
          id={detail}
          onClose={() => setDetail(null)}
        />
      )}
      <ConfirmDelete
        opened={remove}
        onClose={() => setRemove(false)}
        label={project.name[lang]}
        onConfirm={() =>
          save.mutate((d) => cascadeProject(d, project.id), {
            onSuccess: () => navigate("/projects"),
          })
        }
      />
    </>
  );
}
