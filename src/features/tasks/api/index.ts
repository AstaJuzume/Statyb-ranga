import { useDatabase } from "../../../lib/store";
export { useDatabase, useSave } from "../../../lib/store";
export function useTasks() {
  const query = useDatabase();
  return { ...query, data: query.data?.tasks };
}
