import { PrismaClient } from "@prisma/client";
import Cors from 'cors';

const prisma = new PrismaClient();
const cors = Cors({ methods: ['POST'], origin: "*" });

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
    if (req.method === "POST") {
        try {
            const { dateRange } = req.body;
            const from = dateRange?.from ? new Date(dateRange.from).toISOString().split('T')[0] : null;
            const to = dateRange?.to ? new Date(dateRange.to).toISOString().split('T')[0] : null;

            const data = await prisma.$queryRaw`EXEC SP_Get_CuttingToolModificationRequests @FromDate=${from}, @ToDate=${to}`;
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    res.status(405).end();
}