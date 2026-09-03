import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUserIdentity,
  getProjectAccess,
} from "@/lib/project-access";

export async function PUT(
  req: Request,
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

    const body = await req.json().catch(() => ({}));
    const nodes = Array.isArray(body.nodes) ? body.nodes : [];
    const edges = Array.isArray(body.edges) ? body.edges : [];

    const payload = JSON.stringify({
      projectId,
      nodes,
      edges,
      savedAt: new Date().toISOString(),
    });

    let blobUrl = access.project.canvasJsonPath;

    // Upload JSON to Vercel Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      let blob;
      try {
        // Try with private store access first (default on modern Vercel Blob stores)
        blob = await put(`canvas/${projectId}.json`, payload, {
          access: "private",
          contentType: "application/json",
          addRandomSuffix: false,
          allowOverwrite: true,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        // Fallback to public access if store is configured with public access
        if (message.includes("Cannot use private access on a public store")) {
          blob = await put(`canvas/${projectId}.json`, payload, {
            access: "public",
            contentType: "application/json",
            addRandomSuffix: false,
            allowOverwrite: true,
          });
        } else {
          console.error("[CANVAS_BLOB_UPLOAD_ERROR]", err);
          throw err;
        }
      }

      if (blob?.url) {
        blobUrl = blob.url;
      }
    }

    // Persist blob URL in Prisma metadata
    if (blobUrl && blobUrl !== access.project.canvasJsonPath) {
      await prisma.project.update({
        where: { id: projectId },
        data: { canvasJsonPath: blobUrl },
      });
    }

    return NextResponse.json({
      success: true,
      url: blobUrl,
      nodeCount: nodes.length,
      edgeCount: edges.length,
    });
  } catch (error) {
    console.error("[CANVAS_PUT_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

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

    // If no blob path exists yet, return empty state
    if (!access.project.canvasJsonPath) {
      return NextResponse.json({ nodes: [], edges: [] });
    }

    try {
      const headers: Record<string, string> = {};
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        headers["authorization"] = `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`;
      }

      const response = await fetch(access.project.canvasJsonPath, {
        headers,
      });
      if (!response.ok) {
        return NextResponse.json({ nodes: [], edges: [] });
      }

      const data = await response.json();
      return NextResponse.json({
        nodes: Array.isArray(data.nodes) ? data.nodes : [],
        edges: Array.isArray(data.edges) ? data.edges : [],
        savedAt: data.savedAt || null,
      });
    } catch (fetchErr) {
      console.error("[CANVAS_BLOB_FETCH_ERROR]", fetchErr);
      return NextResponse.json({ nodes: [], edges: [] });
    }
  } catch (error) {
    console.error("[CANVAS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
