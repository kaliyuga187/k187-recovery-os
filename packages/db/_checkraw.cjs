const {PrismaClient}=require("@prisma/client");
const p=new PrismaClient();
(async()=>{
  const x=await p.aIAnalysis.findFirst({where:{project:{slug:"ar15-mobile"}},orderBy:{generatedAt:"desc"}});
  console.log("rawText[:600]:", JSON.stringify(x.rawText.slice(0,600)));
  console.log("\naction:", x.recommendedAction);
  await p.$disconnect();
})();
