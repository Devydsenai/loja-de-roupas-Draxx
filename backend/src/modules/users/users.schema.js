import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z.string().min(3).optional(),
      phone: z.string().min(10).optional(),
      email: z.string().email().optional(),
      zipCode: z.string().min(8).optional(),
      street: z.string().min(3).optional(),
      number: z.string().min(1).optional(),
      neighborhood: z.string().min(2).optional(),
      city: z.string().min(2).optional(),
      state: z.string().length(2).optional(),
      complement: z.string().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Informe ao menos um campo para atualizar.",
    }),
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
});

export const createEmployeeSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    cpf: z.string().min(11).max(14),
    birthDate: z.string(),
    phone: z.string().min(10),
    email: z.string().email(),
    password: z.string().min(6),
  }),
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
});
