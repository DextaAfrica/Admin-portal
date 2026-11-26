import * as zlib from "zlib";

function escapeXml(str: string): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapePdfText(str: string): string {
  return String(str ?? "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function colLetter(index: number): string {
  let col = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    n = Math.floor((n - 1) / 26);
  }
  return col;
}

/**
 * Minimal, standards-compliant ZIP builder using Node built-in zlib.
 */
function buildZip(entries: Array<{ name: string; content: Buffer }>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, "utf8");
    const uncompressed = entry.content;
    const compressed = zlib.deflateRawSync(uncompressed);
    const crc = zlib.crc32(uncompressed);

    // Local file header (30 bytes + name)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0, 6); // flags
    localHeader.writeUInt16LE(8, 8); // compression method: deflate
    localHeader.writeUInt16LE(0, 10); // mod time
    localHeader.writeUInt16LE(0, 12); // mod date
    localHeader.writeUInt32LE(crc >>> 0, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(uncompressed.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra length

    localParts.push(localHeader, nameBuf, compressed);

    // Central directory header (46 bytes + name)
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0, 8); // flags
    centralHeader.writeUInt16LE(8, 10); // deflate
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc >>> 0, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(uncompressed.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDir, eocd]);
}

export interface XlsxSheetInput {
  name: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
}

/**
 * Generates a real, multi-sheet OpenXML `.xlsx` Excel workbook buffer.
 */
