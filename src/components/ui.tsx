import { useMemo, useState, type ReactNode } from "react";
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDownUp,
  ArrowDown,
  ArrowUp,
  Inbox,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useApp } from "../lib/i18n";
import {
  categoryLabels,
  statusLabels,
  overdue,
  type Category,
  type Status,
  type Database,
} from "../lib/types";
export function StatusBadge({
  status,
  date,
}: {
  status: Status;
  date?: string;
}) {
  const { lang } = useApp();
  const late = date && overdue(date, status);
  const color =
    late || ["blocked", "rejected"].includes(status)
      ? "red"
      : ["done", "signed", "approved", "awarded", "closed"].includes(status)
        ? "green"
        : ["review", "evaluating", "signing", "sent"].includes(status)
          ? "yellow"
          : status === "active"
            ? "blue"
            : "gray";
  return (
    <Badge
      className="status-badge"
      color={color}
      variant="light"
      leftSection={late ? <span className="status-dot" /> : undefined}
    >
      {statusLabels[status][lang]}
    </Badge>
  );
}
export function CategoryBadge({ category }: { category: Category }) {
  const { lang } = useApp();
  return (
    <Badge variant="light" color="gray" fw={400}>
      {categoryLabels[category][lang]}
    </Badge>
  );
}
export function Initials({ name, size = 30 }: { name: string; size?: number }) {
  return (
    <Avatar size={size} radius="xl" color="blue" variant="light">
      {name
        .split(" ")
        .slice(0, 2)
        .map((x) => x[0])
        .join("")}
    </Avatar>
  );
}
export function PersonCell({ id, db }: { id: string; db: Database }) {
  const p = db.people.find((x) => x.id === id);
  return p ? (
    <Group gap={9} wrap="nowrap">
      <Initials name={p.name} />
      <Text size="sm">{p.name}</Text>
    </Group>
  ) : (
    <Text c="dimmed">—</Text>
  );
}
export function Empty({ action }: { action?: ReactNode }) {
  const { t } = useApp();
  return (
    <div className="empty">
      <Inbox size={34} strokeWidth={1.3} />
      <Text fw={500}>{t("Įrašų nerasta", "No records found")}</Text>
      <Text size="sm" c="dimmed">
        {t(
          "Pakeiskite filtrus arba sukurkite naują įrašą.",
          "Adjust your filters or create a new record.",
        )}
      </Text>
      {action}
    </div>
  );
}
export function Loading() {
  return (
    <Stack p={28}>
      <Skeleton height={34} width={240} />
      <Group grow>
        {[1, 2, 3, 4].map((x) => (
          <Skeleton key={x} height={120} />
        ))}
      </Group>
      <Skeleton height={380} />
    </Stack>
  );
}
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <Text className="eyebrow">{eyebrow}</Text>}
        <Title order={1}>{title}</Title>
        {description && <Text className="page-description">{description}</Text>}
      </div>
      <Group gap={10}>{actions}</Group>
    </div>
  );
}
export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  const { t } = useApp();
  return (
    <TextInput
      className="search-pill"
      leftSection={<Search size={18} />}
      placeholder={placeholder || t("Ieškoti…", "Search…")}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={placeholder || t("Ieškoti", "Search")}
    />
  );
}
export function ProjectFilter({
  db,
  value,
  onChange,
}: {
  db: Database;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const { lang, t } = useApp();
  return (
    <Select
      clearable
      searchable
      aria-label={t("Projektas", "Project")}
      placeholder={t("Visi projektai", "All projects")}
      data={db.projects.map((x) => ({ value: x.id, label: x.name[lang] }))}
      value={value}
      onChange={onChange}
      className="filter-select"
    />
  );
}
export function DataTable<T>({
  data,
  columns,
  onRowClick,
}: {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  onRowClick?: (r: T) => void;
}) {
  const { t } = useApp();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  const rows = table.getRowModel().rows;
  const actualPage = Math.min(
    page,
    Math.max(0, Math.ceil(rows.length / pageSize) - 1),
  );
  const visible = useMemo(
    () => rows.slice(actualPage * pageSize, (actualPage + 1) * pageSize),
    [rows, actualPage],
  );
  if (!data.length) return <Empty />;
  return (
    <>
      <div className="table-scroll">
        <Table
          className="data-table"
          verticalSpacing="md"
          horizontalSpacing="lg"
        >
          <Table.Thead>
            <Table.Tr>
              {table.getHeaderGroups()[0].headers.map((h) => (
                <Table.Th key={h.id}>
                  <button
                    className="table-sort"
                    onClick={h.column.getToggleSortingHandler()}
                    disabled={!h.column.getCanSort()}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {h.column.getCanSort() &&
                      (h.column.getIsSorted() === "asc" ? (
                        <ArrowUp size={12} />
                      ) : h.column.getIsSorted() === "desc" ? (
                        <ArrowDown size={12} />
                      ) : (
                        <ArrowDownUp size={12} />
                      ))}
                  </button>
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {visible.map((row) => (
              <Table.Tr
                key={row.id}
                className={onRowClick ? "click-row" : ""}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((c) => (
                  <Table.Td key={c.id}>
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>
      <div className="table-footer">
        <Text size="xs" c="dimmed">
          {t("Rodoma", "Showing")} {actualPage * pageSize + 1}–
          {Math.min((actualPage + 1) * pageSize, rows.length)} {t("iš", "of")}{" "}
          {rows.length}
        </Text>
        <Group gap={4}>
          <ActionIcon
            variant="subtle"
            color="gray"
            disabled={actualPage === 0}
            onClick={() => setPage(actualPage - 1)}
            aria-label={t("Ankstesnis puslapis", "Previous page")}
          >
            <ChevronLeft size={17} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            disabled={(actualPage + 1) * pageSize >= rows.length}
            onClick={() => setPage(actualPage + 1)}
            aria-label={t("Kitas puslapis", "Next page")}
          >
            <ChevronRight size={17} />
          </ActionIcon>
        </Group>
      </div>
    </>
  );
}
export function ConfirmDelete({
  opened,
  onClose,
  onConfirm,
  label,
}: {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  label: string;
}) {
  const { t } = useApp();
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("Pašalinti įrašą?", "Delete record?")}
      centered
    >
      <Stack>
        <Group>
          <AlertTriangle color="#d93025" />
          <Text>{label}</Text>
        </Group>
        <Text size="sm" c="dimmed">
          {t(
            "Šis įrašas bus pašalintas. Jei įrašas naudojamas kituose moduliuose, pirmiausia reikės pašalinti jo ryšius.",
            "This record will be deleted. If other modules use this record, remove those links first.",
          )}
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {t("Atšaukti", "Cancel")}
          </Button>
          <Button
            color="red"
            leftSection={<Trash2 size={16} />}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {t("Pašalinti", "Delete")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
export function Surface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <Paper className={`surface ${className}`}>{children}</Paper>;
}
