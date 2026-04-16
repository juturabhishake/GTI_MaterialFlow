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
        const { processCodes } = req.body;
        try {
            if (!processCodes || processCodes.length === 0) {
                return res.status(200).json([]);
            }
            const codesString = processCodes.join(',');
            const data = await prisma.$queryRawUnsafe(`
                EXEC [dbo].[SP_Get_ToolSurcharge_By_ProcessCodes] @ProcessCodes='${codesString}'
            `);
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    res.status(405).end();
}