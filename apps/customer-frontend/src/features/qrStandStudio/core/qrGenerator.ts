import type { ErrorCorrectionLevel, QRCodeConfig, QRFields, QRType } from '../types/studio';
import { createQRMatrix } from './qrCodeEngine';

export interface QRMatrixResult {
  size: number;
  modules: boolean[][]; // true = dark module
  payload: string;
  version: number;
}

export interface QRValidationIssue {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
}

export interface QRValidationReport {
  isValid: boolean;
  scannable: boolean;
  contrastRatio: number;
  moduleSizeMm: number;
  payloadLength: number;
  issues: QRValidationIssue[];
}

export function createDefaultQRFields(): QRFields {
  return {
    url: 'https://jasvel3dmakers.co.in',
    upiVpa: 'jasvel@upi',
    upiName: 'Jasvel 3D Makers',
    upiAmount: '',
    upiCurrency: 'INR',
    upiNote: 'Order Payment',
    googlePlaceId: 'https://g.page/r/jasvel-3d-makers/review',
    instagramHandle: 'jasvel3dmakers',
    whatsappPhone: '+919876543210',
    whatsappMessage: 'Hi! I scanned your QR stand.',
    facebookPage: 'jasvel3dmakers',
    youtubeHandle: '@jasvel3dmakers',
    wifiSsid: 'Jasvel_Studio_Guest',
    wifiPassword: 'MakersPass2026',
    wifiSecurity: 'WPA',
    wifiHidden: false,
    vcardName: 'Jasvel Studio Lead',
    vcardCompany: 'Jasvel 3D Makers',
    vcardTitle: 'Manufacturing Lead',
    vcardPhone: '+919876543210',
    vcardEmail: 'contact@jasvel3dmakers.co.in',
    vcardWebsite: 'https://www.jasvel3dmakers.co.in',
    menuUrl: 'https://jasvel3dmakers.co.in/menu',
    emailAddress: 'contact@jasvel3dmakers.co.in',
    emailSubject: 'Inquiry via QR Stand',
    emailBody: 'Hello, I would like to inquire about 3D printing services.',
    phoneNumber: '+919876543210',
    customText: 'Welcome to Jasvel 3D Makers!',
  };
}

