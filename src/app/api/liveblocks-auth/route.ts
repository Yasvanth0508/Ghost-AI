import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getCurrentUserIdentity, getProjectAccess } from "@/lib/project-access";
import { liveblocks, getUserColor } from "@/lib/liveblocks";

export async function POST(req: NextRequest) {
  try {
    // 1. Require Clerk authentication
    const { userId, primaryEmail, userEmails } = await getCurrentUserIdentity();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Extract Room ID / Project ID
    let roomId: string | undefined;
    try {
      const body = await req.json();
      roomId = body?.room || body?.roomId;
    } catch {
      // Body could be empty or not JSON
    }

    if (!roomId) {
      const url = new URL(req.url);
      roomId = url.searchParams.get("room") || url.searchParams.get("roomId") || undefined;
    }

    if (!roomId) {
      return NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
      );
    }

    // 3. Verify project access using the existing access helper
    const { hasAccess, project } = await getProjectAccess(
      roomId,
      userId,
      userEmails
    );

    if (!hasAccess || !project) {
      return new Response(
        JSON.stringify({
          error: "forbidden",
          reason: "Unauthorized project access",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Ensure the Liveblocks room exists (create only if needed)
    try {
      await liveblocks.getOrCreateRoom(roomId, {
        defaultAccesses: [],
        metadata: {
          name: project.name,
        },
      });
    } catch (roomErr) {
      console.error("[LIVEBLOCKS_ROOM_CREATION_WARNING]", roomErr);
    }

    // 5. Build user metadata
    const user = await currentUser();
    const name =
      [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
      user?.username ||
      primaryEmail ||
      "Anonymous User";
    const avatar = user?.imageUrl || "";
    const color = getUserColor(userId);

    // 6. Prepare session and authorize
    const session = liveblocks.prepareSession(userId, {
      userInfo: {
        name,
        avatar,
        color,
      },
    });

    session.allow(roomId, session.FULL_ACCESS);

    const { status, body: authBody } = await session.authorize();

    return new Response(authBody, {
      status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[LIVEBLOCKS_AUTH_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
