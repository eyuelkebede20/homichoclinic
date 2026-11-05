/**
 * Professional Styled Excel Export Utility (.xlsx)
 * 
 * Generates valid OpenXML (.xlsx) files with complete cell borders,
 * professional background colors, bold headers, formatted numbers,
 * frozen top panes, and multi-sheet partitions.
 * 
 * Zero external npm package dependencies.
 */

export interface ExcelColumn {
  width: number;
}

export interface ExcelDataRow {
  type: "data";
  rowIndex: number;
  seq: number;
  rank: string;
  name: string;
  count: number;
  amount: number;
  percent: string;
  empStatus: string;
  remarks: string;
}

export interface ExcelSubtotalRow {
  type: "subtotal";
  label: string;
  count: number;
  amount: number;
  percent: string;
  remarks: string;
}

export interface ExcelSeparatorRow {
  type: "separator";
}

export type ExcelRow = ExcelDataRow | ExcelSubtotalRow | ExcelSeparatorRow;

export interface ExcelTotals {
  grossAmount: number;
  netAmount: number;
  subsidyAmount?: number;
}

export interface ExcelSheetData {
  sheetName: string;
  dateHeader: string;
  columns?: ExcelColumn[];
  headers: string[];
  rows: ExcelRow[];
  totals?: ExcelTotals;
}

export interface ExportStyledLedgerOptions {
  filename: string;
  sheets: ExcelSheetData[];
}

// CRC-32 Lookup Table
const makeCRCTable = (): Uint32Array => {
  let c: number;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
};

const crcTable = makeCRCTable();

function computeCRC32(bytes: Uint8Array): number {
  let crc = 0 ^ (-1);
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  let totalLength = 0;
  for (const arr of arrays) totalLength += arr.length;
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

interface ZipEntry {
  name: string;
  data: string | Uint8Array;
}

/**
 * Creates a standard PKZIP archive with Method 0 (Store)
 * Fully compliant with ISO/IEC 29500 (OpenXML) and Microsoft Excel.
 */
function createOpenXmlZip(files: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = typeof file.data === "string" ? encoder.encode(file.data) : file.data;
    const crc = computeCRC32(dataBytes);
    const size = dataBytes.length;

    // Local Header (30 bytes + name length + data length)
    const local = new Uint8Array(30 + nameBytes.length + size);
    const lv = new DataView(local.buffer, local.byteOffset, local.byteLength);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true); // Method 0 (Store)
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);
    local.set(dataBytes, 30 + nameBytes.length);
    localHeaders.push(local);

    // Central Directory Header (46 bytes + name length)
    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer, central.byteOffset, central.byteLength);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centralHeaders.push(central);

    offset += local.length;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  for (const ch of centralHeaders) centralDirSize += ch.length;

  // End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer, eocd.byteOffset, eocd.byteLength);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralDirSize, true);
  ev.setUint32(16, centralDirOffset, true);
  ev.setUint16(20, 0, true);

  return concatUint8Arrays([...localHeaders, ...centralHeaders, eocd]);
}

function escapeXml(str: any): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function colToLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = "";
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

/**
 * Builds a styled .xlsx binary buffer with complete borders, colors, and formatting
 */
