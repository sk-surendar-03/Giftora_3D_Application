import test from 'node:test'
import assert from 'node:assert/strict'
import { getAnnouncementConfig, updateAnnouncementConfig } from '../src/modules/settings/settingsService.js'

test('announcement settings can be retrieved and updated', async (t) => {
  try {
    const updated = await updateAnnouncementConfig({
      text: 'Diwali Special — 20% OFF',
      enabled: true,
    })
    assert.equal(updated.text, 'Diwali Special — 20% OFF')
    assert.equal(updated.enabled, true)

    const fetched = await getAnnouncementConfig()
    assert.equal(fetched.text, 'Diwali Special — 20% OFF')
    assert.equal(fetched.enabled, true)
  } catch (err) {
    if (err.message?.includes("Can't reach database server")) {
      t.skip('Database server not reachable in sandbox environment')
      return
    }
    throw err
  }
})
