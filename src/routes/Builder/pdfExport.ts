import { jsPDF } from 'jspdf';
import type { TextOptionsLight } from 'jspdf';
import { formatTime } from './utils';
import type { useBuilderForm } from './useBuilderForm';

type DensityMode = 'normal' | 'compact' | 'tight';
type FormData = ReturnType<typeof useBuilderForm>['form'];

const PX_TO_MM = 25.4 / 96;
const PX_TO_PT = 72 / 96;
const PT_TO_MM = 25.4 / 72;
const FONT_FILE_REGULAR = 'Deng.ttf';
const FONT_FILE_BOLD = 'Dengb.ttf';
const FONT_NAME = 'DengXian';

const COLORS = {
  title: [17, 24, 39],
  body: [55, 65, 81],
  contact: [75, 85, 99],
  muted: [107, 114, 128],
  link: [37, 99, 235],
  line: [31, 41, 55],
} as const;

const densityConfig = {
  normal: {
    marginMm: pxToMm(40),
    titlePt: pxToPt(24),
    sectionTitlePt: pxToPt(16),
    textPt: pxToPt(14),
    lineHeight: 1.5,
    sectionGapMm: pxToMm(20),
    itemGapMm: pxToMm(12),
    h2PaddingMm: pxToMm(8),
    h2MarginMm: pxToMm(8),
    titleGapMm: pxToMm(4),
    subTitleGapMm: pxToMm(4),
    descGapMm: pxToMm(4),
    rowGapMm: pxToMm(4),
    columnGapMm: pxToMm(12),
    bulletIndentMm: pxToMm(4),
    dateGapMm: pxToMm(8),
    photoWmm: pxToMm(80),
    photoHmm: pxToMm(112),
  },
  compact: {
    marginMm: pxToMm(32),
    titlePt: pxToPt(20),
    sectionTitlePt: pxToPt(14),
    textPt: pxToPt(12),
    lineHeight: 1.375,
    sectionGapMm: pxToMm(12),
    itemGapMm: pxToMm(8),
    h2PaddingMm: pxToMm(8),
    h2MarginMm: pxToMm(8),
    titleGapMm: pxToMm(4),
    subTitleGapMm: pxToMm(4),
    descGapMm: pxToMm(4),
    rowGapMm: pxToMm(4),
    columnGapMm: pxToMm(12),
    bulletIndentMm: pxToMm(4),
    dateGapMm: pxToMm(8),
    photoWmm: pxToMm(80),
    photoHmm: pxToMm(112),
  },
  tight: {
    marginMm: pxToMm(24),
    titlePt: pxToPt(18),
    sectionTitlePt: pxToPt(12),
    textPt: pxToPt(12),
    lineHeight: 1.25,
    sectionGapMm: pxToMm(8),
    itemGapMm: pxToMm(4),
    h2PaddingMm: pxToMm(8),
    h2MarginMm: pxToMm(8),
    titleGapMm: pxToMm(4),
    subTitleGapMm: pxToMm(4),
    descGapMm: pxToMm(4),
    rowGapMm: pxToMm(4),
    columnGapMm: pxToMm(12),
    bulletIndentMm: pxToMm(4),
    dateGapMm: pxToMm(8),
    photoWmm: pxToMm(64),
    photoHmm: pxToMm(88),
  },
};

type DensityConfig = (typeof densityConfig)[DensityMode];

interface ContactItem {
  text: string;
  url?: string;
  color?: readonly number[];
}

interface TextSegment {
  text: string;
  color?: readonly number[];
  bold?: boolean;
  link?: string;
}

type FontStyle = 'normal' | 'bold';

const cachedFontData: Record<string, string> = {};

function pxToMm(px: number): number {
  return px * PX_TO_MM;
}

function pxToPt(px: number): number {
  return px * PX_TO_PT;
}

