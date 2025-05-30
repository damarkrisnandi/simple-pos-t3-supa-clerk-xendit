import { db } from "@/server/db";
import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
type XenditWebhookBody = {
    event: "payment.succeeded",
    data: {
        id: string
        amount: number,
        payment_request_id: string;
        reference_id: string;
        status: "SUCCEEDED" | "FAILED";
    }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== "POST") return;

    const body = req.body as XenditWebhookBody;

    const order = await db.order.findUnique({
        where: {
            id: body.data.reference_id
        }
    });

    if (!order) {
        return res.status(400).send("Order not found")
    }

    if (body.data.status !== "SUCCEEDED") {
        return res.status(200);
    }

    await db.order.update({
        where: {
            id: order.id
        },
        data: {
            paidAt: new Date(),
            status: "PROCESSING",
        }
    })
    res.status(200);
}

export default handler;