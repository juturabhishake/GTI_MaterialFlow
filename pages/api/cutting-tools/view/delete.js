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
        try {
            const { id } = req.query;
            const result = await prisma.$queryRaw`EXEC SP_Delete_CuttingToolModification @Id=${id}`;
            if(result[0]?.Status === 1) return res.status(200).json({ message: "Success" });
            else throw new Error(result[0]?.Message);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    res.status(405).end();
}