import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildQRPayload,
  computeContrastRatio,
  createDefaultQRFields,
  validateQRConfig,
} from '../core/qrGenerator';
import type { QRCodeConfig } from '../types/studio';

test('buildQRPayload constructs valid UPI payment URI with exact parameters', () => {
  const fields = createDefaultQRFields();
  fields.upiVpa = 'jasvel3d@okaxis';
  fields.upiName = 'Jasvel 3D Makers';
  fields.upiAmount = '499.00';
  fields.upiCurrency = 'INR';
  fields.upiNote = 'Custom QR Stand Order';

  const uri = buildQRPayload('upi', fields);
  assert.ok(uri.startsWith('upi://pay?'), 'Must start with upi://pay?');
  assert.ok(uri.includes('pa=jasvel3d%40okaxis'), 'Must contain URI-encoded VPA');
  assert.ok(uri.includes('pn=Jasvel+3D+Makers'), 'Must contain payee name');
  assert.ok(uri.includes('am=499.00'), 'Must contain decimal formatted amount');
  assert.ok(uri.includes('cu=INR'), 'Must specify currency INR');
  assert.ok(uri.includes('tn=Custom+QR+Stand+Order'), 'Must contain transaction note');
});

test('buildQRPayload sanitizes and formats URL, Wi-Fi, WhatsApp, and vCard payloads', () => {
  const fields = createDefaultQRFields();

  // URL
  assert.equal(
    buildQRPayload('url', { ...fields, url: 'jasvel3dmakers.co.in' }),
    'https://jasvel3dmakers.co.in'
  );
  assert.equal(
    buildQRPayload('url', { ...fields, url: 'https://jasvel3dmakers.co.in' }),
    'https://jasvel3dmakers.co.in'
  );

  // Wi-Fi
  const wifi = buildQRPayload('wifi', {
    ...fields,
    wifiSsid: 'Makers;Guest',
    wifiPassword: 'Pass:123',
    wifiSecurity: 'WPA',
    wifiHidden: false,
  });
  assert.equal(wifi, 'WIFI:T:WPA;S:Makers\\;Guest;P:Pass\\:123;;');

  // WhatsApp
  const wa = buildQRPayload('whatsapp', {
    ...fields,
    whatsappPhone: '+91 (987) 654-3210',
    whatsappMessage: 'Hi! Love the 3D QR stand.',
  });
  assert.equal(wa, 'https://wa.me/919876543210?text=Hi!%20Love%20the%203D%20QR%20stand.');

  // Instagram
  const ig = buildQRPayload('instagram', {
    ...fields,
    instagramHandle: '@jasvel3dmakers',
  });
  assert.equal(ig, 'https://instagram.com/jasvel3dmakers');

  // vCard
  const vcard = buildQRPayload('vcard', {
    ...fields,
    vcardName: 'Jasvel Support',
    vcardPhone: '+919876543210',
    vcardEmail: 'support@jasvel3dmakers.co.in',
  });
  assert.ok(vcard.startsWith('BEGIN:VCARD'));
  assert.ok(vcard.includes('FN:Jasvel Support'));
  assert.ok(vcard.includes('TEL;TYPE=CELL:+919876543210'));
  assert.ok(vcard.includes('EMAIL:support@jasvel3dmakers.co.in'));
  assert.ok(vcard.endsWith('END:VCARD'));
});

test('validateQRConfig flags invalid UPI VPA, tiny modules, and low contrast', () => {
  const badConfig: QRCodeConfig = {
    id: 'test-qr',
    label: 'Test',
    type: 'upi',
    fields: { ...createDefaultQRFields(), upiVpa: 'invalid-vpa-without-at' },
    sizeMm: 15,
    errorCorrection: 'H',
    quietZone: 1,
    fgColor: '#666666',
    bgColor: '#777777',
    positionX: 0,
    positionY: 0,
    face: 'front',
    visible: true,
  };

  const report = validateQRConfig(badConfig);
  assert.equal(report.isValid, false);
  assert.equal(report.scannable, false);
  assert.ok(report.issues.some((i) => i.code === 'INVALID_UPI_VPA'));
  assert.ok(report.issues.some((i) => i.code === 'TINY_MODULES'));
  assert.ok(report.issues.some((i) => i.code === 'LOW_QUIET_ZONE'));
  assert.ok(report.issues.some((i) => i.code === 'LOW_CONTRAST'));

  // High contrast test
  assert.ok(computeContrastRatio('#000000', '#FFFFFF') >= 20);
});
