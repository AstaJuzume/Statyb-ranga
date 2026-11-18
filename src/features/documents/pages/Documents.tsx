import { useState } from "react";
import {
  ActionIcon,
  Anchor,
  Button,
  Group,
  Select,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  ArrowUpRight,
  FolderOpen,
  Link2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useDatabase, useSave } from "../api";
import { useApp } from "../../../lib/i18n";
import { categoryLabels } from "../../../lib/types";
import {
  CategoryBadge,
  ConfirmDelete,
  DataTable,
  Loading,
  PageHeader,
  PersonCell,
  ProjectFilter,
  SearchField,
  Surface,
} from "../../../components/ui";
import { EntityEditor } from "../../../components/EntityEditor";
export function Documents({
  projectId,
  embedded = false,
}: {
  projectId?: string;
  embedded?: boolean;
}) {
  const { data: db } = useDatabase();
  const { t, lang } = useApp();
  const save = useSave();
  const [q, setQ] = useState("");
  const [project, setProject] = useState<string | null>(projectId || null);
  const [category, setCategory] = useState<string | null>(null);
  const [edit, setEdit] = useState<string | true | null>(null);
  const [remove, setRemove] = useState<string | null>(null);
  if (!db) return <Loading />;
  const data = db.documents.filter(
    (x) =>
      (!project || x.projectId === project) &&
      (!category || x.category === category) &&
      x.name[lang].toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      {!embedded && (
        <PageHeader
          eyebrow="GOOGLE DRIVE"
          title={t("Dokumentai", "Documents")}
          description={t(
            "Projektų dokumentai ir brėžiniai. Viena nuoroda – visai komandai.",
            "Project documents and drawings. One link for the whole team.",
          )}
          actions={
            <Button
              leftSection={<Plus size={17} />}
              onClick={() => setEdit(true)}
            >
              {t("Pridėti dokumentą", "Add document")}
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
          placeholder={t("Visos kategorijos", "All categories")}
          data={Object.entries(categoryLabels).map(([value, label]) => ({
            value,
            label: label[lang],
          }))}
          value={category}
          onChange={setCategory}
        />
        {embedded && (
          <Button
            size="xs"
            leftSection={<Plus size={14} />}
            onClick={() => setEdit(true)}
          >
            {t("Pridėti nuorodą", "Add link")}
          </Button>
        )}
      </div>
      <div className="document-info">
        <FolderOpen size={18} />
        <Text size="xs">
          {t(
            "Nuorodos atveria Google Drive. Demonstraciniai dokumentai rodomi per projekto paiešką; pridėkite savo bendrinamą nuorodą redaguodami įrašą.",
            "Links open Google Drive. Demo documents use a project search; edit a record to add your own shared link.",
          )}
        </Text>
      </div>
      <Surface>
        <DataTable
          data={data}
          columns={[
            {
              accessorFn: (d) => d.name[lang],
              header: t("Dokumentas", "Document"),
              cell: ({ row }) => (
                <Group gap={10} wrap="nowrap">
                  <span className="document-icon">
                    <Link2 size={19} />
                  </span>
                  <div>
                    <Anchor
                      href={row.original.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="sm"
                      fw={500}
                    >
                      {row.original.name[lang]} <ArrowUpRight size={12} />
                    </Anchor>
                    <Text size="xs" c="dimmed">
                      {
                        db.projects.find((p) => p.id === row.original.projectId)
                          ?.name[lang]
                      }
                    </Text>
                  </div>
                </Group>
              ),
            },
            {
              accessorKey: "category",
              header: t("Kategorija", "Category"),
              cell: ({ row }) => (
                <CategoryBadge category={row.original.category} />
              ),
            },
            { accessorKey: "date", header: t("Pridėta", "Added") },
            {
              accessorKey: "personId",
              header: t("Pridėjo", "Added by"),
              cell: ({ row }) => (
                <PersonCell db={db} id={row.original.personId} />
              ),
            },
            {
              id: "actions",
              header: t("Veiksmai", "Actions"),
              cell: ({ row }) => (
                <Group gap={3}>
                  <Tooltip label={t("Redaguoti", "Edit")}>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={() => setEdit(row.original.id)}
                      aria-label={t("Redaguoti", "Edit")}
                    >
                      <Pencil size={15} />
                    </ActionIcon>
                  </Tooltip>
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
      {edit && (
        <EntityEditor
          kind="document"
          id={typeof edit === "string" ? edit : undefined}
          projectId={project || ""}
          onClose={() => setEdit(null)}
        />
      )}
      <ConfirmDelete
        opened={!!remove}
        onClose={() => setRemove(null)}
        label={db.documents.find((d) => d.id === remove)?.name[lang] || ""}
        onConfirm={() =>
          save.mutate((d) => ({
            ...d,
            documents: d.documents.filter((x) => x.id !== remove),
            tenders: d.tenders.map((x) => ({
              ...x,
              documentIds: x.documentIds.filter((id) => id !== remove),
            })),
            handovers: d.handovers.map((x) => ({
              ...x,
              documentIds: x.documentIds.filter((id) => id !== remove),
            })),
          }))
        }
      />
    </>
  );
}
