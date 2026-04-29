import { z } from "zod";

export const addCartItemSchema = z.object({
  body: z.object({
    productId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
});

export const updateCartItemSchema = z.object({
  body: z.object({
    quantity: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional().default({}),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const cartItemIdSchema = z.object({
  body: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});
