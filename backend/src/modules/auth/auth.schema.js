import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    cpf: z.string().min(11).max(14),
    birthDate: z.string(),
    phone: z.string().min(10),
    email: z.email(),
    password: z.string().min(6),
    zipCode: z.string().min(8),
    street: z.string().min(3),
    number: z.string().min(1),
    neighborhood: z.string().min(2),
    city: z.string().min(2),
    state: z.string().length(2),
    complement: z.string().optional(),
  }),
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(6),
  }),
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
});
