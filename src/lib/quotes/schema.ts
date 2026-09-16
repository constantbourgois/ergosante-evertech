import { z } from "zod";

export const quoteLineSchema = z.object({
  familyId: z.string().min(1),
  quantity: z.number().int().min(1),
  lengthCm: z.number().int().positive(),
  widthCm: z.number().int().positive(),
  hasESD: z.boolean(),
  hasB1: z.boolean(),
  hasEdging: z.boolean(),
});

export const quoteInputSchema = z.object({
  lines: z.array(quoteLineSchema).min(1, "Un devis doit comporter au moins une ligne."),
});
