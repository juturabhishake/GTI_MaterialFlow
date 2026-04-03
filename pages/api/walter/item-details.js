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
        const { itemCode } = req.body;
        if (!itemCode) {
            return res.status(400).json({ message: "ItemCode is required." });
        }
        try {
            const result = await prisma.$queryRaw`SELECT dbo.FN_Get_SizeSpec_By_ItemCode(${itemCode}) as sizeSpecifications`;
            const spec = result[0]?.sizeSpecifications || "";
            return res.status(200).json({ sizeSpecifications: spec });
        } catch (error) {
            console.error("API Error fetching item details:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
}