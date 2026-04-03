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
            const jsonData = JSON.stringify(req.body.data);
            const result = await prisma.$queryRaw`EXEC SP_Insert_WalterBasic @jsonData=${jsonData}`;
            const dbResponse = result[0];

            if (dbResponse.Status === 'SUCCESS') {
                return res.status(201).json({ message: dbResponse.Message });
            } else if (dbResponse.Status === 'EXISTS') {
                return res.status(409).json({ message: dbResponse.Message });
            } else {
                return res.status(400).json({ message: dbResponse.Message || "An unknown database error occurred." });
            }
        } catch (error) {
            console.error("API Error inserting data:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
}