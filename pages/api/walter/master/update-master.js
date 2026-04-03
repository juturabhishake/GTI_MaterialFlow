import { PrismaClient } from "@prisma/client";
import Cors from 'cors';

const prisma = new PrismaClient();
const cors = Cors({ methods: ['PUT'], origin: "*" });

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
    if (req.method === "PUT") {
        try {
            const jsonData = JSON.stringify(req.body);
            const result = await prisma.$queryRaw`EXEC SP_Update_WalterMaster_From_JSON @jsonData=${jsonData}`;
            const dbResponse = result[0];
            if (dbResponse.Status === 'SUCCESS') {
                return res.status(200).json({ message: dbResponse.Message });
            } else {
                return res.status(404).json({ message: dbResponse.Message });
            }
        } catch (error) {
            console.error("API Error updating Walter Master data:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
    res.setHeader('Allow', ['PUT']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
}