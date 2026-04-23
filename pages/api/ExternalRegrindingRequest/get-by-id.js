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
        const { requestId } = req.body;
        try {
            const result = await prisma.$queryRaw`EXEC SP_Get_ExternalRegrindingRequest_ById @RequestId=${requestId}`;
            return res.status(200).json(result);
        } catch (error) {
            console.error("Error fetching ExternalRegrinding request by ID:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
    res.status(405).end();
}