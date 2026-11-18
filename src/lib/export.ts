export async function exportWorkbook(
  rows: Record<string, string | number>[],
  name: string,
) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(rows),
    name.slice(0, 31),
  );
  XLSX.writeFile(workbook, `${name.replaceAll(" ", "_")}.xlsx`);
}
