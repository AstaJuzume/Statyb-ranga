import { useDatabase } from "../../../lib/store";
export { useDatabase, useSave } from "../../../lib/store";
export function useDocuments() {
  const query = useDatabase();
  return { ...query, data: query.data?.documents };
}
