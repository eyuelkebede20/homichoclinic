const { PrismaClient } = require("@prisma/client"); 
const prisma = new PrismaClient(); 
prisma.user.findMany({where: {role: 'Doctor'}}).then(d => console.log('Doctors:', d)).finally(() => prisma.$disconnect());
prisma.systemSetting.findMany().then(d => console.log('Settings:', d)).finally(() => prisma.$disconnect());
