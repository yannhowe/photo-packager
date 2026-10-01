const $ = (id) => document.getElementById(id);
const els = {
  photoInput: $("photoInput"), singlePhotoInput: $("singlePhotoInput"), pickerStatus: $("pickerStatus"), photoCount: $("photoCount"), photoList: $("photoList"), sizePreset: $("sizePreset"),
  photoWidth: $("photoWidth"), photoHeight: $("photoHeight"), cropMode: $("cropMode"), photoMaterial: $("photoMaterial"),
  photoThicknessLabel: $("photoThicknessLabel"), photoThickness: $("photoThickness"), sheetSize: $("sheetSize"),
  printPaper: $("printPaper"), backOrientation: $("backOrientation"), autoPhotoOrientation: $("autoPhotoOrientation"), showPrintGuides: $("showPrintGuides"), pageMargin: $("pageMargin"), photoGap: $("photoGap"), backOffsetX: $("backOffsetX"), backOffsetY: $("backOffsetY"),
  metaDate: $("metaDate"), metaCamera: $("metaCamera"), metaExposure: $("metaExposure"), metaLocation: $("metaLocation"), metaFilename: $("metaFilename"), metaPixels: $("metaPixels"),
  designStyle: $("designStyle"), casePreviewFace: $("casePreviewFace"), printCoverArtwork: $("printCoverArtwork"), showPhotoCount: $("showPhotoCount"),
  printSideArtwork: $("printSideArtwork"), showFoldInstructions: $("showFoldInstructions"), sideLabel: $("sideLabel"), caseMaterial: $("caseMaterial"), caseThicknessLabel: $("caseThicknessLabel"), caseThickness: $("caseThickness"),
  quantity: $("quantity"), titleOne: $("titleOne"), titleTwo: $("titleTwo"), subtitle: $("subtitle"),
  paperColor: $("paperColor"), inkColor: $("inkColor"), previewTitle: $("previewTitle"), previewSummary: $("previewSummary"),
  prevPage: $("prevPage"), pageIndicator: $("pageIndicator"), nextPage: $("nextPage"), sheetViewport: $("sheetViewport"),
  fitMessage: $("fitMessage"), printRoot: $("printRoot"), resetButton: $("resetButton"), downloadButton: $("downloadButton"),
  printCurrentButton: $("printCurrentButton"), printDuplexButton: $("printDuplexButton"), printCaseDuplexButton: $("printCaseDuplexButton"), printCalibrationButton: $("printCalibrationButton"), downloadCasePdfButton: $("downloadCasePdfButton"),
  advancedButton: $("advancedButton"), advancedDialog: $("advancedDialog"), advancedBody: $("advancedBody"), closeAdvancedButton: $("closeAdvancedButton"),
};
const defaults = {
  sizePreset: "instax-wide", photoWidth: "108", photoHeight: "86", cropMode: "cover", photoMaterial: "0.24",
  photoThickness: "0.24", sheetSize: "a4", printPaper: "glossy", backOrientation: "epson-left-right", autoPhotoOrientation: true, showPrintGuides: true, pageMargin: "6", photoGap: "4", backOffsetX: "0", backOffsetY: "0",
  metaDate: true, metaCamera: true, metaExposure: true, metaLocation: false, metaFilename: true, metaPixels: false, designStyle: "bureau",
  casePreviewFace: "outside", printCoverArtwork: true, showPhotoCount: true, printSideArtwork: true, showFoldInstructions: true, sideLabel: "PHOTO ARCHIVE", caseMaterial: "0.21", caseThickness: "0.21",
  quantity: "Photo Set", titleOne: "Instax Wide", titleTwo: "Photo Pack", subtitle: "Wide-format archive",
  paperColor: "#f5e8c8", inkColor: "#c94f3f",
};
const settingsIds = Object.keys(defaults);
const sizes = { "instax-mini": [54, 86], "instax-wide": [108, 86], "4r": [102, 152], "4r-landscape": [152, 102], "6x4": [152, 102], square: [86, 86] };
const presetDefaults = {
  "instax-mini": { titleOne: "Instax Mini", titleTwo: "Photo Pack", subtitle: "Pocket archive", quantity: "Photo Set", pageMargin: "6", photoGap: "4", photoMaterial: "0.28", caseMaterial: "0.21" },
  "instax-wide": { titleOne: "Instax Wide", titleTwo: "Photo Pack", subtitle: "Wide-format archive", quantity: "Photo Set", pageMargin: "6", photoGap: "4", photoMaterial: "0.28", caseMaterial: "0.21" },
  "4r": { titleOne: "4R", titleTwo: "Photo Pack", subtitle: "Print archive", quantity: "Photo Set", pageMargin: "3", photoGap: "0", photoMaterial: "0.24", caseMaterial: "0.21" },
  "4r-landscape": { titleOne: "4R", titleTwo: "Photo Pack", subtitle: "Landscape archive", quantity: "Photo Set", pageMargin: "3", photoGap: "0", photoMaterial: "0.24", caseMaterial: "0.21" },
  square: { titleOne: "Square", titleTwo: "Photo Pack", subtitle: "Square archive", quantity: "Photo Set", pageMargin: "6", photoGap: "4", photoMaterial: "0.24", caseMaterial: "0.21" },
};
const sheets = { a4: { w: 297, h: 210, label: "A4" }, "4r": { w: 102, h: 152, label: "4R" }, "6r": { w: 203, h: 152, label: "6R" } };
let photos = [], view = "overview", page = 0;

function esc(value) { return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
function n(id, fallback = 0) { const value = Number(els[id].value); return Number.isFinite(value) ? value : fallback; }
function photoThickness() { return els.photoMaterial.value === "custom" ? n("photoThickness", .24) : Number(els.photoMaterial.value); }
function caseThickness() { return els.caseMaterial.value === "custom" ? n("caseThickness", .21) : Number(els.caseMaterial.value); }
function currentSheet() { return sheets[els.sheetSize.value]; }
function state() { return Object.fromEntries(settingsIds.map((id) => [id, els[id].type === "checkbox" ? els[id].checked : els[id].value])); }
function save() { localStorage.setItem("photo-packager-v1", JSON.stringify(state())); }
function load() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem("photo-packager-v1") || "{}"); } catch (_) {}
  if (saved.backOrientation === "same" || saved.backOrientation === "long" || saved.backOrientation === "left-right") saved.backOrientation = "epson-left-right";
  if (saved.backOrientation === "rotate" || saved.backOrientation === "short") saved.backOrientation = "top-bottom";
  const values = { ...defaults, ...saved };
  settingsIds.forEach((id) => { if (els[id].type === "checkbox") els[id].checked = Boolean(values[id]); else els[id].value = values[id]; });
}