export function buildQRPayload(type: QRType, fields: QRFields): string {
  switch (type) {
    case 'url': {
      const raw = fields.url.trim();
      if (!raw) return '';
      return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    }
    case 'upi': {
      const pa = fields.upiVpa.trim();
      if (!pa) return '';
      const params = new URLSearchParams();
      params.set('pa', pa);
      if (fields.upiName.trim()) params.set('pn', fields.upiName.trim());
      const amt = parseFloat(fields.upiAmount);
      if (!Number.isNaN(amt) && amt > 0) {
        params.set('am', amt.toFixed(2));
      }
      params.set('cu', (fields.upiCurrency || 'INR').trim().toUpperCase());
      if (fields.upiNote.trim()) params.set('tn', fields.upiNote.trim());
      return `upi://pay?${params.toString()}`;
    }
    case 'google_review': {
      const raw = fields.googlePlaceId.trim();
      if (!raw) return '';
      if (/^https?:\/\//i.test(raw)) return raw;
      return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(raw)}`;
    }
    case 'instagram': {
      const handle = fields.instagramHandle.trim().replace(/^@+/, '');
      if (!handle) return '';
      if (/^https?:\/\//i.test(handle)) return handle;
      return `https://instagram.com/${handle}`;
    }
    case 'whatsapp': {
      const phone = fields.whatsappPhone.replace(/[^\d]/g, '');
      if (!phone) return '';
      const msg = fields.whatsappMessage.trim();
      return msg
        ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/${phone}`;
    }
    case 'facebook': {
      const page = fields.facebookPage.trim().replace(/^\/+/, '');
      if (!page) return '';
      if (/^https?:\/\//i.test(page)) return page;
      return `https://facebook.com/${page}`;
    }
    case 'youtube': {
      const yt = fields.youtubeHandle.trim();
      if (!yt) return '';
      if (/^https?:\/\//i.test(yt)) return yt;
      const normalized = yt.startsWith('@') ? yt : `@${yt}`;
      return `https://youtube.com/${normalized}`;
    }
    case 'wifi': {
      const ssid = escapeWifi(fields.wifiSsid.trim());
      if (!ssid) return '';
      const sec = fields.wifiSecurity || 'WPA';
      const pass = sec === 'nopass' ? '' : escapeWifi(fields.wifiPassword);
      const hidden = fields.wifiHidden ? 'H:true;' : '';
      return `WIFI:T:${sec};S:${ssid};P:${pass};${hidden};`;
    }
    case 'vcard': {
      const name = fields.vcardName.trim();
      if (!name && !fields.vcardPhone.trim() && !fields.vcardEmail.trim()) return '';
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${name || 'Contact'}`,
        fields.vcardCompany.trim() ? `ORG:${fields.vcardCompany.trim()}` : '',
        fields.vcardTitle.trim() ? `TITLE:${fields.vcardTitle.trim()}` : '',
        fields.vcardPhone.trim() ? `TEL;TYPE=CELL:${fields.vcardPhone.trim()}` : '',
        fields.vcardEmail.trim() ? `EMAIL:${fields.vcardEmail.trim()}` : '',
        fields.vcardWebsite.trim() ? `URL:${fields.vcardWebsite.trim()}` : '',
        'END:VCARD',
      ].filter(Boolean);
      return lines.join('\n');
    }
    case 'menu': {
      const raw = fields.menuUrl.trim();
      if (!raw) return '';
      return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    }
    case 'email': {
      const email = fields.emailAddress.trim();
      if (!email) return '';
      const params = new URLSearchParams();
      if (fields.emailSubject.trim()) params.set('subject', fields.emailSubject.trim());
      if (fields.emailBody.trim()) params.set('body', fields.emailBody.trim());
      const q = params.toString();
      return q ? `mailto:${email}?${q}` : `mailto:${email}`;
    }
    case 'phone': {
      const tel = fields.phoneNumber.trim().replace(/[^+\d]/g, '');
      return tel ? `tel:${tel}` : '';
    }
    case 'text':
      return fields.customText;
    default:
      return '';
  }
}

function escapeWifi(value: string): string {
  return value.replace(/([\\;,:""])/g, '\\$1');
}

export function generateQRMatrix(
  payload: string,
  errorCorrection: ErrorCorrectionLevel = 'M'
): QRMatrixResult {
  const safePayload = payload && payload.length > 0 ? payload : 'https://jasvel3dmakers.co.in';
  const qr = createQRMatrix(safePayload, errorCorrection);

  return {
    size: qr.size,
    modules: qr.modules,
    payload: safePayload,
    version: qr.version,
  };
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return [0, 0, 0];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function relativeLuminance([r, g, b]: [number, number, number]): number {
  const map = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * map[0] + 0.7152 * map[1] + 0.0722 * map[2];
}

export function computeContrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexToRgb(hexA));
  const lumB = relativeLuminance(hexToRgb(hexB));
  const brightest = Math.max(lumA, lumB);
  const darkest = Math.min(lumA, lumB);
  return Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
}

export function validateQRConfig(
  config: QRCodeConfig,
  standBgColorOverride?: string
): QRValidationReport {
  const payload = buildQRPayload(config.type, config.fields);
  const issues: QRValidationIssue[] = [];

  if (!payload.trim()) {
    issues.push({
      severity: 'error',
      code: 'EMPTY_PAYLOAD',
      message: 'Enter required QR content so a scannable code can be generated.',
    });
  }

  if (config.type === 'upi' && config.fields.upiVpa && !config.fields.upiVpa.includes('@')) {
    issues.push({
      severity: 'error',
      code: 'INVALID_UPI_VPA',
      message: 'UPI VPA must include "@" (for example: business@okaxis).',
    });
  }

  let matrixSize = 21;
  try {
    const matrix = generateQRMatrix(payload || 'https://jasvel3dmakers.co.in', config.errorCorrection);
    matrixSize = matrix.size;
  } catch {
    issues.push({
      severity: 'error',
      code: 'PAYLOAD_TOO_LONG',
      message: 'Data exceeds QR capacity for this error-correction level. Shorten text or lower EC level.',
    });
  }

  const totalModulesWithQuiet = matrixSize + config.quietZone * 2;
  const moduleSizeMm = Number((config.sizeMm / totalModulesWithQuiet).toFixed(3));

  if (moduleSizeMm < 0.75) {
    issues.push({
      severity: 'warning',
      code: 'TINY_MODULES',
      message: `QR module width (${moduleSizeMm.toFixed(2)} mm) is too small for a standard 0.4 mm nozzle. Increase QR size or reduce data length.`,
    });
  } else if (moduleSizeMm < 1.0) {
    issues.push({
      severity: 'info',
      code: 'FINE_MODULES',
      message: `QR module width is ${moduleSizeMm.toFixed(2)} mm. Use a 0.4 mm or finer nozzle with slow outer walls.`,
    });
  }

  if (config.quietZone < 2) {
    issues.push({
      severity: 'warning',
      code: 'LOW_QUIET_ZONE',
      message: 'Quiet zone below 2 modules can cause smartphone cameras to fail detection.',
    });
  } else if (config.quietZone < 4) {
    issues.push({
      severity: 'info',
      code: 'SUB_STANDARD_QUIET_ZONE',
      message: 'Quiet zone is below the ISO/IEC standard of 4 modules, though scan may work in good lighting.',
    });
  }

  const effectiveBg = standBgColorOverride || config.bgColor;
  const contrastRatio = computeContrastRatio(config.fgColor, effectiveBg);
  if (contrastRatio < 3.0) {
    issues.push({
      severity: 'warning',
      code: 'LOW_CONTRAST',
      message: `Low contrast (${contrastRatio}:1) between QR modules and background. Use dark modules on a light background for reliable scanning.`,
    });
  }

  // Check inverted QR (dark background, bright foreground)
  const fgLum = relativeLuminance(hexToRgb(config.fgColor));
  const bgLum = relativeLuminance(hexToRgb(effectiveBg));
  if (fgLum > bgLum + 0.1) {
    issues.push({
      severity: 'warning',
      code: 'INVERTED_COLORS',
      message: 'Light QR modules on a dark stand reduce scanner compatibility on older camera apps.',
    });
  }

  const hasError = issues.some((i) => i.severity === 'error');
  const hasSeriousWarning = issues.some(
    (i) => i.code === 'TINY_MODULES' || i.code === 'LOW_CONTRAST' || i.code === 'LOW_QUIET_ZONE'
  );

  return {
    isValid: !hasError,
    scannable: !hasError && !hasSeriousWarning,
    contrastRatio,
    moduleSizeMm,
    payloadLength: payload.length,
    issues,
  };
}
