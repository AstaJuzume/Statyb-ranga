import { useDatabase } from "../../../lib/store";
export { useDatabase, useSave } from "../../../lib/store";
export function usePlanning() {
  const query = useDatabase();
  return { ...query, data: query.data?.processes };
}