export function buildXlsxBuffer(sheets: XlsxSheetInput[]): Buffer {
  const safeSheets = sheets.map((s, idx) => ({
    ...s,
    safeName: s.name.replace(/[\\/*?:[\]]/g, "").slice(0, 31) || `Sheet${idx + 1}`,
  }));

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${safeSheets
    .map(
      (_, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    )
    .join("\n  ")}
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${safeSheets
      .map(
        (s, i) =>
          `<sheet name="${escapeXml(s.safeName)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`
      )
      .join("\n    ")}
  </sheets>
</workbook>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${safeSheets
    .map(
      (_, i) =>
        `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
    )
    .join("\n  ")}
  <Relationship Id="rId${safeSheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0F172A"/></patternFill></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
  </cellXfs>
</styleSheet>`;

  const entries: Array<{ name: string; content: Buffer }> = [
    { name: "[Content_Types].xml", content: Buffer.from(contentTypesXml, "utf8") },
    { name: "_rels/.rels", content: Buffer.from(rootRelsXml, "utf8") },
    { name: "xl/workbook.xml", content: Buffer.from(workbookXml, "utf8") },
    { name: "xl/_rels/workbook.xml.rels", content: Buffer.from(workbookRelsXml, "utf8") },
    { name: "xl/styles.xml", content: Buffer.from(stylesXml, "utf8") },
  ];

  safeSheets.forEach((sheet, idx) => {
    const allRows = [sheet.headers, ...sheet.rows];
    const colsXml = sheet.headers
      .map((_, cIdx) => `<col min="${cIdx + 1}" max="${cIdx + 1}" width="24" customWidth="1"/>`)
      .join("");

    const rowsXml = allRows
      .map((row, rIdx) => {
        const isHeader = rIdx === 0;
        const cells = row
          .map((val, cIdx) => {
            const ref = `${colLetter(cIdx)}${rIdx + 1}`;
            const styleAttr = isHeader ? ` s="1"` : "";
            if (typeof val === "number" && Number.isFinite(val)) {
              return `<c r="${ref}"${styleAttr}><v>${val}</v></c>`;
            }
            return `<c r="${ref}" t="inlineStr"${styleAttr}><is><t>${escapeXml(
              String(val ?? "")
            )}</t></is></c>`;
          })
          .join("");
        return `<row r="${rIdx + 1}">${cells}</row>`;
      })
      .join("\n");

    const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${colsXml}</cols>
  <sheetData>
    ${rowsXml}
  </sheetData>
</worksheet>`;

    entries.push({
      name: `xl/worksheets/sheet${idx + 1}.xml`,
      content: Buffer.from(sheetXml, "utf8"),
    });
  });

  return buildZip(entries);
}

/**
 * Generates a real, multi-page PDF 1.4 executive report buffer.
 * Landscape A4 (842 x 595 pt) for clean multi-column data logs.
 */
export function buildPdfBuffer(options: {
  title: string;
  subtitle: string;
  headers: string[];
  rows: string[][];
}): Buffer {
  const PAGE_W = 842;
  const PAGE_H = 595;
  const MARGIN = 36;
  const ROWS_PER_PAGE = 26;

  const colCount = Math.max(1, options.headers.length);
  const usableW = PAGE_W - MARGIN * 2;
  const colW = usableW / colCount;
  const maxChars = Math.max(10, Math.floor(colW / 5.2));

  const chunks: string[][][] = [];
  for (let i = 0; i < options.rows.length; i += ROWS_PER_PAGE) {
    chunks.push(options.rows.slice(i, i + ROWS_PER_PAGE));
  }
  if (chunks.length === 0) chunks.push([]);

  const objects: string[] = [];
  const addObj = (body: string) => {
    objects.push(body);
    return objects.length; // 1-based object id
  };

  // Reserve 1: Catalog, 2: Pages, 3: Font Regular, 4: Font Bold
  const catalogId = addObj(""); // placeholder
  const pagesId = addObj(""); // placeholder
  const fontRegularId = addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBoldId = addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  const pageIds: number[] = [];

  chunks.forEach((pageRows, pageIdx) => {
    const ops: string[] = [];

    // Header bar
    ops.push("0.06 0.09 0.16 rg");
    ops.push(`0 ${PAGE_H - 64} ${PAGE_W} 64 re f`);
    ops.push("0.86 0.15 0.15 rg");
    ops.push(`0 ${PAGE_H - 67} ${PAGE_W} 3 re f`);

    // Title
    ops.push("BT");
    ops.push(`/F2 14 Tf 1 1 1 rg ${MARGIN} ${PAGE_H - 30} Td (${escapePdfText(options.title)}) Tj`);
    ops.push("ET");

    // Subtitle
    ops.push("BT");
    ops.push(`/F1 9 Tf 0.8 0.84 0.9 rg ${MARGIN} ${PAGE_H - 48} Td (${escapePdfText(options.subtitle)}) Tj`);
    ops.push("ET");

    // Table Header Bar
    const headerY = PAGE_H - 96;
    ops.push("0.95 0.96 0.98 rg");
    ops.push(`${MARGIN} ${headerY - 6} ${usableW} 20 re f`);
    ops.push("0.06 0.09 0.16 rg");

    options.headers.forEach((h, cIdx) => {
      const x = MARGIN + cIdx * colW + 4;
      const label = h.length > maxChars ? h.slice(0, maxChars - 1) + "." : h;
      ops.push(`BT /F2 8 Tf ${x.toFixed(1)} ${headerY} Td (${escapePdfText(label)}) Tj ET`);
    });

    // Data rows
    pageRows.forEach((row, rIdx) => {
      const y = headerY - 22 - rIdx * 17;
      if (rIdx % 2 === 1) {
        ops.push("0.98 0.98 0.99 rg");
        ops.push(`${MARGIN} ${y - 4} ${usableW} 16 re f`);
      }
      ops.push("0.2 0.25 0.33 rg");
      row.forEach((cell, cIdx) => {
        const x = MARGIN + cIdx * colW + 4;
        const txt = String(cell ?? "");
        const clipped = txt.length > maxChars ? txt.slice(0, maxChars - 2) + ".." : txt;
        ops.push(`BT /F1 7.5 Tf ${x.toFixed(1)} ${y} Td (${escapePdfText(clipped)}) Tj ET`);
      });
    });

    // Footer
    ops.push("BT");
    ops.push(
      `/F1 8 Tf 0.45 0.5 0.58 rg ${MARGIN} 20 Td (Dexta Africa Enterprise Systems | Generated ${escapePdfText(
        new Date().toISOString().slice(0, 19).replace("T", " ")
      )} UTC | Page ${pageIdx + 1} of ${chunks.length}) Tj`
    );
    ops.push("ET");

    const stream = ops.join("\n");
    const contentId = addObj(`<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`);
    const pageId = addObj(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    pageIds.push(pageId);
  });

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefPos = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}
