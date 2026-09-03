Liveblocks Client
Create a cached Liveblocks node client in lib.

Add a helper that deterministically maps a user ID to a consistent color from a fixed palette.

Auth Route
Create POST /api/liveblocks-auth.

Use the project ID as the Liveblocks room ID.

This route must:

require Clerk authentication
verify project access using the existing access helper
ensure the Liveblocks room exists (create only if needed)
return a session token with:
user name
avatar
generated cursor color
Return 403 for unauthorized project access.

Dependencies
All required Liveblocks packages are already installed.

Check When Done
liveblocks.config.ts defines Presence and UserMeta
Liveblocks client is cached
auth route verifies project access
user metadata is attached to sessions
npm run build passes
