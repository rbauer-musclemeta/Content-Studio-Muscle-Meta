import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import craConfig from "../src/lib/assessments/cra-config.json";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123!", 12);

  const adminUser = await prisma.user.upsert({
    where: { email: "randy@muscle-meta.com" },
    update: {},
    create: {
      email: "randy@muscle-meta.com",
      name: "Randy Bauer",
      password: hashedPassword,
      role: "ADMIN",
      tags: ["admin"],
    },
  });

  console.log("Created admin user:", adminUser.email);

  // Create CRA assessment type
  const assessmentType = await prisma.assessmentType.upsert({
    where: { code: "CRA" },
    update: {
      configuration: craConfig as any,
      version: craConfig.version,
      totalQuestions: craConfig.totalQuestions,
      maxScore: craConfig.maxScore,
    },
    create: {
      code: "CRA",
      name: "Catabolic Risk Assessment",
      description: craConfig.description,
      version: craConfig.version,
      estimatedTime: "8-10 minutes",
      totalQuestions: craConfig.totalQuestions,
      maxScore: craConfig.maxScore,
      configuration: craConfig as any,
    },
  });

  console.log("Created CRA assessment type:", assessmentType.code);

  // Create sample test users for development
  if (process.env.NODE_ENV === "development") {
    const testPassword = await bcrypt.hash("test123!", 12);

    const testUsers = [
      {
        email: "test.user1@example.com",
        name: "Test User One",
        age: 55,
        gender: "MALE" as const,
        tags: ["founding_cohort", "test"],
      },
      {
        email: "test.user2@example.com",
        name: "Test User Two",
        age: 68,
        gender: "FEMALE" as const,
        tags: ["founding_cohort", "test"],
      },
    ];

    for (const userData of testUsers) {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          ...userData,
          password: testPassword,
          role: "USER",
        },
      });

      // Create a pending assessment for each test user
      await prisma.assessment.upsert({
        where: {
          id: `test-assessment-${user.id}`,
        },
        update: {},
        create: {
          id: `test-assessment-${user.id}`,
          userId: user.id,
          assessmentTypeId: assessmentType.id,
          status: "NOT_STARTED",
          invitationToken: `test-token-${user.id}`,
        },
      });

      console.log("Created test user:", user.email);
    }
  }

  console.log("Database seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
