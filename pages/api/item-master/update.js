import { PrismaClient } from "@prisma/client";
import Cors from 'cors';
import fs from 'fs';
import path from 'path';
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
        const { itemId, itemCode, location, stdStock, safetyStock, image, isCritical, updatedBy } = req.body;
        try {
            let finalImagePath = image;
            if (image && image.startsWith('data:image')) {
                const matches = image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
                if (matches) {
                    const ext = matches[1];
                    const base64Data = matches[2];
                    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
                    const fileName = `${itemId}_${itemCode}_${dateStr}.${ext}`;
                    const uploadDir = path.join(process.cwd(), 'public', 'item-master');
                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, { recursive: true });
                    }
                    const filePath = path.join(uploadDir, fileName);
                    fs.writeFileSync(filePath, base64Data, 'base64');
                    
                    finalImagePath = `/item-master/${fileName}`;
                }
            }
            await prisma.$executeRaw`
                EXEC SP_Update_ItemMaster_Details 
                @ItemId=${itemId}, 
                @ItemLocation=${location}, 
                @StandardStock=${stdStock}, 
                @SafetyStock=${safetyStock}, 
                @ItemImage=${finalImagePath}, 
                @IsCritical=${isCritical ? 1 : 0},
                @UpdatedBy=${updatedBy}
            `;
            return res.status(200).json({ message: "Success" });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    res.status(405).end();
}