import { PrismaClient } from "@prisma/client";
import Cors from 'cors';

const prisma = new PrismaClient();
const cors = Cors({ methods: ['GET'], origin: "*" });

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
            const items = await prisma.$queryRaw`SELECT * FROM dbo.FN_Get_AllItems()`;
            return res.status(200).json(items);
        } catch (error) {
            console.error("API Error fetching items:", error);
            return res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    }
    
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
}