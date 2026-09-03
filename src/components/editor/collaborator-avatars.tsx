"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { useOthers } from "@liveblocks/react";

export function CollaboratorAvatars() {
  const { user } = useUser();
  const currentUserId = user?.id;
  const others = useOthers();

  // Filter out the current user (and any duplicate tabs from the current user)
  const collaborators = React.useMemo(() => {
    if (!others) return [];
    return others.filter((other) => other.id && other.id !== currentUserId);
  }, [others, currentUserId]);

  if (collaborators.length === 0) {
    return null;
  }

  const visibleCollaborators = collaborators.slice(0, 5);
  const overflowCount = Math.max(0, collaborators.length - 5);

  return (
    <div className="flex items-center gap-2">
      {/* Overlapping Collaborator Avatars */}
      <div className="flex items-center -space-x-2">
        {visibleCollaborators.map((collaborator) => {
          const info = collaborator.info;
          const name = info?.name || "Collaborator";
          const avatar = info?.avatar;
          const color = info?.color || "#38bdf8";

          // Generate initials if no avatar photo
          const initials =
            name
              .split(" ")
              .map((part) => part[0])
              .filter(Boolean)
              .join("")
              .toUpperCase()
              .slice(0, 2) || "U";

          return (
            <div
              key={collaborator.connectionId}
              title={name}
              aria-label={name}
              className="relative flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full ring-2 ring-surface overflow-hidden text-xs font-semibold text-white shadow-sm pointer-events-none"
              style={{ backgroundColor: color }}
            >
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
          );
        })}

        {/* Overflow badge when more than 5 collaborators */}
        {overflowCount > 0 && (
          <div
            title={`${overflowCount} more collaborator${overflowCount > 1 ? "s" : ""}`}
            className="relative flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-subtle border border-border ring-2 ring-surface text-[11px] font-semibold text-text-secondary shadow-sm pointer-events-none"
          >
            +{overflowCount}
          </div>
        )}
      </div>

      {/* Divider between Collaborator Avatars and Clerk UserButton */}
      <div className="h-5 w-[1px] bg-border" aria-hidden="true" />
    </div>
  );
}
