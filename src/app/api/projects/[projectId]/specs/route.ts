import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUserIdentity,
  getProjectAccess,
} from "@/lib/project-access";

export async function GET(
  _req: Request,
  props: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId, userEmails } = await getCurrentUserIdentity();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await props.params;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const access = await getProjectAccess(projectId, userId, userEmails);

    if (!access.hasAccess || !access.project) {
      return NextResponse.json(
        { error: "Forbidden: You do not have access to this project" },
        { status: 403 }
      );
    }

    // 1. Fetch specs from Prisma
    let dbSpecs: Array<{
      id: string;
      projectId: string;
      title?: string | null;
      filePath: string;
      createdAt: Date;
    }> = [];

    try {
      dbSpecs = await prisma.projectSpec.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
      });
    } catch (dbErr) {
      console.warn("[PROJECT_SPECS_DB_FETCH_WARN]", dbErr);
    }

    // 2. Fetch specs from Vercel Blob storage & merge
    const specMap = new Map<
      string,
      {
        id: string;
        projectId: string;
        title?: string;
        filePath: string;
        createdAt: string;
      }
    >();

    // Add DB specs to map
    for (const s of dbSpecs) {
      specMap.set(s.id, {
        id: s.id,
        projectId: s.projectId,
        title: s.title || `${access.project.name} Architecture Spec`,
        filePath: s.filePath,
        createdAt: s.createdAt.toISOString(),
      });
    }

    // Query Vercel Blob store if token is available
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blobList = await list({
          prefix: `specs/${projectId}/`,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        for (const blob of blobList.blobs) {
          // Extract specId from pathname: specs/[projectId]/[specId].md
          const filename = blob.pathname.split("/").pop() || "";
          const specId = filename.replace(/\.md$/, "");

          if (specId && !specMap.has(specId)) {
            specMap.set(specId, {
              id: specId,
              projectId,
              title: `${access.project.name} Architecture Spec`,
              filePath: blob.url,
              createdAt: blob.uploadedAt.toISOString(),
            });
          }
        }
      } catch (blobErr) {
        console.warn("[PROJECT_SPECS_BLOB_LIST_WARN]", blobErr);
      }
    }

    // Sort all specs by createdAt descending
    const allSpecs = Array.from(specMap.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      specs: allSpecs,
    });
  } catch (error) {
    console.error("[PROJECT_SPECS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
