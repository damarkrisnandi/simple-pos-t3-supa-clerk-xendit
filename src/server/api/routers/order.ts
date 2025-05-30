import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { createQRIS } from "@/server/xendit";

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

                const totalPrice = product.price * productQuantity;

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
                externaleTransactionId: paymentRequest.id,
                paymentMethodId: paymentRequest.paymentMethod.id
            }
        })

        console.log('cek payment', JSON.stringify(paymentRequest));

        return {
            order,
            newOrderItems,
            qrString: paymentRequest.paymentMethod.qrCode?.channelProperties?.qrString,
        }
    })
})