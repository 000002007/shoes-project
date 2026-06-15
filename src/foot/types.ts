// Единый источник словарей замера стопы: массивы — канон, типы выводятся из них.
export const WIDTH_CATEGORIES = ['narrow', 'standard', 'wide'] as const
export const SIZE_SYSTEMS = ['EU', 'US_M', 'UK'] as const

export type WidthCategory = (typeof WIDTH_CATEGORIES)[number]
export type SizeSystem = (typeof SIZE_SYSTEMS)[number]

export interface FootMeasurement {
  lengthMm?: number
  widthMm?: number
  widthCategory?: WidthCategory
  sizeValue?: number
  sizeSystem?: SizeSystem
  source: 'manual' | 'a4'
}