function lineHeightMm(fontSizePt: number, lineHeight: number): number {
  return fontSizePt * PT_TO_MM * lineHeight;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

async function loadFontData(file: string): Promise<string> {
  if (cachedFontData[file]) return cachedFontData[file];
  const res = await fetch(`/fonts/${file}`);
  if (!res.ok) {
    throw new Error('字体加载失败，请确认 public/fonts/Deng.ttf 与 Dengb.ttf 是否存在');
  }
  const buffer = await res.arrayBuffer();
  cachedFontData[file] = arrayBufferToBase64(buffer);
  return cachedFontData[file];
}

async function ensureFont(pdf: jsPDF): Promise<void> {
  const [regularData, boldData] = await Promise.all([
    loadFontData(FONT_FILE_REGULAR),
    loadFontData(FONT_FILE_BOLD),
  ]);
  const fontList = pdf.getFontList();
  const styles = fontList[FONT_NAME] ?? [];
  if (!styles.includes('normal')) {
    pdf.addFileToVFS(FONT_FILE_REGULAR, regularData);
    pdf.addFont(FONT_FILE_REGULAR, FONT_NAME, 'normal');
  }
  if (!styles.includes('bold')) {
    pdf.addFileToVFS(FONT_FILE_BOLD, boldData);
    pdf.addFont(FONT_FILE_BOLD, FONT_NAME, 'bold');
  }
  pdf.setFont(FONT_NAME, 'normal');
}

function setTextStyle(pdf: jsPDF, sizePt: number, color: readonly number[], fontStyle: FontStyle = 'normal') {
  pdf.setFont(FONT_NAME, fontStyle);
  pdf.setFontSize(sizePt);
  pdf.setTextColor(color[0], color[1], color[2]);
}

function splitLines(
  pdf: jsPDF,
  text: string,
  width: number,
  sizePt: number,
  fontStyle: FontStyle = 'normal'
): string[] {
  pdf.setFont(FONT_NAME, fontStyle);
  pdf.setFontSize(sizePt);
  return pdf.splitTextToSize(text, width);
}

function getTextWidth(pdf: jsPDF, text: string, sizePt: number, fontStyle: FontStyle = 'normal'): number {
  pdf.setFont(FONT_NAME, fontStyle);
  pdf.setFontSize(sizePt);
  return pdf.getTextWidth(text);
}

function drawText(pdf: jsPDF, text: string, x: number, y: number, options?: TextOptionsLight) {
  const baseOptions = { baseline: 'top', ...(options || {}) };
  pdf.text(text, x, y, baseOptions);
}

function measureTextHeight(pdf: jsPDF, text: string, width: number, sizePt: number, lineHeight: number): number {
  if (!text) return 0;
  const lines = splitLines(pdf, text, width, sizePt);
  return lines.length * lineHeightMm(sizePt, lineHeight);
}

function measureMultilineHeight(
  pdf: jsPDF,
  text: string,
  width: number,
  sizePt: number,
  lineHeight: number
): number {
  if (!text) return 0;
  const lineHeightValue = lineHeightMm(sizePt, lineHeight);
  let height = 0;
  text.split('\n').forEach((line) => {
    if (!line) {
      height += lineHeightValue;
      return;
    }
    const lines = splitLines(pdf, line, width, sizePt);
    height += lines.length * lineHeightValue;
  });
  return height;
}

function ensurePageSpace(pdf: jsPDF, y: number, required: number, pageHeight: number, margin: number): number {
  if (y + required > pageHeight - margin) {
    pdf.addPage();
    return margin;
  }
  return y;
}

function truncateText(pdf: jsPDF, text: string, maxWidth: number, sizePt: number): string {
  if (getTextWidth(pdf, text, sizePt) <= maxWidth) return text;
  const ellipsis = '...';
  let current = text;
  while (current.length > 0 && getTextWidth(pdf, current + ellipsis, sizePt) > maxWidth) {
    current = current.slice(0, -1);
  }
  return current ? `${current}${ellipsis}` : text;
}

function drawTextBlock(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  sizePt: number,
  lineHeight: number,
  color: readonly number[],
  fontStyle: FontStyle = 'normal'
): number {
  if (!text) return y;
  setTextStyle(pdf, sizePt, color, fontStyle);
  const lines = splitLines(pdf, text, width, sizePt, fontStyle);
  const lineHeightValue = lineHeightMm(sizePt, lineHeight);
  lines.forEach((line) => {
    drawText(pdf, line, x, y, { baseline: 'top' });
    y += lineHeightValue;
  });
  return y;
}

function drawMultilineText(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  sizePt: number,
  lineHeight: number,
  color: readonly number[],
  fontStyle: FontStyle = 'normal'
): number {
  if (!text) return y;
  setTextStyle(pdf, sizePt, color, fontStyle);
  const lineHeightValue = lineHeightMm(sizePt, lineHeight);
  const lines = text.split('\n');
  lines.forEach((line) => {
    if (!line) {
      y += lineHeightValue;
      return;
    }
    const wrapped = splitLines(pdf, line, width, sizePt, fontStyle);
    wrapped.forEach((wrappedLine) => {
      pdf.text(wrappedLine, x, y, { baseline: 'top' });
      y += lineHeightValue;
    });
  });
  return y;
}

function measureSegmentsHeight(
  pdf: jsPDF,
  segments: TextSegment[],
  width: number,
  sizePt: number,
  lineHeight: number
): number {
  const fullText = segments.map((segment) => segment.text).join('');
  if (!fullText) return 0;
  const lines = splitLines(pdf, fullText, width, sizePt);
  return lines.length * lineHeightMm(sizePt, lineHeight);
}

function drawSegmentsBlock(
  pdf: jsPDF,
  segments: TextSegment[],
  x: number,
  y: number,
  width: number,
  sizePt: number,
  lineHeight: number,
  defaultColor: readonly number[]
): number {
  const fullText = segments.map((segment) => segment.text).join('');
  if (!fullText) return y;
  const lines = splitLines(pdf, fullText, width, sizePt);
  const lineHeightValue = lineHeightMm(sizePt, lineHeight);
  let segIndex = 0;
  let segOffset = 0;

  lines.forEach((line) => {
    let remaining = line.length;
    let cursorX = x;
    while (remaining > 0 && segIndex < segments.length) {
      const segment = segments[segIndex];
      const segmentText = segment.text;
      const available = segmentText.length - segOffset;
      const take = Math.min(remaining, available);
      const part = segmentText.slice(segOffset, segOffset + take);
      if (part) {
        const fontStyle: FontStyle = segment.bold ? 'bold' : 'normal';
        setTextStyle(pdf, sizePt, segment.color ?? defaultColor, fontStyle);
        drawText(pdf, part, cursorX, y, { baseline: 'top' });
        if (segment.link) {
          const linkWidth = getTextWidth(pdf, part, sizePt, fontStyle);
          pdf.link(cursorX, y, linkWidth, lineHeightValue, { url: segment.link });
        }
        cursorX += getTextWidth(pdf, part, sizePt, fontStyle);
      }
      remaining -= take;
      segOffset += take;
      if (segOffset >= segmentText.length) {
        segIndex += 1;
        segOffset = 0;
      }
    }
    y += lineHeightValue;
  });

  return y;
}

function drawSectionTitle(
  pdf: jsPDF,
  title: string,
  x: number,
  y: number,
  width: number,
  s: DensityConfig
): number {
  setTextStyle(pdf, s.sectionTitlePt, COLORS.title, 'bold');
  drawText(pdf, title, x, y, { baseline: 'top' });
  const lineY = y + lineHeightMm(s.sectionTitlePt, s.lineHeight) + s.h2PaddingMm;
  pdf.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);
  pdf.setLineWidth(0.3);
  pdf.line(x, lineY, x + width, lineY);
  return lineY + s.h2MarginMm;
}

