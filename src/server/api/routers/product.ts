import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
// import { supabaseAdmin } from "@/server/supabase-admin";
import { Bucket } from "@/server/bucket";

export const productRouter = createTRPCRouter({
    getProducts: protectedProcedure.query(async ({ ctx }) => {
        const { db } = ctx;

        const products = await db.product.findMany({
            select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
                category: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })

        return products;
    }),

    createProduct: protectedProcedure.input(
        z.object({
            name: z.string().min(3),
            price: z.number().min(1000),
            categoryId: z.string(),
            // imageUrl: z.string().url(),
    }))
    .mutation(async({ ctx, input}) => {
        const { db } = ctx;

        const newProduct = await db.product.create({
            data: {
                name: input.name,
                price: input.price,
                category: {
                    connect: {
                        id: input.categoryId
                    }
                }
            }
        })

        return newProduct;
    }),

    deleteProductById: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      await db.product.delete({
        where: {
          id: input.productId,
        },
      });
    }),

    editProduct: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        name: z.string().min(3, "Minimum of 3 character"),
        price: z.number().min(1000),
        categoryId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      await db.product.update({
        where: {
          id: input.productId,
        },
        data: {
          name: input.name,
          price: input.price,
          categoryId: input.categoryId
        },
      });
    }),

    // createProductImageUploadSignedUrl: protectedProcedure.mutation(
    //     async ({ ctx }) => {
    //         const { db } = ctx;

    //         const { data, error } = await supabaseAdmin.storage.from(Bucket.ProductImages).createSignedUploadUrl(`${Date.now()}.jpeg`)

    //         if (error) {

    //         }

    //         return data;
    //     }
    // )
})