import type ExcelJS from "exceljs";
import type { RoadmapItem } from "./types";
import { derivedState, formatDate } from "./calculations";
import { clientRemark } from "./share";

export const CLIENT_ROADMAP_EXPORT_COLUMNS = [
  { key: "id", label: "ID" },
  { key: "module", label: "Module" },
  { key: "feature", label: "Feature" },
  { key: "priority", label: "Priority" },
  { key: "sprint", label: "Sprint" },
  { key: "etaStaging", label: "ETA Staging" },
  { key: "etaProduction", label: "ETA Production" },
  { key: "businessStatus", label: "Business Status" },
  { key: "deliveryStatus", label: "Delivery Status" },
  { key: "status", label: "Overall Status" },
  { key: "remarks", label: "Notes" },
] as const;

const COL_COUNT = CLIENT_ROADMAP_EXPORT_COLUMNS.length;

/** Brand-aligned palette (logo purple / slate). */
const C = {
  titleBg: "FF763291",
  titleText: "FFFFFFFF",
  metaBg: "FFF6F0FA",
  metaText: "FF4A205A",
  headerBg: "FF4A205A",
  headerText: "FFFFFFFF",
  rowEven: "FFFFFFFF",
  rowOdd: "FFF8FAFC",
  border: "FFE2E8F0",
  text: "FF0F172A",
  muted: "FF64748B",
} as const;

const STATUS_FILL: Record<string, string> = {
  Completed: "FFD1FAE5",
  "In Progress": "FFDBEAFE",
  Blocked: "FFFEE2E2",
  Delayed: "FFFEF3C7",
  Planned: "FFF1F5F9",
};

const PRIORITY_FILL: Record<string, string> = {
  High: "FFFEE2E2",
  Medium: "FFFEF3C7",
  Low: "FFE0F2FE",
};

function cellValue(item: RoadmapItem, key: (typeof CLIENT_ROADMAP_EXPORT_COLUMNS)[number]["key"]) {
  switch (key) {
    case "etaStaging":
      return formatDate(item.etaStaging) || "—";
    case "etaProduction":
      return formatDate(item.etaProduction) || "—";
    case "status":
      return derivedState(item);
    case "remarks":
      return clientRemark(item.remarks) || "—";
    default:
      return String(item[key] ?? "") || "—";
  }
}

export interface ClientRoadmapExportFilters {
  search: string;
  module: string;
  sprint: string;
  status: string;
}

function filterSummaryLine(filters: ClientRoadmapExportFilters) {
  const parts: string[] = [];
  if (filters.module !== "all") parts.push(`Module: ${filters.module}`);
  if (filters.sprint !== "all") parts.push(`Sprint: ${filters.sprint}`);
  if (filters.status !== "all") parts.push(`Status: ${filters.status}`);
  if (filters.search.trim()) parts.push(`Search: "${filters.search.trim()}"`);
  return parts.length ? `Filters: ${parts.join(" · ")}` : "Filters: none (full roadmap)";
}

function safeFilePart(value: string) {
  return value.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "roadmap";
}

function setBorder(cell: ExcelJS.Cell) {
  const edge = { style: "thin" as const, color: { argb: C.border } };
  cell.border = { top: edge, left: edge, bottom: edge, right: edge };
}

function mergeRow(sheet: ExcelJS.Worksheet, row: number, fillArgb: string, height: number) {
  sheet.mergeCells(row, 1, row, COL_COUNT);
  sheet.getRow(row).height = height;
  const cell = sheet.getCell(row, 1);
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillArgb } };
  setBorder(cell);
  return cell;
}

const COLUMN_WIDTHS = [12, 20, 38, 11, 12, 14, 16, 18, 18, 14, 32];

/** Styled .xlsx export for filtered client-view roadmap data. */
export async function exportClientRoadmapExcel(options: {
  title: string;
  items: RoadmapItem[];
  filters: ClientRoadmapExportFilters;
  clientName?: string;
}) {
  const { default: ExcelJSModule } = await import("exceljs");
  const exportedAt = new Date().toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const workbook = new ExcelJSModule.Workbook();
  workbook.creator = "DTP Roadmap";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Roadmap", {
    views: [{ showGridLines: false, state: "frozen", ySplit: 5 }],
  });

  COLUMN_WIDTHS.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });

  const titleCell = mergeRow(sheet, 1, C.titleBg, 40);
  titleCell.value = options.title;
  titleCell.font = { name: "Calibri", size: 18, bold: true, color: { argb: C.titleText } };
  titleCell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };

  const metaCell = mergeRow(sheet, 2, C.metaBg, 22);
  metaCell.value = `Exported ${exportedAt}  ·  ${options.items.length} item(s)`;
  metaCell.font = { name: "Calibri", size: 11, color: { argb: C.metaText } };
  metaCell.alignment = { vertical: "middle", horizontal: "center" };

  const filterCell = mergeRow(sheet, 3, C.metaBg, 22);
  filterCell.value = filterSummaryLine(options.filters);
  filterCell.font = { name: "Calibri", size: 10, italic: true, color: { argb: C.muted } };
  filterCell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };

  sheet.getRow(4).height = 8;

  const headerRowIndex = 5;
  const headerRow = sheet.getRow(headerRowIndex);
  headerRow.height = 26;
  CLIENT_ROADMAP_EXPORT_COLUMNS.forEach((col, colIdx) => {
    const cell = headerRow.getCell(colIdx + 1);
    cell.value = col.label;
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: C.headerText } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.headerBg } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    setBorder(cell);
  });

  const statusColIndex =
    CLIENT_ROADMAP_EXPORT_COLUMNS.findIndex((c) => c.key === "status") + 1;
  const priorityColIndex =
    CLIENT_ROADMAP_EXPORT_COLUMNS.findIndex((c) => c.key === "priority") + 1;

  options.items.forEach((item, rowOffset) => {
    const rowIndex = headerRowIndex + 1 + rowOffset;
    const row = sheet.getRow(rowIndex);
    row.height = 22;
    const stripe = rowOffset % 2 === 0 ? C.rowEven : C.rowOdd;

    CLIENT_ROADMAP_EXPORT_COLUMNS.forEach((col, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      const value = cellValue(item, col.key);
      cell.value = value;
      cell.font = { name: "Calibri", size: 10, color: { argb: C.text } };
      cell.alignment = {
        vertical: "middle",
        horizontal: col.key === "feature" || col.key === "remarks" ? "left" : "center",
        wrapText: col.key === "feature" || col.key === "remarks",
      };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: stripe } };
      setBorder(cell);

      if (colIdx + 1 === statusColIndex && STATUS_FILL[value]) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: STATUS_FILL[value]! } };
        cell.font = { ...cell.font, bold: true };
      }
      if (colIdx + 1 === priorityColIndex && PRIORITY_FILL[value]) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIORITY_FILL[value]! } };
      }
    });
  });

  if (options.items.length === 0) {
    const emptyRow = sheet.getRow(headerRowIndex + 1);
    sheet.mergeCells(headerRowIndex + 1, 1, headerRowIndex + 1, COL_COUNT);
    const cell = emptyRow.getCell(1);
    cell.value = "No items match the current filters.";
    cell.font = { name: "Calibri", size: 11, italic: true, color: { argb: C.muted } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.rowOdd } };
    setBorder(cell);
    emptyRow.height = 28;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const datePart = new Date().toISOString().slice(0, 10);
  const namePart = options.clientName ? safeFilePart(options.clientName) : "client";
  const fileName = `dtp-roadmap-${namePart}-${datePart}.xlsx`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
