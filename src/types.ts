export type Confidence = 'high' | 'medium' | 'low'

export interface AttributeSource {
  title: string
  url: string
}

export interface Attributes {
  brand: string
  model: string
  category: 'running' | 'lifestyle' | 'basketball' | 'training' | 'hiking' | 'other' | 'unknown'
  upperMaterial: string
  stretch: 'stretchy' | 'moderate' | 'rigid' | 'unknown'
  sizeReputation: 'runs_small' | 'true_to_size' | 'runs_large' | 'unknown'
  widthReputation: 'narrow' | 'standard' | 'wide' | 'unknown'
  toeBox: 'low' | 'standard' | 'roomy' | 'unknown'
  confidence: Confidence
  notes: string
  sources: AttributeSource[]
}

export interface LookupResponse {
  normalized: string
  attributes: Attributes
}
