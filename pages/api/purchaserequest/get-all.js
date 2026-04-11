import { PrismaClient } from "@prisma/client";
import Cors from 'cors';

const prisma = new PrismaClient();
const cors = Cors({ methods: ['GET', 'POST'], origin: "*" });

function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) return reject(result);
            return resolve(result);
        });
    });
}

export default async function handler(req, res) {
    await runMiddleware(req, res, cors);
    if (req.method === "GET") {
        try {
            const data = await prisma.$queryRaw`EXEC SP_Get_All_PurchaseRequests`;
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ message: "Error", error: error.message });
        }
    }
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method Not Allowed`);
}