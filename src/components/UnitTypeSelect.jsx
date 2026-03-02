import React from 'react'

const DEFAULT_UNIT_TYPES = [
  'Grama',
  'Quilograma',
  'Miligrama',
  'Litro',
  'Mililitro',
  'Centímetro',
  'Milímetro',
  'Unitário'
]

const normalizeUnitType = (val) => {
  if (!val) return 'Unitário'
  if (val === 'Unidade') return 'Unitário'
  if (val === 'Metro') return 'Centímetro'
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
