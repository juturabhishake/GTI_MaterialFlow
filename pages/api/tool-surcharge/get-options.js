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
            const data = await prisma.$queryRaw`
                SELECT DISTINCT Project, ProcessCode 
                FROM [dbo].[ProductMatrix] 
                WHERE Status IN ('1', '3', '4') 
                AND ProcessCode IS NOT NULL 
                AND Project IS NOT NULL
            `;
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    res.status(405).end();
}