function buildContacts(form: FormData): ContactItem[] {
  const contacts: ContactItem[] = [];
  if (form.basicInfo.phone) contacts.push({ text: `电话: ${form.basicInfo.phone}` });
  if (form.basicInfo.email) contacts.push({ text: `邮箱: ${form.basicInfo.email}` });
  if (form.basicInfo.city) contacts.push({ text: `城市: ${form.basicInfo.city}` });
  if (form.basicInfo.status) contacts.push({ text: `状态: ${form.basicInfo.status}` });
  if (form.basicInfo.birthYear) {
    const birth = `${form.basicInfo.birthYear}${form.basicInfo.birthMonth ? `-${form.basicInfo.birthMonth}` : ''}`;
    contacts.push({ text: `出生: ${birth}` });
  }
  if (form.basicInfo.hometown) contacts.push({ text: `籍贯: ${form.basicInfo.hometown}` });
  if (form.basicInfo.github) {
    const url = form.basicInfo.github.startsWith('http') ? form.basicInfo.github : `https://${form.basicInfo.github}`;
    contacts.push({ text: `GitHub: ${form.basicInfo.github}`, url, color: COLORS.link });
  }
  if (form.basicInfo.website) {
    const url = form.basicInfo.website.startsWith('http') ? form.basicInfo.website : `https://${form.basicInfo.website}`;
    contacts.push({ text: `网站: ${form.basicInfo.website}`, url, color: COLORS.link });
  }
  return contacts;
}

