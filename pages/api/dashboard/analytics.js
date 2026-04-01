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
      const { timeRange, monthYear } = req.query;
      console.log("Received query parameters:", req.query);

      if (!timeRange) {
        return res.status(400).json({ message: "timeRange parameter is required." });
      }

      const result = await prisma.$queryRaw`
        EXEC dbo.sp_GetProcessAuditAnalytics 
        @TimeRange = ${timeRange}, 
        @CustomMonthYear = ${monthYear || null}
      `;
      
      res.status(200).json(result);

    } catch (error) {
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: "Method not allowed" });
  }
}