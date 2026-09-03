import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUserIdentity,
  getProjectAccess,
} from "@/lib/project-access";

export async function GET(
  _req: Request,
  props: { params: Promise<{ projectId: string; specId: string }> }
) {
  try {
    const { userId, userEmails } = await getCurrentUserIdentity();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, specId } = await props.params;

    if (!projectId || !specId) {
      return NextResponse.json(
        { error: "Project ID and Spec ID are required" },
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

    let specRecord = null;
    try {
      specRecord = await prisma.projectSpec.findUnique({
        where: { id: specId },
      });
    } catch (dbErr) {
      console.warn("[SPEC_GET_DB_WARN]", dbErr);
    }

    let content = specRecord?.content || "";
    let filePath = specRecord?.filePath || `specs/${projectId}/${specId}.md`;
    const title = specRecord?.title || `${access.project.name} Architecture Spec`;
    let createdAt = specRecord?.createdAt?.toISOString() || new Date().toISOString();

    // If content is not in DB, fetch from authenticated Vercel Blob
    if (!content && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        // Try fetching via direct filePath if it's an HTTP URL
        if (filePath.startsWith("http")) {
          const res = await fetch(filePath, {
            headers: {
              Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
            },
          });
          if (res.ok) {
            content = await res.text();
          }
        }

        // If content is still empty, search for matching blob in Vercel Blob store
        if (!content) {
          const blobList = await list({
            prefix: `specs/${projectId}/${specId}`,
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });

          if (blobList.blobs.length > 0) {
            const blobItem = blobList.blobs[0];
            filePath = blobItem.url;
            createdAt = blobItem.uploadedAt.toISOString();

            const res = await fetch(blobItem.url, {
              headers: {
                Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
              },
            });
            if (res.ok) {
              content = await res.text();
            }
          }
        }

        // Backfill DB if content found
        if (content && specRecord) {
          await prisma.projectSpec.update({
            where: { id: specId },
            data: { content },
          }).catch(() => {});
        }
      } catch (blobFetchErr) {
        console.error("[SPEC_BLOB_FETCH_ERROR]", blobFetchErr);
      }
    }

    return NextResponse.json({
      spec: {
        id: specId,
        projectId,
        title,
        filePath,
        createdAt,
      },
      content,
    });
  } catch (error) {
    console.error("[SPEC_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
