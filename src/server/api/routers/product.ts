import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Bucket } from "@/server/bucket";
import { supabaseAdmin } from "@/server/supabase-admin";
import { TRPCError } from "@trpc/server";

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

    getAllUploadedImages: protectedProcedure.query(async() => {
      const { data, error } = await supabaseAdmin.storage
      .from(Bucket.ProductImages)
      .list('folder', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      })

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message
        })
      }

      return data;
    })
})