/**
 * PDF 文本提取服务
 */

import * as pdfjsLib from 'pdfjs-dist';

// 设置 worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// 限制常量
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PAGES = 10;
const MIN_TEXT_LENGTH = 30; // 低于此长度视为扫描件

export interface PDFValidationResult {
  valid: boolean;
  error?: string;
}

export interface PDFExtractionResult {
  success: boolean;
  text?: string;
  error?: string;
  pageCount?: number;
}

/**
 * 验证 PDF 文件
 */
export function validatePDFFile(file: File): PDFValidationResult {
  // 检查文件类型
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return { valid: false, error: '请上传 PDF 文件' };
  }

  // 检查文件大小
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `文件大小超出限制（最大 ${MAX_FILE_SIZE / 1024 / 1024}MB）` };
  }

  return { valid: true };
}

/**
 * 从 PDF 文件提取文本
 */
export async function extractTextFromPDF(file: File): Promise<PDFExtractionResult> {
  // 先验证文件
  const validation = validatePDFFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    // 读取文件为 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // 加载 PDF 文档
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // 检查页数
    if (pdf.numPages > MAX_PAGES) {
      return { 
        success: false, 
        error: `PDF 页数超出限制（最多 ${MAX_PAGES} 页，当前 ${pdf.numPages} 页）` 
      };
    }

    // 逐页提取文本
    const textParts: string[] = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // 提取文本项并按行合并
      const pageText = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (pageText) {
        textParts.push(pageText);
      }
    }

    // 合并所有页面文本（页与页之间用空行分隔）
    const fullText = textParts.join('\n\n');
    
    // 检查提取结果
    const trimmedText = fullText.replace(/\s/g, '');
    if (trimmedText.length < MIN_TEXT_LENGTH) {
      return {
        success: false,
        error: '可能为扫描件 PDF，请改用粘贴文本或使用简历生成器',
        pageCount: pdf.numPages,
      };
    }

    return {
      success: true,
      text: fullText,
      pageCount: pdf.numPages,
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    return {
      success: false,
      error: 'PDF 解析失败，请确保文件未损坏或尝试粘贴文本',
    };
  }
}

/**
 * 检查提取的文本是否可能是扫描件
 */
export function isLikelyScannedPDF(text: string): boolean {
  const trimmed = text.replace(/\s/g, '');
  return trimmed.length < MIN_TEXT_LENGTH;
}
