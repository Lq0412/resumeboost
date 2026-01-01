/**
 * 边缘函数端的二次脱敏
 */

const PATTERNS = {
  chinesePhone: /1[3-9]\d{9}/g,
  internationalPhone: /\+?\d[\d\s-]{7,}\d/g,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  idCard: /\d{17}[\dXx]|\d{15}/g,
};

const ADDRESS_KEYWORDS = ['省', '市', '区', '县', '路', '街', '号', '楼', '室', '镇', '村', '道'];

function isAddressLine(line: string): boolean {
  const hasKeyword = ADDRESS_KEYWORDS.some((kw) => line.includes(kw));
  const hasNumber = /\d/.test(line);
  return hasKeyword && hasNumber;
}

export function serverMask(text: string): string {
  let result = text;
  let counter = { phone: 0, email: 0, id: 0, address: 0 };

  // 邮箱
  result = result.replace(PATTERNS.email, () => `[EMAIL_${++counter.email}]`);
  
  // 身份证
  result = result.replace(PATTERNS.idCard, (match) => {
    if (match.length === 15 || match.length === 18) {
      return `[ID_${++counter.id}]`;
    }
    return match;
  });

  // 中国手机号
  result = result.replace(PATTERNS.chinesePhone, () => `[PHONE_${++counter.phone}]`);

  // 国际电话
  result = result.replace(PATTERNS.internationalPhone, (match) => {
    const cleaned = match.replace(/[\s-]/g, '');
    if (cleaned.length >= 8 && cleaned.length <= 15 && !match.includes('[PHONE_')) {
      return `[PHONE_${++counter.phone}]`;
    }
    return match;
  });

  // 地址行
  const lines = result.split('\n');
  result = lines
    .map((line) => {
      if (isAddressLine(line) && !line.includes('[ADDRESS_') && !line.includes('[PHONE_') && !line.includes('[EMAIL_')) {
        return `[ADDRESS_${++counter.address}]`;
      }
      return line;
    })
    .join('\n');

  return result;
}
