import { PARAMETER_GROUPS, hasActiveParameter, parameterRange } from '../../features/customiser/geometry/model/parameters.js'

// Upstream's labelKey values are i18n lookup keys (see Step a's notes on
// keyringPositionNameKey/keyringPresetNameKey) — Giftora has no i18n system,
// so this is a plain English label map for the same keys, the "future
// Giftora UI" those notes anticipated.
const LABELS = {
  textSize: 'Text size',
  fontWeight: 'Letter thickness',
  baseThickness: 'Base thickness',
  raisedText: 'Raised text height',
  borderPadding: 'Border padding',
  backingSize: 'Backing size',
  letterSpacing: 'Letter spacing',
  keyringHole: 'Keyring hole size',
  keyringSlotLength: 'Keyring slot length',
  connectorWidth: 'Connector width',
  jointClearance: 'Joint clearance',
  mechanicalGap: 'Gap between letters',
  maxJointAngle: 'Maximum joint angle',
  cornerRadius: 'Corner roundness',
  stakeLength: 'Stake length',
  textTilt: 'Text tilt',
  embedDepth: 'Embed depth',
  reliefHalo: 'Text halo',
  keyringHoleOffset: 'Keyring hole offset',
  bubbleLobe: 'Bubble size',
  tagTail: 'Tag tail size',
  archCurve: 'Arch curve',
  stakeShoulder: 'Stake shoulder',
  jointBoss: 'Joint boss size',
  ribbonTail: 'Ribbon tail length',
  ribbonNotch: 'Ribbon notch depth',
  heartSize: 'Heart size',
  heartBorder: 'Heart border',
  heartLeftGap: 'Left word gap',
  heartRightGap: 'Right word gap',
  heartVerticalOffset: 'Heart vertical offset',
}

const GROUP_LABELS = {
  common: 'Shape',
  relief: 'Relief',
  outline: 'Outline',
  templateDetails: 'Template details',
  heart: 'Heart',
  mechanics: 'Mechanics',
}

/**
 * Renders one labelled range slider per shape parameter that's actually
 * applicable to the current template/style — driven entirely by the real,
 * ported `PARAMETER_GROUPS`/`hasActiveParameter`/`parameterRange` registry
 * from Step (a), so nothing here invents a parameter or a range upstream
 * doesn't already define.
 */
export default function ShapeParameterSliders({ params, onChange }) {
  const groupsWithActiveParameters = PARAMETER_GROUPS.map((group) => ({
    ...group,
    parameters: group.parameters.filter((key) => hasActiveParameter(params, key)),
  })).filter((group) => group.parameters.length > 0)

  if (groupsWithActiveParameters.length === 0) return null

  return (
    <div className="space-y-6">
      {groupsWithActiveParameters.map((group) => (
        <div key={group.key}>
          <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">{GROUP_LABELS[group.key] ?? group.key}</h3>
          <div className="mt-3 space-y-4">
            {group.parameters.map((key) => {
              const range = parameterRange(params, key)
              const value = params[key] ?? range.min
              return (
                <label key={key} className="block">
                  <span className="flex items-center justify-between text-sm text-ink">
                    <span>{LABELS[key] ?? key}</span>
                    <span className="text-muted">
                      {value}
                      {range.unit}
                    </span>
                  </span>
                  <input
                    type="range"
                    min={range.min}
                    max={range.max}
                    step={range.step}
                    value={value}
                    onChange={(e) => onChange(key, Number(e.target.value))}
                    className="mt-1.5 w-full accent-accent"
                  />
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
