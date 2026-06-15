// Единый источник словарей атрибутов: массивы — канон, типы выводятся из них.
export const CONFIDENCES = ['high', 'medium', 'low'] as const
export const CATEGORIES = ['running', 'lifestyle', 'basketball', 'training', 'hiking', 'other', 'unknown'] as const
export const STRETCHES = ['stretchy', 'moderate', 'rigid', 'unknown'] as const
export const SIZE_REPUTATIONS = ['runs_small', 'true_to_size', 'runs_large', 'unknown'] as const
export const WIDTH_REPUTATIONS = ['narrow', 'standard', 'wide', 'unknown'] as const
export const TOE_BOXES = ['low', 'standard', 'roomy', 'unknown'] as const

export type Confidence = (typeof CONFIDENCES)[number]
export type Category = (typeof CATEGORIES)[number]
export type Stretch = (typeof STRETCHES)[number]
export type SizeReputation = (typeof SIZE_REPUTATIONS)[number]
export type WidthReputation = (typeof WIDTH_REPUTATIONS)[number]
export type ToeBox = (typeof TOE_BOXES)[number]

export interface AttributeSource {
  title: string
  url: string
}

export interface Attributes {
  brand: string
  model: string
  category: Category
  upperMaterial: string
  stretch: Stretch
  sizeReputation: SizeReputation
  widthReputation: WidthReputation
  toeBox: ToeBox
  confidence: Confidence
  notes: string
  sources: AttributeSource[]
}

export interface LookupResponse {
  normalized: string
  attributes: Attributes
}
