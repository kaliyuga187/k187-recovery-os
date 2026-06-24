const {PrismaClient}=require("@prisma/client");
const p=new PrismaClient();
(async()=>{
  const all=await p.project.findMany({select:{slug:true,path:true}});
  const hits=all.filter(x => /concrete|estimator/i.test(x.slug+" "+x.path));
  console.log(JSON.stringify(hits,null,2));
  await p.$disconnect();
})();
