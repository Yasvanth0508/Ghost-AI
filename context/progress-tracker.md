# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 7: Wire Editor Home & Workspace

## Current Goal

- Editor home and workspace wired to server-side data fetching and backend project APIs. Ready for next feature unit.

## Completed

- Feature Spec 01: Design System and UI Primitives (installed shadcn/ui dependencies, dark theme tokens in globals.css, lucide-react icons, cn() utility helper in lib/utils.ts, and 7 core UI primitives: button, card, dialog, input, tabs, textarea, scroll-area).
- Feature Spec 02: Editor Base Chrome Components (created `EditorNavbar` with sidebar toggle, left/center/right sections, dark theme border; created floating `ProjectSidebar` overlay with My Projects/Shared tabs, empty placeholder states, and New Project button).
- Feature Spec 03: Clerk Authentication (installed `@clerk/nextjs` & `@clerk/ui`, configured `ClerkProvider` with shadcn dark theme in RootLayout, created minimal two-panel sign-in & sign-up pages, configured `src/proxy.ts` with route protection and proxy matcher, added `UserButton` / `SignInButton` / `SignUpButton` to `EditorNavbar`, set up `/` redirect to `/editor` or `/sign-in`).
- Feature Spec 04: Editor Home & Project Dialogs (implemented `/editor` minimal center home screen without cards, `CreateProjectDialog` with live slug preview, `RenameProjectDialog` with auto-focus and Enter submission, `DeleteProjectDialog` with destructive confirmation, owned vs shared project sidebar action menus with Rename/Delete, mobile backdrop scrim, and `useProjectDialogs` management hook).
- Feature Spec 05: Prisma Database Layer (configured `prisma/schema.prisma` and `prisma/models/project.prisma` with `Project` and `ProjectCollaborator` models, status enum, indexes, and relations; created cached `src/lib/prisma.ts` singleton branching between `@prisma/adapter-pg` with `pg.Pool` and `@prisma/extension-accelerate`; generated Prisma Client).
- Feature Spec 06: Project API Routes (created `GET /api/projects` and `POST /api/projects` with Clerk user ID ownership and fallback naming; created `PATCH /api/projects/[projectId]` and `DELETE /api/projects/[projectId]` enforcing 401 unauthorized and 403 non-owner forbidden mutations).
- Feature Spec 07: Wire Editor Home (converted `/editor` and `/editor/[projectId]` to Server Components with server-side Prisma data fetching for owned and shared projects; created `useProjectActions` hook wired to real API mutations; wired Create dialog with live Room ID preview and workspace navigation, Rename dialog with refresh, and Delete dialog with redirect/refresh).

## In Progress

- None.

## Next Up

- Feature Spec 08: Canvas Graph Foundation / Nodes & Edges

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Add decisions that affect the system design or data model.

## Session Notes

- Add context needed to resume work in the next session.
