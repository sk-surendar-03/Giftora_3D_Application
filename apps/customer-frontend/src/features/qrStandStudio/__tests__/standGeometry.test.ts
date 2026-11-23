import test from 'node:test';
import assert from 'node:assert/strict';
import { createDesignFromTemplate, TEMPLATES } from '../data/templates';
import { generateStandGeometry } from '../geometry/standGeometry';

test('all 12 templates generate valid 3D geometry with positive triangle counts', () => {
  for (const tpl of TEMPLATES) {
    const design = createDesignFromTemplate(tpl.id);
    const parts = generateStandGeometry(design);

    assert.ok(parts.body, `${tpl.id} should generate body geometry`);
    assert.ok(parts.qrModules, `${tpl.id} should generate QR modules geometry`);
    assert.ok(parts.triangleCount > 50, `${tpl.id} should have >50 triangles`);
    assert.ok(parts.bounds.size.x > 20, `${tpl.id} width > 20mm`);
    assert.ok(parts.bounds.size.y > 20, `${tpl.id} height > 20mm`);
    if (tpl.hasBase) {
      assert.ok(parts.base, `${tpl.id} should generate pedestal base`);
    }
  }
});

test('all 3 physical QR printing modes produce distinct valid geometry', () => {
  const raisedDesign = createDesignFromTemplate('classic_upright');
  raisedDesign.printingMode = 'raised';
  const raised = generateStandGeometry(raisedDesign);

  const recessedDesign = createDesignFromTemplate('classic_upright');
  recessedDesign.printingMode = 'recessed';
  const recessed = generateStandGeometry(recessedDesign);

  const inlayDesign = createDesignFromTemplate('classic_upright');
  inlayDesign.printingMode = 'inlay';
  const inlay = generateStandGeometry(inlayDesign);

  const bodyTris = (g: typeof raised) => (g.body?.attributes.position.count || 0) / 3;
  assert.ok(bodyTris(recessed) > bodyTris(raised), 'Recessed mode creates additional pocket faces in body');
  assert.ok(bodyTris(inlay) > bodyTris(raised), 'Inlay mode creates additional pocket faces in body');
  assert.ok((inlay.qrModules?.attributes.position.count || 0) > 0, 'Inlay mode generates physical QR inlay parts');
});

test('mini_keychain template generates integrated keyring loop', () => {
  const keychainDesign = createDesignFromTemplate('mini_keychain');
  const parts = generateStandGeometry(keychainDesign);

  assert.equal(parts.base, null, 'Keychain has no pedestal base');
  assert.ok(parts.body, 'Keychain has body with loop');
  assert.ok(parts.bounds.size.y >= 50, 'Keychain height includes top keyring loop tab');
});
