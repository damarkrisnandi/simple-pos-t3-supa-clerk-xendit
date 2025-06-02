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
    const headers = req.headers;
    const webhookToken = headers["x-callback-token"];

    if (webhookToken !== process.env.XENDIT_WEBHOOK_TOKEN) {
        return res.status(401)
    }

    const body = req.body as XenditWebhookBody;

    const order = await db.order.findUnique({
        where: {
            id: body.data.reference_id
        }
    });

    
    console.log('check response 1', JSON.stringify(body.data));

    if (!order) {
        return res.status(400).send("Order not found")
    }

    console.log('check response 2', JSON.stringify(body.data));


    if (body.data.status !== "SUCCEEDED") {
        return res.status(422);
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
    return res.status(200);
}

export default handler;