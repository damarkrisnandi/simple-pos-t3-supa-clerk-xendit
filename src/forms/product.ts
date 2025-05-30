import { z } from "zod";

export const productFormSchema = z.object({
  name: z.string().min(3, {
    message: "Name is required",
  }),
  price: z.coerce.number().min(1000),
  categoryId: z.string(),
  // imageUrl: z.string().url()
});

export type ProductFormSchema = z.infer<typeof productFormSchema>;
