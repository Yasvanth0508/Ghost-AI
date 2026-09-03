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
      console.warn("[SPEC_DOWNLOAD_DB_WARN]", dbErr);
    }

    let markdownContent = specRecord?.content || "";
    const title = specRecord?.title || access.project.name;

    if (!markdownContent && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        let fetchUrl = specRecord?.filePath;

        // If no direct HTTP URL, search blob list
        if (!fetchUrl || !fetchUrl.startsWith("http")) {
          const blobList = await list({
            prefix: `specs/${projectId}/${specId}`,
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });

          if (blobList.blobs.length > 0) {
            fetchUrl = blobList.blobs[0].url;
          }
        }

        if (fetchUrl && fetchUrl.startsWith("http")) {
          const res = await fetch(fetchUrl, {
            headers: {
              Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
            },
          });
          if (res.ok) {
            markdownContent = await res.text();
            if (markdownContent && specRecord) {
              await prisma.projectSpec.update({
                where: { id: specId },
                data: { content: markdownContent },
              }).catch(() => {});
            }
          }
        }
      } catch (fetchErr) {
        console.error("[SPEC_DOWNLOAD_FETCH_ERROR]", fetchErr);
      }
    }

    if (!markdownContent) {
      markdownContent = `# ${title} — Technical Architecture Specification\n\nGenerated for project ${projectId}`;
    }

    const cleanName = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const filename = `${cleanName || "spec"}-${specId.slice(-6)}.md`;

    return new Response(markdownContent, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[SPEC_DOWNLOAD_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
