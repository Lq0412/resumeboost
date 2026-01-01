/**
 * 脱敏服务 - 将敏感信息替换为占位符，支持可逆映射
 */

export interface MaskingMap {
  tokenToOriginal: Map<string, string>;
  originalToToken: Map<string, string>;
}

export interface MaskResult {
  masked: string;
  map: MaskingMap;
}

// 正则模式
const PATTERNS = {
  // 中国手机号: 1[3-9]开头的11位数字
  chinesePhone: /1[3-9]\d{9}/g,
  // 国际电话: +开头或纯数字，包含空格/横线，至少8位
  internationalPhone: /\+?\d[\d\s-]{7,}\d/g,
  // 邮箱
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // 身份证: 15位或18位（最后一位可能是X）
  idCard: /\d{17}[\dXx]|\d{15}/g,
};

// 地址关键字
const ADDRESS_KEYWORDS = ['省', '市', '区', '县', '路', '街', '号', '楼', '室', '镇', '村', '道'];

/**
 * 检测一行是否为地址行
 */
function isAddressLine(line: string): boolean {
  const hasKeyword = ADDRESS_KEYWORDS.some((kw) => line.includes(kw));
  const hasNumber = /\d/.test(line);
  return hasKeyword && hasNumber;
}

/**
 * 对文本进行脱敏处理
 */
export function mask(text: string): MaskResult {
  const map: MaskingMap = {
    tokenToOriginal: new Map(),
    originalToToken: new Map(),
  };

  let result = text;
  const counters = { phone: 0, email: 0, id: 0, address: 0 };

  // 辅助函数：添加映射并替换
  const addMapping = (original: string, prefix: string, counter: keyof typeof counters): string => {
    // 检查是否已有映射
    if (map.originalToToken.has(original)) {
      return map.originalToToken.get(original)!;
    }
    counters[counter]++;
    const token = `[${prefix}_${counters[counter]}]`;
    map.tokenToOriginal.set(token, original);
    map.originalToToken.set(original, token);
    return token;
  };

  // 1. 先处理邮箱（避免被其他模式误匹配）
  result = result.replace(PATTERNS.email, (match) => addMapping(match, 'EMAIL', 'email'));

  // 2. 处理身份证
  result = result.replace(PATTERNS.idCard, (match) => {
    // 避免误匹配年份等短数字
    if (match.length === 15 || match.length === 18) {
      return addMapping(match, 'ID', 'id');
    }
    return match;
  });

  // 3. 处理中国手机号
  result = result.replace(PATTERNS.chinesePhone, (match) => addMapping(match, 'PHONE', 'phone'));

  // 4. 处理国际电话（更宽松的匹配）
  result = result.replace(PATTERNS.internationalPhone, (match) => {
    // 过滤掉可能是年份或日期的情况
    const cleaned = match.replace(/[\s-]/g, '');
    if (cleaned.length >= 8 && cleaned.length <= 15) {
      // 检查是否已被处理
      if (!map.originalToToken.has(match)) {
        return addMapping(match, 'PHONE', 'phone');
      }
    }
    return match;
  });

  // 5. 处理地址行（按行处理）
  const lines = result.split('\n');
  result = lines
    .map((line) => {
      if (isAddressLine(line) && !line.includes('[ADDRESS_') && !line.includes('[PHONE_') && !line.includes('[EMAIL_')) {
        return addMapping(line, 'ADDRESS', 'address');
      }
      return line;
    })
    .join('\n');

  return { masked: result, map };
}

/**
 * 对脱敏文本进行还原
 */
export function unmask(maskedText: string, map: MaskingMap): string {
  let result = maskedText;
  
  // 按 token 长度降序排序，避免部分匹配问题
  const tokens = Array.from(map.tokenToOriginal.keys()).sort((a, b) => b.length - a.length);
  
  for (const token of tokens) {
    const original = map.tokenToOriginal.get(token)!;
    result = result.split(token).join(original);
  }
  
  return result;
}

/**
 * 创建空的映射表
 */
export function createEmptyMap(): MaskingMap {
  return {
    tokenToOriginal: new Map(),
    originalToToken: new Map(),
  };
}

/**
 * 合并两个映射表
 */
export function mergeMaps(map1: MaskingMap, map2: MaskingMap): MaskingMap {
  const merged: MaskingMap = {
    tokenToOriginal: new Map([...map1.tokenToOriginal, ...map2.tokenToOriginal]),
    originalToToken: new Map([...map1.originalToToken, ...map2.originalToToken]),
  };
  return merged;
}

/**
 * 序列化映射表（用于存储）
 */
export function serializeMap(map: MaskingMap): string {
  return JSON.stringify({
    tokenToOriginal: Array.from(map.tokenToOriginal.entries()),
    originalToToken: Array.from(map.originalToToken.entries()),
  });
}

/**
 * 反序列化映射表
 */
export function deserializeMap(json: string): MaskingMap {
  const data = JSON.parse(json);
  return {
    tokenToOriginal: new Map(data.tokenToOriginal),
    originalToToken: new Map(data.originalToToken),
  };
}
