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
        const { fromDate, toDate } = req.query;

        if (!fromDate || !toDate) {
            return res.status(400).json({ message: "fromDate and toDate are required." });
        }

        try {
            const data = await prisma.$queryRaw`EXEC SP_Get_ToolmakingReturn_Requests_ByDate @fromDate=${fromDate}, @toDate=${toDate}`;
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ message: "Error fetching data", error: error.message });
        }
    }
    
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method Not Allowed`);
}