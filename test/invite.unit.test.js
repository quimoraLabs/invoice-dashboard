import { describe, it, expect } from "vitest";

// Pure helper function modeling /api/accept-invite business logic
export function processInviteAcceptance({
  userId,
  userEmail,
  inviteId,
  displayName,
  invitesDb,
  membersDb = new Map(),
}) {
  const effectiveEmail = (userEmail || "").toLowerCase().trim();
  let acceptedCount = 0;
  const acceptedWorkspaces = [];

  if (inviteId) {
    const invite = invitesDb.get(inviteId);
    if (!invite) {
      throw new Error("Invite not found");
    }
    if (invite.status !== "pending") {
      throw new Error(`Invite is already ${invite.status}`);
    }
    if (invite.invitedEmail && effectiveEmail && invite.invitedEmail.toLowerCase() !== effectiveEmail) {
      throw new Error("This invitation was sent to a different email address");
    }

    const memberKey = `${invite.workspaceId}_${userId}`;
    membersDb.set(memberKey, {
      workspaceId: invite.workspaceId,
      userId,
      email: effectiveEmail || invite.invitedEmail,
      displayName: displayName || effectiveEmail.split("@")[0],
      role: invite.role || "accountant",
      joinedAt: new Date(),
    });

    invite.status = "accepted";
    invite.acceptedBy = userId;
    acceptedCount = 1;
    acceptedWorkspaces.push({ workspaceId: invite.workspaceId, role: invite.role || "accountant" });
  } else if (effectiveEmail) {
    for (const [, invite] of invitesDb.entries()) {
      if (invite.invitedEmail.toLowerCase() === effectiveEmail && invite.status === "pending") {
        const memberKey = `${invite.workspaceId}_${userId}`;
        membersDb.set(memberKey, {
          workspaceId: invite.workspaceId,
          userId,
          email: effectiveEmail,
          displayName: displayName || effectiveEmail.split("@")[0],
          role: invite.role || "accountant",
          joinedAt: new Date(),
        });
        invite.status = "accepted";
        invite.acceptedBy = userId;
        acceptedCount++;
        acceptedWorkspaces.push({ workspaceId: invite.workspaceId, role: invite.role || "accountant" });
      }
    }
  }

  return { acceptedCount, acceptedWorkspaces, membersDb };
}

describe("B2B Invite Flow Unit Tests", () => {
  it("successfully accepts specific invite by ID with matching email", () => {
    const invitesDb = new Map([
      ["inv_1", { workspaceId: "ws_acme", invitedEmail: "bob@example.com", role: "accountant", status: "pending" }],
    ]);

    const result = processInviteAcceptance({
      userId: "user_bob",
      userEmail: "bob@example.com",
      inviteId: "inv_1",
      displayName: "Bob Smith",
      invitesDb,
    });

    expect(result.acceptedCount).toBe(1);
    expect(result.acceptedWorkspaces).toEqual([{ workspaceId: "ws_acme", role: "accountant" }]);
    expect(result.membersDb.get("ws_acme_user_bob")).toMatchObject({
      workspaceId: "ws_acme",
      userId: "user_bob",
      email: "bob@example.com",
      role: "accountant",
    });
    expect(invitesDb.get("inv_1").status).toBe("accepted");
  });

  it("rejects acceptance if invite is already accepted or revoked", () => {
    const invitesDb = new Map([
      ["inv_2", { workspaceId: "ws_acme", invitedEmail: "bob@example.com", role: "accountant", status: "accepted" }],
    ]);

    expect(() =>
      processInviteAcceptance({
        userId: "user_bob",
        userEmail: "bob@example.com",
        inviteId: "inv_2",
        invitesDb,
      })
    ).toThrow("Invite is already accepted");
  });

  it("rejects acceptance if email does not match the invitation", () => {
    const invitesDb = new Map([
      ["inv_3", { workspaceId: "ws_acme", invitedEmail: "alice@example.com", role: "accountant", status: "pending" }],
    ]);

    expect(() =>
      processInviteAcceptance({
        userId: "user_bob",
        userEmail: "bob@example.com",
        inviteId: "inv_3",
        invitesDb,
      })
    ).toThrow("This invitation was sent to a different email address");
  });

  it("auto-accepts all pending invites for user's email case-insensitively", () => {
    const invitesDb = new Map([
      ["inv_a", { workspaceId: "ws_alpha", invitedEmail: "Alice@Example.COM", role: "accountant", status: "pending" }],
      ["inv_b", { workspaceId: "ws_beta", invitedEmail: "alice@example.com", role: "owner", status: "pending" }],
      ["inv_c", { workspaceId: "ws_gamma", invitedEmail: "charlie@example.com", role: "accountant", status: "pending" }],
    ]);

    const result = processInviteAcceptance({
      userId: "user_alice",
      userEmail: "alice@example.com",
      invitesDb,
    });

    expect(result.acceptedCount).toBe(2);
    expect(result.acceptedWorkspaces).toHaveLength(2);
    expect(invitesDb.get("inv_a").status).toBe("accepted");
    expect(invitesDb.get("inv_b").status).toBe("accepted");
    expect(invitesDb.get("inv_c").status).toBe("pending"); // Unrelated invite untouched
  });
});
