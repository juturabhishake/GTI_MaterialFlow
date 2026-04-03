import { PrismaClient } from "@prisma/client";
import Cors from 'cors';
const prisma = new PrismaClient();
const cors = Cors({ methods: ['DELETE'], origin: "*" });

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
    if (req.method === "DELETE") {
        const { id } = req.query;
        if (!id) return res.status(400).json({ message: "ID is required" });
        try {
            const result = await prisma.$queryRaw`EXEC SP_Delete_WalterBasic @Id=${parseInt(id, 10)}`;
            const dbResponse = result[0];
            if (dbResponse.Status === 'SUCCESS') {
                return res.status(200).json({ message: dbResponse.Message });
            }
            return res.status(404).json({ message: dbResponse.Message });
        } catch (error) {
            console.error("API Error deleting Walter Basic data:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
    res.setHeader('Allow', ['DELETE']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
}