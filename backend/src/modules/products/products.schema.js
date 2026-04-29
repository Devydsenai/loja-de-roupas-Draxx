import { z } from "zod";

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    description: z.string().min(5),
    price: z.number().positive(),
    stock: z.number().int().nonnegative(),
    imageUrl: z.string().url().optional(),
    active: z.boolean().optional(),
  }),
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
});

export const updateProductSchema = z.object({
  body: z
    .object({
      name: z.string().min(3).optional(),
      description: z.string().min(5).optional(),
      price: z.number().positive().optional(),
      stock: z.number().int().nonnegative().optional(),
      imageUrl: z.string().url().optional(),
      active: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Informe pelo menos um campo para atualizar.",
    }),
  query: z.object({}).optional().default({}),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const productIdSchema = z.object({
  body: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});
