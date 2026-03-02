import React from 'react'

const DEFAULT_UNIT_TYPES = ['Unidade']

const normalizeUnitType = (val) => {
  if (!val) return 'Unidade'
  if (val === 'Unitário') return 'Unidade'
  return val
}

const UnitTypeSelect = ({ value, onChange, options = DEFAULT_UNIT_TYPES, ...props }) => {
  const normalizedValue = normalizeUnitType(value)

  return (
    <select
      value={normalizedValue}
      onChange={(e) => onChange?.(e.target.value)}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  )
}

export default UnitTypeSelect
