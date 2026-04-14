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
        const { page, pageSize, search, itemCodes, itemSpecs, itemDescs, isCriticals, sortCol, sortDir } = req.body;
        try {
            const data = await prisma.$queryRaw`
                EXEC SP_Get_ItemMaster_Paginated 
                @PageNumber=${page}, 
                @PageSize=${pageSize}, 
                @SearchText=${search || null}, 
                @ItemCodes=${itemCodes?.length ? itemCodes.join(',') : null}, 
                @ItemSpecs=${itemSpecs?.length ? itemSpecs.join(',') : null}, 
                @ItemDescs=${itemDescs?.length ? itemDescs.join(',') : null}, 
                @IsCriticals=${isCriticals?.length ? isCriticals.join(',') : null},
                @SortColumn=${sortCol || 'Item_Id'},
                @SortDirection=${sortDir || 'DESC'}
            `;
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    res.status(405).end();
}