function readAscii(view, offset, length) {
  let out = "";
  for (let i = 0; i < length; i++) { const c = view.getUint8(offset + i); if (!c) break; out += String.fromCharCode(c); }
  return out.trim();
}
function parseExif(buffer) {
  const data = new DataView(buffer), result = {};
  try {
    if (data.byteLength < 4 || data.getUint16(0) !== 0xffd8) return result;
    let p = 2;
    while (p + 4 < data.byteLength) {
      if (data.getUint8(p) !== 0xff) break;
      const marker = data.getUint8(p + 1), len = data.getUint16(p + 2);
      if (marker === 0xe1 && readAscii(data, p + 4, 4) === "Exif") {
        const tiff = p + 10, little = data.getUint16(tiff) === 0x4949;
        const u16 = (o) => data.getUint16(o, little), u32 = (o) => data.getUint32(o, little);
        const typeSize = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
        const textTag = (entry, type, count) => readAscii(data, (typeSize[type] || 1) * count <= 4 ? entry + 8 : tiff + u32(entry + 8), count);
        const numberTag = (entry, type, count = 1) => {
          const bytes = (typeSize[type] || 1) * count, at = bytes <= 4 ? entry + 8 : tiff + u32(entry + 8);
          if (at < 0 || at + (typeSize[type] || 1) > data.byteLength) return null;
          if (type === 3) return u16(at);
          if (type === 4) return u32(at);
          if (type === 9) return data.getInt32(at, little);
          if (type === 5 || type === 10) {
            const numerator = type === 5 ? u32(at) : data.getInt32(at, little), denominator = type === 5 ? u32(at + 4) : data.getInt32(at + 4, little);
            return denominator ? numerator / denominator : null;
          }
          return data.getUint8(at);
        };
        const rationalArray = (entry, type, count) => {
          if (type !== 5 && type !== 10) return [];
          const at = tiff + u32(entry + 8), values = [];
          for (let j = 0; j < count; j++) {
            const pos = at + j * 8;
            if (pos + 8 > data.byteLength) break;
            const numerator = type === 5 ? u32(pos) : data.getInt32(pos, little), denominator = type === 5 ? u32(pos + 4) : data.getInt32(pos + 4, little);
            values.push(denominator ? numerator / denominator : 0);
          }
          return values;
        };
        const walk = (offset, depth = 0, gps = false) => {
          if (!offset || depth > 2 || tiff + offset + 2 > data.byteLength) return;
          const base = tiff + offset, count = u16(base);
          for (let i = 0; i < count; i++) {
            const e = base + 2 + i * 12;
            if (e + 12 > data.byteLength) break;
            const tag = u16(e), type = u16(e + 2), qty = u32(e + 4);
            if (tag === 0x010f) result.make = textTag(e, type, qty);
            if (tag === 0x0110) result.model = textTag(e, type, qty);
            if (tag === 0x9003 || tag === 0x0132) result.date = textTag(e, type, qty);
            if (tag === 0xa434) result.lens = textTag(e, type, qty);
            if (tag === 0x829a) result.exposure = numberTag(e, type, qty);
            if (tag === 0x829d) result.aperture = numberTag(e, type, qty);
            if (tag === 0x8827 || tag === 0x8833) result.iso = numberTag(e, type, qty);
            if (tag === 0x920a) result.focalLength = numberTag(e, type, qty);
            if (tag === 0xa405) result.focalLength35 = numberTag(e, type, qty);
            if (gps && tag === 0x0001) result.gpsLatRef = textTag(e, type, qty);
            if (gps && tag === 0x0002) result.gpsLatDms = rationalArray(e, type, qty);
            if (gps && tag === 0x0003) result.gpsLonRef = textTag(e, type, qty);
            if (gps && tag === 0x0004) result.gpsLonDms = rationalArray(e, type, qty);
            if (gps && tag === 0x0005) result.gpsAltitudeRef = numberTag(e, type, qty);
            if (gps && tag === 0x0006) result.altitude = numberTag(e, type, qty);
            if (!gps && tag === 0x8769) walk(u32(e + 8), depth + 1, false);
            if (!gps && tag === 0x8825) walk(u32(e + 8), depth + 1, true);
          }
        };
        walk(u32(tiff + 4));
        const decimal = (parts, ref) => parts?.length === 3 ? (parts[0] + parts[1]/60 + parts[2]/3600) * (/^[SW]$/i.test(ref || "") ? -1 : 1) : null;
        result.latitude = decimal(result.gpsLatDms, result.gpsLatRef);
        result.longitude = decimal(result.gpsLonDms, result.gpsLonRef);
        if (result.altitude != null && result.gpsAltitudeRef === 1) result.altitude *= -1;
        delete result.gpsLatDms; delete result.gpsLonDms; delete result.gpsLatRef; delete result.gpsLonRef; delete result.gpsAltitudeRef;
        break;
      }
      if (len < 2) break; p += len + 2;
    }
  } catch (_) { return result; }
  return result;
}
function imageSize(url) { return new Promise((resolve) => { const img = new Image(); img.onload = () => resolve([img.naturalWidth, img.naturalHeight]); img.onerror = () => resolve([0, 0]); img.src = url; }); }
function friendlyDate(raw, fallback) {
  const m = raw && raw.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}`;
  return new Date(fallback).toLocaleString([], { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
async function addFiles(files) {
  const incoming = Array.from(files).filter((file) => file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name));
  els.pickerStatus.textContent = incoming.length ? `Preparing ${incoming.length} photo${incoming.length === 1 ? "" : "s"}…` : "No compatible photos were received. On iPhone, try “Add one at a time”.";
  for (const file of incoming) {
    const url = URL.createObjectURL(file); let exif = {};
    if (/jpe?g/i.test(file.type) || /\.jpe?g$/i.test(file.name)) { try { exif = parseExif(await file.arrayBuffer()); } catch (_) {} }
    const [width, height] = await imageSize(url);
    photos.push({ id: crypto.randomUUID(), file, url, width, height, exif });
  }
  els.photoInput.value = ""; els.singlePhotoInput.value = "";
  if (incoming.length) els.pickerStatus.textContent = `${incoming.length} photo${incoming.length === 1 ? "" : "s"} added. Files and metadata stay on this device.`;
  page = 0; render();
}
function removePhoto(id) {
  const item = photos.find((p) => p.id === id); if (item) URL.revokeObjectURL(item.url);
  photos = photos.filter((p) => p.id !== id); page = 0; render();
}
function renderPhotoList() {
  els.photoCount.textContent = `${photos.length} selected`;
  els.photoList.innerHTML = photos.map((p) => `<div class="photo-item"><img src="${esc(p.url)}" alt=""><div class="photo-copy"><strong>${esc(p.file.name)}</strong><span>${p.width || "?"} × ${p.height || "?"}${p.exif.model ? ` · ${esc(p.exif.model)}` : ""}</span></div><button type="button" data-remove="${p.id}" aria-label="Remove ${esc(p.file.name)}">×</button></div>`).join("");
  els.photoList.querySelectorAll("[data-remove]").forEach((button) => button.addEventListener("click", () => removePhoto(button.dataset.remove)));
}

function layout() {
  const sheet = currentSheet(), pw = n("photoWidth", 108), ph = n("photoHeight", 86), margin = n("pageMargin", 6), gap = n("photoGap", 4);
  const cols = Math.max(0, Math.floor((sheet.w - 2 * margin + gap) / (pw + gap))), rows = Math.max(0, Math.floor((sheet.h - 2 * margin + gap) / (ph + gap)));
  const perPage = cols * rows, usedW = cols ? cols * pw + (cols - 1) * gap : 0, usedH = rows ? rows * ph + (rows - 1) * gap : 0;
  return { sheet, pw, ph, margin, gap, cols, rows, perPage, startX: (sheet.w - usedW) / 2, startY: (sheet.h - usedH) / 2 };
}
function orientedPhotoSize(photo) {
  const baseW = n("photoWidth",108), baseH = n("photoHeight",86);
  if (!els.autoPhotoOrientation.checked || !photo?.width || !photo?.height || Math.abs(baseW-baseH) < .01) return {w:baseW,h:baseH};
  const long = Math.max(baseW,baseH), short = Math.min(baseW,baseH), portrait = photo.height > photo.width;
  return portrait ? {w:short,h:long} : {w:long,h:short};
}
function photoPagePlan() {
  const sheet = currentSheet(), margin = n("pageMargin",6), gap = n("photoGap",4), maxX = sheet.w-margin, maxY = sheet.h-margin;
  const pages = []; let current = [], x = margin, y = margin, rowH = 0, valid = true;
  const finishPage = () => {
    if (!current.length) return;
    const minX = Math.min(...current.map((p) => p.x)), maxPlacedX = Math.max(...current.map((p) => p.x+p.w));
    const minY = Math.min(...current.map((p) => p.y)), maxPlacedY = Math.max(...current.map((p) => p.y+p.h));
    const dx = (sheet.w-(maxPlacedX-minX))/2-minX, dy = (sheet.h-(maxPlacedY-minY))/2-minY;
    current.forEach((p) => { p.x += dx; p.y += dy; }); pages.push(current); current = []; x = margin; y = margin; rowH = 0;
  };
  photos.forEach((photo,index) => {
    const {w,h} = orientedPhotoSize(photo);
    if (w > sheet.w-2*margin+.01 || h > sheet.h-2*margin+.01) { valid = false; return; }
    if (current.length && x+w > maxX+.01) { x = margin; y += rowH+gap; rowH = 0; }
    if (current.length && y+h > maxY+.01) finishPage();
    current.push({photo,index,x,y,w,h}); x += w+gap; rowH = Math.max(rowH,h);
  });
  finishPage();
  return {sheet,pages,valid};
}
function cropGeometry(photo, x, y, w, h, uid) {
  return `<defs><clipPath id="clip-${uid}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs><image href="${esc(photo.url)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid ${els.cropMode.value === "cover" ? "slice" : "meet"}" clip-path="url(#clip-${uid})"/>`;
}
function cropMarks(x, y, w, h) {
  const a = 3, o = 1;
  return `<path d="M${x-o-a} ${y}h${a}M${x} ${y-o-a}v${a}M${x+w+o} ${y}h${a}M${x+w} ${y-o-a}v${a}M${x-o-a} ${y+h}h${a}M${x} ${y+h+o}v${a}M${x+w+o} ${y+h}h${a}M${x+w} ${y+h+o}v${a}" fill="none" stroke="#333" stroke-width=".25"/>`;
}
function tidyNumber(value, digits = 1) { return Number(value).toFixed(digits).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1"); }
function exposureSummary(photo) {
  const e = photo.exif, parts = [];
  if (e.exposure) parts.push(e.exposure < 1 ? `1/${Math.max(1, Math.round(1/e.exposure))} s` : `${tidyNumber(e.exposure, 2)} s`);
  if (e.aperture) parts.push(`f/${tidyNumber(e.aperture, 1)}`);
  if (e.iso) parts.push(`ISO ${Math.round(e.iso)}`);
  if (e.focalLength) parts.push(`${tidyNumber(e.focalLength, 1)} mm${e.focalLength35 ? ` (${Math.round(e.focalLength35)} mm eq.)` : ""}`);
  return parts.join(" · ") || "Unavailable in this image file";
}
function locationSummary(photo) {
  const { latitude, longitude, altitude } = photo.exif;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return "Unavailable in this image file";
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}${Number.isFinite(altitude) ? ` · ${Math.round(altitude)} m` : ""}`;
}
function balancedLines(value, lineCount) {
  let remaining = String(value || "Unavailable").replace(/\s+/g," ").trim();
  if (lineCount <= 1 || !remaining) return [remaining];
  const lines = [];
  for (let i=0; i<lineCount-1; i++) {
    const left = lineCount-i, ideal = Math.ceil(remaining.length/left);
    let cut = remaining.lastIndexOf(" ",ideal+1);
    if (cut < Math.max(1,ideal*.55)) cut = remaining.indexOf(" ",ideal);
    if (cut < 1) cut = ideal;
    lines.push(remaining.slice(0,cut).trim()); remaining = remaining.slice(cut).trim();
  }
  if (remaining) lines.push(remaining);
  return lines;
}
function wrappedSvgText(value,x,y,width,maxSize,minSize,attrs="",maxLines=2,lineGap=1.25) {
  const supplied = Array.isArray(value) ? value.map((line) => String(line).trim()).filter(Boolean) : null;
  const text = supplied ? supplied.join(" ") : String(value || "Unavailable").replace(/\s+/g," ").trim();
  const naturalWidth = text.length*maxSize*.54, count = Math.max(1,Math.min(maxLines,Math.ceil(naturalWidth/Math.max(1,width))));
  const lines = supplied || balancedLines(text,count), longest = Math.max(1,...lines.map((line) => line.length));
  const size = Math.max(minSize,Math.min(maxSize,width/(longest*.54))), gap = size*lineGap;
  return `<text x="${x}" y="${y}" font-size="${size.toFixed(2)}" ${attrs}>${lines.map((line,i) => `<tspan x="${x}" y="${(y+i*gap).toFixed(2)}">${esc(line)}</tspan>`).join("")}</text>`;
}
function semanticMetadataLines(label,value) {
  if (Array.isArray(value)) return value;
  const text = String(value || "Unavailable");
  if (label === "EXPOSURE") {
    const parts = text.split(" · ");
    if (parts.length > 1) { const mid = Math.ceil(parts.length/2); return [parts.slice(0,mid).join(" · "),parts.slice(mid).join(" · ")]; }
  }
  if (label === "LOCATION" && text.includes(" · ")) return text.split(" · ");
  if (label === "LENS" && text.includes(" (")) { const at = text.indexOf(" ("); return [text.slice(0,at),text.slice(at+1)]; }
  return text;
}
function metadataArtwork(photo, x, y, w, h, index) {
  const fields = [];
  if (els.metaDate.checked) fields.push(["DATE", friendlyDate(photo.exif.date, photo.file.lastModified)]);
  if (els.metaCamera.checked) {
    const cameraParts = [photo.exif.make,photo.exif.model].filter(Boolean);
    fields.push(["CAMERA", cameraParts.length ? cameraParts : "Unavailable in this image file"]);
    fields.push(["LENS", photo.exif.lens || "Unavailable in this image file"]);
  }
  if (els.metaExposure.checked) fields.push(["EXPOSURE", exposureSummary(photo)]);
  if (els.metaLocation.checked) fields.push(["LOCATION", locationSummary(photo)]);
  if (els.metaFilename.checked) fields.push(["FILE", photo.file.name]);
  if (els.metaPixels.checked) fields.push(["SIZE", `${photo.width || "?"} × ${photo.height || "?"} px`]);
  if (!fields.length) fields.push(["METADATA", "All metadata fields are turned off"]);
  const ink = esc(els.inkColor.value), paper = esc(els.paperColor.value), clipId = `metadata-${index}`, compact = w < 72;
  const rows = (startY, step, family, labelFill, valueFill, maxRows) => fields.slice(0,maxRows).map(([label,value],j) => compact
    ? `<text x="${x+6}" y="${startY+j*step}" font-family="${family}" font-size="1.8" font-weight="700" letter-spacing=".3" fill="${labelFill}">${label}</text>${wrappedSvgText(semanticMetadataLines(label,value),x+6,startY+j*step+3.55,w-12,2.35,1.75,`font-family="${family}" fill="${valueFill}"`,2,1.15)}`
    : `<text x="${x+8}" y="${startY+j*step}" font-family="${family}" font-size="2.05" font-weight="700" letter-spacing=".32" fill="${labelFill}">${label}</text>${wrappedSvgText(semanticMetadataLines(label,value),x+26,startY+j*step,w-32,2.75,1.8,`font-family="${family}" fill="${valueFill}"`,2,1.12)}`).join("");
  const defs = `<defs><clipPath id="${clipId}"><rect x="${x+.6}" y="${y+.6}" width="${w-1.2}" height="${h-1.2}"/></clipPath></defs>`;
  if (els.designStyle.value === "museum") {
    const start = y+(compact?29:36), step = compact?9.8:7.2, maxRows = Math.max(1,Math.floor((h-(compact?34:43))/step));
    return `${defs}<g clip-path="url(#${clipId})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f3efe3"/><rect x="${x+5}" y="${y+5}" width="${w-10}" height="${h-10}" fill="none" stroke="#292522" stroke-width=".35"/><text x="${x+(compact?6:8)}" y="${y+12}" font-family="Georgia,serif" font-size="${compact?2.5:3.2}" letter-spacing="${compact?.35:.75}">PHOTOGRAPHIC ARCHIVE</text><text x="${x+(compact?6:8)}" y="${y+(compact?22:27)}" font-family="Georgia,serif" font-size="${compact?7:11}">No. ${String(index).padStart(2,"0")}</text><line x1="${x+(compact?6:8)}" y1="${y+(compact?25:32)}" x2="${x+w-(compact?6:8)}" y2="${y+(compact?25:32)}" stroke="#292522" stroke-width=".35"/>${rows(start,step,"Georgia,serif","#6d625a","#292522",maxRows)}<text x="${x+(compact?6:8)}" y="${y+h-6}" font-family="Georgia,serif" font-size="${compact?2.05:2.8}" font-style="italic">${compact?"CATALOGUED FROM ORIGINAL":"Catalogued from the original image file"}</text></g>`;
  }
  if (els.designStyle.value === "contact") {
    const start = y+(compact?23:28), step = compact?9.8:7.2, maxRows = Math.max(1,Math.floor((h-(compact?29:39))/step));
    return `${defs}<g clip-path="url(#${clipId})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f7f7f3"/><rect x="${x}" y="${y}" width="${w}" height="${compact?15:18}" fill="#20201e"/><text x="${x+(compact?6:7)}" y="${y+(compact?9.5:11)}" font-family="monospace" font-size="${compact?3.4:4.5}" font-weight="700" fill="#fff">FRAME_${String(index).padStart(3,"0")}</text>${rows(start,step,"monospace","#77736d","#20201e",maxRows)}<path d="M${x+6} ${y+h-11}H${x+w-6}" stroke="#20201e" stroke-width=".3"/><text x="${x+6}" y="${y+h-6}" font-family="monospace" font-size="${compact?2.05:2.8}">${w} × ${h} MM / PHOTO PACKAGER</text></g>`;
  }
  const start = y+(compact?29:36), step = compact?9.8:7.2, maxRows = Math.max(1,Math.floor((h-(compact?35:43))/step));
  return `${defs}<g clip-path="url(#${clipId})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${paper}"/><text x="${x+(compact?6:8)}" y="${y+10}" font-family="Arial,sans-serif" font-size="${compact?3.1:3.7}" font-weight="700" fill="${ink}">PHOTO ${String(index).padStart(2,"0")}</text><line x1="${x+(compact?6:8)}" y1="${y+14}" x2="${x+w-(compact?6:8)}" y2="${y+14}" stroke="${ink}" stroke-width=".55"/><text x="${x+(compact?6:8)}" y="${y+(compact?22:26)}" font-family="Arial,sans-serif" font-size="${compact?5.3:8}" font-weight="700" fill="${ink}">Archive record</text><line x1="${x+(compact?6:8)}" y1="${y+(compact?25:30)}" x2="${x+w-(compact?6:8)}" y2="${y+(compact?25:30)}" stroke="${ink}" stroke-width=".55"/>${rows(start,step,"Arial,sans-serif",ink,"#282422",maxRows)}<text x="${x+(compact?6:8)}" y="${y+h-6}" font-family="Arial,sans-serif" font-size="${compact?2.2:2.8}" font-weight="700" fill="${ink}">PAPER / ${esc(els.printPaper.value.toUpperCase())}</text></g>`;
}
function sheetPrintGuide(sheet) {
  if (!els.showPrintGuides.checked || sheet.label !== "A4") return "";
  const ink = esc(els.inkColor.value), rulerX = sheet.w/2-50, rulerY = sheet.h-8;
  return `<g id="PAGE_ORIENTATION_GUIDE" aria-label="A4 orientation and scale guide" font-family="Arial,sans-serif"><rect x="4" y="4" width="${sheet.w-8}" height="${sheet.h-8}" rx="1" fill="none" stroke="${ink}" stroke-width=".45" stroke-dasharray="3 1.5"/><path d="M4 18V4H18" fill="none" stroke="${ink}" stroke-width="2.2"/><circle cx="10" cy="10" r="3.2" fill="${ink}"/><text x="20" y="10.8" fill="${ink}" font-size="3.2" font-weight="700" letter-spacing=".35">ORIENTATION CORNER</text><text x="${sheet.w/2}" y="8" text-anchor="middle" fill="${ink}" font-size="3" font-weight="700" letter-spacing=".35">A4 PAGE: ${sheet.w} × ${sheet.h} MM · BORDER IS INSET 4 MM</text><text x="8" y="${sheet.h/2}" text-anchor="middle" fill="${ink}" font-size="3.25" font-weight="700" letter-spacing=".45" transform="rotate(-90 8 ${sheet.h/2})">SHORT EDGE · ${sheet.h} MM PAGE</text><g fill="none" stroke="${ink}" stroke-width=".65"><path d="M${rulerX} ${rulerY}H${rulerX+100}M${rulerX} ${rulerY-2.2}V${rulerY+2.2}M${rulerX+50} ${rulerY-1.4}V${rulerY+1.4}M${rulerX+100} ${rulerY-2.2}V${rulerY+2.2}"/></g><text x="${sheet.w/2}" y="${rulerY-2.6}" text-anchor="middle" fill="${ink}" font-size="2.8" font-weight="700">100 MM CALIBRATION BAR · MUST MEASURE EXACTLY 100 MM</text></g>`;
}
function calibrationSvg(print = false) {
  const sheet = currentSheet(), inset = sheet.label === "A4" ? 15 : Math.max(8,n("pageMargin",6)), ink = esc(els.inkColor.value);
  const rulerX = sheet.w/2-50, rulerY = sheet.h/2+8;
  return `<svg${print ? ' class="print-page"' : ""} xmlns="http://www.w3.org/2000/svg" width="${sheet.w}mm" height="${sheet.h}mm" viewBox="0 0 ${sheet.w} ${sheet.h}" role="img" aria-label="Print size calibration sheet"><g font-family="Arial,sans-serif" fill="${ink}"><rect x="${inset}" y="${inset}" width="${sheet.w-2*inset}" height="${sheet.h-2*inset}" rx="2" fill="none" stroke="${ink}" stroke-width=".5" stroke-dasharray="3 2"/><path d="M${inset} ${inset+14}V${inset}H${inset+14}" fill="none" stroke="${ink}" stroke-width="2.2"/><circle cx="${inset+6}" cy="${inset+6}" r="3"/><text x="${sheet.w/2}" y="${sheet.h/2-20}" text-anchor="middle" font-size="7" font-weight="800">PRINT SIZE TEST</text><text x="${sheet.w/2}" y="${sheet.h/2-10}" text-anchor="middle" font-size="3.4" font-weight="700">${sheet.label} PAGE · ${sheet.w} × ${sheet.h} MM · PRINT AT 100%</text><g fill="none" stroke="${ink}" stroke-width=".8"><path d="M${rulerX} ${rulerY}H${rulerX+100}M${rulerX} ${rulerY-3}V${rulerY+3}M${rulerX+50} ${rulerY-2}V${rulerY+2}M${rulerX+100} ${rulerY-3}V${rulerY+3}"/></g><text x="${sheet.w/2}" y="${rulerY-5}" text-anchor="middle" font-size="4" font-weight="800">THIS BAR MUST MEASURE EXACTLY 100 MM</text><text x="${sheet.w/2}" y="${rulerY+13}" text-anchor="middle" font-size="3.2">If it does not, disable “Fit to page” or print the saved PDF at Actual Size.</text><text x="${sheet.w/2}" y="${sheet.h-inset-6}" text-anchor="middle" font-size="2.8">All marks are at least ${inset} mm from the paper edge.</text></g></svg>`;
}
function pageSvg(kind, pageIndex, print = false) {
  const plan = photoPagePlan(), items = plan.pages[pageIndex] || [], sheet = plan.sheet;
  let content = "";
  items.forEach((item, i) => {
    const {photo,index, w, h} = item, frontX = item.x, frontY = item.y, uid = `${pageIndex}-${i}`;
    let x = frontX, y = frontY;
    if (kind === "backs" && (els.backOrientation.value === "left-right" || els.backOrientation.value === "epson-left-right")) x = sheet.w-frontX-w;
    if (kind === "backs" && els.backOrientation.value === "top-bottom") y = sheet.h-frontY-h;
    if (kind === "backs") { x += n("backOffsetX",0); y += n("backOffsetY",0); }
    if (kind === "fronts") content += cropGeometry(photo, x, y, w, h, uid) + cropMarks(x, y, w, h);
    else content += metadataArtwork(photo, x, y, w, h, index+1) + cropMarks(x,y,w,h);
  });
  if (kind === "backs" && els.backOrientation.value === "epson-left-right") content = `<g transform="rotate(180 ${sheet.w/2} ${sheet.h/2})">${content}</g>`;
  if (!print) content += sheetPrintGuide(sheet);
  return `<svg${print ? ' class="print-page"' : ""} xmlns="http://www.w3.org/2000/svg" width="${sheet.w}mm" height="${sheet.h}mm" viewBox="0 0 ${sheet.w} ${sheet.h}" role="img" aria-label="${kind === "fronts" ? "Photo fronts" : "Metadata backs"} page ${pageIndex+1}">${print ? "" : '<rect width="100%" height="100%" fill="white"/>'}${content}</svg>`;
}

function dateRange() {
  if (!photos.length) return "Add photos to build this archive";
  const times = photos.map((p) => { const m = p.exif.date && p.exif.date.match(/^(\d{4}):(\d{2}):(\d{2})/); return m ? new Date(`${m[1]}-${m[2]}-${m[3]}T12:00:00`).getTime() : p.file.lastModified; }).sort((a,b) => a-b);
  const fmt = (t) => new Date(t).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
  return fmt(times[0]) === fmt(times.at(-1)) ? fmt(times[0]) : `${fmt(times[0])} — ${fmt(times.at(-1))}`;
}
function cameraSummary() {
  const names = [...new Set(photos.map((p) => [p.exif.make, p.exif.model].filter(Boolean).join(" ")).filter(Boolean))];
  return names.length ? names.slice(0, 2).join(" / ") : "Camera details from photo metadata";
}
function caseArtwork(d, cx, cy, ink, q, countLabel) {
  const t1 = esc(els.titleOne.value), t2 = esc(els.titleTwo.value), sub = esc(els.subtitle.value);
  const countRaw = els.showPhotoCount.checked ? countLabel.toUpperCase() : q.toUpperCase(), count = esc(countRaw);
  const rightBackX = cx+d.panelW+d.depth;
  const side = esc((els.sideLabel.value.trim() || "PHOTO ARCHIVE").toUpperCase());
  const dates = dateRange(), cameras = cameraSummary();
  const titleSize = (value,max=13) => Math.max(2.5,Math.min(max,d.panelW/8.5,(d.panelW-16)/(Math.max(1,String(value).length)*.56)));
  let cover = "";
  if (els.printCoverArtwork.checked && els.designStyle.value === "museum") {
    cover = `<g font-family="Georgia,serif" fill="#292522"><rect x="${cx+6}" y="${cy+6}" width="${d.panelW-12}" height="${d.panelH-12}" fill="none" stroke="#292522" stroke-width=".4"/><text x="${cx+10}" y="${cy+17}" font-size="3.5" letter-spacing=".9">PHOTOGRAPHIC ARCHIVE</text><text x="${cx+10}" y="${cy+39}" font-size="${Math.min(13,d.panelW/9)}">${t1}</text><text x="${cx+10}" y="${cy+53}" font-size="${Math.min(13,d.panelW/9)}">${t2}</text><line x1="${cx+10}" y1="${cy+62}" x2="${cx+d.panelW-10}" y2="${cy+62}" stroke="#292522" stroke-width=".35"/><text x="${cx+10}" y="${cy+73}" font-size="5" font-style="italic">${sub}</text><text x="${cx+10}" y="${cy+d.panelH-11}" font-size="4">${count}</text></g>`;
  } else if (els.printCoverArtwork.checked && els.designStyle.value === "contact") {
    cover = `<g font-family="monospace"><rect x="${cx}" y="${cy}" width="${d.panelW}" height="${Math.min(25,d.panelH*.25)}" fill="#20201e"/><text x="${cx+8}" y="${cy+10}" font-size="4" font-weight="700" fill="#fff">PHOTO_CASE / ${count}</text><text x="${cx+8}" y="${cy+20}" font-size="7" font-weight="700" fill="#fff">${t1} ${t2}</text><text x="${cx+8}" y="${cy+42}" font-size="5" font-weight="700">${sub}</text><path d="M${cx+8} ${cy+49}H${cx+d.panelW-8}M${cx+8} ${cy+d.panelH-18}H${cx+d.panelW-8}" stroke="#20201e" stroke-width=".4"/><text x="${cx+8}" y="${cy+d.panelH-9}" font-size="3.6">SIZE_${d.photoW}X${d.photoH} / ${count}</text></g>`;
  } else if (els.printCoverArtwork.checked) {
    cover = `<g font-family="Arial,sans-serif" fill="${ink}"><text x="${cx+d.panelW/2}" y="${cy+15}" text-anchor="middle" font-size="${titleSize(count,4.4)}" font-weight="700" letter-spacing=".35">${count}</text><text x="${cx+d.panelW/2}" y="${cy+d.panelH*.43}" text-anchor="middle" font-size="${titleSize(els.titleOne.value)}" font-weight="800">${t1}</text><text x="${cx+d.panelW/2}" y="${cy+d.panelH*.43+14}" text-anchor="middle" font-size="${titleSize(els.titleTwo.value)}" font-weight="800">${t2}</text><text x="${cx+d.panelW/2}" y="${cy+d.panelH-12}" text-anchor="middle" font-size="${titleSize(els.subtitle.value,4.4)}" font-weight="700">${sub}</text></g>`;
  }
  const clips = `<defs><clipPath id="case-cover"><rect x="${cx+1}" y="${cy+1}" width="${d.panelW-2}" height="${d.panelH-2}"/></clipPath><clipPath id="case-right-wing"><rect x="${rightBackX+2}" y="${cy+2}" width="${d.wingW-12}" height="${d.panelH-4}"/></clipPath></defs>`;
  const backWidth = d.wingW-18, backX = rightBackX+6;
  const dateLines = dates.includes(" — ") ? dates.split(" — ") : [dates], cameraLines = cameras.includes(" / ") ? cameras.split(" / ") : [cameras];
  const microLabel = `font-family="Arial,sans-serif" fill="${ink}" font-size="1.55" font-weight="700" letter-spacing=".35"`;
  const back = `<g clip-path="url(#case-right-wing)" font-family="Arial,sans-serif" fill="${ink}">${wrappedSvgText(`ARCHIVE / ${countRaw}`,backX,cy+14,backWidth,2.45,1.8,`font-family="Arial,sans-serif" fill="${ink}" font-weight="700"`,2,1.12)}<line x1="${backX}" y1="${cy+20}" x2="${backX+backWidth}" y2="${cy+20}" stroke="${ink}" stroke-width=".3"/><text x="${backX}" y="${cy+25}" ${microLabel}>DATE RANGE</text>${wrappedSvgText(dateLines,backX,cy+29,backWidth,2.65,1.8,`font-family="Arial,sans-serif" fill="${ink}"`,2,1.15)}<text x="${backX}" y="${cy+41}" ${microLabel}>CAMERAS</text>${wrappedSvgText(cameraLines,backX,cy+45,backWidth,2.5,1.7,`font-family="Arial,sans-serif" fill="${ink}"`,2,1.15)}<text x="${backX}" y="${cy+d.panelH-25}" ${microLabel}>FORMAT</text>${wrappedSvgText(`${d.photoW} × ${d.photoH} MM`,backX,cy+d.panelH-20,backWidth,2.7,1.8,`font-family="Arial,sans-serif" fill="${ink}"`,2,1.15)}<text x="${backX}" y="${cy+d.panelH-11}" ${microLabel}>CAPACITY</text>${wrappedSvgText(`${d.depth.toFixed(1)} MM`,backX,cy+d.panelH-6,backWidth,2.7,1.8,`font-family="Arial,sans-serif" fill="${ink}"`,2,1.15)}</g>`;
  const sides = !els.printSideArtwork.checked ? "" : `<g font-family="Arial,sans-serif" fill="${ink}" font-size="3.1" font-weight="700" letter-spacing=".35"><text x="${cx-d.depth/2}" y="${cy+d.panelH/2}" text-anchor="middle" transform="rotate(-90 ${cx-d.depth/2} ${cy+d.panelH/2})">${side}</text><text x="${cx+d.panelW+d.depth/2}" y="${cy+d.panelH/2}" text-anchor="middle" transform="rotate(90 ${cx+d.panelW+d.depth/2} ${cy+d.panelH/2})">${side}</text></g>`;
  return `${clips}<g id="ARTWORK"><g clip-path="url(#case-cover)">${cover}</g>${back}${sides}</g>`;
}
function caseData() {
  const photoW = n("photoWidth", 108), photoH = n("photoHeight", 86), stock = caseThickness();
  const innerW = photoW + 3, innerH = photoH + 3, depth = Math.max(3, photos.length * photoThickness() + 2 * stock + 1.2);
  const panelW = innerW + 2 * stock, panelH = innerH + 2 * stock;
  const overlap = Math.min(24, Math.max(16, panelW * .17)), wingW = panelW/2 + overlap/2, tabReach = 8;
  const sheet = currentSheet(), margin = n("pageMargin", 6), desiredRetainerLeaf = panelH/2 + 2;
  const availableRetainerLeaf = Math.max(11, (sheet.h-2*margin-panelH)/2-depth);
  const retainerLeaf = Math.min(desiredRetainerLeaf, availableRetainerLeaf), lockTabH = Math.min(42, Math.max(30, panelH * .42));
  const flapClearance = Math.max(1, stock * 4), bevel = Math.min(4, Math.max(2.5, depth * .45 + 1.5));
  const retainerOverlap = Math.max(0,2*retainerLeaf-panelH);
  return { photoW, photoH, stock, innerW, innerH, depth, panelW, panelH, overlap, wingW, tabReach, retainerLeaf, retainerOverlap, lockTabH, flapClearance, bevel, w: panelW + 2*(depth+wingW) + tabReach, h: panelH + 2*(depth+retainerLeaf) };
}
function caseSvg(print = false, exportNet = false, requestedFace = els.casePreviewFace.value) {
  const d = caseData(), chosenSheet = currentSheet(), margin = n("pageMargin", 6), face = requestedFace || "outside";
  const fits = d.w <= chosenSheet.w - 2 * margin && d.h <= chosenSheet.h - 2 * margin;
  const sheet = exportNet ? { w: d.w + 12, h: d.h + 12, label: "SVG" } : chosenSheet;
  const netX = (sheet.w-d.w)/2, netY = (sheet.h-d.h)/2, cx = netX+d.wingW+d.depth, cy = netY+d.retainerLeaf+d.depth;
  const leftOuter = netX, leftWall = cx-d.depth, rightWall = cx+d.panelW+d.depth, rightBase = rightWall+d.wingW, tipEdge = rightBase+d.tabReach;
  const topOuter = netY, bottomOuter = cy+d.panelH+d.depth+d.retainerLeaf, ink = esc(els.inkColor.value), paper = esc(els.paperColor.value);
  const countLabel = `${photos.length} ${photos.length === 1 ? "photo" : "photos"}`, q = els.quantity.value.trim() || "Photo Set";
  const c = d.flapClearance, b = d.bevel, half = d.lockTabH/2, tabCenter = cy+d.panelH/2, tabBevel = 3;
  const tab = (center) => `V${center-half}L${tipEdge-tabBevel} ${center-half}L${tipEdge} ${center-half+tabBevel}V${center+half-tabBevel}L${tipEdge-tabBevel} ${center+half}H${rightBase}`;
  const cutPath = `M${cx} ${cy}H${cx+c}L${cx+c+b} ${topOuter}H${cx+d.panelW-c-b}L${cx+d.panelW-c} ${cy}H${rightBase-b}L${rightBase} ${cy+b}${tab(tabCenter)}V${cy+d.panelH-b}L${rightBase-b} ${cy+d.panelH}H${cx+d.panelW-c}L${cx+d.panelW-c-b} ${bottomOuter}H${cx+c+b}L${cx+c} ${cy+d.panelH}H${leftOuter+b}L${leftOuter} ${cy+d.panelH-b}V${cy+b}L${leftOuter+b} ${cy}Z`;
  const foldPath = `M${cx+c} ${cy}H${cx+d.panelW-c}M${cx+c+b} ${cy-d.depth}H${cx+d.panelW-c-b}M${cx+c} ${cy+d.panelH}H${cx+d.panelW-c}M${cx+c+b} ${cy+d.panelH+d.depth}H${cx+d.panelW-c-b}M${cx} ${cy}V${cy+d.panelH}M${leftWall} ${cy+b}V${cy+d.panelH-b}M${cx+d.panelW} ${cy}V${cy+d.panelH}M${rightWall} ${cy+b}V${cy+d.panelH-b}M${rightBase} ${tabCenter-half}V${tabCenter+half}`;
  const slotShift = Math.min(4,d.overlap*.22), slotX = leftWall-(d.panelW-d.wingW+1)+slotShift, slotPad = 1.2;
  const slots = `<path d="M${slotX} ${tabCenter-half-slotPad}V${tabCenter+half+slotPad}"/>`;
  const artwork = caseArtwork(d,cx,cy,ink,q,countLabel);
  const instructionSize = Math.min(2.7,d.panelW/24);
  const foldSteps = els.showFoldInstructions.checked
    ? `<g text-anchor="middle"><text x="${cx+d.panelW/2}" y="${cy+d.panelH*.32}" font-size="2.25" letter-spacing=".45">ASSEMBLY</text><text x="${cx+d.panelW/2}" y="${cy+d.panelH*.43}" font-size="${instructionSize}">1 · SCORE EVERY DASHED LINE</text><text x="${cx+d.panelW/2}" y="${cy+d.panelH*.50}" font-size="${instructionSize}">2 · FOLD TOP + BOTTOM IN</text><text x="${cx+d.panelW/2}" y="${cy+d.panelH*.57}" font-size="${instructionSize}">3 · WRAP THE SLOTTED WING</text><text x="${cx+d.panelW/2}" y="${cy+d.panelH*.64}" font-size="${instructionSize}">4 · WRAP + INSERT CENTER TAB</text></g>`
    : `<text x="${cx+d.panelW/2}" y="${cy+d.panelH/2}" text-anchor="middle">FRONT / PHOTO BED</text>`;
  const previewFooter = print ? "" : `<text x="${sheet.w/2}" y="${sheet.h-5}" text-anchor="middle" font-size="2.6" font-weight="400">SOLID = CUT · DASHED = SCORE · PRINT AT 100%</text>`;
  const guideLabels = `<g id="LABELS" font-family="Arial,sans-serif" fill="#6c625d" font-size="3.1" font-weight="700" letter-spacing=".25">${foldSteps}<text x="${cx+d.panelW/2}" y="${cy-d.depth-d.retainerLeaf/2}" text-anchor="middle">TOP RETAINER · FOLD IN${d.retainerOverlap ? " + OVERLAP" : ""}</text><text x="${cx+d.panelW/2}" y="${cy+d.panelH+d.depth+d.retainerLeaf/2}" text-anchor="middle">BOTTOM RETAINER · FOLD IN${d.retainerOverlap ? " + OVERLAP" : ""}</text><text x="${leftOuter+d.wingW/2}" y="${cy+d.panelH/2}" text-anchor="middle" transform="rotate(-90 ${leftOuter+d.wingW/2} ${cy+d.panelH/2})">UNDER WING · ONE CENTER SLOT</text><text x="${rightWall+d.wingW/2}" y="${cy+d.panelH/2}" text-anchor="middle" transform="rotate(90 ${rightWall+d.wingW/2} ${cy+d.panelH/2})">TOP WING · ARTWORK + ONE WIDE TAB</text>${previewFooter}</g>`;
  const guide = `<g id="INSIDE_GUIDE"><path d="${cutPath}" fill="${paper}" fill-opacity=".34"/><g id="CUT" fill="none" stroke="#252220" stroke-width=".38"><path d="${cutPath}"/>${slots}</g><g id="SCORE" fill="none" stroke="${ink}" stroke-width=".28" stroke-dasharray="2 1.4"><path d="${foldPath}"/></g>${guideLabels}</g>`;
  let content = face === "inside" ? guide : `<path d="${cutPath}" fill="${paper}"/>${artwork}`;
  if (face === "inside" && els.backOrientation.value === "rotate") content = `<g transform="rotate(180 ${sheet.w/2} ${sheet.h/2})">${content}</g>`;
  return { fits, data: d, face, svg: `<svg${print ? ' class="print-page"' : ""} xmlns="http://www.w3.org/2000/svg" width="${sheet.w}mm" height="${sheet.h}mm" viewBox="0 0 ${sheet.w} ${sheet.h}" role="img" aria-label="Cross-wrap no-glue photo container ${face}">${print ? "" : '<rect width="100%" height="100%" fill="white"/>'}${content}${print ? "" : sheetPrintGuide(sheet)}</svg>` };
}

function overviewCard(title, note, markup, printKind, buttonLabel, disabled = false) {
  return `<article class="preview-card"><header><div><strong>${esc(title)}</strong><span>${esc(note)}</span></div><button type="button" data-print-kind="${printKind}"${disabled ? " disabled" : ""}>${esc(buttonLabel)}</button></header><div class="mini-sheet">${markup}</div></article>`;
}
function renderOverview(l, plan) {
  const outside = caseSvg(false, false, "outside"), inside = caseSvg(false, false, "inside"), noPhotos = !photos.length || !plan.valid || !plan.pages.length;
  els.previewTitle.textContent = "All previews";
  els.previewSummary.textContent = "Each piece prints separately; use the paired duplex buttons when printing both sides.";
  els.sheetViewport.classList.add("overview-grid");
  els.sheetViewport.innerHTML = [
    overviewCard("1. Photo fronts", photos.length ? `${plan.pages.length} sheet${plan.pages.length === 1 ? "" : "s"} · orientation matched` : "Add photos to populate", photos.length ? pageSvg("fronts",0) : '<div class="empty-preview">Your printable photo sheet will appear here</div>', "fronts", "Print fronts", noPhotos),
    overviewCard("2. Metadata backs", "Aligned to the photo fronts", photos.length ? pageSvg("backs",0) : '<div class="empty-preview">Metadata backs appear after photos are added</div>', "backs", "Print backs", noPhotos),
    overviewCard("3. Package artwork", outside.fits ? `Outside · ${outside.data.w.toFixed(1)} × ${outside.data.h.toFixed(1)} mm` : `Does not fit ${currentSheet().label}`, outside.svg, "case-outside", "Print artwork", !outside.fits),
    overviewCard("4. Cut + fold guide", "Print on the inside of the package sheet", inside.svg, "case-inside", "Print guide", !inside.fits),
  ].join("");
  els.sheetViewport.querySelectorAll("[data-print-kind]").forEach((button) => button.addEventListener("click", () => printKind(button.dataset.printKind)));
  els.fitMessage.textContent = `Use “Download exact photos PDF” for photo fronts plus aligned metadata backs, and “Download exact case PDF” for the package. Individual preview-card Print buttons use the legacy browser path and may be scaled by AirPrint.${isIOSDevice() ? " PDFs open in a separate tab so this project and its selected photos stay intact." : ""}`;
}

function render() {
  save(); renderPhotoList(); document.documentElement.style.setProperty("--accent", els.inkColor.value);
  els.photoThicknessLabel.classList.toggle("hidden", els.photoMaterial.value !== "custom");
  els.caseThicknessLabel.classList.toggle("hidden", els.caseMaterial.value !== "custom");
  const l = layout(), plan = photoPagePlan(), photoPages = Math.max(1,plan.pages.length), total = (view === "case" || view === "overview") ? 1 : photoPages;
  page = Math.max(0, Math.min(page, total - 1));
  document.querySelectorAll(".view-tabs button").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  els.prevPage.disabled = page === 0; els.nextPage.disabled = page >= total - 1; els.pageIndicator.textContent = `${page + 1} / ${total}`;
  els.printDuplexButton.disabled = !photos.length || !plan.valid || !plan.pages.length; els.printCaseDuplexButton.disabled = true; els.printCurrentButton.disabled = view === "overview" || ((view !== "case" && !photos.length) || !plan.valid || !plan.pages.length);
  els.sheetViewport.classList.remove("overview-grid"); els.sheetViewport.style.aspectRatio = `${currentSheet().w}/${currentSheet().h}`; els.fitMessage.classList.remove("warning");
  document.querySelector(".page-nav").classList.toggle("hidden", view === "overview"); document.querySelector(".sheet-stage").classList.toggle("overview-stage", view === "overview");
  if (view === "overview") {
    renderOverview(l,plan);
    const c = caseSvg(); els.printCaseDuplexButton.disabled = !c.fits;
  } else if (view === "case") {
    const c = caseSvg(); els.previewTitle.textContent = `Container · ${c.face === "inside" ? "inside guide" : "outside artwork"}`;
    els.previewSummary.textContent = `Cross-wrap · ${c.data.photoW} × ${c.data.photoH} × ${c.data.depth.toFixed(1)} mm stack · ${c.data.w.toFixed(1)} × ${c.data.h.toFixed(1)} mm net · ${c.data.retainerOverlap ? `${c.data.retainerOverlap.toFixed(1)} mm retainer overlap` : "retainers limited by sheet size"}`;
    els.sheetViewport.innerHTML = c.svg; els.printCurrentButton.disabled = !c.fits; els.printCaseDuplexButton.disabled = !c.fits;
    if (c.fits && c.face === "outside") els.fitMessage.textContent = `Outside artwork fits ${currentSheet().label} at 100%. The blank slotted wing folds underneath; the printed tabbed wing folds over it so its text remains visible.`;
    else if (c.fits) els.fitMessage.textContent = `Inside guide fits ${currentSheet().label} at 100%. Cut solid lines, score dashed lines, fold the extended top and bottom retainers inward, wrap the blank slotted wing first, then fold the printed wing over it and insert the single wide center tab.${c.data.retainerOverlap ? ` The retainers overlap by ${c.data.retainerOverlap.toFixed(1)} mm.` : " Retainer length is capped by the selected sheet."}`;
    else { els.fitMessage.classList.add("warning"); els.fitMessage.textContent = `This ${c.data.w.toFixed(1)} × ${c.data.h.toFixed(1)} mm net does not fit ${currentSheet().label} at 100%. Download the SVG for a larger sheet, or choose a smaller photo format.`; }
  } else {
    els.previewTitle.textContent = view === "fronts" ? "Photo fronts" : "Metadata backs";
    if (!plan.valid) {
      els.previewSummary.textContent = "Photo is larger than the printable area"; els.sheetViewport.innerHTML = '<div class="empty-sheet">Choose a larger sheet or smaller finished photo.</div>';
      els.fitMessage.classList.add("warning"); els.fitMessage.textContent = "No photos fit with the current size, margins, and gaps.";
    } else if (!photos.length) {
      els.previewSummary.textContent = "Select photos to begin"; els.sheetViewport.innerHTML = '<div class="empty-sheet">Select all the images for this case.</div>';
      els.fitMessage.textContent = `${l.cols} × ${l.rows} layout · up to ${l.perPage} photos per ${l.sheet.label} sheet.`;
    } else {
      els.previewSummary.textContent = `${photos.length} photos · portrait/landscape matched · ${photoPages} page${photoPages === 1 ? "" : "s"}`;
      els.sheetViewport.innerHTML = pageSvg(view, page);
      const straightCut = els.sizePreset.value === "4r" && els.sheetSize.value === "a4" ? " Two 4R prints share a straight cut line for guillotine trimming." : "";
      els.fitMessage.textContent = view === "fronts" ? `Print at 100% / actual size on ${els.printPaper.options[els.printPaper.selectedIndex].text}. Portrait files use portrait frames and landscape files use landscape frames. Crop marks are included.${straightCut}` : `The metadata top follows each image top. ${duplexDriverHint()}`;
    }
  }
}
function duplexDriverHint() {
  if (els.backOrientation.value === "epson-left-right") return 'Epson L6170 / AirPrint correction is active: the back page is intentionally pre-rotated 180° to cancel the printer\'s opposite-edge flip.';
  return els.backOrientation.value === "left-right"
    ? 'For this landscape PDF, select Epson "Flip on short edge" so it reads correctly when turned left to right.'
    : 'For this landscape PDF, select Epson "Flip on long edge" so it reads correctly when turned top to bottom.';
}
function isIOSDevice() { return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }
function portraitSafeMarkup(markup,sheet) {
  if (sheet.w <= sheet.h) return markup;
  const holder = document.createElement("div"); holder.innerHTML = markup;
  holder.querySelectorAll("svg.print-page").forEach((svg) => {
    const original = svg.innerHTML;
    svg.setAttribute("width",`${sheet.h}mm`); svg.setAttribute("height",`${sheet.w}mm`);
    svg.setAttribute("viewBox",`0 0 ${sheet.h} ${sheet.w}`);
    svg.innerHTML = `<g transform="translate(${sheet.h} 0) rotate(90)">${original}</g>`;
  });
  return holder.innerHTML;
}
function bytes(value) { return new TextEncoder().encode(value); }
function joinBytes(parts) {
  const length = parts.reduce((sum,part) => sum+part.length,0), result = new Uint8Array(length);
  let offset = 0; parts.forEach((part) => { result.set(part,offset); offset += part.length; });
  return result;
}
function pdfFromJpegs(images,pageWmm,pageHmm) {
  const pageW = pageWmm*72/25.4, pageH = pageHmm*72/25.4, objects = [null,null];
  const pages = [];
  images.forEach((image,index) => {
    const imageId = 3+index*3, contentId = imageId+1, pageId = imageId+2;
    const command = `q\n${pageW.toFixed(4)} 0 0 ${pageH.toFixed(4)} 0 0 cm\n/Im${index+1} Do\nQ\n`;
    objects[imageId-1] = { prefix: `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.data.length} >>\nstream\n`, stream: image.data };
    objects[contentId-1] = { prefix: `<< /Length ${bytes(command).length} >>\nstream\n`, stream: bytes(command) };
    objects[pageId-1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW.toFixed(4)} ${pageH.toFixed(4)}] /Resources << /XObject << /Im${index+1} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`;
    pages.push(`${pageId} 0 R`);
  });
  objects[0] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[1] = `<< /Type /Pages /Kids [${pages.join(" ")}] /Count ${pages.length} >>`;
  const output = [bytes("%PDF-1.4\n%PDFPHOTO\n")], offsets = [0];
  for (let i=0;i<objects.length;i++) {
    offsets.push(output.reduce((sum,part) => sum+part.length,0));
    const object = objects[i], header = bytes(`${i+1} 0 obj\n`), footer = bytes("\nendobj\n");
    if (typeof object === "string") output.push(header,bytes(object),footer);
    else output.push(header,bytes(object.prefix),object.stream,bytes("\nendstream"),footer);
  }
  const xrefAt = output.reduce((sum,part) => sum+part.length,0);
  const xref = [`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`,...offsets.slice(1).map((offset) => `${String(offset).padStart(10,"0")} 00000 n \n`)].join("");
  output.push(bytes(xref),bytes(`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`));
  return joinBytes(output);
}
async function svgToJpeg(svg,pageWmm,pageHmm,dpi=240) {
  const source = new XMLSerializer().serializeToString(svg), url = URL.createObjectURL(new Blob([source],{type:"image/svg+xml;charset=utf-8"}));
  try {
    const image = new Image();
    await new Promise((resolve,reject) => { image.onload = resolve; image.onerror = () => reject(new Error("Could not render the PDF page.")); image.src = url; });
    const canvas = document.createElement("canvas"), width = Math.round(pageWmm/25.4*dpi), height = Math.round(pageHmm/25.4*dpi);
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d",{alpha:false}); context.fillStyle = "#fff"; context.fillRect(0,0,width,height); context.drawImage(image,0,0,width,height);
    const jpeg = await new Promise((resolve,reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not encode the PDF page.")),"image/jpeg",.96));
    return { data:new Uint8Array(await jpeg.arrayBuffer()), width, height };
  } finally { URL.revokeObjectURL(url); }
}
function blobAsDataUrl(blob) {
  return new Promise((resolve,reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(reader.error || new Error("Could not embed a photo.")); reader.readAsDataURL(blob);
  });
}
async function inlineSvgImages(svgs) {
  const cache = new Map();
  for (const image of svgs.flatMap((svg) => [...svg.querySelectorAll("image")])) {
    const href = image.getAttribute("href") || image.getAttributeNS("http://www.w3.org/1999/xlink","href");
    if (!href || href.startsWith("data:")) continue;
    if (!cache.has(href)) cache.set(href,blobAsDataUrl(await (await fetch(href)).blob()));
    const dataUrl = await cache.get(href); image.setAttribute("href",dataUrl); image.setAttributeNS("http://www.w3.org/1999/xlink","href",dataUrl);
  }
}
async function downloadExactPdf(markup,filename,button,preserveLandscape=false) {
  const pdfTab = isIOSDevice() ? window.open("","_blank") : null;
  if (pdfTab) {
    pdfTab.document.open(); pdfTab.document.write(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Building PDF</title><style>body{font:16px -apple-system,BlinkMacSystemFont,sans-serif;padding:28px;color:#282422}p{color:#6f6864}</style><h1>Building exact PDF…</h1><p>Keep this tab open. Your Photo Packager project remains in the previous tab.</p>`); pdfTab.document.close();
  }
  const sheet = currentSheet(), page = preserveLandscape ? sheet : (sheet.w > sheet.h ? {w:sheet.h,h:sheet.w} : sheet);
  const holder = document.createElement("div"); holder.innerHTML = preserveLandscape ? markup : portraitSafeMarkup(markup,sheet);
  const svgs = [...holder.querySelectorAll("svg.print-page")];
  if (!svgs.length) throw new Error("No printable pages were generated.");
  const originalText = button.textContent; button.disabled = true; button.textContent = "Building exact PDF…";
  try {
    await inlineSvgImages(svgs);
    const images = [];
    for (const svg of svgs) images.push(await svgToJpeg(svg,page.w,page.h));
    const pdf = pdfFromJpegs(images,page.w,page.h), href = URL.createObjectURL(new Blob([pdf],{type:"application/pdf"}));
    if (pdfTab) pdfTab.location.replace(href);
    else {
      const link = document.createElement("a"); link.href = href; link.download = filename; document.body.append(link); link.click(); link.remove();
    }
    setTimeout(() => URL.revokeObjectURL(href),180000);
    els.fitMessage.classList.remove("warning"); els.fitMessage.textContent = `${pdfTab ? "Opened" : "Downloaded"} ${filename} as a ${page.w} × ${page.h} mm PDF. Your selected photos remain in this tab.`;
  } catch (error) {
    if (pdfTab && !pdfTab.closed) pdfTab.close();
    els.fitMessage.classList.add("warning"); els.fitMessage.textContent = error.message || "Could not build the PDF.";
  } finally { button.disabled = false; button.textContent = originalText; }
}
function mobilePrintDocument(markup,title) {
  const popup = window.open("","_blank");
  if (!popup) {
    els.fitMessage.classList.add("warning");
    els.fitMessage.textContent = "This in-app browser blocked the printable document. Use the browser menu to open Photo Packager in Safari, then press the print button again.";
    return false;
  }
  const sheet = currentSheet(), photoOutput = /photo fronts|metadata backs|photos duplex/i.test(title);
  const printSheet = photoOutput ? sheet : (sheet.w > sheet.h ? {w:sheet.h,h:sheet.w} : sheet), safeMarkup = photoOutput ? markup : portraitSafeMarkup(markup,sheet);
  popup.document.open();
  const calibrationCopy = title.includes("size test") ? "The entire test is inset from the paper edge. The calibration bar must measure exactly 100 mm." : "Production pages omit the page-edge guide, full-page background, and footer so only the inset artwork is printable. Use the separate Print size test first.";
  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>:root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#282422}*{box-sizing:border-box}body{margin:0;background:#ddd8d3}.print-controls{position:sticky;top:0;z-index:5;padding:14px;background:#fffdfb;border-bottom:1px solid #d5cfca}.print-controls h1{margin:0 0 5px;font-size:18px}.print-controls p{max-width:720px;margin:0 0 10px;color:#6f6864;font-size:13px;line-height:1.4}.print-controls button{min-height:42px;padding:0 16px;border:0;border-radius:7px;background:#c94f3f;color:#fff;font:inherit;font-weight:700}.pages{display:grid;gap:18px;padding:18px}.print-page{display:block;width:${printSheet.w}mm;height:${printSheet.h}mm;max-width:100%;margin:auto;background:white;box-shadow:0 8px 25px rgba(30,20,15,.18)}@page{size:${printSheet.w}mm ${printSheet.h}mm;margin:0}@media print{html,body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}.print-controls{display:none}.pages{display:block;padding:0}.print-page{width:${printSheet.w}mm!important;height:${printSheet.h}mm!important;max-width:none;margin:0;box-shadow:none;break-after:page;page-break-after:always}}</style></head><body><header class="print-controls"><h1>${esc(title)}</h1><p>Confirm the printer tray and print sheet both say A4, then choose Actual Size / 100%. ${duplexDriverHint()} ${calibrationCopy} If iPhone AirPrint still shrinks it, save the preview as a PDF and print it with Epson iPrint or a desktop PDF viewer at 100%.</p><button type="button" onclick="window.print()">Print / Save PDF</button></header><main class="pages">${safeMarkup}</main></body></html>`);
  popup.document.close();
  return true;
}
function printMarkup(markup,title="Photo Packager") {
  els.printRoot.innerHTML = markup;
  if (isIOSDevice()) { mobilePrintDocument(markup,title); return; }
  const sheet = currentSheet(); let printStyle = $("dynamicPrintStyle");
  if (!printStyle) { printStyle = document.createElement("style"); printStyle.id = "dynamicPrintStyle"; document.head.append(printStyle); }
  printStyle.textContent = `@page{size:${sheet.w}mm ${sheet.h}mm;margin:0}@media print{.print-page{width:${sheet.w}mm!important;height:${sheet.h}mm!important}}`;
  void els.printRoot.offsetHeight;
  window.print();
}
function printCurrent() {
  if (view === "case") { const c = caseSvg(true); if (c.fits) printMarkup(c.svg,`Photo Packager · ${c.face === "inside" ? "cut and fold guide" : "package artwork"}`); return; }
  const pages = photoPagePlan().pages.length;
  printMarkup(Array.from({ length: pages }, (_, i) => pageSvg(view, i, true)).join(""),`Photo Packager · ${view === "fronts" ? "photo fronts" : "metadata backs"}`);
}
function printDuplex() {
  const pages = photoPagePlan().pages.length;
  printMarkup(Array.from({ length: pages }, (_, i) => pageSvg("fronts", i, true) + pageSvg("backs", i, true)).join(""),"Photo Packager · photos duplex");
}
async function downloadPhotosPdf() {
  const pages = photoPagePlan().pages.length;
  if (!pages) return;
  const markup = Array.from({length:pages},(_,i) => pageSvg("fronts",i,true)+pageSvg("backs",i,true)).join("");
  const correction = els.backOrientation.value === "epson-left-right" ? "-epson-airprint" : "";
  await downloadExactPdf(markup,`photo-packager-${els.sizePreset.value}-photos-duplex${correction}.pdf`,els.printDuplexButton,true);
}
function printKind(kind) {
  const pages = photoPagePlan().pages.length;
  if (kind === "fronts" || kind === "backs") {
    if (pages) printMarkup(Array.from({length:pages},(_,i) => pageSvg(kind,i,true)).join(""),`Photo Packager · ${kind === "fronts" ? "photo fronts" : "metadata backs"}`);
    return;
  }
  const face = kind === "case-inside" ? "inside" : "outside", c = caseSvg(true,false,face);
  if (c.fits) printMarkup(c.svg,`Photo Packager · ${face === "inside" ? "cut and fold guide" : "package artwork"}`);
}
function printCaseDuplex() {
  const outside = caseSvg(true, false, "outside"), inside = caseSvg(true, false, "inside");
  if (outside.fits) printMarkup(outside.svg + inside.svg,"Photo Packager · package duplex");
}
async function downloadCalibrationPdf() {
  await downloadExactPdf(calibrationSvg(true),"photo-packager-size-test-a4.pdf",els.printCalibrationButton);
}
async function downloadCasePdf() {
  const outside = caseSvg(true,false,"outside"), inside = caseSvg(true,false,"inside");
  if (!outside.fits) {
    els.fitMessage.classList.add("warning"); els.fitMessage.textContent = "The current package does not fit the selected sheet at 100%."; return;
  }
  await downloadExactPdf(outside.svg+inside.svg,`photo-packager-case-${outside.data.photoW}x${outside.data.photoH}mm.pdf`,els.downloadCasePdfButton);
}
function downloadCase() {
  const c = caseSvg(false, true, els.casePreviewFace.value), holder = document.createElement("div"); holder.innerHTML = c.svg;
  const source = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(holder.firstElementChild)}`;
  const href = URL.createObjectURL(new Blob([source], { type: "image/svg+xml" })), a = document.createElement("a");
  a.href = href; a.download = `photo-case-${c.face}-${c.data.photoW}x${c.data.photoH}x${c.data.depth.toFixed(1)}mm.svg`; a.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);
}
function reset() {
  photos.forEach((p) => URL.revokeObjectURL(p.url)); photos = [];
  settingsIds.forEach((id) => { if (els[id].type === "checkbox") els[id].checked = defaults[id]; else els[id].value = defaults[id]; });
  localStorage.removeItem("photo-packager-v1"); view = "overview"; page = 0; render();
}

els.photoInput.addEventListener("change", () => addFiles(els.photoInput.files));
els.singlePhotoInput.addEventListener("change", () => addFiles(els.singlePhotoInput.files));
const pickerCancelled = () => { els.pickerStatus.textContent = "The iPhone picker returned no files. Try fewer photos, wait for iCloud downloads, or use “Add one at a time”."; };
els.photoInput.addEventListener("cancel", pickerCancelled); els.singlePhotoInput.addEventListener("cancel", pickerCancelled);
settingsIds.forEach((id) => els[id].addEventListener("input", () => {
  if (id === "sizePreset" && sizes[els.sizePreset.value]) {
    [els.photoWidth.value, els.photoHeight.value] = sizes[els.sizePreset.value];
    const recommended = presetDefaults[els.sizePreset.value];
    if (recommended) Object.entries(recommended).forEach(([key,value]) => { els[key].value = value; });
  }
  if (id === "sheetSize" && els.sheetSize.value === "4r") { els.pageMargin.value = "0"; els.photoGap.value = "0"; }
  if ((id === "photoWidth" || id === "photoHeight") && sizes[els.sizePreset.value]) els.sizePreset.value = "custom";
  page = 0; render();
}));
document.querySelectorAll(".view-tabs button").forEach((button) => button.addEventListener("click", () => { view = button.dataset.view; page = 0; render(); }));
els.prevPage.addEventListener("click", () => { page--; render(); }); els.nextPage.addEventListener("click", () => { page++; render(); });
els.resetButton.addEventListener("click", reset); els.downloadButton.addEventListener("click", downloadCase);
els.printCurrentButton.addEventListener("click", printCurrent); els.printDuplexButton.addEventListener("click", downloadPhotosPdf); els.printCaseDuplexButton.addEventListener("click", printCaseDuplex); els.printCalibrationButton.addEventListener("click", downloadCalibrationPdf); els.downloadCasePdfButton.addEventListener("click", downloadCasePdf);
els.advancedButton.addEventListener("click", () => els.advancedDialog.showModal());
els.closeAdvancedButton.addEventListener("click", () => els.advancedDialog.close());
els.advancedDialog.addEventListener("click", (event) => { if (event.target === els.advancedDialog) els.advancedDialog.close(); });
window.addEventListener("afterprint", () => { els.printRoot.innerHTML = ""; });
document.querySelectorAll(".advanced-only").forEach((node) => els.advancedBody.append(node));
load(); render();
