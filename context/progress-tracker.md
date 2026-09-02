# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 9: Share Dialog & Collaborator Access

## Current Goal

- Share dialog implemented with collaborator management (invite & remove), Clerk user data enrichment, server-side ownership authorization, read-only collaborator views, and project link copying. Ready for next feature unit.

## Completed

- Feature Spec 01: Design System and UI Primitives (installed shadcn/ui dependencies, dark theme tokens in globals.css, lucide-react icons, cn() utility helper in lib/utils.ts, and 7 core UI primitives: button, card, dialog, input, tabs, textarea, scroll-area).
- Feature Spec 02: Editor Base Chrome Components (created `EditorNavbar` with sidebar toggle, left/center/right sections, dark theme border; created floating `ProjectSidebar` overlay with My Projects/Shared tabs, empty placeholder states, and New Project button).
- Feature Spec 03: Clerk Authentication (installed `@clerk/nextjs` & `@clerk/ui`, configured `ClerkProvider` with shadcn dark theme in RootLayout, created minimal two-panel sign-in & sign-up pages, configured `src/proxy.ts` with route protection and proxy matcher, added `UserButton` / `SignInButton` / `SignUpButton` to `EditorNavbar`, set up `/` redirect to `/editor` or `/sign-in`).
- Feature Spec 04: Editor Home & Project Dialogs (implemented `/editor` minimal center home screen without cards, `CreateProjectDialog` with live slug preview, `RenameProjectDialog` with auto-focus and Enter submission, `DeleteProjectDialog` with destructive confirmation, owned vs shared project sidebar action menus with Rename/Delete, mobile backdrop scrim, and `useProjectDialogs` management hook).
- Feature Spec 05: Prisma Database Layer (configured `prisma/schema.prisma` and `prisma/models/project.prisma` with `Project` and `ProjectCollaborator` models, status enum, indexes, and relations; created cached `src/lib/prisma.ts` singleton branching between `@prisma/adapter-pg` with `pg.Pool` and `@prisma/extension-accelerate`; generated Prisma Client).
- Feature Spec 06: Project API Routes (created `GET /api/projects` and `POST /api/projects` with Clerk user ID ownership and fallback naming; created `PATCH /api/projects/[projectId]` and `DELETE /api/projects/[projectId]` enforcing 401 unauthorized and 403 non-owner forbidden mutations).
- Feature Spec 07: Wire Editor Home (converted `/editor` and `/editor/[projectId]` to Server Components with server-side Prisma data fetching for owned and shared projects; created `useProjectActions` hook wired to real API mutations; wired Create dialog with live Room ID preview and workspace navigation, Rename dialog with refresh, and Delete dialog with redirect/refresh).
- Feature Spec 08: Editor Workspace Shell (created `/editor/[roomId]` server component with server-side authentication and project access checks; created `src/lib/project-access.ts` with `getCurrentUserIdentity()` and `getProjectAccess()` helpers; created `AccessDenied` fallback UI for missing or unauthorized projects; updated `EditorNavbar` with Share and AI toggle buttons; built full-viewport workspace layout in `EditorClientLayout` with left `ProjectSidebar` highlighting active room, central canvas placeholder with dark styling, and collapsible right AI assistant sidebar placeholder).
- Feature Spec 09: Share Dialog (implemented `GET` and `POST` `/api/projects/[projectId]/collaborators` and `DELETE` `/api/projects/[projectId]/collaborators/[collaboratorId]` with server-side ownership enforcement; created `src/lib/clerk-users.ts` to enrich collaborator emails with Clerk display names and avatars; created `src/hooks/use-share-dialog.ts` and `src/components/editor/share-dialog.tsx` with email invitations, collaborator list, removal actions, read-only mode for collaborators, and 2-second link copy feedback; integrated share dialog trigger into workspace navbar).

## In Progress

- None.

## Next Up

- Feature Spec 10: Canvas Graph Foundation / Liveblocks Real-time Setup

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- `src/lib/project-access.ts` encapsulates Clerk user identity retrieval and Prisma project access resolution outside of page components for cleaner separation of concerns and reuse across future routes and Liveblocks auth endpoints.
- `/editor/[roomId]` acts as the standard dynamic workspace route parameter matching Liveblocks room identifiers.
- Collaborators are stored by email in PostgreSQL (`ProjectCollaborator` model) without a local user table; user profile enrichment (names and avatars) is retrieved dynamically via Clerk's Backend API (`clerkClient()`).

## Session Notes

- Feature Spec 09 passed verification with 0 TypeScript errors and full production Next.js build.
