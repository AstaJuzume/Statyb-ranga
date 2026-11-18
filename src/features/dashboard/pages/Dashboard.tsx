import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Group,
  Menu,
  Progress,
  Select,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock3,
  FileSignature,
  MoreHorizontal,
  Plus,
  ArrowDownToLine,
  CalendarDays,
  TriangleAlert,
  ChevronRight,
} from "lucide-react";
import { useDatabase, useSave } from "../../../lib/store";
import { useApp } from "../../../lib/i18n";
import { money, overdue, type Project } from "../../../lib/types";
import {
  DataTable,
  Empty,
  Initials,
  Loading,
  PageHeader,
  ProjectFilter,
  StatusBadge,
  Surface,
} from "../../../components/ui";
import { EntityEditor } from "../../../components/EntityEditor";
import { WorkDetail } from "../../../components/WorkDetail";
import { exportWorkbook } from "../../../lib/export";
export function Dashboard() {
  const { data: db } = useDatabase();
  const { t, lang, personId, role } = useApp();
  const navigate = useNavigate();
  const save = useSave();
  const [project, setProject] = useState<string | null>(null);
  const [person, setPerson] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [editor, setEditor] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  if (!db) return <Loading />;
  const user = db.people.find((p) => p.id === personId)!;
  const scoped = db.projects.filter(
    (p) =>
      (role === "admin" ||
        role === "procurement" ||
        p.managerId === personId ||
        p.team.includes(personId)) &&
      (!project || p.id === project) &&
      (!person || p.team.includes(person) || p.managerId === person) &&
      (!status || p.status === status) &&
      (!deadline || p.deadline <= deadline),
  );
  const scope = new Set(scoped.map((p) => p.id));
  const processes = db.processes.filter(
    (p) => scope.has(p.projectId) && (!person || p.assigneeId === person),
  );
  const late = processes.filter((p) => overdue(p.deadline, p.status));
  const tasks = db.tasks
    .filter(
      (p) =>
        scope.has(p.projectId) &&
        (role === "admin" || p.assigneeId === (person || personId)),
    )
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
  const tenders = db.tenders.filter(
    (p) =>
      scope.has(p.projectId) &&
      !["closed", "awarded", "draft"].includes(p.status),
  );
  const contracts = db.contracts.filter(
    (c) =>
      scope.has(c.projectId) &&
      ["review", "approved", "signing"].includes(c.status),
  );
  const upcoming = processes
    .filter((p) => !["done", "cancelled"].includes(p.status))
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 4);
  const progress = (p: Project) => {
    const all = db.processes.filter(
      (x) => x.projectId === p.id && x.status !== "cancelled",
    );
    return all.length
      ? Math.round(
          (all.filter((x) => x.status === "done").length / all.length) * 100,
        )
      : 0;
  };
  return (
    <>
      <PageHeader
        eyebrow={t("TREČIADIENIS, 2026-11-18", "WEDNESDAY, 2026-11-18")}
        title={
          role === "admin"
            ? t("Įmonės veiklos apžvalga", "Company overview")
            : role === "procurement"
              ? t("Pirkimų apžvalga", "Procurement overview")
              : role === "worker"
                ? t("Mano dienos apžvalga", "My day")
                : t("Projektų apžvalga", "Project overview")
        }
        description={t(
          `Sveiki, ${user.name.split(" ")[0]}. Štai kas šiandien vyksta jūsų projektuose.`,
          `Hello, ${user.name.split(" ")[0]}. Here’s what’s happening across your projects.`,
        )}
        actions={
          <>
            <Button
              variant="default"
              leftSection={<ArrowDownToLine size={16} />}
              onClick={() =>
                exportWorkbook(
                  scoped.map((p) => ({
                    [t("Projektas", "Project")]: p.name[lang],
                    [t("Biudžetas (€)", "Budget (€)")]: p.budget,
                    [t("Terminas", "Deadline")]: p.deadline,
                  })),
                  t("Projektų apžvalga", "Project overview"),
                )
              }
            >
              {t("Eksportuoti", "Export")}
            </Button>
            <Button
              leftSection={<Plus size={18} />}
              onClick={() => setEditor(true)}
            >
              {t("Naujas projektas", "New project")}
            </Button>
          </>
        }
      />
      <div className="dashboard-filter">
        <ProjectFilter db={db} value={project} onChange={setProject} />
        <Select
          clearable
          searchable
          placeholder={t("Visi atsakingi asmenys", "All assignees")}
          aria-label={t("Atsakingas asmuo", "Assignee")}
          data={db.people.map((p) => ({ value: p.id, label: p.name }))}
          value={person}
          onChange={setPerson}
        />
        <Select
          clearable
          placeholder={t("Visi terminai", "All deadlines")}
          aria-label={t("Terminas", "Deadline")}
          data={[
            {
              value: "2026-11-30",
              label: t("Iki mėnesio pabaigos", "By month end"),
            },
            {
              value: "2027-06-30",
              label: t("Iki 2027-06-30", "By 2027-06-30"),
            },
          ]}
          value={deadline}
          onChange={setDeadline}
        />
        <Select
          clearable
          placeholder={t("Visos būsenos", "All statuses")}
          aria-label={t("Būsena", "Status")}
          value={status}
          onChange={setStatus}
          data={[
            { value: "active", label: t("Vykdoma", "In progress") },
            { value: "blocked", label: t("Vėluoja", "Blocked") },
            { value: "planned", label: t("Planuojama", "Planned") },
            { value: "done", label: t("Atlikta", "Completed") },
          ]}
        />
        <Text size="xs" c="dimmed" className="filter-note">
          {t("Atnaujinta ką tik", "Updated just now")}
          <span className="live-dot" />
        </Text>
      </div>
      <div className="stats-grid">
        {[
          {
            label: t("Aktyvūs projektai", "Active projects"),
            value: scoped.filter((p) =>
              ["active", "blocked"].includes(p.status),
            ).length,
            icon: Building2,
            sub: t(
              `${scoped.length} projektai jūsų darbo erdvėje`,
              `${scoped.length} projects in your workspace`,
            ),
            cls: "blue",
            url: "/projects",
          },
          {
            label: t("Vėluojantys procesai", "Overdue processes"),
            value: late.length,
            icon: Clock3,
            sub: t("Reikia jūsų dėmesio", "Need your attention"),
            cls: "red",
            url: "/planning?overdue=true",
          },
          {
            label: t("Aktyvūs konkursai", "Active tenders"),
            value: tenders.length,
            icon: CheckCircle2,
            sub: t("Vyksta tiekėjų atranka", "Supplier selection in progress"),
            cls: "amber",
            url: "/tenders",
          },
          {
            label: t("Sutartys derinimui", "Contracts needing action"),
            value: contracts.length,
            icon: FileSignature,
            sub: t(
              "Laukia peržiūros arba parašo",
              "Awaiting review or signature",
            ),
            cls: "blue",
            url: "/contracts",
          },
        ].map((stat) => (
          <UnstyledButton
            className="stat-card"
            key={stat.label}
            onClick={() => navigate(stat.url)}
          >
            <div className="stat-top">
              <Text size="sm" c="dimmed">
                {stat.label}
              </Text>
              <span className={`stat-icon ${stat.cls}`}>
                <stat.icon size={20} strokeWidth={1.6} />
              </span>
            </div>
            <div className="stat-value">
              {String(stat.value).padStart(2, "0")}
              <ArrowUpRight size={18} />
            </div>
            <Text size="xs" c={stat.cls === "red" ? "red" : "dimmed"}>
              {stat.cls === "red" && <span className="red-dot" />}
              {stat.sub}
            </Text>
          </UnstyledButton>
        ))}
      </div>
      <div className="dashboard-main-grid">
        <Surface>
          <div className="section-heading">
            <div>
              <Text className="section-title">
                {t("Mano projektai", "My projects")}
              </Text>
              <Text size="xs" c="dimmed">
                {t(
                  "Darbų eiga ir artimiausi terminai",
                  "Progress and upcoming deadlines",
                )}
              </Text>
            </div>
            <Button
              variant="subtle"
              size="xs"
              rightSection={<ArrowRight size={14} />}
              onClick={() => navigate("/projects")}
            >
              {t("Visi projektai", "All projects")}
            </Button>
          </div>
          <DataTable
            data={scoped.slice(0, 5)}
            onRowClick={(p) => navigate(`/projects/${p.id}`)}
            columns={[
              {
                accessorFn: (p) => p.name[lang],
                header: t("Projektas", "Project"),
                cell: ({ row }) => (
                  <div className="project-name-cell">
                    <span className="project-mini-icon">
                      <Building2 size={19} />
                    </span>
                    <div>
                      <Text fw={500} size="sm">
                        {row.original.name[lang]}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {row.original.address}
                      </Text>
                    </div>
                  </div>
                ),
              },
              {
                accessorKey: "status",
                header: t("Būsena", "Status"),
                cell: ({ row }) => <StatusBadge status={row.original.status} />,
              },
              {
                id: "progress",
                header: t("Pažanga", "Progress"),
                accessorFn: progress,
                cell: ({ row }) => (
                  <div className="progress-cell">
                    <Text size="xs">{progress(row.original)}%</Text>
                    <Progress
                      value={progress(row.original)}
                      size={5}
                      color={row.original.status === "done" ? "green" : "blue"}
                    />
                  </div>
                ),
              },
              { accessorKey: "deadline", header: t("Terminas", "Deadline") },
            ]}
          />
        </Surface>
        <Surface className="my-tasks-panel">
          <div className="section-heading">
            <Group gap={8}>
              <Text className="section-title">
                {t("Mano užduotys", "My tasks")}
              </Text>
              <Badge size="sm" color="gray">
                {tasks.filter((x) => x.status !== "done").length}
              </Badge>
            </Group>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => navigate("/tasks")}
              aria-label={t("Visos užduotys", "All tasks")}
            >
              <ArrowUpRight size={18} />
            </ActionIcon>
          </div>
          <div className="task-preview-list">
            {tasks.length ? (
              tasks.slice(0, 4).map((task) => (
                <div className="task-preview" key={task.id}>
                  <Checkbox
                    size="sm"
                    checked={task.status === "done"}
                    onChange={(e) =>
                      save.mutate((d) => ({
                        ...d,
                        tasks: d.tasks.map((x) =>
                          x.id === task.id
                            ? {
                                ...x,
                                status: e.target.checked ? "done" : "planned",
                              }
                            : x,
                        ),
                      }))
                    }
                    aria-label={t("Pažymėti atlikta", "Mark completed")}
                  />
                  <UnstyledButton onClick={() => setDetail(task.id)}>
                    <Text
                      size="sm"
                      td={task.status === "done" ? "line-through" : undefined}
                      fw={400}
                    >
                      {task.name[lang]}
                    </Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      {
                        db.projects.find((p) => p.id === task.projectId)?.name[
                          lang
                        ]
                      }
                    </Text>
                    <Text
                      size="xs"
                      c={overdue(task.deadline, task.status) ? "red" : "dimmed"}
                      mt={7}
                    >
                      <CalendarDays size={12} /> {task.deadline}
                    </Text>
                  </UnstyledButton>
                </div>
              ))
            ) : (
              <Empty />
            )}
          </div>
          <Button
            variant="subtle"
            size="xs"
            fullWidth
            rightSection={<ArrowRight size={14} />}
            onClick={() => navigate("/tasks")}
          >
            {t("Peržiūrėti visas užduotis", "View all tasks")}
          </Button>
        </Surface>
      </div>
      <div className="dashboard-bottom-grid">
        <Surface>
          <div className="section-heading">
            <div>
              <Text className="section-title">
                {t("Artimiausi darbai", "Upcoming work")}
              </Text>
              <Text size="xs" c="dimmed">
                {t(
                  "Prioritetai pagal darbų terminus",
                  "Priorities by deadline",
                )}
              </Text>
            </div>
            <Badge color="gray" variant="light">
              {t("Ši savaitė", "This week")}
            </Badge>
          </div>
          <div className="deadline-list">
            {upcoming.length ? (
              upcoming.map((p) => (
                <UnstyledButton
                  key={p.id}
                  className="deadline-row"
                  onClick={() => navigate(`/planning?detail=${p.id}`)}
                >
                  <span
                    className={`deadline-date ${overdue(p.deadline, p.status) ? "late" : ""}`}
                  >
                    <b>{p.deadline.slice(8)}</b>
                    <small>{t("LAP", "NOV")}</small>
                  </span>
                  <div>
                    <Text size="sm" fw={500}>
                      {db.works.find((w) => w.id === p.workId)?.name[lang]}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {
                        db.projects.find((x) => x.id === p.projectId)?.name[
                          lang
                        ]
                      }
                    </Text>
                  </div>
                  <Tooltip
                    label={db.people.find((x) => x.id === p.assigneeId)?.name}
                  >
                    <span className="deadline-person">
                      <Initials
                        name={
                          db.people.find((x) => x.id === p.assigneeId)?.name ||
                          ""
                        }
                      />
                    </span>
                  </Tooltip>
                  <StatusBadge status={p.status} date={p.deadline} />
                  <ChevronRight size={15} />
                </UnstyledButton>
              ))
            ) : (
              <Empty />
            )}
          </div>
        </Surface>
        <Surface>
          <div className="section-heading">
            <div>
              <Text className="section-title">
                {t("Pirkimų pulsas", "Procurement pulse")}
              </Text>
              <Text size="xs" c="dimmed">
                {t(
                  "Atviri konkursai jūsų projektuose",
                  "Open tenders across your projects",
                )}
              </Text>
            </div>
            <Menu position="bottom-end">
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  aria-label={t("Daugiau veiksmų", "More actions")}
                >
                  <MoreHorizontal size={19} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={() => navigate("/tenders")}>
                  {t("Atidaryti konkursus", "Open tenders")}
                </Menu.Item>
                <Menu.Item onClick={() => navigate("/suppliers")}>
                  {t("Tiekėjų katalogas", "Supplier directory")}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </div>
          <div className="procurement-list">
            {tenders.slice(0, 2).map((tender) => (
              <UnstyledButton
                className="procurement-card"
                key={tender.id}
                onClick={() => navigate(`/tenders/${tender.id}`)}
              >
                <Group justify="space-between">
                  <StatusBadge status={tender.status} />
                  <ArrowUpRight size={16} />
                </Group>
                <Text fw={500} size="sm" mt={14}>
                  {tender.name[lang]}
                </Text>
                <Text size="xs" c="dimmed" mt={3}>
                  {
                    db.projects.find((p) => p.id === tender.projectId)?.name[
                      lang
                    ]
                  }
                </Text>
                <Group justify="space-between" mt={16}>
                  <Text size="xs" c="dimmed">
                    {tender.offers.length} {t("pasiūlymai", "offers")}
                  </Text>
                  <Text size="sm" fw={500}>
                    {money(Math.min(...tender.offers.map((o) => o.price)))}
                  </Text>
                </Group>
              </UnstyledButton>
            ))}
            {!tenders.length && <Empty />}
          </div>
          <div className="insight-strip">
            <TriangleAlert size={15} />
            <Text size="xs">
              {t(
                "Sprendimai šiandien padeda išlaikyti darbų tempą.",
                "Decisions today keep your projects moving.",
              )}
            </Text>
          </div>
        </Surface>
      </div>
      {editor && (
        <EntityEditor kind="project" onClose={() => setEditor(false)} />
      )}{" "}
      {detail && (
        <WorkDetail
          entity="tasks"
          id={detail}
          onClose={() => setDetail(null)}
        />
      )}
    </>
  );
}
