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
            const shifts = await prisma.$queryRaw`SELECT Shifts AS Shift FROM dbo.getshifts()`;
            const formattedShifts = shifts.map(s => ({ value: s.Shift, label: s.Shift }));
            return res.status(200).json(formattedShifts); 
        } catch (error) { 
            console.error("API Error fetching shifts:", error);
            return res.status(500).json({ message: "Internal Server Error" }); 
        } 
    }
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
}