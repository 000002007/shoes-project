export type WidthCategory = 'narrow' | 'standard' | 'wide'
export type SizeSystem = 'EU' | 'US_M' | 'UK'

export interface FootMeasurement {
  lengthMm?: number
  widthMm?: number
  widthCategory?: WidthCategory
  sizeValue?: number
  sizeSystem?: SizeSystem
  source: 'manual' | 'a4'
}
