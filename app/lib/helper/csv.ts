const BOM = "﻿";
const SEPARATOR = ";";

const escapeCell = (value: string): string =>
  /[";\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

export const toCsv = (rows: (string | number)[][]): string =>
  BOM +
  rows
    .map((row) => row.map((cell) => escapeCell(String(cell))).join(SEPARATOR))
    .join("\r\n");

/** Formats an amount the way German Excel expects a number: "1234,50". */
export const toCsvNumber = (value: number): string => value.toFixed(2).replace(".", ",");

export const downloadCsv = (fileName: string, content: string): void => {
  const blob = new Blob([content], {type: "text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
