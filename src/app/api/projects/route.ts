import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const userEmails =
      user?.emailAddresses?.map((email) => email.emailAddress) || [];

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          ...(userEmails.length > 0
            ? [{ collaborators: { some: { email: { in: userEmails } } } }]
            : []),
        ],
      },
      include: {
        collaborators: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("[PROJECTS_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const name =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim()
        : "Untitled Project";
    const description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;

    const project = await prisma.project.create({
      data: {
        ownerId: userId,
        name,
        description,
      },
      include: {
        collaborators: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("[PROJECTS_POST]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
