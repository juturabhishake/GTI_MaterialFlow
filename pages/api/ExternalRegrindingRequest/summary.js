import { PrismaClient } from "@prisma/client";
import Cors from 'cors';
import { format } from "date-fns";

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
        const { startDate, endDate } = req.body;
        
        if (!startDate || !endDate) return res.status(400).json({ message: "Start and End Date required" });

        try {
            const sDate = format(new Date(startDate), 'yyyy-MM-dd');
            const eDate = format(new Date(endDate), 'yyyy-MM-dd');
            
            const result = await prisma.$queryRaw`EXEC SP_Get_ExternalRegrindingRequest_Summary @StartDate=${sDate}, @EndDate=${eDate}`;
            return res.status(200).json(result);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
    res.status(405).end();
}