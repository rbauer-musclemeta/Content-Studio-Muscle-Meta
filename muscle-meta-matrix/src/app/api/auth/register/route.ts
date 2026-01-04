import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  invitationToken: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email, password, name, invitationToken } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role: "USER",
        tags: ["founding_cohort"],
      },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "registered",
        details: { method: "self_registration" },
      },
    });

    // If there's an invitation token, link the assessment
    if (invitationToken) {
      const assessment = await prisma.assessment.findFirst({
        where: { invitationToken },
      });

      if (assessment) {
        // Update the assessment with the new user
        await prisma.assessment.update({
          where: { id: assessment.id },
          data: { userId: user.id },
        });
      }
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Error during registration:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
