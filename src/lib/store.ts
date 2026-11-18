import {
  QueryClient,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import type { Database } from "./types";
import { seed } from "../features/projects/fixtures/seed";
import { useApp } from "./i18n";
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: Infinity, retry: 1 } },
});
const KEY = "sr.database.v3";
function read(): Database {
  try {
    const data = localStorage.getItem(KEY);
    if (data) return JSON.parse(data) as Database;
  } catch {
    /* Recover a corrupt local demo state. */
  }
  const db = seed();
  localStorage.setItem(KEY, JSON.stringify(db));
  return db;
}
let database = read();
export function useDatabase() {
  return useQuery({
    queryKey: ["database"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 180));
      return database;
    },
  });
}
export type Update = (db: Database) => Database;
export function useSave() {
  const qc = useQueryClient();
  const { t } = useApp();
  const mutation = useMutation({
    mutationFn: async (update: Update) => {
      const next = update(structuredClone(database));
      localStorage.setItem(KEY, JSON.stringify(next));
      database = next;
      return next;
    },
    onSuccess: (next) => {
      qc.setQueryData(["database"], next);
      notifications.show({
        title: t("Išsaugota", "Saved"),
        message: t(
          "Pakeitimai sėkmingai išsaugoti.",
          "Your changes have been saved.",
        ),
        color: "green",
      });
    },
    onError: () =>
      notifications.show({
        title: t("Nepavyko išsaugoti", "Could not save"),
        message: t(
          "Vietinė atmintis pilna. Pašalinkite didelius priedus ir bandykite dar kartą.",
          "Local storage is full. Remove large attachments and try again.",
        ),
        color: "red",
      }),
  });
  return mutation;
}
export function cascadeProject(db: Database, id: string): Database {
  return {
    ...db,
    projects: db.projects.filter((x) => x.id !== id),
    works: db.works.filter((x) => x.projectId !== id),
    processes: db.processes.filter((x) => x.projectId !== id),
    tasks: db.tasks.filter((x) => x.projectId !== id),
    tenders: db.tenders.filter((x) => x.projectId !== id),
    contracts: db.contracts.filter((x) => x.projectId !== id),
    documents: db.documents.filter((x) => x.projectId !== id),
    handovers: db.handovers.filter((x) => x.projectId !== id),
  };
}
