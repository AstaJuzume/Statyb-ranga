import dayjs from "dayjs";
import { useState } from "react";
import { useSearchParams } from "react-router";
import {
  Alert,
  Button,
  Checkbox,
  Group,
  SegmentedControl,
  Select,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  CalendarPlus,
  CheckCheck,
  ClipboardCheck,
  Plus,
  TriangleAlert,
  ArrowRight,
} from "lucide-react";
import { useDatabase, useSave } from "../api";
import { useApp } from "../../../lib/i18n";
import {
  overdue,
  processStatuses,
  statusLabels,
  today,
  type Database,
} from "../../../lib/types";
import {
  DataTable,
  Empty,
  Loading,
  PageHeader,
  PersonCell,
  ProjectFilter,
  SearchField,
  StatusBadge,
  Surface,
} from "../../../components/ui";
import { EntityEditor } from "../../../components/EntityEditor";
import { WorkDetail } from "../../../components/WorkDetail";
export function Tasks({
  projectId,
  embedded = false,
}: {
  projectId?: string;
  embedded?: boolean;
}) {
  const { data: db } = useDatabase();
  return db ? (
    <TaskList db={db} projectId={projectId} embedded={embedded} />
  ) : (
    <Loading />
  );
}
function TaskList({
  db,
  projectId,
  embedded,
}: {
  db: Database;
  projectId?: string;
  embedded: boolean;
}) {
  const { t, lang, role, personId } = useApp();
  const save = useSave();
  const [params, setParams] = useSearchParams();
  const [project, setProject] = useState<string | null>(projectId || null);
  const [q, setQ] = useState("");
  const [assignee, setAssignee] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [period, setPeriod] = useState("undone");
  const [create, setCreate] = useState(false);
  const [localDetail, setDetail] = useState<string | null>(null);
  const detail = localDetail || params.get("detail");
  const worker = role === "worker";
  const all = db.tasks.filter(
    (x) =>
      (!project || x.projectId === project) &&
      (!worker || x.assigneeId === personId),
  );
  const late = all.filter((x) => overdue(x.deadline, x.status));
  const filtered = all.filter(
    (x) =>
      x.name[lang].toLocaleLowerCase().includes(q.toLocaleLowerCase()) &&
      (!assignee || x.assigneeId === assignee) &&
      (!status || x.status === status) &&
      (!worker ||
        (period === "done"
          ? x.status === "done"
          : period === "today"
            ? x.deadline === today && x.status !== "done"
            : x.status !== "done")),
  );
  const complete = (id: string, done: boolean) =>
    save.mutate((d) => ({
      ...d,
      tasks: d.tasks.map((x) =>
        x.id === id ? { ...x, status: done ? "done" : "planned" } : x,
      ),
    }));
  return (
    <div className={worker ? "worker-tasks" : ""}>
      {!embedded && (
        <PageHeader
          eyebrow={
            worker
              ? t("JŪSŲ DARBO DIENA", "YOUR WORKDAY")
              : t("KOMANDOS DARBAI", "TEAM WORK")
          }
          title={
            worker
              ? t("Mano darbai", "My work")
              : t("Kasdienės užduotys", "Daily tasks")
          }
          description={
            worker
              ? t(
                  "2026-11-18 · Trečiadienis. Svarbiausi darbai vienoje vietoje.",
                  "2026-11-18 · Wednesday. Your priorities in one place.",
                )
              : t(
                  "Aiškios užduotys, atsakingi žmonės ir darbų rezultatai.",
                  "Clear tasks, assigned people and recorded results.",
                )
          }
          actions={
            <Button
              leftSection={<Plus size={17} />}
              onClick={() => setCreate(true)}
            >
              {t("Nauja užduotis", "New task")}
            </Button>
          }
        />
      )}{" "}
      {worker && late.length > 0 && (
        <Alert
          color="red"
          icon={<TriangleAlert size={20} />}
          mb="lg"
          title={t("Yra vėluojančių darbų", "You have overdue work")}
        >
          {late.length}{" "}
          {t("užduotys laukia jūsų dėmesio.", "tasks need your attention.")}
        </Alert>
      )}
      {worker && (
        <SegmentedControl
          fullWidth
          mb="lg"
          value={period}
          onChange={setPeriod}
          data={[
            { value: "today", label: t("Šiandien", "Today") },
            { value: "undone", label: t("Neatliktos", "Incomplete") },
            { value: "done", label: t("Atliktos", "Completed") },
          ]}
        />
      )}
      <div className="list-toolbar">
        <SearchField value={q} onChange={setQ} />
        {!projectId && (
          <ProjectFilter db={db} value={project} onChange={setProject} />
        )}{" "}
        {!worker && (
          <>
            <Select
              clearable
              searchable
              placeholder={t("Visi atsakingi", "All assignees")}
              data={db.people.map((p) => ({ value: p.id, label: p.name }))}
              value={assignee}
              onChange={setAssignee}
            />
            <Select
              clearable
              placeholder={t("Visos būsenos", "All statuses")}
              data={processStatuses.map((value) => ({
                value,
                label: statusLabels[value][lang],
              }))}
              value={status}
              onChange={setStatus}
            />
          </>
        )}
        {embedded && (
          <Button
            size="xs"
            leftSection={<Plus size={14} />}
            onClick={() => setCreate(true)}
          >
            {t("Pridėti", "Add")}
          </Button>
        )}
      </div>
      {worker ? (
        <div className="worker-task-list">
          {filtered.map((task) => {
            const calendar = new URL(
              "https://calendar.google.com/calendar/render",
            );
            calendar.searchParams.set("action", "TEMPLATE");
            calendar.searchParams.set("text", task.name[lang]);
            calendar.searchParams.set(
              "dates",
              task.deadline.replaceAll("-", "") +
                "/" +
                dayjs(task.deadline).add(1, "day").format("YYYYMMDD"),
            );
            return (
              <Surface className="worker-task-card" key={task.id}>
                <Group justify="space-between" mb="md">
                  <Text size="xs" c="dimmed">
                    {
                      db.projects.find((p) => p.id === task.projectId)?.name[
                        lang
                      ]
                    }
                  </Text>
                  <StatusBadge status={task.status} date={task.deadline} />
                </Group>
                <Group wrap="nowrap" align="flex-start">
                  <Checkbox
                    checked={task.status === "done"}
                    onChange={(e) => complete(task.id, e.target.checked)}
                    aria-label={t("Pažymėti atlikta", "Mark completed")}
                  />
                  <UnstyledButton onClick={() => setDetail(task.id)}>
                    <Text
                      fw={500}
                      td={task.status === "done" ? "line-through" : undefined}
                    >
                      {task.name[lang]}
                    </Text>
                    <Text
                      size="sm"
                      c={overdue(task.deadline, task.status) ? "red" : "dimmed"}
                      mt={8}
                    >
                      {t("Terminas", "Deadline")}: {task.deadline}
                    </Text>
                  </UnstyledButton>
                </Group>
                <Group mt="lg" justify="space-between">
                  <Button
                    component="a"
                    href={calendar.toString()}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="xs"
                    variant="default"
                    leftSection={<CalendarPlus size={15} />}
                  >
                    {t("Pridėti į Google Calendar", "Add to Google Calendar")}
                  </Button>
                  <Button
                    size="compact-xs"
                    variant="subtle"
                    rightSection={<ArrowRight size={14} />}
                    onClick={() => setDetail(task.id)}
                  >
                    {t("Informacija", "Details")}
                  </Button>
                </Group>
              </Surface>
            );
          })}
          {!filtered.length && <Empty action={<CheckCheck size={28} />} />}
        </div>
      ) : (
        <Surface>
          <DataTable
            data={filtered}
            onRowClick={(x) => setDetail(x.id)}
            columns={[
              {
                id: "check",
                header: "",
                enableSorting: false,
                cell: ({ row }) => (
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      size="sm"
                      checked={row.original.status === "done"}
                      onChange={(e) =>
                        complete(row.original.id, e.target.checked)
                      }
                      aria-label={t("Pažymėti atlikta", "Mark completed")}
                    />
                  </div>
                ),
              },
              {
                accessorFn: (x) => x.name[lang],
                header: t("Užduotis", "Task"),
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
                accessorKey: "projectId",
                header: t("Projektas", "Project"),
                cell: ({ row }) => (
                  <Text size="sm">
                    {
                      db.projects.find((p) => p.id === row.original.projectId)
                        ?.name[lang]
                    }
                  </Text>
                ),
              },
              {
                accessorKey: "assigneeId",
                header: t("Atsakingas", "Assignee"),
                cell: ({ row }) => (
                  <PersonCell db={db} id={row.original.assigneeId} />
                ),
              },
              {
                accessorKey: "deadline",
                header: t("Terminas", "Deadline"),
                cell: ({ row }) => (
                  <Text
                    size="sm"
                    c={
                      overdue(row.original.deadline, row.original.status)
                        ? "red"
                        : undefined
                    }
                  >
                    {row.original.deadline}
                  </Text>
                ),
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
              {
                id: "comments",
                header: t("Komentarai / failai", "Comments / files"),
                cell: ({ row }) => (
                  <Group gap={6}>
                    <ClipboardCheck size={14} />
                    {row.original.comments.length} /{" "}
                    {row.original.attachments.length}
                  </Group>
                ),
              },
            ]}
          />
        </Surface>
      )}
      {create && (
        <EntityEditor
          kind="task"
          projectId={project || ""}
          onClose={() => setCreate(false)}
        />
      )}{" "}
      {detail && (
        <WorkDetail
          entity="tasks"
          id={detail}
          onClose={() => {
            setDetail(null);
            setParams((p) => {
              p.delete("detail");
              return p;
            });
          }}
        />
      )}
    </div>
  );
}
