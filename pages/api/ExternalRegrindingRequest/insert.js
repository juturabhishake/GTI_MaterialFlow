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
        const { data } = req.body;
        if (!data) return res.status(400).json({ message: "Data is required." });
        try {
            const jsonData = JSON.stringify(data);
            const result = await prisma.$queryRaw`EXEC SP_Insert_ExternalRegrindingRequest @jsonData=${jsonData}`;
            return res.status(201).json(result[0]);
        } catch (error) {
            console.error("API Error:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}