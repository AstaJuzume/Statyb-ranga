import { useState } from "react";
import {
  ActionIcon,
  Anchor,
  Button,
  Checkbox,
  Drawer,
  Group,
  Progress,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { ClipboardCheck, Link2, Pencil, Plus, Trash2 } from "lucide-react";
import { useDatabase, useSave } from "../api";
import { useApp } from "../../../lib/i18n";
import { overdue, processStatuses, statusLabels } from "../../../lib/types";
import {
  ConfirmDelete,
  DataTable,
  Loading,
  PageHeader,
  PersonCell,
  ProjectFilter,
  SearchField,
  StatusBadge,
  Surface,
} from "../../../components/ui";
import { EntityEditor } from "../../../components/EntityEditor";
export function Handover({
  projectId,
  embedded = false,
}: {
  projectId?: string;
  embedded?: boolean;
}) {
  const { data: db } = useDatabase();
  const { t, lang } = useApp();
  const save = useSave();
  const [project, setProject] = useState<string | null>(projectId || null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [edit, setEdit] = useState<string | true | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [remove, setRemove] = useState<string | null>(null);
  if (!db) return <Loading />;
  const data = db.handovers.filter(
    (x) =>
      (!project || x.projectId === project) &&
      (!status || x.status === status) &&
      x.name[lang].toLowerCase().includes(q.toLowerCase()),
  );
  const item = db.handovers.find((x) => x.id === detail);
  const done = data.filter((x) => x.status === "done").length;
  return (
    <>
      {!embedded && (
        <PageHeader
          eyebrow={t("OBJEKTŲ UŽBAIGIMAS", "PROJECT COMPLETION")}
          title={t("Pridavimas", "Handover")}
          description={t(
            "Visi užbaigimo etapai, dokumentai ir atsakomybės.",
            "Every completion stage, document and responsible person.",
          )}
          actions={
            <Button
              leftSection={<Plus size={17} />}
              onClick={() => setEdit(true)}
            >
              {t("Naujas etapas", "New stage")}
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
          data={processStatuses.map((value) => ({
            value,
            label: statusLabels[value][lang],
          }))}
        />
        {embedded && (
          <Button
            size="xs"
            leftSection={<Plus size={14} />}
            onClick={() => setEdit(true)}
          >
            {t("Pridėti etapą", "Add stage")}
          </Button>
        )}
      </div>
      <Surface className="handover-progress">
        <Group justify="space-between">
          <Group>
            <ClipboardCheck size={20} />
            <Text fw={500} size="sm">
              {t("Pridavimo pažanga", "Handover progress")}
            </Text>
          </Group>
          <Text size="sm">
            {done} / {data.length} {t("etapų atlikta", "stages completed")}
          </Text>
        </Group>
        <Progress
          mt="md"
          value={data.length ? (done / data.length) * 100 : 0}
          color="blue"
          size={7}
        />
      </Surface>
      <Surface>
        <DataTable
          data={data}
          onRowClick={(x) => setDetail(x.id)}
          columns={[
            {
              id: "check",
              header: "",
              cell: ({ row }) => (
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    aria-label={t("Pažymėti atlikta", "Mark completed")}
                    checked={row.original.status === "done"}
                    onChange={(e) =>
                      save.mutate((d) => ({
                        ...d,
                        handovers: d.handovers.map((x) =>
                          x.id === row.original.id
                            ? {
                                ...x,
                                status: e.target.checked ? "done" : "planned",
                              }
                            : x,
                        ),
                      }))
                    }
                  />
                </div>
              ),
            },
            { accessorFn: (x) => x.name[lang], header: t("Etapas", "Stage") },
            {
              accessorKey: "projectId",
              header: t("Projektas", "Project"),
              cell: ({ row }) =>
                db.projects.find((p) => p.id === row.original.projectId)?.name[
                  lang
                ],
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
              id: "actions",
              header: t("Veiksmai", "Actions"),
              cell: ({ row }) => (
                <Group onClick={(e) => e.stopPropagation()} gap={3}>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={() => setEdit(row.original.id)}
                    aria-label={t("Redaguoti", "Edit")}
                  >
                    <Pencil size={15} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={() => setRemove(row.original.id)}
                    aria-label={t("Pašalinti", "Delete")}
                  >
                    <Trash2 size={15} />
                  </ActionIcon>
                </Group>
              ),
            },
          ]}
        />
      </Surface>
      <Drawer
        opened={!!item}
        onClose={() => setDetail(null)}
        title={t("Pridavimo etapo informacija", "Handover stage details")}
        position="right"
      >
        <Stack>
          {item && (
            <>
              <StatusBadge status={item.status} date={item.deadline} />
              <Text size="xl">{item.name[lang]}</Text>
              <PersonCell db={db} id={item.assigneeId} />
              <Text size="sm">
                {t("Terminas", "Deadline")}: {item.deadline}
              </Text>
              <Text fw={500} size="sm">
                {t("Etapo dokumentai", "Stage documents")}
              </Text>
              {item.documentIds.map((id) => {
                const d = db.documents.find((x) => x.id === id);
                return (
                  d && (
                    <Anchor
                      size="sm"
                      key={id}
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Link2 size={14} /> {d.name[lang]}
                    </Anchor>
                  )
                );
              })}
              <Button variant="default" onClick={() => setEdit(item.id)}>
                {t("Redaguoti etapą ir dokumentus", "Edit stage & documents")}
              </Button>
            </>
          )}
        </Stack>
      </Drawer>
      {edit && (
        <EntityEditor
          kind="handover"
          id={typeof edit === "string" ? edit : undefined}
          projectId={project || ""}
          onClose={() => setEdit(null)}
        />
      )}
      <ConfirmDelete
        opened={!!remove}
        onClose={() => setRemove(null)}
        label={db.handovers.find((x) => x.id === remove)?.name[lang] || ""}
        onConfirm={() =>
          save.mutate((d) => ({
            ...d,
            handovers: d.handovers.filter((x) => x.id !== remove),
          }))
        }
      />
    </>
  );
}
