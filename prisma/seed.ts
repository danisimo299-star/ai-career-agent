import { prisma } from "../src/lib/db/prisma";

async function main() {
  console.log("No seed data yet — add fixtures here as features land.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
