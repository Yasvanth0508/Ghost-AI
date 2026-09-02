import { clerkClient } from "@clerk/nextjs/server";
import type { CollaboratorOwnerInfo } from "@/types/project";

export interface EnrichedUserInfo {
  name: string | null;
  imageUrl: string | null;
}

export async function getClerkUsersByEmails(
  emails: string[]
): Promise<Map<string, EnrichedUserInfo>> {
  const map = new Map<string, EnrichedUserInfo>();
  const normalizedEmails = Array.from(
    new Set(emails.map((e) => e.toLowerCase().trim()).filter(Boolean))
  );

  if (normalizedEmails.length === 0) {
    return map;
  }

  try {
    const client = await clerkClient();
    const response = await client.users.getUserList({
      emailAddress: normalizedEmails,
      limit: 100,
    });

    for (const user of response.data) {
      const name =
        [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
        user.username ||
        null;
      const imageUrl = user.imageUrl || null;

      for (const emailObj of user.emailAddresses) {
        if (emailObj.emailAddress) {
          map.set(emailObj.emailAddress.toLowerCase(), { name, imageUrl });
        }
      }
    }
  } catch (err) {
    console.error("[CLERK_USER_LOOKUP_ERROR]", err);
  }

  return map;
}

export async function getClerkOwnerInfo(
  ownerId: string
): Promise<CollaboratorOwnerInfo> {
  try {
    const client = await clerkClient();
    const ownerUser = await client.users.getUser(ownerId);
    const name =
      [ownerUser.firstName, ownerUser.lastName].filter(Boolean).join(" ").trim() ||
      ownerUser.username ||
      null;
    const primaryEmail =
      ownerUser.emailAddresses.find(
        (e) => e.id === ownerUser.primaryEmailAddressId
      )?.emailAddress ||
      ownerUser.emailAddresses[0]?.emailAddress ||
      null;

    return {
      id: ownerId,
      email: primaryEmail,
      name,
      imageUrl: ownerUser.imageUrl || null,
    };
  } catch (err) {
    console.error("[CLERK_OWNER_LOOKUP_ERROR]", err);
    return {
      id: ownerId,
      email: null,
      name: null,
      imageUrl: null,
    };
  }
}
