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
        const { month, year } = req.body;
        if (!month || !year) {
            return res.status(400).json({ error: "Month and Year are required" });
        }
        try {
            const m = parseInt(month);
            const y = parseInt(year);
            const data = await prisma.$queryRaw`
                EXEC [dbo].[SP_Get_ToolForecast_by_Tool] 
                 @Month=${m}, 
                 @Year=${y}
            `;
            const serializedData = JSON.parse(
                JSON.stringify(data, (key, value) =>
                    typeof value === "bigint" ? value.toString() : value
                )
            );
            return res.status(200).json(serializedData);
        } catch (error) {
            console.error("API Error:", error);
            return res.status(500).json({ error: error.message });
        }
    }
    res.status(405).end();
}