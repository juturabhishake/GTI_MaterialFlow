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
        const { spName, data } = req.body;

        if (!spName || typeof data !== 'object' || data === null) {
            return res.status(400).json({ message: "spName and a valid data object are required." });
        }

        try {
            let result;
            const jsonData = JSON.stringify(data);

            switch (spName) {
                case 'SP_Insert_WalterMaster':
                    result = await prisma.$queryRaw`EXEC SP_Insert_WalterMaster @jsonData=${jsonData}`;
                    break;
                
                default:
                    return res.status(403).json({ message: "Forbidden: This stored procedure is not allowed." });
            }

            const dbResponse = result[0];

            if (dbResponse.Status === 'SUCCESS') {
                return res.status(201).json({ message: dbResponse.Message });
            } else {
                return res.status(409).json({ message: dbResponse.Message });
            }

        } catch (error) {
            console.error("API Error executing stored procedure:", error);
            return res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    }
    
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
}