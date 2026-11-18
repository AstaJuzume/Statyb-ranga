import { useState } from "react";
import { useSearchParams } from "react-router";
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  SegmentedControl,
  Select,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  CalendarDays,
  ChartNoAxesGantt,
  Columns3,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import dayjs from "dayjs";
import { useDatabase, useSave } from "../api";
import { useApp } from "../../../lib/i18n";
import {
  processStatuses,
  overdue,
  today,
  type Database,
  type Status,
} from "../../../lib/types";
import {
  Empty,
  Initials,
  Loading,
  PageHeader,
  StatusBadge,
  Surface,
} from "../../../components/ui";
import { WorkDetail } from "../../../components/WorkDetail";
import { EntityEditor } from "../../../components/EntityEditor";
import { Gantt } from "../components/Gantt";
export function Planning() {
  const { data: db } = useDatabase();
  const { t, lang } = useApp();
  const [params, setParams] = useSearchParams();
  const [project, setProject] = useState(params.get("project") || "p1");
  const [view, setView] = useState("gantt");
  const [create, setCreate] = useState(false);
  const [localDetail, setDetail] = useState<string | null>(null);
  const [detailEntity, setDetailEntity] = useState<"tasks" | "processes">(
    "processes",
  );
  const onlyOverdue = params.get("overdue") === "true";
  const detail = localDetail || params.get("detail");
  if (!db) return <Loading />;
  return (
    <>
      <PageHeader
        eyebrow={t("DARBŲ ORGANIZAVIMAS", "WORK ORGANISATION")}
        title={t("Planavimas", "Planning")}
        description={t(
          "Vienas planas. Aiškios atsakomybės. Sklandus darbų ritmas.",
          "One plan. Clear ownership. Steady project progress.",
        )}
        actions={
          <Button
            leftSection={<Plus size={17} />}
            onClick={() => setCreate(true)}
          >
            {t("Naujas procesas", "New process")}
          </Button>
        }
      />
      <div className="planning-controls">
        <Select
          searchable
          value={project}
          onChange={(v) => v && setProject(v)}
          data={db.projects.map((p) => ({ value: p.id, label: p.name[lang] }))}
          aria-label={t("Pasirinkti projektą", "Select project")}
          w={300}
        />
        <SegmentedControl
          value={view}
          onChange={setView}
          data={[
            {
              value: "gantt",
              label: (
                <Group gap={7} wrap="nowrap">
                  <ChartNoAxesGantt size={16} />
                  {t("Gantas", "Gantt")}
                </Group>
              ),
            },
            {
              value: "kanban",
              label: (
                <Group gap={7} wrap="nowrap">
                  <Columns3 size={16} />
                  Kanban
                </Group>
              ),
            },
            {
              value: "calendar",
              label: (
                <Group gap={7} wrap="nowrap">
                  <CalendarDays size={16} />
                  {t("Kalendorius", "Calendar")}
                </Group>
              ),
            },
          ]}
        />
        {onlyOverdue && (
          <Button
            size="xs"
            color="red"
            variant="light"
            onClick={() => setParams({})}
          >
            {t(
              "Tik vėluojantys · pašalinti filtrą",
              "Overdue only · clear filter",
            )}
          </Button>
        )}
      </div>
      <Surface className="planning-surface">
        {view === "gantt" ? (
          <Gantt
            db={db}
            projectId={project}
            onDetail={(id) => {
              setDetailEntity("processes");
              setDetail(id);
            }}
            onlyOverdue={onlyOverdue}
          />
        ) : view === "kanban" ? (
          <Kanban
            db={db}
            projectId={project}
            onDetail={(id) => {
              setDetailEntity("processes");
              setDetail(id);
            }}
            onlyOverdue={onlyOverdue}
          />
        ) : (
          <Calendar
            db={db}
            projectId={project}
            onDetail={(id, entity) => {
              setDetail(id);
              setDetailEntity(entity);
            }}
          />
        )}
      </Surface>
      {create && (
        <EntityEditor
          kind="process"
          projectId={project}
          onClose={() => setCreate(false)}
        />
      )}{" "}
      {detail && (
        <WorkDetail
          entity={detailEntity}
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
    </>
  );
}
function Kanban({
  db,
  projectId,
  onDetail,
  onlyOverdue,
}: {
  db: Database;
  projectId: string;
  onDetail: (id: string) => void;
  onlyOverdue: boolean;
}) {
  const { t, lang } = useApp();
  const save = useSave();
  const [over, setOver] = useState<Status | null>(null);
  return (
    <div className="kanban-board">
      {processStatuses.map((status) => {
        const items = db.processes.filter(
          (p) =>
            p.projectId === projectId &&
            p.status === status &&
            (!onlyOverdue || overdue(p.deadline, p.status)),
        );
        return (
          <div
            className={`kanban-column ${over === status ? "drag-over" : ""}`}
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(status);
            }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              setOver(null);
              if (db.processes.some((p) => p.id === id))
                save.mutate((d) => ({
                  ...d,
                  processes: d.processes.map((p) =>
                    p.id === id ? { ...p, status } : p,
                  ),
                }));
            }}
          >
            <Group justify="space-between" mb={14}>
              <StatusBadge status={status} />
              <Badge color="gray" size="sm">
                {items.length}
              </Badge>
            </Group>
            {items.map((p) => (
              <UnstyledButton
                key={p.id}
                className="kanban-card"
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", p.id)}
                onClick={() => onDetail(p.id)}
              >
                <Text size="xs" c="dimmed" mb={8}>
                  {db.works.find((w) => w.id === p.workId)?.name[lang]}
                </Text>
                <Text size="sm" fw={500}>
                  {p.name[lang]}
                </Text>
                <Group mt={10}>
                  <StatusBadge status={p.status} />
                </Group>
                <Group justify="space-between" mt={18}>
                  <Group gap={5}>
                    <Initials
                      name={
                        db.people.find((x) => x.id === p.assigneeId)?.name || ""
                      }
                      size={26}
                    />
                    <Text size="xs">
                      {
                        db.people
                          .find((x) => x.id === p.assigneeId)
                          ?.name.split(" ")[0]
                      }
                    </Text>
                  </Group>
                  <Text
                    size="xs"
                    c={overdue(p.deadline, p.status) ? "red" : "dimmed"}
                  >
                    {p.deadline}
                  </Text>
                </Group>
              </UnstyledButton>
            ))}
            {!items.length && (
              <Text size="xs" c="dimmed" ta="center" py={28}>
                {t("Tempkite procesą čia", "Drag a process here")}
              </Text>
            )}
          </div>
        );
      })}
    </div>
  );
}
function Calendar({
  db,
  projectId,
  onDetail,
}: {
  db: Database;
  projectId: string;
  onDetail: (id: string, entity: "tasks" | "processes") => void;
}) {
  const { t, lang } = useApp();
  const [date, setDate] = useState(today);
  const [mode, setMode] = useState("month");
  const current = dayjs(date);
  const monthStart = current.startOf("month");
  const start =
    mode === "month"
      ? monthStart.subtract((monthStart.day() + 6) % 7, "day")
      : mode === "week"
        ? current.subtract((current.day() + 6) % 7, "day")
        : current;
  const count = mode === "month" ? 42 : mode === "week" ? 7 : 1;
  const events = [
    ...db.processes
      .filter((p) => p.projectId === projectId)
      .map((p) => ({ ...p, entity: "processes" as const })),
    ...db.tasks
      .filter((p) => p.projectId === projectId)
      .map((p) => ({ ...p, entity: "tasks" as const })),
  ];
  return (
    <>
      <Group justify="space-between" className="calendar-toolbar">
        <Group>
          <ActionIcon
            variant="default"
            onClick={() =>
              setDate(
                current
                  .subtract(1, mode as "month" | "week" | "day")
                  .format("YYYY-MM-DD"),
              )
            }
            aria-label={t("Ankstesnis", "Previous")}
          >
            <ChevronLeft size={16} />
          </ActionIcon>
          <Text fw={500}>
            {current.format(mode === "month" ? "MMMM YYYY" : "YYYY-MM-DD")}
          </Text>
          <ActionIcon
            variant="default"
            onClick={() =>
              setDate(
                current
                  .add(1, mode as "month" | "week" | "day")
                  .format("YYYY-MM-DD"),
              )
            }
            aria-label={t("Kitas", "Next")}
          >
            <ChevronRight size={16} />
          </ActionIcon>
          <Button
            size="compact-xs"
            variant="subtle"
            onClick={() => setDate(today)}
          >
            {t("Šiandien", "Today")}
          </Button>
        </Group>
        <SegmentedControl
          size="xs"
          value={mode}
          onChange={setMode}
          data={[
            { value: "day", label: t("Diena", "Day") },
            { value: "week", label: t("Savaitė", "Week") },
            { value: "month", label: t("Mėnuo", "Month") },
          ]}
        />
      </Group>
      <div
        className={`calendar-grid ${mode === "day" ? "day-view" : ""}`}
        style={{
          gridTemplateColumns: `repeat(${mode === "day" ? 1 : 7},minmax(0,1fr))`,
        }}
      >
        {Array.from({ length: count }, (_, i) => {
          const day = start.add(i, "day");
          const ds = day.format("YYYY-MM-DD");
          const items = events.filter((p) => p.deadline === ds);
          return (
            <div
              className={`calendar-cell ${ds === today ? "is-today" : ""} ${day.month() !== current.month() ? "outside" : ""}`}
              key={i}
            >
              <div className="calendar-date">
                <small>{day.format("dd")}</small>
                <b>{day.format("DD")}</b>
              </div>
              {items.map((p) => (
                <UnstyledButton
                  key={p.id}
                  className={`calendar-event ${p.entity === "tasks" ? "task-event" : ""}`}
                  onClick={() => onDetail(p.id, p.entity)}
                >
                  <span />
                  {p.name[lang]}
                </UnstyledButton>
              ))}
            </div>
          );
        })}
      </div>
      {!events.length && <Empty />}
    </>
  );
}
