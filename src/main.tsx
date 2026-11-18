import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Link, Route, Routes } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  Button,
  createTheme,
  MantineProvider,
  Paper,
  Stack,
  Text,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./styles.css";
import { AppProvider, useApp } from "./lib/i18n";
import { queryClient } from "./lib/store";
import { AppShell } from "./components/AppShell";
import { Dashboard } from "./features/dashboard/pages/Dashboard";
import { Projects } from "./features/projects/pages/Projects";
import { ProjectWorkspace } from "./features/projects/pages/ProjectWorkspace";
import { Planning } from "./features/planning/pages/Planning";
import { Tasks } from "./features/tasks/pages/Tasks";
import { Tenders, TenderDetail } from "./features/tenders/pages/Tenders";
import {
  Suppliers,
  SupplierDetail,
} from "./features/suppliers/pages/Suppliers";
import {
  Contracts,
  ContractDetail,
} from "./features/contracts/pages/Contracts";
import { Documents } from "./features/documents/pages/Documents";
import { Handover } from "./features/handover/pages/Handover";
import { Users } from "./features/users/pages/Users";
const theme = createTheme({
  fontFamily: '"SR Roboto", "Segoe UI", Arial, sans-serif',
  headings: {
    fontFamily: '"SR Roboto", "Segoe UI", Arial, sans-serif',
    fontWeight: "400",
  },
  primaryColor: "blue",
  primaryShade: 6,
  colors: {
    blue: [
      "#e8f0fe",
      "#d2e3fc",
      "#aecbfa",
      "#8ab4f8",
      "#669df6",
      "#4285f4",
      "#1a73e8",
      "#1967d2",
      "#185abc",
      "#174ea6",
    ],
  },
  defaultRadius: 4,
  components: {
    Button: Button.extend({ defaultProps: { fw: 500, radius: 4 } }),
    Paper: Paper.extend({ defaultProps: { radius: 4 } }),
  },
});
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? <ErrorFallback /> : this.props.children;
  }
}
function ErrorFallback() {
  const { t } = useApp();
  return (
    <Stack p={50}>
      <Text size="xl">
        {t("Nepavyko atidaryti puslapio", "Could not open page")}
      </Text>
      <Button onClick={() => window.location.assign(window.location.pathname + '#/')}>
        {t("Grįžti į pradžią", "Back to overview")}
      </Button>
    </Stack>
  );
}
function NotFound() {
  const { t } = useApp();
  return (
    <Stack align="center" p={60}>
      <Text size="30px">404</Text>
      <Text>{t("Puslapis nerastas", "Page not found")}</Text>
      <Button component={Link} to="/">
        {t("Grįžti", "Go back")}
      </Button>
    </Stack>
  );
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <Notifications position="bottom-right" />
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <ErrorBoundary>
            <HashRouter>
              <Routes>
                <Route element={<AppShell />}>
                  <Route index element={<Dashboard />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="projects/:id" element={<ProjectWorkspace />} />
                  <Route path="planning" element={<Planning />} />
                  <Route path="tasks" element={<Tasks />} />
                  <Route path="tenders" element={<Tenders />} />
                  <Route path="tenders/:id" element={<TenderDetail />} />
                  <Route path="suppliers" element={<Suppliers />} />
                  <Route path="suppliers/:id" element={<SupplierDetail />} />
                  <Route path="contracts" element={<Contracts />} />
                  <Route path="contracts/:id" element={<ContractDetail />} />
                  <Route path="documents" element={<Documents />} />
                  <Route path="handover" element={<Handover />} />
                  <Route path="users" element={<Users />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </HashRouter>
          </ErrorBoundary>
        </AppProvider>
      </QueryClientProvider>
    </MantineProvider>
  </React.StrictMode>,
);
