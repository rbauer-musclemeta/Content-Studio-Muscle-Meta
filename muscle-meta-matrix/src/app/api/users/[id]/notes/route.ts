import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// POST /api/users/[id]/notes - Add a note to a user
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Note content is required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create note
    const note = await prisma.userNote.create({
      data: {
        userId: id,
        authorId: session.user.id,
        content: content.trim(),
        noteType: "MANUAL",
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: id,
        action: "note_added",
        details: { noteId: note.id, authorId: session.user.id },
      },
    });

    return NextResponse.json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error("Error adding note:", error);
    return NextResponse.json(
      { error: "Failed to add note" },
      { status: 500 }
    );
  }
}

// GET /api/users/[id]/notes - Get all notes for a user
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notes = await prisma.userNote.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: notes,
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}
