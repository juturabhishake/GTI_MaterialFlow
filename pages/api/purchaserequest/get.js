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
        const { reqDate } = req.body;

        if (!reqDate) return res.status(400).json({ message: "Request Date is required" });

        try {
            const formattedDate = format(new Date(reqDate), 'yyyy-MM-dd');
            
            const result = await prisma.$queryRaw`EXEC SP_Get_PurchaseRequest @ReqDate=${formattedDate}`;
            
            return res.status(200).json(result);
        } catch (error) {
            console.error("API Error:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
    
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}