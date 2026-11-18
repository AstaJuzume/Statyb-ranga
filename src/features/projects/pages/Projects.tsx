import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Badge,
  Button,
  Group,
  Progress,
  SegmentedControl,
  Select,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  ArrowUpRight,
  Building2,
  LayoutGrid,
  List,
  Plus,
  MapPin,
  CalendarDays,
} from "lucide-react";
import { useDatabase } from "../../../lib/store";
import { useApp } from "../../../lib/i18n";
import {
  statusLabels,
  money,
  processStatuses,
  type Project,
} from "../../../lib/types";
import {
  DataTable,
  Initials,
  Loading,
  PageHeader,
  PersonCell,
  SearchField,
  StatusBadge,
  Surface,
  Empty,
} from "../../../components/ui";
import { EntityEditor } from "../../../components/EntityEditor";
export function Projects() {
  const { data: db } = useDatabase();
  const { t, lang } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [manager, setManager] = useState<string | null>(null);
  const [view, setView] = useState("grid");
  const [create, setCreate] = useState(false);
  if (!db) return <Loading />;
  const projects = db.projects.filter(
    (p) =>
      (p.name[lang] + " " + p.address + " " + p.client)
        .toLocaleLowerCase()
        .includes(q.toLocaleLowerCase()) &&
      (!status || p.status === status) &&
      (!manager || p.managerId === manager),
  );
  const progress = (p: Project) => {
    const ps = db.processes.filter(
      (x) => x.projectId === p.id && x.status !== "cancelled",
    );
    return ps.length
      ? Math.round(
          (ps.filter((x) => x.status === "done").length / ps.length) * 100,
        )
      : 0;
  };
  return (
    <>
      <PageHeader
        eyebrow={t("PROJEKTŲ PORTFELIS", "PROJECT PORTFOLIO")}
        title={t("Projektai", "Projects")}
        description={t(
          "Nuo pirmojo brėžinio iki objekto perdavimo.",
          "From the first drawing to final handover.",
        )}
        actions={
          <Button
            leftSection={<Plus size={17} />}
            onClick={() => setCreate(true)}
          >
            {t("Naujas projektas", "New project")}
          </Button>
        }
      />
      <div className="list-toolbar">
        <SearchField
          value={q}
          onChange={setQ}
          placeholder={t(
            "Ieškoti projekto ar adreso",
            "Search project or address",
          )}
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
        <Select
          clearable
          searchable
          placeholder={t("Visi vadovai", "All managers")}
          data={db.people
            .filter((x) => x.role === "manager")
            .map((p) => ({ value: p.id, label: p.name }))}
          value={manager}
          onChange={setManager}
        />
        <div className="toolbar-spacer" />
        <Text size="sm" c="dimmed">
          {projects.length} {t("projektai", "projects")}
        </Text>
        <SegmentedControl
          value={view}
          onChange={setView}
          data={[
            { value: "grid", label: <LayoutGrid size={16} /> },
            { value: "list", label: <List size={16} /> },
          ]}
          aria-label={t("Rodinys", "View")}
        />
      </div>
      {view === "grid" ? (
        <div className="project-grid">
          {projects.map((p, i) => (
            <Surface key={p.id} className="project-card">
              <UnstyledButton
                className="project-card-main"
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                <div className={`project-art art-${i % 4}`}>
                  <Building2 size={70} strokeWidth={0.7} />
                  <div className="architecture-lines" />
                  <Badge
                    color={
                      p.status === "active"
                        ? "blue"
                        : p.status === "blocked"
                          ? "red"
                          : "gray"
                    }
                    variant="white"
                  >
                    {statusLabels[p.status][lang]}
                  </Badge>
                  <span className="project-code">
                    SR / {String(db.projects.indexOf(p) + 1).padStart(3, "0")}
                  </span>
                </div>
                <div className="project-card-content">
                  <Group justify="space-between" wrap="nowrap">
                    <Text fw={500} size="lg">
                      {p.name[lang]}
                    </Text>
                    <ArrowUpRight size={19} />
                  </Group>
                  <Text size="xs" c="dimmed" mt={5}>
                    <MapPin size={12} /> {p.address}
                  </Text>
                  <Text size="xs" c="dimmed" mt={4}>
                    {p.client}
                  </Text>
                  <Group justify="space-between" mt={22}>
                    <Text size="xs" c="dimmed">
                      {t("Darbų pažanga", "Work progress")}
                    </Text>
                    <Text size="xs" fw={500}>
                      {progress(p)}%
                    </Text>
                  </Group>
                  <Progress
                    value={progress(p)}
                    size={5}
                    mt={8}
                    color={p.status === "done" ? "green" : "blue"}
                  />
                  <Group justify="space-between" mt={20}>
                    <div className="avatar-stack">
                      {p.team.slice(0, 4).map((id) => (
                        <Initials
                          key={id}
                          name={db.people.find((x) => x.id === id)?.name || ""}
                          size={28}
                        />
                      ))}
                    </div>
                    <Text size="xs" c="dimmed">
                      <CalendarDays size={13} /> {p.deadline}
                    </Text>
                  </Group>
                </div>
              </UnstyledButton>
              <div className="project-card-footer">
                <Text size="xs" c="dimmed">
                  {t("Biudžetas", "Budget")}
                </Text>
                <Text size="sm" fw={500}>
                  {money(p.budget)}
                </Text>
              </div>
            </Surface>
          ))}
          {!projects.length && <Empty />}
        </div>
      ) : (
        <Surface>
          <DataTable
            data={projects}
            onRowClick={(p) => navigate(`/projects/${p.id}`)}
            columns={[
              {
                accessorFn: (p) => p.name[lang],
                header: t("Projektas", "Project"),
              },
              {
                accessorKey: "managerId",
                header: t("Projekto vadovas", "Project manager"),
                cell: ({ row }) => (
                  <PersonCell db={db} id={row.original.managerId} />
                ),
              },
              {
                accessorKey: "worksManagerId",
                header: t("Darbų vadovas", "Works manager"),
                cell: ({ row }) => (
                  <PersonCell db={db} id={row.original.worksManagerId} />
                ),
              },
              { accessorKey: "start", header: t("Pradžia", "Start") },
              { accessorKey: "deadline", header: t("Terminas", "Deadline") },
              {
                accessorKey: "status",
                header: t("Būsena", "Status"),
                cell: ({ row }) => <StatusBadge status={row.original.status} />,
              },
              {
                id: "progress",
                header: t("Pažanga", "Progress"),
                accessorFn: progress,
                cell: ({ row }) => `${progress(row.original)}%`,
              },
            ]}
          />
        </Surface>
      )}
      {create && (
        <EntityEditor kind="project" onClose={() => setCreate(false)} />
      )}
    </>
  );
}
