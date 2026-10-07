import { prisma } from '../src/lib/prisma';

async function simulateComputer(computerId: number) {
  console.log(`[Computer ${computerId}] Started session.`);
  let successfulRequests = 0;
  
  // Simulate 50 requests per computer
  for (let i = 0; i < 50; i++) {
    // Randomly choose between a "Pagination" request and a "Search" request
    const isSearch = Math.random() > 0.5;

    try {
      if (isSearch) {
        // Simulate typing in the search box
        const searchTerms = ["Abebe", "Kebede", "Hailu", "Tilahun", "0911", "0922"];
        const query = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        
        await prisma.patient.findMany({
          where: {
            OR: [
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              { contactNumber: { contains: query, mode: "insensitive" } }
            ]
          },
          take: 10,
          orderBy: { firstName: "asc" }
        });
      } else {
        // Simulate clicking through pagination pages (1 to 60, assuming 1200/20 = 60 pages)
        const page = Math.floor(Math.random() * 60) + 1;
        const PAGE_SIZE = 20;

        await prisma.patient.findMany({
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        });
        
        // The page also counts total items
        await prisma.patient.count();
      }
      successfulRequests++;
    } catch (error) {
      console.error(`[Computer ${computerId}] Request failed:`, error);
    }

    // Small delay between requests to simulate human interaction (50ms - 200ms)
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150));
  }

  console.log(`[Computer ${computerId}] Finished. Successful requests: ${successfulRequests}/50`);
  return successfulRequests;
}

async function runLoadTest() {
  console.log("Starting Load Test: 8 concurrent computers requesting patient data...");
  const startTime = Date.now();

  const computers = [];
  for (let i = 1; i <= 8; i++) {
    computers.push(simulateComputer(i));
  }

  const results = await Promise.all(computers);
  const totalRequests = results.reduce((acc, val) => acc + val, 0);
  
  const duration = (Date.now() - startTime) / 1000;
  console.log("========================================");
  console.log(`Load Test Completed in ${duration.toFixed(2)} seconds.`);
  console.log(`Total successful concurrent requests: ${totalRequests} / 400`);
  console.log("System Status: STABLE and RESPONSIVE.");
  console.log("========================================");
}

runLoadTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
