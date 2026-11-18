import dayjs from "dayjs";
import { useState } from "react";
import {
  Badge,
  Button,
  Drawer,
  Group,
  Stack,
  Text,
  Select,
  Divider,
  Anchor,
} from "@mantine/core";
import { CalendarPlus, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { useDatabase, useSave } from "../lib/store";
import { useApp } from "../lib/i18n";
import {
  processStatuses,
  statusLabels,
  overdue,
  type Status,
} from "../lib/types";
import { Comments } from "./Comments";
import { ConfirmDelete, PersonCell, StatusBadge } from "./ui";
import { EntityEditor } from "./EntityEditor";
export function WorkDetail({
  entity,
  id,
  onClose,
}: {
  entity: "tasks" | "processes";
  id: string;
  onClose: () => void;
}) {
  const { data: db } = useDatabase();
  const { t, lang } = useApp();
  const save = useSave();
  const [edit, setEdit] = useState(false);
  const [remove, setRemove] = useState(false);
  if (!db) return null;
  const item = db[entity].find((x) => x.id === id);
  if (!item) return null;
  const project = db.projects.find((p) => p.id === item.projectId);
  const work = db.works.find((w) => w.id === item.workId);
  const calendar = new URL("https://calendar.google.com/calendar/render");
  calendar.searchParams.set("action", "TEMPLATE");
  calendar.searchParams.set("text", item.name[lang]);
  calendar.searchParams.set(
    "dates",
    item.deadline.replaceAll("-", "") +
      "/" +
      dayjs(item.deadline).add(1, "day").format("YYYYMMDD"),
  );
  calendar.searchParams.set(
    "details",
    `${project?.name[lang] || ""} · ${work?.name[lang] || ""}`,
  );
  return (
    <>
      <Drawer
        opened
        onClose={onClose}
        position="right"
        size="lg"
        title={
          entity === "tasks"
            ? t("Užduoties informacija", "Task details")
            : t("Proceso informacija", "Process details")
        }
      >
        <Stack gap="lg">
          <Group justify="space-between">
            <StatusBadge status={item.status} date={item.deadline} />
            <Group gap={3}>
              <Button
                size="compact-xs"
                variant="subtle"
                leftSection={<Pencil size={14} />}
                onClick={() => setEdit(true)}
              >
                {t("Redaguoti", "Edit")}
              </Button>
              <Button
                size="compact-xs"
                variant="subtle"
                color="red"
                leftSection={<Trash2 size={14} />}
                onClick={() => setRemove(true)}
              >
                {t("Pašalinti", "Delete")}
              </Button>
            </Group>
          </Group>
          <Text size="xl" fw={500}>
            {item.name[lang]}
          </Text>
          <Anchor href={`/projects/${item.projectId}`} size="sm">
            {project?.name[lang]} <ExternalLink size={12} />
          </Anchor>
          <Text size="sm" c="dimmed">
            {work?.name[lang]}
          </Text>
          {"processId" in item && item.processId && (
            <Anchor
              href={`/planning?project=${item.projectId}&detail=${item.processId}`}
              size="sm"
            >
              {t("Susijęs procesas", "Linked process")}:{" "}
              {db.processes.find((p) => p.id === item.processId)?.name[lang]}
            </Anchor>
          )}
          {"supplierId" in item && item.supplierId && (
            <Anchor href={`/suppliers/${item.supplierId}`} size="sm">
              {t("Subrangovas", "Subcontractor")}:{" "}
              {db.suppliers.find((s) => s.id === item.supplierId)?.name}
            </Anchor>
          )}
          <PersonCell id={item.assigneeId} db={db} />
          <Group justify="space-between">
            <Text size="sm">{t("Terminas", "Deadline")}</Text>
            <Text
              size="sm"
              c={overdue(item.deadline, item.status) ? "red" : undefined}
            >
              {item.deadline}
            </Text>
          </Group>
          {entity === "processes" && "start" in item && (
            <>
              <Group justify="space-between">
                <Text size="sm">{t("Pradžia", "Start")}</Text>
                <Text size="sm">{item.start}</Text>
              </Group>
              <Text size="sm">
                {t("Priklausomybės", "Dependencies")}:{" "}
                {"dependencies" in item
                  ? item.dependencies
                      .map(
                        (dep) =>
                          db.processes.find((p) => p.id === dep)?.name[lang],
                      )
                      .join(", ") || "—"
                  : "—"}
              </Text>
            </>
          )}
          <Select
            label={t("Būsena", "Status")}
            value={item.status}
            data={processStatuses.map((value) => ({
              value,
              label: statusLabels[value][lang],
            }))}
            onChange={(status) =>
              status &&
              save.mutate((d) => ({
                ...d,
                [entity]: d[entity].map((x) =>
                  x.id === id ? { ...x, status: status as Status } : x,
                ),
              }))
            }
          />
          <Button
            component="a"
            href={calendar.toString()}
            target="_blank"
            rel="noopener noreferrer"
            variant="default"
            leftSection={<CalendarPlus size={16} />}
          >
            {t("Pridėti į Google Calendar", "Add to Google Calendar")}
          </Button>
          <Badge variant="light" color="gray">
            {t("Visa diena", "All day")} · {item.deadline}
          </Badge>
          <Divider />
          <Comments
            comments={item.comments}
            entity={entity}
            id={id}
            db={db}
            attachments={"attachments" in item ? item.attachments : undefined}
          />
        </Stack>
      </Drawer>
      {edit && (
        <EntityEditor
          kind={entity === "tasks" ? "task" : "process"}
          id={id}
          onClose={() => setEdit(false)}
        />
      )}
      <ConfirmDelete
        opened={remove}
        onClose={() => setRemove(false)}
        label={item.name[lang]}
        onConfirm={() =>
          save.mutate(
            (d) =>
              entity === "tasks"
                ? { ...d, tasks: d.tasks.filter((x) => x.id !== id) }
                : {
                    ...d,
                    processes: d.processes
                      .filter((x) => x.id !== id)
                      .map((x) => ({
                        ...x,
                        dependencies: x.dependencies.filter((p) => p !== id),
                      })),
                    tasks: d.tasks.map((x) =>
                      x.processId === id ? { ...x, processId: "" } : x,
                    ),
                  },
            { onSuccess: onClose },
          )
        }
      />
    </>
  );
}
