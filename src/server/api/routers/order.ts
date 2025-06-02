import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { createQRIS, xenditPaymentMethodClient, xenditPaymentRequestClient } from "@/server/xendit";
import { TRPCError } from "@trpc/server";
import { OrderStatus, Prisma } from "@prisma/client";

export const orderRouter = createTRPCRouter({
    createOrder: protectedProcedure.input(
        z.object({
            orderItems: z.array(
                z.object({
                    productId: z.string(),
                    quantity: z.number().min(1)
                })
            )
        })
    )
    .mutation(async ({ ctx, input}) => {
        const { db } = ctx;

        const { orderItems } = input;

        const products = await db.product.findMany({
            where: {
                id: {
                    in: orderItems.map((item) => item.productId)
                }
            }
        });

        let subtotal = 0;
        
        products.forEach(product => {
            const productQuantity = orderItems.find(item => item.productId === product.id )!.quantity;
            const price = product.price * productQuantity;

            subtotal += price;
        })

        const tax = subtotal * 0.1;

        const grandTotal = subtotal + tax;
        const order = await db.order.create({
            data: {
                grandTotal,
                subtotal,
                tax,
            }
        })

        const newOrderItems = await db.orderItem.createMany({
            data: products.map(product => {
                const productQuantity = orderItems.find(
                    (item) => item.productId == product.id
                )!.quantity;

                return {
                    orderId: order.id,
                    price: product.price,
                    productId: product.id,
                    quantity: productQuantity
                }
            })
        })

        const paymentRequest = await createQRIS({
            amount: grandTotal,
            orderId: order.id
        });

        await db.order.update({
            where: {
                id: order.id
            },

            data: {
                externalTransactionId: paymentRequest.id,
                paymentMethodId: paymentRequest.paymentMethod.id
            }
        })

        return {
            order,
            newOrderItems,
            qrString: paymentRequest.paymentMethod.qrCode!.channelProperties!.qrString!,
        }
    }),

    simulatePayment: protectedProcedure.input(z.object({
        orderId: z.string().uuid()
    }))
    .mutation(async ({ ctx, input }) => {
        const { db } = ctx;
        const order = await db.order.findUnique({
            where: {
                id: input.orderId
            },
            select: {
                paymentMethodId: true,
                grandTotal: true,
                externalTransactionId: true
            }
        });

        if (!order) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Order not found"
            })
        }

        await xenditPaymentMethodClient.simulatePayment({
            paymentMethodId: order.paymentMethodId!,
            data: {
                amount: order.grandTotal
            }
        })

        return order;
    }),

    checkOrderStatus: protectedProcedure
    .input(
        z.object({
            orderId: z.string().uuid()
        })
    )
    .mutation(async({ ctx, input }) => {
        const { db } = ctx;

        const order = await db.order.findUnique({
            where: {
                id: input.orderId
            },
            select: {
                status: true
            }
        });

        if (order?.status !== OrderStatus.PROCESSING) {
            return false
        }

        return true;
    }),

    getOrders: protectedProcedure
    .input(
        z.object({
            status: z.enum(["ALL", ...Object.keys(OrderStatus)]).default("ALL")
        })
    )
    .query( async ({ ctx, input }) => {
        const { db } = ctx;

        let where: Prisma.OrderWhereInput = {};
        
        switch (input.status) {
            case OrderStatus.AWAITING_PAYMENT:
                where.status = OrderStatus.AWAITING_PAYMENT
                break;
            case OrderStatus.PROCESSING:
                where.status = OrderStatus.PROCESSING
                break;
            case OrderStatus.DONE:
                where.status = OrderStatus.DONE
                break;
            default:
                break;
        }
        const orders = await db.order.findMany({
            where,
            select: {
                id: true,
                grandTotal: true,
                status: true,
                _count: {
                    select: {
                        orderItems: true
                    }
                }
            }
        })

        return orders;
    }),

    finishOrder: protectedProcedure.input(
        z.object({
            orderId: z.string().uuid()
        })
    ).mutation(async ({ ctx, input }) => {
        const { db } = ctx;

        const order = await db.order.findUnique({
            where: {
                id: input.orderId
            },
            select: {
                paidAt: true,
                status: true,
                id: true
            }
        });

        if (!order) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Order not found"
            })
        }

        if (!order.paidAt) {
            throw new TRPCError({
                code: "UNPROCESSABLE_CONTENT",
                message: "Order is not paid yet"
            })
        }

        if (order.status !== OrderStatus.PROCESSING) {
            throw new TRPCError({
                code: "UNPROCESSABLE_CONTENT",
                message: "Order is not processing yet"
            })
        }

        await db.order.update({
            where: {
                id: order.id
            },
            data: {
                status: OrderStatus.DONE
            }
        })
    }),

    getSalesReport: protectedProcedure.query(async ({ ctx }) => {
        const { db } = ctx;

        const paidOrderQuery = db.order.findMany({
            where: {
                paidAt: {
                    not: null
                }
            },
            select: {
                grandTotal: true
            }
        });

        
        const ongoingOrderQuery = db.order.findMany({
            where: {
                status: {
                    not: OrderStatus.DONE
                }
            },
            select: {
                id: true
            }
        });
        
        
        const completedOrderQuery = db.order.findMany({
            where: {
                status: OrderStatus.DONE
            },
            select: {
                id: true
            }
        });

        const [
            paidOrder,
            ongoingOrder,
            completedOrder 
        ] = await Promise.all([
            paidOrderQuery,
            ongoingOrderQuery,
            completedOrderQuery 
        ])

        const totalRevenue = paidOrder.reduce((a, b) => a + b.grandTotal, 0);;
        const totalOngoingOrder = ongoingOrder.length;
        const totalCompletedOrder = completedOrder.length;

        return { totalRevenue, totalOngoingOrder, totalCompletedOrder };
        
    }) 
})