import { z } from 'zod';

export const AttributesSchema = z.object({
  brand: z.string(),
  model: z.string(),
  category: z.enum(['running', 'lifestyle', 'basketball', 'training', 'hiking', 'other', 'unknown']),
  upperMaterial: z.string(),
  stretch: z.enum(['stretchy', 'moderate', 'rigid', 'unknown']),
  sizeReputation: z.enum(['runs_small', 'true_to_size', 'runs_large', 'unknown']),
  widthReputation: z.enum(['narrow', 'standard', 'wide', 'unknown']),
  toeBox: z.enum(['low', 'standard', 'roomy', 'unknown']),
  confidence: z.enum(['high', 'medium', 'low']),
  notes: z.string(),
  sources: z.array(z.object({ title: z.string(), url: z.string() })),
});

// Бросает ZodError, если объект не соответствует схеме.
export function validateAttributes(obj) {
  return AttributesSchema.parse(obj);
}
