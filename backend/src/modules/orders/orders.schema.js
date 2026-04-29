import { z } from "zod";

export const createOrderSchema = z.object({
  body: z.object({
    paymentMethod: z.enum(["PIX", "CARTAO", "BOLETO"]),
  }),
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
});
