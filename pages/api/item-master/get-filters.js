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
            const result = await prisma.$queryRaw`EXEC SP_Get_ItemMaster_Filters`;
            const formattedData = [
                result.filter(r => r.FilterType === 'Item_Code').map(r => ({ Item_Code: r.FilterValue })),
                result.filter(r => r.FilterType === 'Item_Spec').map(r => ({ Item_Spec: r.FilterValue })),
                result.filter(r => r.FilterType === 'Item_Des').map(r => ({ Item_Des: r.FilterValue })),
                result.filter(r => r.FilterType === 'Is_Critical').map(r => ({ Is_Critical: r.FilterValue }))
            ];
            return res.status(200).json(formattedData);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    res.status(405).end();
}