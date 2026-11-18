import { useDatabase } from "../../../lib/store";
export { useDatabase, useSave } from "../../../lib/store";
export function useSuppliers() {
  const query = useDatabase();
  return { ...query, data: query.data?.suppliers };
}