function drawContacts(
  pdf: jsPDF,
  contacts: ContactItem[],
  x: number,
  y: number,
  width: number,
  s: DensityConfig
): number {
  if (!contacts.length) return y;
  const columnWidth = (width - s.columnGapMm) / 2;
  const lineHeightValue = lineHeightMm(s.textPt, s.lineHeight);
  const rows = Math.ceil(contacts.length / 2);
  for (let row = 0; row < rows; row += 1) {
    const left = contacts[row * 2];
    const right = contacts[row * 2 + 1];
    if (left) {
      setTextStyle(pdf, s.textPt, left.color ?? COLORS.contact);
      const display = truncateText(pdf, left.text, columnWidth, s.textPt);
      if (left.url) {
        const linkWidth = getTextWidth(pdf, display, s.textPt);
        pdf.text(display, x, y, { baseline: 'top' });
        pdf.link(x, y, linkWidth, lineHeightValue, { url: left.url });
      } else {
        pdf.text(display, x, y, { baseline: 'top' });
      }
    }
    if (right) {
      const rightX = x + columnWidth + s.columnGapMm;
      setTextStyle(pdf, s.textPt, right.color ?? COLORS.contact);
      const display = truncateText(pdf, right.text, columnWidth, s.textPt);
      if (right.url) {
        const linkWidth = getTextWidth(pdf, display, s.textPt);
        pdf.text(display, rightX, y, { baseline: 'top' });
        pdf.link(rightX, y, linkWidth, lineHeightValue, { url: right.url });
      } else {
        pdf.text(display, rightX, y, { baseline: 'top' });
      }
    }
    y += lineHeightValue;
  }
  return y;
}

function measureBulletHeight(
  pdf: jsPDF,
  bullets: string[],
  width: number,
  s: DensityConfig
): number {
  const lineHeightValue = lineHeightMm(s.textPt, s.lineHeight);
  let height = 0;
  bullets.forEach((bullet) => {
    if (!bullet || !bullet.trim()) return;
    const lines = splitLines(pdf, bullet, width - s.bulletIndentMm, s.textPt);
    height += lines.length * lineHeightValue;
  });
  return height;
}

function drawBullets(
  pdf: jsPDF,
  bullets: string[],
  x: number,
  y: number,
  width: number,
  s: DensityConfig
): number {
  const lineHeightValue = lineHeightMm(s.textPt, s.lineHeight);
  setTextStyle(pdf, s.textPt, COLORS.body);
  bullets.forEach((bullet) => {
    if (!bullet || !bullet.trim()) return;
    const lines = splitLines(pdf, bullet, width - s.bulletIndentMm, s.textPt);
    lines.forEach((line, index) => {
      if (index === 0) {
        pdf.text('•', x, y, { baseline: 'top' });
        pdf.text(line, x + s.bulletIndentMm, y, { baseline: 'top' });
      } else {
        pdf.text(line, x + s.bulletIndentMm, y, { baseline: 'top' });
      }
      y += lineHeightValue;
    });
  });
  return y;
}

