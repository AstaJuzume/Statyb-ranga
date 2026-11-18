import { useRef, useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  SegmentedControl,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Download,
  GripVertical,
  Link2,
  LocateFixed,
} from "lucide-react";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import { useApp } from "../../../lib/i18n";
import { useSave } from "../../../lib/store";
import {
  overdue,
  today,
  type Database,
  type Process,
} from "../../../lib/types";
import { Empty, Initials } from "../../../components/ui";
import { exportWorkbook } from "../../../lib/export";
interface Row {
  id: string;
  name: string;
  type: "group" | "work" | "process";
  start: string;
  deadline: string;
  groupIndex: number;
  process?: Process;
  count?: number;
}
export function Gantt({
  db,
  projectId,
  onDetail,
  onlyOverdue = false,
}: {
  db: Database;
  projectId: string;
  onDetail: (id: string) => void;
  onlyOverdue?: boolean;
}) {
  const { t, lang } = useApp();
  const save = useSave();
  const [zoom, setZoom] = useState("day");
  const [offset, setOffset] = useState(0);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [drag, setDrag] = useState<{
    id: string;
    startX: number;
    delta: number;
    mode: "move" | "resize";
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const works = db.works.filter((w) => w.projectId === projectId);
  const processes = db.processes.filter(
    (p) =>
      p.projectId === projectId &&
      (!onlyOverdue || overdue(p.deadline, p.status)),
  );
  const cellWidth = zoom === "day" ? 36 : zoom === "week" ? 14 : 5;
  const first = processes.length
    ? processes.reduce(
        (a, p) => (p.start < a ? p.start : a),
        processes[0].start,
      )
    : today;
  const last = processes.length
    ? processes.reduce(
        (a, p) => (p.deadline > a ? p.deadline : a),
        processes[0].deadline,
      )
    : today;
  const origin = dayjs(first).subtract(2, "day").add(offset, "day");
  const totalDays = Math.max(42, dayjs(last).diff(origin, "day") + 10);
  const chartWidth = Math.max(totalDays * cellWidth, 700);
  const groups = [...new Set(works.map((w) => w.group[lang]))];
  const rows: Row[] = [];
  groups.forEach((name, groupIndex) => {
    const ws = works.filter((w) => w.group[lang] === name);
    const ps = processes.filter((p) => ws.some((w) => w.id === p.workId));
    if (!ps.length) return;
    const start = ps.reduce((s, p) => (p.start < s ? p.start : s), ps[0].start);
    const deadline = ps.reduce(
      (s, p) => (p.deadline > s ? p.deadline : s),
      ps[0].deadline,
    );
    rows.push({
      id: name,
      name,
      type: "group",
      start,
      deadline,
      groupIndex,
      count: ps.length,
    });
    if (collapsed.includes(name)) return;
    ws.forEach((w) => {
      const ps = processes.filter((p) => p.workId === w.id);
      if (!ps.length) return;
      rows.push({
        id: w.id,
        name: w.name[lang],
        type: "work",
        start: ps.reduce((s, p) => (p.start < s ? p.start : s), ps[0].start),
        deadline: ps.reduce(
          (s, p) => (p.deadline > s ? p.deadline : s),
          ps[0].deadline,
        ),
        groupIndex,
      });
      ps.forEach((p) =>
        rows.push({
          id: p.id,
          name: p.name[lang],
          type: "process",
          start: p.start,
          deadline: p.deadline,
          groupIndex,
          process: p,
        }),
      );
    });
  });
  const toggle = (id: string) =>
    setCollapsed((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  const finishDrag = (dx: number) => {
    if (!drag) return;
    const days = Math.round(dx / cellWidth);
    const current = drag;
    setDrag(null);
    if (!days) return;
    const item = processes.find((p) => p.id === current.id)!;
    const start =
      current.mode === "move"
        ? dayjs(item.start).add(days, "day").format("YYYY-MM-DD")
        : item.start;
    const deadline = dayjs(item.deadline).add(days, "day").format("YYYY-MM-DD");
    if (deadline < start) {
      notifications.show({
        message: t(
          "Terminas negali būti ankstesnis už pradžią.",
          "Deadline cannot be before the start.",
        ),
        color: "red",
      });
      return;
    }
    const predecessor = db.processes.find(
      (p) => item.dependencies.includes(p.id) && p.deadline > start,
    );
    if (predecessor) {
      notifications.show({
        message: t(
          "Pirmiausia turi pasibaigti ankstesnis procesas.",
          "A predecessor must finish before this process starts.",
        ),
        color: "red",
      });
      return;
    }
    save.mutate((d) => {
      d.processes = d.processes.map((p) =>
        p.id === item.id ? { ...p, start, deadline } : p,
      );
      const cascade = (id: string, visited = new Set<string>()) => {
        if (visited.has(id)) return;
        visited.add(id);
        const parent = d.processes.find((p) => p.id === id)!;
        d.processes
          .filter((p) => p.dependencies.includes(id))
          .forEach((child) => {
            if (child.start <= parent.deadline) {
              const diff = dayjs(parent.deadline)
                .add(1, "day")
                .diff(dayjs(child.start), "day");
              child.start = dayjs(child.start)
                .add(diff, "day")
                .format("YYYY-MM-DD");
              child.deadline = dayjs(child.deadline)
                .add(diff, "day")
                .format("YYYY-MM-DD");
            }
            cascade(child.id, visited);
          });
      };
      cascade(item.id);
      return d;
    });
  };
  const x = (date: string) => dayjs(date).diff(origin, "day") * cellWidth;
  const color = (row: Row) =>
    row.process?.status === "active"
      ? "#1a73e8"
      : row.process?.status === "done"
        ? "#81b29a"
        : row.process?.status === "blocked"
          ? "#d98078"
          : ["#8ca8c9", "#a79bc4", "#82b3b2"][row.groupIndex % 3];
  return (
    <>
      <div className="gantt-toolbar">
        <Group gap={8}>
          <SegmentedControl
            size="xs"
            value={zoom}
            onChange={setZoom}
            data={[
              { value: "day", label: t("Diena", "Day") },
              { value: "week", label: t("Savaitė", "Week") },
              { value: "month", label: t("Mėnuo", "Month") },
            ]}
          />
          <ActionIcon
            variant="default"
            aria-label={t("Ankstesnis laikotarpis", "Previous period")}
            onClick={() => setOffset((v) => v - 7)}
          >
            <ChevronLeft size={15} />
          </ActionIcon>
          <ActionIcon
            variant="default"
            aria-label={t("Kitas laikotarpis", "Next period")}
            onClick={() => setOffset((v) => v + 7)}
          >
            <ChevronRight size={15} />
          </ActionIcon>
          <Text size="sm">
            {origin.format("YYYY-MM-DD")} –{" "}
            {origin.add(totalDays, "day").format("YYYY-MM-DD")}
          </Text>
        </Group>
        <Group>
          <Button
            size="compact-xs"
            variant="subtle"
            leftSection={<LocateFixed size={15} />}
            onClick={() => {
              setOffset(0);
              scrollRef.current?.scrollTo({
                left: Math.max(0, x(today) - 150),
                behavior: "smooth",
              });
            }}
          >
            {t("Šiandien", "Today")}
          </Button>
          <Button
            size="xs"
            variant="default"
            leftSection={<Download size={15} />}
            onClick={() =>
              exportWorkbook(
                processes.map((p) => ({
                  [t("Procesas", "Process")]: p.name[lang],
                  [t("Pradžia", "Start")]: p.start,
                  [t("Terminas", "Deadline")]: p.deadline,
                  [t("Atsakingas", "Assignee")]:
                    db.people.find((x) => x.id === p.assigneeId)?.name || "",
                })),
                t("Darbų planas", "Work plan"),
              )
            }
          >
            {t("Eksportuoti Excel", "Export Excel")}
          </Button>
        </Group>
      </div>
      <div className="gantt-hint">
        <GripVertical size={13} />
        {t(
          "Tempkite juostą, kad pakeistumėte datas. Tempkite dešinį kraštą, kad pakeistumėte trukmę.",
          "Drag a bar to reschedule. Drag its right edge to resize.",
        )}
        <Link2 size={13} />
        {t(
          "Priklausomi darbai persiplanuoja automatiškai.",
          "Dependent work is rescheduled automatically.",
        )}
      </div>
      {!rows.length ? (
        <Empty />
      ) : (
        <div className="gantt-layout">
          <div className="gantt-labels">
            <div className="gantt-label-header">
              {t("Darbų grupė / procesas", "Work group / process")}
            </div>
            {rows.map((row) => (
              <UnstyledButton
                key={row.id}
                className={`gantt-label ${row.type}`}
                onClick={() =>
                  row.type === "group"
                    ? toggle(row.id)
                    : row.type === "process"
                      ? onDetail(row.id)
                      : undefined
                }
              >
                <span>
                  {row.type === "group" ? (
                    collapsed.includes(row.id) ? (
                      <ChevronRight size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )
                  ) : row.type === "work" ? (
                    <span
                      className="group-square"
                      style={{ background: color(row) }}
                    />
                  ) : (
                    <GripVertical size={12} />
                  )}
                </span>
                <Text
                  size="xs"
                  truncate
                  fw={row.type === "process" ? 400 : 500}
                >
                  {row.name}
                </Text>
                {row.process && (
                  <Initials
                    name={
                      db.people.find((p) => p.id === row.process?.assigneeId)
                        ?.name || ""
                    }
                    size={22}
                  />
                )}
              </UnstyledButton>
            ))}
          </div>
          <div className="gantt-scroll" ref={scrollRef}>
            <div className="gantt-timeline" style={{ width: chartWidth }}>
              <div className="gantt-days" style={{ height: 60 }}>
                {Array.from({ length: totalDays }, (_, i) => {
                  const date = origin.add(i, "day");
                  const show =
                    zoom === "day" ||
                    (zoom === "week" && date.day() === 1) ||
                    (zoom === "month" && date.date() === 1);
                  return show ? (
                    <div
                      key={i}
                      className={`gantt-day ${date.format("YYYY-MM-DD") === today ? "today" : ""}`}
                      style={{
                        left: i * cellWidth,
                        width:
                          zoom === "day"
                            ? cellWidth
                            : zoom === "week"
                              ? 7 * cellWidth
                              : 30 * cellWidth,
                      }}
                    >
                      <small>
                        {zoom === "month"
                          ? date.format("MMM")
                          : date.format("dd")}
                      </small>
                      <b>
                        {zoom === "month"
                          ? date.format("YYYY")
                          : date.format("DD")}
                      </b>
                    </div>
                  ) : null;
                })}
              </div>
              <div
                className="gantt-bars"
                style={{
                  height: rows.length * 42,
                  backgroundSize: `${cellWidth}px 42px`,
                }}
              >
                {rows.map((row, i) => {
                  const isDrag = drag?.id === row.id;
                  const left =
                    x(row.start) +
                    (isDrag && drag.mode === "move" ? drag.delta : 0);
                  const width = Math.max(
                    10,
                    (dayjs(row.deadline).diff(dayjs(row.start), "day") + 1) *
                      cellWidth +
                      (isDrag && drag.mode === "resize" ? drag.delta : 0),
                  );
                  return (
                    <div
                      key={row.id}
                      className={`gantt-track ${row.type}`}
                      style={{ top: i * 42 }}
                    >
                      <Tooltip
                        label={`${row.name} · ${row.start} → ${row.deadline}`}
                      >
                        <div
                          role={row.process ? "button" : undefined}
                          tabIndex={row.process ? 0 : undefined}
                          onKeyDown={(e) => {
                            if (
                              row.process &&
                              (e.key === "Enter" || e.key === " ")
                            )
                              onDetail(row.id);
                          }}
                          className={`gantt-bar ${row.type} ${row.process?.status === "cancelled" ? "cancelled" : ""}`}
                          style={{
                            left,
                            width,
                            background: color(row),
                            opacity:
                              row.type === "group"
                                ? 0.35
                                : row.process?.status === "planned"
                                  ? 0.65
                                  : 1,
                          }}
                          onDoubleClick={() => row.process && onDetail(row.id)}
                          onPointerDown={(e) => {
                            if (!row.process) return;
                            e.preventDefault();
                            e.currentTarget.setPointerCapture(e.pointerId);
                            setDrag({
                              id: row.id,
                              startX: e.clientX,
                              delta: 0,
                              mode: (e.target as HTMLElement).dataset.resize
                                ? "resize"
                                : "move",
                            });
                          }}
                          onPointerMove={(e) => {
                            if (drag?.id === row.id)
                              setDrag({
                                ...drag,
                                delta: e.clientX - drag.startX,
                              });
                          }}
                          onPointerUp={(e) => {
                            if (drag?.id === row.id)
                              finishDrag(e.clientX - drag.startX);
                          }}
                        >
                          <span>
                            {row.type === "process" && width > 90
                              ? row.name
                              : ""}
                          </span>
                          {row.process && (
                            <i data-resize="true" className="bar-resize" />
                          )}
                          {row.process &&
                            overdue(row.deadline, row.process.status) && (
                              <b className="gantt-late">!</b>
                            )}
                        </div>
                      </Tooltip>
                    </div>
                  );
                })}
                <svg
                  className="dependencies"
                  width={chartWidth}
                  height={rows.length * 42}
                  aria-label={t(
                    "Procesų priklausomybės",
                    "Process dependencies",
                  )}
                >
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="6"
                      markerHeight="6"
                      refX="5"
                      refY="3"
                      orient="auto"
                    >
                      <path d="M0 0L6 3L0 6" fill="#9aa0a6" />
                    </marker>
                  </defs>
                  {rows.flatMap(
                    (row, i) =>
                      row.process?.dependencies.map((dep) => {
                        const j = rows.findIndex((r) => r.id === dep);
                        if (j < 0) return null;
                        const parent = rows[j];
                        const x1 = x(parent.deadline) + cellWidth;
                        const x2 = x(row.start);
                        return (
                          <path
                            key={`${dep}-${row.id}`}
                            d={`M${x1},${j * 42 + 21} H${x1 + 8} V${i * 42 + 21} H${x2 - 3}`}
                            stroke="#9aa0a6"
                            fill="none"
                            strokeWidth="1.2"
                            markerEnd="url(#arrowhead)"
                          />
                        );
                      }) || [],
                  )}
                </svg>
                {x(today) >= 0 && (
                  <div
                    className="today-line"
                    style={{ left: x(today) + cellWidth / 2, height: "100%" }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <Group gap={18} mt="md" className="gantt-legend">
        {[
          ["#1a73e8", t("Vykdoma", "In progress")],
          ["#81b29a", t("Atlikta", "Completed")],
          ["#d98078", t("Vėluoja", "Blocked")],
          ["#8ca8c9", t("Paruošimas", "Preparation")],
          ["#a79bc4", t("Konstrukcijos", "Structures")],
          ["#82b3b2", t("Apdaila", "Finishing")],
        ].map(([color, label]) => (
          <Group gap={5} key={label}>
            <span
              style={{
                background: color,
                width: 8,
                height: 8,
                borderRadius: 2,
              }}
            />
            <Text size="xs" c="dimmed">
              {label}
            </Text>
          </Group>
        ))}
        <Badge color="gray" variant="light">
          {t(
            "Dukart spustelėkite juostą – informacija",
            "Double-click a bar for details",
          )}
        </Badge>
      </Group>
    </>
  );
}
