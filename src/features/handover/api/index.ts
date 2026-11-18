import { useDatabase } from "../../../lib/store";
export { useDatabase, useSave } from "../../../lib/store";
export function useHandover() {
  const query = useDatabase();
  return { ...query, data: query.data?.handovers };
}