export function generateStyledLedgerBuffer(options: ExportStyledLedgerOptions): Uint8Array {
  const { sheets } = options;

  // 1. [Content_Types].xml
  let contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n  <Default Extension="xml" ContentType="application/xml"/>\n  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>\n  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>`;
  sheets.forEach((_, idx) => {
    contentTypesXml += `\n  <Override PartName="/xl/worksheets/sheet${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
  });
  contentTypesXml += `\n</Types>`;

  // 2. _rels/.rels
  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>\n</Relationships>`;

  // 3. xl/_rels/workbook.xml.rels
  let wbRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`;
  sheets.forEach((_, idx) => {
    wbRelsXml += `\n  <Relationship Id="rIdSheet${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${idx + 1}.xml"/>`;
  });
  wbRelsXml += `\n</Relationships>`;

  // 4. xl/workbook.xml
  let wbXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">\n  <sheets>`;
  sheets.forEach((s, idx) => {
    wbXml += `\n    <sheet name="${escapeXml(s.sheetName)}" sheetId="${idx + 1}" r:id="rIdSheet${idx + 1}"/>`;
  });
  wbXml += `\n  </sheets>\n</workbook>`;

  // 5. xl/styles.xml
  // Defined styles:
  // 0: Default
  // 1: Banner (Soft blue #EFF6FF, Bold Navy #1E3A8A, thin border, centered)
  // 2: Header (Navy #1E3A8A, Bold White #FFFFFF, thin border, centered, wrap)
  // 3: Cell Left (Thin border)
  // 4: Cell Center (Thin border, centered)
  // 5: Cell Right (Thin border, right)
  // 6: Cell Currency (Thin border, right, #,##0.00)
  // 7: Cell Zebra Left (#F8FAFC, Thin border)
  // 8: Cell Zebra Center (#F8FAFC, Thin border, centered)
  // 9: Cell Zebra Right (#F8FAFC, Thin border, right)
  // 10: Cell Zebra Currency (#F8FAFC, Thin border, right, #,##0.00)
  // 11: Subtotal Title (Amber #FEF3C7, Bold Dark Amber #92400E, left, amber border)
  // 12: Subtotal Center (Amber #FEF3C7, Bold #92400E, center, amber border)
  // 13: Subtotal Currency (Amber #FEF3C7, Bold #92400E, right, #,##0.00, amber border)
  // 14: Subtotal Remarks (Amber #FEF3C7, Bold #92400E, left, amber border)
  // 15: Grand Total 1 Label (Slate #F1F5F9, Bold #0F172A, right, border)
  // 16: Grand Total 1 Currency (Slate #F1F5F9, Bold #0F172A, right, #,##0.00, border)
  // 17: Grand Total 1 Note (Slate #F1F5F9, #475569, left, border)
  // 18: Grand Total 2 Label (Mint #DCFCE7, Bold #1E3A8A, right, double bottom border)
  // 19: Grand Total 2 Currency (Mint #DCFCE7, Bold #1E3A8A, right, #,##0.00, double bottom border)
  // 20: Grand Total 2 Note (Mint #DCFCE7, #166534, left, double bottom border)
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1">
    <numFmt numFmtId="164" formatCode="#,##0.00"/>
  </numFmts>
  <fonts count="6">
    <!-- 0: Regular -->
    <font><sz val="10"/><name val="Calibri"/><color rgb="FF0F172A"/></font>
    <!-- 1: Header Bold White -->
    <font><b/><sz val="11"/><name val="Calibri"/><color rgb="FFFFFFFF"/></font>
    <!-- 2: Banner Bold Navy -->
    <font><b/><sz val="12"/><name val="Calibri"/><color rgb="FF1E3A8A"/></font>
    <!-- 3: Subtotal Bold Amber -->
    <font><b/><sz val="10"/><name val="Calibri"/><color rgb="FF92400E"/></font>
    <!-- 4: Total 1 Bold Slate -->
    <font><b/><sz val="11"/><name val="Calibri"/><color rgb="FF0F172A"/></font>
    <!-- 5: Total 2 Bold Navy -->
    <font><b/><sz val="12"/><name val="Calibri"/><color rgb="FF1E3A8A"/></font>
  </fonts>
  <fills count="7">
    <!-- 0: None -->
    <fill><patternFill patternType="none"/></fill>
    <!-- 1: Gray125 -->
    <fill><patternFill patternType="gray125"/></fill>
    <!-- 2: Header Navy #1E3A8A -->
    <fill><patternFill patternType="solid"><fgColor rgb="FF1E3A8A"/><bgColor indexed="64"/></patternFill></fill>
    <!-- 3: Banner Light Blue #EFF6FF -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFEFF6FF"/><bgColor indexed="64"/></patternFill></fill>
    <!-- 4: Zebra Light #F8FAFC -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/><bgColor indexed="64"/></patternFill></fill>
    <!-- 5: Subtotal Amber #FEF3C7 -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEF3C7"/><bgColor indexed="64"/></patternFill></fill>
    <!-- 6: Grand Total Mint #DCFCE7 -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFDCFCE7"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="4">
    <!-- 0: None -->
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <!-- 1: Thin Gray Grid Border (#CBD5E1) -->
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
      <diagonal/>
    </border>
    <!-- 2: Subtotal Border (Amber top/bottom #F59E0B) -->
    <border>
      <left style="thin"><color rgb="FFFDE68A"/></left>
      <right style="thin"><color rgb="FFFDE68A"/></right>
      <top style="thin"><color rgb="FFF59E0B"/></top>
      <bottom style="thin"><color rgb="FFF59E0B"/></bottom>
      <diagonal/>
    </border>
    <!-- 3: Grand Total Border (Navy top thin, double bottom #1E3A8A) -->
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FF1E3A8A"/></top>
      <bottom style="double"><color rgb="FF1E3A8A"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="21">
    <!-- 0: Default -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>

    <!-- 1: Banner -->
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>

    <!-- 2: Table Header -->
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>

    <!-- 3: Cell Left -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center"/>
    </xf>

    <!-- 4: Cell Center -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>

    <!-- 5: Cell Right -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>

    <!-- 6: Cell Currency -->
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>

    <!-- 7: Cell Zebra Left -->
    <xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center"/>
    </xf>

    <!-- 8: Cell Zebra Center -->
    <xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>

    <!-- 9: Cell Zebra Right -->
    <xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>

    <!-- 10: Cell Zebra Currency -->
    <xf numFmtId="164" fontId="0" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>

    <!-- 11: Subtotal Title -->
    <xf numFmtId="0" fontId="3" fillId="5" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center"/>
    </xf>

    <!-- 12: Subtotal Center -->
    <xf numFmtId="0" fontId="3" fillId="5" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>

    <!-- 13: Subtotal Currency -->
    <xf numFmtId="164" fontId="3" fillId="5" borderId="2" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>

    <!-- 14: Subtotal Remarks -->
    <xf numFmtId="0" fontId="3" fillId="5" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center"/>
    </xf>

    <!-- 15: Grand Total 1 Label -->
    <xf numFmtId="0" fontId="4" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>

    <!-- 16: Grand Total 1 Currency -->
    <xf numFmtId="164" fontId="4" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>

    <!-- 17: Grand Total 1 Note -->
    <xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center"/>
    </xf>

    <!-- 18: Grand Total 2 Label -->
    <xf numFmtId="0" fontId="5" fillId="6" borderId="3" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>

    <!-- 19: Grand Total 2 Currency -->
    <xf numFmtId="164" fontId="5" fillId="6" borderId="3" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>

    <!-- 20: Grand Total 2 Note -->
    <xf numFmtId="0" fontId="0" fillId="6" borderId="3" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center"/>
    </xf>
  </cellXfs>
</styleSheet>`;

  // 6. Each worksheet XML
  const worksheetFiles = sheets.map((sheet, sheetIdx) => {
    let sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`;

    // Freeze Top 2 Rows (Date banner and table header remain visible when scrolling)
    sheetXml += `\n  <sheetViews>\n    <sheetView tabSelected="${sheetIdx === 0 ? "1" : "0"}" workbookViewId="0" showGridLines="1">\n      <pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/>\n    </sheetView>\n  </sheetViews>`;

    // Column widths
    if (sheet.columns && sheet.columns.length > 0) {
      sheetXml += `\n  <cols>`;
      sheet.columns.forEach((col, cIdx) => {
        sheetXml += `\n    <col min="${cIdx + 1}" max="${cIdx + 1}" width="${col.width || 12}" customWidth="1"/>`;
      });
      sheetXml += `\n  </cols>`;
    }

    sheetXml += `\n  <sheetData>`;

    // Row 1: Date Banner
    sheetXml += `\n    <row r="1" ht="28" customHeight="1">`;
    const numCols = sheet.headers.length || 8;
    for (let c = 0; c < numCols; c++) {
      const cellRef = `${colToLetter(c)}1`;
      if (c === 0) {
        sheetXml += `<c r="${cellRef}" s="1" t="inlineStr"><is><t>${escapeXml(sheet.dateHeader)}</t></is></c>`;
      } else {
        sheetXml += `<c r="${cellRef}" s="1"/>`;
      }
    }
    sheetXml += `</row>`;

    // Row 2: Headers
    sheetXml += `\n    <row r="2" ht="30" customHeight="1">`;
    sheet.headers.forEach((h, cIdx) => {
      const cellRef = `${colToLetter(cIdx)}2`;
      sheetXml += `<c r="${cellRef}" s="2" t="inlineStr"><is><t>${escapeXml(h)}</t></is></c>`;
    });
    sheetXml += `</row>`;

    let currentRow = 3;
    const mergeRanges: { start: string; end: string }[] = [
      { start: "A1", end: `${colToLetter(numCols - 1)}1` }
    ];

    // Data rows and sections
    sheet.rows.forEach((rowItem) => {
      if (rowItem.type === "data") {
        const isZebra = rowItem.rowIndex % 2 === 1;
        sheetXml += `\n    <row r="${currentRow}" ht="20" customHeight="1">`;
        
        // 0: seq (center)
        sheetXml += `<c r="A${currentRow}" s="${isZebra ? 8 : 4}"><v>${rowItem.seq}</v></c>`;
        // 1: rank (center)
        sheetXml += `<c r="B${currentRow}" s="${isZebra ? 8 : 4}" t="inlineStr"><is><t>${escapeXml(rowItem.rank)}</t></is></c>`;
        // 2: name (left)
        sheetXml += `<c r="C${currentRow}" s="${isZebra ? 7 : 3}" t="inlineStr"><is><t>${escapeXml(rowItem.name)}</t></is></c>`;
        // 3: count (center)
        sheetXml += `<c r="D${currentRow}" s="${isZebra ? 8 : 4}"><v>${rowItem.count || 1}</v></c>`;
        // 4: amount (currency)
        sheetXml += `<c r="E${currentRow}" s="${isZebra ? 10 : 6}"><v>${rowItem.amount}</v></c>`;
        // 5: percent (center)
        sheetXml += `<c r="F${currentRow}" s="${isZebra ? 8 : 4}" t="inlineStr"><is><t>${escapeXml(rowItem.percent)}</t></is></c>`;
        // 6: empStatus (left)
        sheetXml += `<c r="G${currentRow}" s="${isZebra ? 7 : 3}" t="inlineStr"><is><t>${escapeXml(rowItem.empStatus)}</t></is></c>`;
        // 7: remarks (left)
        sheetXml += `<c r="H${currentRow}" s="${isZebra ? 7 : 3}" t="inlineStr"><is><t>${escapeXml(rowItem.remarks)}</t></is></c>`;
        
        sheetXml += `</row>`;
        currentRow++;
      } else if (rowItem.type === "subtotal") {
        // Subtotal row dividing discount
        sheetXml += `\n    <row r="${currentRow}" ht="22" customHeight="1">`;
        sheetXml += `<c r="A${currentRow}" s="11" t="inlineStr"><is><t>${escapeXml(rowItem.label)}</t></is></c>`;
        sheetXml += `<c r="B${currentRow}" s="11"/>`;
        sheetXml += `<c r="C${currentRow}" s="11"/>`;
        sheetXml += `<c r="D${currentRow}" s="12"><v>${rowItem.count}</v></c>`;
        sheetXml += `<c r="E${currentRow}" s="13"><v>${rowItem.amount}</v></c>`;
        sheetXml += `<c r="F${currentRow}" s="12" t="inlineStr"><is><t>${escapeXml(rowItem.percent)}</t></is></c>`;
        sheetXml += `<c r="G${currentRow}" s="14"/>`;
        sheetXml += `<c r="H${currentRow}" s="14" t="inlineStr"><is><t>${escapeXml(rowItem.remarks)}</t></is></c>`;
        sheetXml += `</row>`;
        mergeRanges.push({ start: `A${currentRow}`, end: `C${currentRow}` });
        currentRow++;
      } else if (rowItem.type === "separator") {
        sheetXml += `\n    <row r="${currentRow}" ht="10" customHeight="1"/>`;
        currentRow++;
      }
    });

    // Grand Totals
    if (sheet.totals) {
      // Empty separator
      sheetXml += `\n    <row r="${currentRow}" ht="10" customHeight="1"/>`;
      currentRow++;

      // Total Row 1: ጠቅላላ ድምር 100%
      const r1 = currentRow;
      sheetXml += `\n    <row r="${r1}" ht="24" customHeight="1">`;
      sheetXml += `<c r="A${r1}" s="15" t="inlineStr"><is><t>                                         ጠቅላላ ድምር 100%</t></is></c>`;
      sheetXml += `<c r="B${r1}" s="15"/>`;
      sheetXml += `<c r="C${r1}" s="15"/>`;
      sheetXml += `<c r="D${r1}" s="15"/>`;
      sheetXml += `<c r="E${r1}" s="16"><v>${sheet.totals.grossAmount}</v></c>`;
      sheetXml += `<c r="F${r1}" s="16"/>`;
      sheetXml += `<c r="G${r1}" s="17" t="inlineStr"><is><t>(ድምር የክሊኒክ አገልግሎት ወጪ)</t></is></c>`;
      sheetXml += `<c r="H${r1}" s="17"/>`;
      sheetXml += `</row>`;
      mergeRanges.push({ start: `A${r1}`, end: `D${r1}` });
      mergeRanges.push({ start: `E${r1}`, end: `F${r1}` });
      mergeRanges.push({ start: `G${r1}`, end: `H${r1}` });
      currentRow++;

      // Total Row 2: አጠቃላይ የሚቆረጥባቸው ብር
      const r2 = currentRow;
      sheetXml += `\n    <row r="${r2}" ht="26" customHeight="1">`;
      sheetXml += `<c r="A${r2}" s="18" t="inlineStr"><is><t>አጠቃላይ የሚቆረጥባቸው ብር</t></is></c>`;
      sheetXml += `<c r="B${r2}" s="18"/>`;
      sheetXml += `<c r="C${r2}" s="18"/>`;
      sheetXml += `<c r="D${r2}" s="18"/>`;
      sheetXml += `<c r="E${r2}" s="19"><v>${sheet.totals.netAmount}</v></c>`;
      sheetXml += `<c r="F${r2}" s="19"/>`;
      const subsidyText = `(ከደመወዝ የሚቆረጥ ጠቅላላ የተጣራ ብር • ድጎማ: ${Number(sheet.totals.subsidyAmount || 0).toFixed(2)} ብር)`;
      sheetXml += `<c r="G${r2}" s="20" t="inlineStr"><is><t>${escapeXml(subsidyText)}</t></is></c>`;
      sheetXml += `<c r="H${r2}" s="20"/>`;
      sheetXml += `</row>`;
      mergeRanges.push({ start: `A${r2}`, end: `D${r2}` });
      mergeRanges.push({ start: `E${r2}`, end: `F${r2}` });
      mergeRanges.push({ start: `G${r2}`, end: `H${r2}` });
      currentRow++;
    }

    sheetXml += `\n  </sheetData>`;

    // Merge Cells (MUST be placed after sheetData in OpenXML)
    if (mergeRanges.length > 0) {
      sheetXml += `\n  <mergeCells count="${mergeRanges.length}">`;
      mergeRanges.forEach(m => {
        sheetXml += `\n    <mergeCell ref="${m.start}:${m.end}"/>`;
      });
      sheetXml += `\n  </mergeCells>`;
    }

    sheetXml += `\n</worksheet>`;

    return {
      name: `xl/worksheets/sheet${sheetIdx + 1}.xml`,
      data: sheetXml
    };
  });

  const allFiles: ZipEntry[] = [
    { name: "[Content_Types].xml", data: contentTypesXml },
    { name: "_rels/.rels", data: rootRelsXml },
    { name: "xl/_rels/workbook.xml.rels", data: wbRelsXml },
    { name: "xl/workbook.xml", data: wbXml },
    { name: "xl/styles.xml", data: stylesXml },
    ...worksheetFiles
  ];

  return createOpenXmlZip(allFiles);
}

/**
 * Triggers a download of the styled Excel workbook in the browser
 */
export function exportStyledLedgerExcel(options: ExportStyledLedgerOptions): void {
  const zipBuffer = generateStyledLedgerBuffer(options);
  const blob = new Blob([zipBuffer as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = options.filename.endsWith(".xlsx") ? options.filename : `${options.filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
