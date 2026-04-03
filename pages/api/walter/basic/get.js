import { PrismaClient } from "@prisma/client";
import Cors from 'cors';
import { format } from 'date-fns';
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
            const startDate = format(new Date(dateRange.from), 'yyyy-MM-dd');
            const endDate = format(new Date(dateRange.to), 'yyyy-MM-dd');
            const data = await prisma.$queryRaw`EXEC SP_Get_WalterBasic @StartDate=${startDate}, @EndDate=${endDate}`;
            return res.status(200).json(data);
        } catch (error) {
            console.error("API Error fetching Walter Basic data:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
}