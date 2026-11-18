import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Drawer,
  Group,
  Menu,
  Modal,
  ScrollArea,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Search,
  Menu as MenuIcon,
  HardHat,
  HelpCircle,
  ArrowUpRight,
  Check,
  UserRound,
  Clock,
  Building2,
} from "lucide-react";
import { navigation } from "../config/routes";
import { useApp } from "../lib/i18n";
import { useDatabase } from "../lib/store";
import { roleLabels, overdue, type Role } from "../lib/types";
import { Initials, Loading } from "./ui";
export function AppShell() {
  const { lang, setLang, t, role, setRole, personId, setPersonId } = useApp();
  const { data: db, isError } = useDatabase();
  const [mobile, setMobile] = useState(false);
  const [switcher, setSwitcher] = useState(false);
  const [help, setHelp] = useState(false);
  const [alerts, setAlerts] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
  if (!db)
    return isError ? (
      <Text p={40}>
        {t(
          "Duomenų įkelti nepavyko. Atnaujinkite puslapį.",
          "Could not load data. Refresh the page.",
        )}
      </Text>
    ) : (
      <Loading />
    );
  const user = db.people.find((p) => p.id === personId) || db.people[0];
  const nav = navigation.filter((n) => n.path !== "/users" || role === "admin");
  const active =
    nav.find((n) => n.path !== "/" && location.pathname.startsWith(n.path)) ||
    nav[0];
  const late = [
    ...db.processes.map((x) => ({ ...x, entity: "processes" })),
    ...db.tasks.map((x) => ({ ...x, entity: "tasks" })),
  ]
    .filter(
      (x) =>
        overdue(x.deadline, x.status) &&
        (role === "admin" ||
          role === "procurement" ||
          x.assigneeId === personId),
    )
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
  const sidebar = (
    <div className="sidebar-inner">
      <NavLink to="/" className="brand" onClick={() => setMobile(false)}>
        <span className="brand-mark">
          <HardHat size={23} strokeWidth={1.7} />
        </span>
        <div>
          <strong>Statybų rangos įmonė</strong>
          <span>
            {t("Statybos projektų valdymas", "Construction project management")}
          </span>
        </div>
      </NavLink>
      <div className="workspace-label">
        {t("DARBO ERDVĖ", "WORKSPACE")}
        <Badge size="xs" color="gray" variant="light">
          DEMO
        </Badge>
      </div>
      <nav>
        {nav.map((n, i) => (
          <NavLink
            key={n.path}
            to={n.path}
            end={n.path === "/"}
            onClick={() => setMobile(false)}
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""} ${i === 4 ? "section-start" : ""}`
            }
          >
            <n.icon size={19} strokeWidth={1.65} />
            <span>
              {n.path === "/tasks" && role === "worker"
                ? t("Mano darbai", "My work")
                : t(n.lt, n.en)}
            </span>
            {n.path === "/projects" && <small>{db.projects.length}</small>}
            {n.path === "/contracts" &&
              db.contracts.filter((c) => c.status === "review").length > 0 && (
                <small className="count-blue">
                  {db.contracts.filter((c) => c.status === "review").length}
                </small>
              )}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="demo-tip">
          <span className="live-dot" />
          <Text size="xs">
            {t("Demonstracinė darbo erdvė", "Demo workspace")}
          </Text>
        </div>
        <SegmentedControl
          value={lang}
          onChange={(v) => setLang(v as "lt" | "en")}
          fullWidth
          data={[
            { value: "lt", label: "Lietuvių" },
            { value: "en", label: "English" },
          ]}
          size="xs"
        />
        <Menu position="top-start" width={260} shadow="md">
          <Menu.Target>
            <UnstyledButton className="user-button">
              <Initials name={user.name} size={36} />
              <div>
                <Text size="sm" fw={500}>
                  {user.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {roleLabels[role][lang]}
                </Text>
              </div>
              <ChevronDown size={15} />
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>
              {t("Demonstracinis naudotojas", "Demo user")}
            </Menu.Label>
            <Menu.Item
              leftSection={<UserRound size={16} />}
              onClick={() => setSwitcher(true)}
            >
              {t("Peržiūrėti sistemą kaip", "View the system as")}
            </Menu.Item>
            <Menu.Item
              leftSection={<HelpCircle size={16} />}
              onClick={() => setHelp(true)}
            >
              {t("Apie prototipą", "About this prototype")}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>
    </div>
  );
  return (
    <div className={`app-shell ${role === "worker" ? "worker-mode" : ""}`}>
      <aside className="sidebar">{sidebar}</aside>
      <Drawer
        opened={mobile}
        onClose={() => setMobile(false)}
        withCloseButton={false}
        size={270}
        padding={0}
        classNames={{ body: "mobile-sidebar" }}
      >
        {sidebar}
      </Drawer>
      <div className="app-body">
        <header className="topbar">
          <Group gap={12}>
            <ActionIcon
              className="mobile-menu"
              variant="subtle"
              color="gray"
              onClick={() => setMobile(true)}
              aria-label={t("Atidaryti meniu", "Open menu")}
            >
              <MenuIcon size={22} />
            </ActionIcon>
            <Text size="sm" c="dimmed" className="breadcrumb">
              {t("Darbo erdvė", "Workspace")}
              <ChevronRight size={14} />
              <span>{t(active.lt, active.en)}</span>
            </Text>
          </Group>
          <Group gap={12} wrap="nowrap">
            <UnstyledButton
              className="global-search"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={17} />
              <span>{t("Ieškoti darbo erdvėje", "Search workspace")}</span>
              <kbd>⌘ K</kbd>
            </UnstyledButton>
            <Tooltip label={t("Pagalba", "Help")}>
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => setHelp(true)}
                aria-label={t("Pagalba", "Help")}
              >
                <HelpCircle size={20} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t("Pranešimai", "Notifications")}>
              <ActionIcon
                variant="subtle"
                color="gray"
                className="notification-icon"
                onClick={() => setAlerts(true)}
                aria-label={t("Pranešimai", "Notifications")}
              >
                <Bell size={20} />
                {late.length > 0 && <i />}
              </ActionIcon>
            </Tooltip>
            <Avatar
              size={32}
              radius="xl"
              color="blue"
              onClick={() => setSwitcher(true)}
              style={{ cursor: "pointer" }}
            >
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </Avatar>
          </Group>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>© 2026 · Statybų rangos įmonė</span>
          <span>
            {t(
              "Visi duomenys yra demonstraciniai",
              "All data is for demonstration",
            )}
          </span>
        </footer>
      </div>
      <Modal
        opened={switcher}
        onClose={() => setSwitcher(false)}
        title={t("Peržiūrėti sistemą kaip", "View the system as")}
        centered
      >
        <Stack>
          <Text size="sm" c="dimmed">
            {t(
              "Pasirinkite rolę ir darbuotoją, kad išbandytumėte jo darbo erdvę.",
              "Choose a role and person to explore their workspace.",
            )}
          </Text>
          <Select
            label={t("Rolė", "Role")}
            data={Object.entries(roleLabels).map(([value, label]) => ({
              value,
              label: label[lang],
            }))}
            value={role}
            onChange={(v) => {
              if (v) {
                setRole(v as Role);
                const p = db.people.find((p) => p.role === v);
                if (p) setPersonId(p.id);
              }
            }}
          />
          <Select
            label={t("Darbuotojas", "Person")}
            data={db.people
              .filter((p) => p.role === role)
              .map((p) => ({ value: p.id, label: p.name }))}
            value={personId}
            onChange={(v) => v && setPersonId(v)}
          />
          <Button
            onClick={() => {
              setSwitcher(false);
              navigate(role === "worker" ? "/tasks" : "/");
            }}
          >
            {t("Atidaryti darbo erdvę", "Open workspace")}
          </Button>
        </Stack>
      </Modal>
      <Modal
        opened={help}
        onClose={() => setHelp(false)}
        title={t(
          "Jūsų statybų valdymo darbo erdvė",
          "Your construction management workspace",
        )}
        centered
      >
        <Stack>
          <Text size="sm">
            {t(
              "Projektas → sąmata → procesai → konkursas → sutartis → pridavimas. Visas darbų ciklas vienoje vietoje.",
              "Project → estimate → processes → tender → contract → handover. The complete construction workflow in one place.",
            )}
          </Text>
          <Text size="sm">
            {t(
              "Duomenys saugomi šioje naršyklėje. Laiškų siuntimas, Excel importas ir Dokobit pasirašymas yra simuliuojami. Failai iki 1 MB išsaugomi kartu su įrašais.",
              "Data is saved in this browser. Email sending, Excel import, and Dokobit signing are simulated. Files up to 1 MB are stored with their records.",
            )}
          </Text>
          <Text size="sm">
            {t("Demonstracinė atskaitos data", "Demo reference date")}:
            2026-11-18
          </Text>
          <Button
            variant="light"
            onClick={() => {
              setHelp(false);
              navigate("/planning");
            }}
            rightSection={<ArrowUpRight size={16} />}
          >
            {t("Išbandyti planavimą", "Explore planning")}
          </Button>
        </Stack>
      </Modal>
      <Drawer
        opened={alerts}
        onClose={() => setAlerts(false)}
        title={t("Reikia jūsų dėmesio", "Needs your attention")}
        position="right"
      >
        <Stack>
          {late.length === 0 ? (
            <Group>
              <Check color="green" />
              <Text>{t("Vėluojančių darbų nėra", "No overdue work")}</Text>
            </Group>
          ) : (
            late.slice(0, 15).map((x) => (
              <UnstyledButton
                key={x.id}
                className="alert-item"
                onClick={() => {
                  navigate(
                    `/${x.entity === "tasks" ? "tasks" : "planning"}?detail=${x.id}`,
                  );
                  setAlerts(false);
                }}
              >
                <Group justify="space-between">
                  <Text size="sm" fw={500}>
                    {x.name[lang]}
                  </Text>
                  <Badge color="red" size="xs">
                    {x.deadline}
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed">
                  {db.projects.find((p) => p.id === x.projectId)?.name[lang]}
                </Text>
              </UnstyledButton>
            ))
          )}
        </Stack>
      </Drawer>
      <Modal
        opened={searchOpen}
        onClose={() => setSearchOpen(false)}
        title={t("Paieška darbo erdvėje", "Search workspace")}
        size="lg"
      >
        <TextInput
          autoFocus
          leftSection={<Search size={17} />}
          placeholder={t(
            "Projektas, užduotis, tiekėjas…",
            "Project, task, supplier…",
          )}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ScrollArea h={400} mt="md">
          <Stack gap={4}>
            {search.trim().length < 2 ? (
              <Text c="dimmed" size="sm" p="md">
                {t(
                  "Įveskite bent 2 simbolius.",
                  "Enter at least 2 characters.",
                )}
              </Text>
            ) : (
              [
                ...db.projects.map((p) => ({
                  id: p.id,
                  title: p.name[lang],
                  type: t("Projektas", "Project"),
                  url: `/projects/${p.id}`,
                  icon: Building2,
                })),
                ...db.tasks.map((p) => ({
                  id: p.id,
                  title: p.name[lang],
                  type: t("Užduotis", "Task"),
                  url: `/tasks?detail=${p.id}`,
                  icon: Clock,
                })),
                ...db.suppliers.map((p) => ({
                  id: p.id,
                  title: p.name,
                  type: t("Tiekėjas", "Supplier"),
                  url: `/suppliers/${p.id}`,
                  icon: UserRound,
                })),
              ]
                .filter((x) =>
                  x.title
                    .toLocaleLowerCase()
                    .includes(search.toLocaleLowerCase()),
                )
                .map((x) => (
                  <UnstyledButton
                    key={x.id}
                    className="search-result"
                    onClick={() => {
                      setSearchOpen(false);
                      navigate(x.url);
                    }}
                  >
                    <x.icon size={19} />
                    <div>
                      <Text size="sm">{x.title}</Text>
                      <Text size="xs" c="dimmed">
                        {x.type}
                      </Text>
                    </div>
                    <ChevronRight size={16} />
                  </UnstyledButton>
                ))
            )}
          </Stack>
        </ScrollArea>
      </Modal>
    </div>
  );
}
