import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Anchor,
  Badge,
  Button,
  Group,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import {
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";
import { notifications } from "@mantine/notifications";
import { useApp } from "../../../lib/i18n";
import { useDatabase, useSave } from "../api";
import { categoryLabels, money } from "../../../lib/types";
import {
  CategoryBadge,
  ConfirmDelete,
  DataTable,
  Empty,
  Loading,
  PageHeader,
  SearchField,
  StatusBadge,
  Surface,
} from "../../../components/ui";
import { EntityEditor } from "../../../components/EntityEditor";
export function Suppliers() {
  const { data: db } = useDatabase();
  const { t, lang } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [create, setCreate] = useState(false);
  if (!db) return <Loading />;
  const data = db.suppliers.filter(
    (x) =>
      (x.name + x.contact + x.email).toLowerCase().includes(q.toLowerCase()) &&
      (!category ||
        x.categories.includes(category as keyof typeof categoryLabels)),
  );
  return (
    <>
      <PageHeader
        eyebrow={t("PARTNERIŲ TINKLAS", "PARTNER NETWORK")}
        title={t("Tiekėjai ir subrangovai", "Suppliers & subcontractors")}
        description={t(
          "Patikimi partneriai kiekvienam statybos etapui.",
          "Reliable partners for every stage of construction.",
        )}
        actions={
          <Button
            leftSection={<Plus size={17} />}
            onClick={() => setCreate(true)}
          >
            {t("Naujas tiekėjas", "New supplier")}
          </Button>
        }
      />
      <div className="list-toolbar">
        <SearchField
          value={q}
          onChange={setQ}
          placeholder={t(
            "Ieškoti įmonės ar kontaktinio asmens",
            "Search company or contact",
          )}
        />
        <Select
          clearable
          value={category}
          onChange={setCategory}
          placeholder={t("Visos kategorijos", "All categories")}
          data={Object.entries(categoryLabels).map(([value, label]) => ({
            value,
            label: label[lang],
          }))}
        />
        <Text size="sm" c="dimmed">
          {data.length} {t("partneriai", "partners")}
        </Text>
      </div>
      <Surface>
        <DataTable
          data={data}
          onRowClick={(x) => navigate(`/suppliers/${x.id}`)}
          columns={[
            {
              accessorKey: "name",
              header: t("Įmonė", "Company"),
              cell: ({ row }) => (
                <div className="project-name-cell">
                  <span className="project-mini-icon">
                    <Building2 size={20} />
                  </span>
                  <div>
                    <Text size="sm" fw={500}>
                      {row.original.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t("Įm. kodas", "Company no.")}: {row.original.code}
                    </Text>
                  </div>
                </div>
              ),
            },
            {
              accessorKey: "contact",
              header: t("Kontaktinis asmuo", "Contact person"),
            },
            {
              accessorKey: "email",
              header: t("Kontaktai", "Contact details"),
              cell: ({ row }) => (
                <div>
                  <Text size="sm">{row.original.email}</Text>
                  <Text size="xs" c="dimmed">
                    {row.original.phone}
                  </Text>
                </div>
              ),
            },
            {
              id: "categories",
              header: t("Kategorijos", "Categories"),
              cell: ({ row }) => (
                <Group gap={4}>
                  {row.original.categories.map((c) => (
                    <CategoryBadge key={c} category={c} />
                  ))}
                </Group>
              ),
            },
          ]}
        />
      </Surface>
      {create && (
        <EntityEditor kind="supplier" onClose={() => setCreate(false)} />
      )}
    </>
  );
}
export function SupplierDetail() {
  const { id } = useParams();
  const { data: db } = useDatabase();
  const { t, lang } = useApp();
  const navigate = useNavigate();
  const save = useSave();
  const [edit, setEdit] = useState(false);
  const [remove, setRemove] = useState(false);
  if (!db) return <Loading />;
  const supplier = db.suppliers.find((x) => x.id === id);
  if (!supplier) return <Empty />;
  const contracts = db.contracts.filter((c) => c.supplierId === id);
  const tenders = db.tenders.filter((c) => c.supplierIds.includes(id || ""));
  const deleteSupplier = () => {
    if (
      contracts.length ||
      tenders.length ||
      db.tasks.some((x) => x.supplierId === id)
    ) {
      notifications.show({
        title: t("Tiekėjas naudojamas", "Supplier is in use"),
        message: t(
          "Pirmiausia pašalinkite tiekėjo ryšius su konkursais, sutartimis ir užduotimis.",
          "First remove supplier links from tenders, contracts and tasks.",
        ),
        color: "red",
      });
      return;
    }
    save.mutate(
      (d) => ({ ...d, suppliers: d.suppliers.filter((x) => x.id !== id) }),
      { onSuccess: () => navigate("/suppliers") },
    );
  };
  return (
    <>
      <Button
        variant="subtle"
        color="gray"
        size="xs"
        mb="md"
        leftSection={<ArrowLeft size={14} />}
        onClick={() => navigate("/suppliers")}
      >
        {t("Visi tiekėjai", "All suppliers")}
      </Button>
      <PageHeader
        title={supplier.name}
        description={`${t("Įmonės kodas", "Company registration no.")} ${supplier.code}`}
        actions={
          <Button
            variant="default"
            onClick={() => setEdit(true)}
            leftSection={<Pencil size={16} />}
          >
            {t("Redaguoti", "Edit")}
          </Button>
        }
      />
      <div className="detail-summary">
        {supplier.categories.map((c) => (
          <CategoryBadge key={c} category={c} />
        ))}
      </div>
      <div className="detail-two-columns">
        <Surface>
          <div className="section-heading">
            <Text className="section-title">
              {t("Kontaktai", "Contact details")}
            </Text>
          </div>
          <Stack p="lg">
            <Group>
              <UserRound size={17} />
              <Text size="sm">{supplier.contact}</Text>
            </Group>
            <Group>
              <Mail size={17} />
              <Anchor size="sm" href={`mailto:${supplier.email}`}>
                {supplier.email}
              </Anchor>
            </Group>
            <Group>
              <Phone size={17} />
              <Anchor size="sm" href={`tel:${supplier.phone}`}>
                {supplier.phone}
              </Anchor>
            </Group>
            <Group>
              <MapPin size={17} />
              <Text size="sm">{supplier.address}</Text>
            </Group>
          </Stack>
        </Surface>
        <Surface>
          <div className="section-heading">
            <Text className="section-title">
              {t("Bendradarbiavimo apžvalga", "Collaboration overview")}
            </Text>
          </div>
          <Group p="lg" justify="space-around">
            <div>
              <Text size="30px">{tenders.length}</Text>
              <Text size="sm" c="dimmed">
                {t("Konkursai", "Tenders")}
              </Text>
            </div>
            <div>
              <Text size="30px">{contracts.length}</Text>
              <Text size="sm" c="dimmed">
                {t("Sutartys", "Contracts")}
              </Text>
            </div>
            <div>
              <Text size="30px">
                {money(contracts.reduce((s, c) => s + c.amount, 0))}
              </Text>
              <Text size="sm" c="dimmed">
                {t("Sutarčių vertė", "Contract value")}
              </Text>
            </div>
          </Group>
        </Surface>
      </div>
      <Surface>
        <div className="section-heading">
          <Text className="section-title">
            {t("Susijusios sutartys", "Related contracts")}
          </Text>
          <Badge color="gray">{contracts.length}</Badge>
        </div>
        <DataTable
          data={contracts}
          onRowClick={(c) => navigate(`/contracts/${c.id}`)}
          columns={[
            { accessorKey: "number", header: t("Sutartis", "Contract") },
            {
              accessorFn: (c) => c.name[lang],
              header: t("Pavadinimas", "Name"),
            },
            {
              accessorKey: "amount",
              header: t("Vertė", "Value"),
              cell: ({ row }) => money(row.original.amount),
            },
            {
              accessorKey: "status",
              header: t("Būsena", "Status"),
              cell: ({ row }) => <StatusBadge status={row.original.status} />,
            },
          ]}
        />
      </Surface>
      <Button
        color="red"
        variant="subtle"
        size="xs"
        mt="lg"
        leftSection={<Trash2 size={14} />}
        onClick={() => setRemove(true)}
      >
        {t("Pašalinti tiekėją", "Delete supplier")}
      </Button>
      {edit && (
        <EntityEditor kind="supplier" id={id} onClose={() => setEdit(false)} />
      )}
      <ConfirmDelete
        opened={remove}
        onClose={() => setRemove(false)}
        label={supplier.name}
        onConfirm={deleteSupplier}
      />
    </>
  );
}
