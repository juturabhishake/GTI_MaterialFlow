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
            const result = await prisma.$queryRaw`EXEC SP_Delete_ExternalRegrindingRequest @Id=${parseInt(id, 10)}`;
            return res.status(200).json(result[0]);
        } catch (error) {
            console.error("API Error:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}