export async function exportToPDF(form: FormData, densityMode: DensityMode): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  await ensureFont(pdf);

  const s = densityConfig[densityMode];
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = s.marginMm;
  const contentWidth = pageWidth - margin * 2;
  const rightX = pageWidth - margin;

  let y = margin;

  const contacts = buildContacts(form);
  const hasContacts = contacts.length > 0;

  const headerStartY = y;
  const textWidth = form.photo ? contentWidth - s.photoWmm - s.columnGapMm : contentWidth;
  let textY = y;

  if (form.basicInfo.name) {
    textY = drawTextBlock(
      pdf,
      form.basicInfo.name,
      margin,
      textY,
      textWidth,
      s.titlePt,
      s.lineHeight,
      COLORS.title,
      'bold'
    );
    if (form.basicInfo.jobTitle || hasContacts) {
      textY += s.titleGapMm;
    }
  }
  if (form.basicInfo.jobTitle) {
    textY = drawTextBlock(
      pdf,
      `求职意向：${form.basicInfo.jobTitle}`,
      margin,
      textY,
      textWidth,
      s.textPt,
      s.lineHeight,
      COLORS.body
    );
    if (hasContacts) {
      textY += s.subTitleGapMm;
    }
  }
  if (hasContacts) {
    textY = drawContacts(pdf, contacts, margin, textY, textWidth, s);
  }

  if (form.photo) {
    const photoX = rightX - s.photoWmm;
    const photoFormat = form.photo.includes('image/png') ? 'PNG' : 'JPEG';
    pdf.addImage(form.photo, photoFormat, photoX, headerStartY, s.photoWmm, s.photoHmm);
  }

  const headerHeight = Math.max(textY - headerStartY, form.photo ? s.photoHmm : 0);
  y = headerStartY + headerHeight + s.sectionGapMm;

  const validEdu = form.education.filter((e) => e.school);
  if (validEdu.length > 0) {
    const sectionHeight = lineHeightMm(s.sectionTitlePt, s.lineHeight) + s.h2PaddingMm + s.h2MarginMm;
    y = ensurePageSpace(pdf, y, sectionHeight, pageHeight, margin);
    y = drawSectionTitle(pdf, '教育经历', margin, y, contentWidth, s);
    validEdu.forEach((edu) => {
      const dateText = formatTime(edu.startYear, edu.startMonth, edu.endYear, edu.endMonth);
      const dateWidth = dateText ? getTextWidth(pdf, dateText, s.textPt) + s.dateGapMm : 0;
      const leftWidth = dateText ? contentWidth - dateWidth : contentWidth;
      const leftSegments: TextSegment[] = [
        { text: edu.school, color: COLORS.title, bold: true },
      ];
      if (edu.major) leftSegments.push({ text: `  ${edu.major}`, color: COLORS.contact });
      if (edu.degree) leftSegments.push({ text: `  ${edu.degree}`, color: COLORS.muted });
      if (edu.ranking) leftSegments.push({ text: `  排名: ${edu.ranking}`, color: COLORS.muted });
      const rowHeight = Math.max(
        measureSegmentsHeight(pdf, leftSegments, leftWidth, s.textPt, s.lineHeight),
        lineHeightMm(s.textPt, s.lineHeight)
      );
      const descHeight = edu.description
        ? s.descGapMm + measureTextHeight(pdf, edu.description, contentWidth, s.textPt, s.lineHeight)
        : 0;
      const requiredHeight = rowHeight + descHeight + s.itemGapMm;
      y = ensurePageSpace(pdf, y, requiredHeight, pageHeight, margin);

      const rowStart = y;
      const rowEnd = drawSegmentsBlock(pdf, leftSegments, margin, y, leftWidth, s.textPt, s.lineHeight, COLORS.title);
      if (dateText) {
        setTextStyle(pdf, s.textPt, COLORS.muted);
        drawText(pdf, dateText, rightX, rowStart, { align: 'right', baseline: 'top' });
      }
      y = Math.max(rowEnd, rowStart + rowHeight);
      if (edu.description) {
        y += s.descGapMm;
        y = drawTextBlock(pdf, edu.description, margin, y, contentWidth, s.textPt, s.lineHeight, COLORS.body);
      }
      y += s.itemGapMm;
    });
    y += s.sectionGapMm;
  }

  if (form.skills) {
    const sectionHeight = lineHeightMm(s.sectionTitlePt, s.lineHeight) + s.h2PaddingMm + s.h2MarginMm;
    y = ensurePageSpace(pdf, y, sectionHeight, pageHeight, margin);
    y = drawSectionTitle(pdf, '专业技能', margin, y, contentWidth, s);
    const textHeight = measureMultilineHeight(pdf, form.skills, contentWidth, s.textPt, s.lineHeight);
    y = ensurePageSpace(pdf, y, textHeight, pageHeight, margin);
    y = drawMultilineText(pdf, form.skills, margin, y, contentWidth, s.textPt, s.lineHeight, COLORS.body);
    y += s.sectionGapMm;
  }

  const validExp = form.experience.filter((e) => e.company);
  if (validExp.length > 0) {
    const sectionHeight = lineHeightMm(s.sectionTitlePt, s.lineHeight) + s.h2PaddingMm + s.h2MarginMm;
    y = ensurePageSpace(pdf, y, sectionHeight, pageHeight, margin);
    y = drawSectionTitle(pdf, '工作经历', margin, y, contentWidth, s);
    validExp.forEach((exp) => {
      const dateText = formatTime(exp.startYear, exp.startMonth, exp.endYear, exp.endMonth);
      const dateWidth = dateText ? getTextWidth(pdf, dateText, s.textPt) + s.dateGapMm : 0;
      const leftWidth = dateText ? contentWidth - dateWidth : contentWidth;
      const leftSegments: TextSegment[] = [
        { text: exp.company, color: COLORS.title, bold: true },
      ];
      if (exp.position) leftSegments.push({ text: `  ${exp.position}`, color: COLORS.contact });
      if (exp.location) leftSegments.push({ text: `  ${exp.location}`, color: COLORS.muted });
      const rowHeight = Math.max(
        measureSegmentsHeight(pdf, leftSegments, leftWidth, s.textPt, s.lineHeight),
        lineHeightMm(s.textPt, s.lineHeight)
      );
      const bullets = exp.bullets.filter((b) => b && b.trim());
      const bulletHeight = bullets.length > 0 ? s.rowGapMm + measureBulletHeight(pdf, bullets, contentWidth, s) : 0;
      const requiredHeight = rowHeight + bulletHeight + s.itemGapMm;
      y = ensurePageSpace(pdf, y, requiredHeight, pageHeight, margin);

      const rowStart = y;
      const rowEnd = drawSegmentsBlock(pdf, leftSegments, margin, y, leftWidth, s.textPt, s.lineHeight, COLORS.title);
      if (dateText) {
        setTextStyle(pdf, s.textPt, COLORS.muted);
        drawText(pdf, dateText, rightX, rowStart, { align: 'right', baseline: 'top' });
      }
      y = Math.max(rowEnd, rowStart + rowHeight);
      if (bullets.length > 0) {
        y += s.rowGapMm;
        y = drawBullets(pdf, bullets, margin, y, contentWidth, s);
      }
      y += s.itemGapMm;
    });
    y += s.sectionGapMm;
  }

  const validProj = form.projects.filter((p) => p.name);
  if (validProj.length > 0) {
    const sectionHeight = lineHeightMm(s.sectionTitlePt, s.lineHeight) + s.h2PaddingMm + s.h2MarginMm;
    y = ensurePageSpace(pdf, y, sectionHeight, pageHeight, margin);
    y = drawSectionTitle(pdf, '项目经历', margin, y, contentWidth, s);
    validProj.forEach((proj) => {
      const dateText = formatTime(proj.startYear, proj.startMonth, proj.endYear, proj.endMonth);
      const dateWidth = dateText ? getTextWidth(pdf, dateText, s.textPt) + s.dateGapMm : 0;
      const leftWidth = dateText ? contentWidth - dateWidth : contentWidth;
      const leftSegments: TextSegment[] = [
        { text: proj.name, color: COLORS.title, bold: true },
      ];
      if (proj.role) leftSegments.push({ text: `  ${proj.role}`, color: COLORS.contact });
      if (proj.link) {
        const linkUrl = proj.link.startsWith('http') ? proj.link : `https://${proj.link}`;
        leftSegments.push({ text: `  ${proj.link}`, color: COLORS.link, link: linkUrl });
      }
      const rowHeight = Math.max(
        measureSegmentsHeight(pdf, leftSegments, leftWidth, s.textPt, s.lineHeight),
        lineHeightMm(s.textPt, s.lineHeight)
      );
      const bullets = proj.bullets.filter((b) => b && b.trim());
      const bulletHeight = bullets.length > 0 ? s.rowGapMm + measureBulletHeight(pdf, bullets, contentWidth, s) : 0;
      const requiredHeight = rowHeight + bulletHeight + s.itemGapMm;
      y = ensurePageSpace(pdf, y, requiredHeight, pageHeight, margin);

      const rowStart = y;
      const rowEnd = drawSegmentsBlock(pdf, leftSegments, margin, y, leftWidth, s.textPt, s.lineHeight, COLORS.title);
      if (dateText) {
        setTextStyle(pdf, s.textPt, COLORS.muted);
        drawText(pdf, dateText, rightX, rowStart, { align: 'right', baseline: 'top' });
      }
      y = Math.max(rowEnd, rowStart + rowHeight);
      if (bullets.length > 0) {
        y += s.rowGapMm;
        y = drawBullets(pdf, bullets, margin, y, contentWidth, s);
      }
      y += s.itemGapMm;
    });
    y += s.sectionGapMm;
  }

  const validAwards = form.awards?.filter((a) => a.name) || [];
  if (validAwards.length > 0) {
    const sectionHeight = lineHeightMm(s.sectionTitlePt, s.lineHeight) + s.h2PaddingMm + s.h2MarginMm;
    y = ensurePageSpace(pdf, y, sectionHeight, pageHeight, margin);
    y = drawSectionTitle(pdf, '荣誉奖项', margin, y, contentWidth, s);
    validAwards.forEach((award) => {
      const dateText = award.time || '';
      const dateWidth = dateText ? getTextWidth(pdf, dateText, s.textPt) + s.dateGapMm : 0;
      const leftWidth = dateText ? contentWidth - dateWidth : contentWidth;
      const rowHeight = Math.max(
        measureTextHeight(pdf, award.name, leftWidth, s.textPt, s.lineHeight),
        lineHeightMm(s.textPt, s.lineHeight)
      );
      const requiredHeight = rowHeight + s.itemGapMm;
      y = ensurePageSpace(pdf, y, requiredHeight, pageHeight, margin);

      const rowStart = y;
      const rowEnd = drawTextBlock(pdf, award.name, margin, y, leftWidth, s.textPt, s.lineHeight, COLORS.body);
      if (dateText) {
        setTextStyle(pdf, s.textPt, COLORS.muted);
        drawText(pdf, dateText, rightX, rowStart, { align: 'right', baseline: 'top' });
      }
      y = Math.max(rowEnd, rowStart + rowHeight);
      y += s.itemGapMm;
    });
  }

  pdf.save(`${form.basicInfo.name || '简历'}_ResumeBoost.pdf`);
}
