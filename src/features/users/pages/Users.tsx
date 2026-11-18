import { useState } from "react";
import { ActionIcon, Alert, Button, Group, Select, Text } from "@mantine/core";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { notifications } from "@mantine/notifications";
import { useApp } from "../../../lib/i18n";
import { useDatabase, useSave } from "../api";
import { roleLabels } from "../../../lib/types";
import {
  ConfirmDelete,
  DataTable,
  Initials,
  Loading,
  PageHeader,
  SearchField,
  Surface,
} from "../../../components/ui";
import { EntityEditor } from "../../../components/EntityEditor";
export function Users() {
  const { data: db } = useDatabase();
  const { t, lang, role, personId } = useApp();
  const save = useSave();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [edit, setEdit] = useState<string | true | null>(null);
  const [remove, setRemove] = useState<string | null>(null);
  if (role !== "admin")
    return (
      <Alert
        color="blue"
        icon={<ShieldCheck size={22} />}
        title={t("Prieiga tik administratoriui", "Administrator access only")}
      >
        {t(
          "Šį skyrių gali peržiūrėti tik vadovybė. Pakeiskite rolę naudotojo meniu.",
          "Only management can view this section. Switch roles in the user menu.",
        )}
      </Alert>
    );
  if (!db) return <Loading />;
  const data = db.people.filter(
    (p) =>
      (p.name + p.email).toLowerCase().includes(q.toLowerCase()) &&
      (!filter || p.role === filter),
  );
  return (
    <>
      <PageHeader
        eyebrow={t("ADMINISTRAVIMAS", "ADMINISTRATION")}
        title={t("Naudotojai ir prieigos", "Users & access")}
        description={t(
          "Komanda, atsakomybės ir vaidmenys jūsų darbo erdvėje.",
          "People, responsibilities and roles in your workspace.",
        )}
        actions={
          <Button
            leftSection={<Plus size={17} />}
            onClick={() => setEdit(true)}
          >
            {t("Naujas naudotojas", "New user")}
          </Button>
        }
      />
      <Alert icon={<ShieldCheck size={18} />} color="blue" mb="lg">
        {t(
          "Demonstracinės rolės valdo sąsają. Tai nėra saugi autentifikavimo ar prieigos kontrolės sistema.",
          "Demo roles control the interface. This is not a secure authentication or access-control system.",
        )}
      </Alert>
      <div className="list-toolbar">
        <SearchField value={q} onChange={setQ} />
        <Select
          clearable
          placeholder={t("Visos rolės", "All roles")}
          data={Object.entries(roleLabels).map(([value, label]) => ({
            value,
            label: label[lang],
          }))}
          value={filter}
          onChange={setFilter}
        />
      </div>
      <Surface>
        <DataTable
          data={data}
          columns={[
            {
              accessorKey: "name",
              header: t("Naudotojas", "User"),
              cell: ({ row }) => (
                <Group>
                  <Initials name={row.original.name} />
                  <Text size="sm" fw={500}>
                    {row.original.name}
                  </Text>
                </Group>
              ),
            },
            { accessorKey: "email", header: t("El. paštas", "Email") },
            { accessorKey: "phone", header: t("Telefonas", "Phone") },
            {
              accessorKey: "role",
              header: t("Rolė", "Role"),
              cell: ({ row }) => roleLabels[row.original.role][lang],
            },
            {
              id: "actions",
              header: t("Veiksmai", "Actions"),
              cell: ({ row }) => (
                <Group gap={4}>
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
                    disabled={row.original.id === personId}
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
      {edit && (
        <EntityEditor
          kind="person"
          id={typeof edit === "string" ? edit : undefined}
          onClose={() => setEdit(null)}
        />
      )}
      <ConfirmDelete
        opened={!!remove}
        onClose={() => setRemove(null)}
        label={db.people.find((p) => p.id === remove)?.name || ""}
        onConfirm={() => {
          const used =
            db.projects.some(
              (p) =>
                p.managerId === remove ||
                p.worksManagerId === remove ||
                p.team.includes(remove || ""),
            ) ||
            db.processes.some(
              (p) =>
                p.assigneeId === remove ||
                p.comments.some((c) => c.personId === remove),
            ) ||
            db.tasks.some(
              (p) =>
                p.assigneeId === remove ||
                p.comments.some((c) => c.personId === remove),
            ) ||
            db.handovers.some((p) => p.assigneeId === remove) ||
            db.documents.some((p) => p.personId === remove) ||
            db.contracts.some((p) =>
              p.approvers.some((a) => a.personId === remove),
            );
          if (used) {
            notifications.show({
              message: t(
                "Naudotojas priskirtas darbams. Pirmiausia perduokite jo atsakomybes kitam asmeniui.",
                "This user has assigned work. Reassign their responsibilities first.",
              ),
              color: "red",
            });
            return;
          }
          save.mutate((d) => ({
            ...d,
            people: d.people.filter((x) => x.id !== remove),
          }));
        }}
      />
    </>
  );
}
