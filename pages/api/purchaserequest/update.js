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
        const { data } = req.body;
        if (!data) return res.status(400).json({ message: "Data is required." });
        try {
            const jsonData = JSON.stringify(data);
            const result = await prisma.$queryRaw`EXEC SP_Update_PurchaseRequest_From_JSON @jsonData=${jsonData}`;
            return res.status(200).json(result[0]);
        } catch (error) {
            console.error("API Error:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}