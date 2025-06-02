import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Bucket } from "@/server/bucket";
import { supabaseAdmin } from "@/server/supabase-admin";
import { TRPCError } from "@trpc/server";

export const productRouter = createTRPCRouter({
    getProducts: protectedProcedure
    .input(z.object({
      categoryId: z.string()
    }))
    .query(async ({ ctx, input }) => {
        const { db } = ctx;
        
        let where = {}
        if (input.categoryId !== "all") {
            where = {
              category: {
                id:  input.categoryId 
              }
            }
        }
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
            },
            where
        })

        return products;
    }),

    createProduct: protectedProcedure.input(
        z.object({
            name: z.string().min(3),
            price: z.number().min(1000),
            categoryId: z.string(),
            imageUrl: z.string().url(),
    }))
    .mutation(async({ ctx, input}) => {
        const { db } = ctx;

        const newProduct = await db.product.create({
            data: {
                name: input.name,
                price: input.price,
                imageUrl: input.imageUrl,
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

    createProductImageUploadSignedUrl: protectedProcedure.mutation(
        async () => {

            const { data, error } = await supabaseAdmin.storage
            .from(Bucket.ProductImages)
            .createSignedUploadUrl(
              `image-${Date.now()}.jpeg`
            );

            if (error) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: error.message
              })
            }

            return data;
        }
    ),

    removeImage: protectedProcedure.input(z.object({
      imageUrl: z.string().url()
    })).mutation(async ({ input }) => {
      const { data, error } = await supabaseAdmin.storage
        .from(Bucket.ProductImages)
        .remove([input.imageUrl])
  
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message
        })
      }

      return data;
    })
})