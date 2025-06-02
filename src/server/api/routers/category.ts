import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

// Query => Fetching data
// Mutation => Creating, Updating, Deleting data

export const categoryRouter = createTRPCRouter({
  getCategories: protectedProcedure.query(async ({ ctx }) => {
    const { db } = ctx;

    const categories = await db.category.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            products: true
          }
        },
      },
    });

    return categories;
  }),

  createCategory: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3, "Minimum of 3 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      const newCategory = await db.category.create({
        data: {
          name: input.name,
        },
        select: {
          id: true,
          name: true,
          productCount: true,
        },
      });

      return newCategory;
    }),

  deleteCategoryById: protectedProcedure
    .input(
      z.object({
        categoryId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      await db.category.delete({
        where: {
          id: input.categoryId,
        },
      });
    }),

  editCategory: protectedProcedure
    .input(
      z.object({
        categoryId: z.string(),
        name: z.string().min(3, "Minimum of 3 character"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      await db.category.update({
        where: {
          id: input.categoryId,
        },
        data: {
          name: input.name,
        },
      });
    }),
});
