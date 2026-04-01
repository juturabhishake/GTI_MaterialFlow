import { PrismaClient } from "@prisma/client";
import Cors from "cors";

const prisma = new PrismaClient();
const cors = Cors({ methods: ["GET"], origin: "*" });

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
      const { fromDate, toDate } = req.query;
      const data = await prisma.$queryRaw`EXEC [dbo].[sp_GetPurchaseReceipts] @fromDate = ${fromDate}, @toDate = ${toDate}`;
      const dataList = Array.isArray(data) ? data : [];
      res.status(200).json(dataList);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}