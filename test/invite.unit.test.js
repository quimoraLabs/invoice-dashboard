import { describe, it, expect } from "vitest";

// Pure helper function modeling /api/accept-invite business logic with Passcode security
export function processInviteAcceptanceWithPasscode({
  userId,
  userEmail,
  inviteId,
  passcode,
  action = "accept",
  displayName,
  invitesDb,
  workspacesDb = new Map(),
  membersDb = new Map(),
  activityLogsDb = [],
}) {
  const effectiveEmail = (userEmail || "").toLowerCase().trim();

  if (!inviteId) {
    throw new Error("Missing inviteId");
  }

  const invite = invitesDb.get(inviteId);
  if (!invite) {
    throw new Error("Invite not found");
  }
  if (invite.status !== "pending") {
    throw new Error(`Invite is already ${invite.status}`);
  }
  if (invite.invitedEmail && effectiveEmail && invite.invitedEmail.toLowerCase().trim() !== effectiveEmail) {
    throw new Error("This invitation was sent to a different email address");
  }

  // Handle DECLINE
  if (action === "decline") {
    invite.status = "declined";
    invite.declinedBy = userId;
    return { success: true, action: "declined" };
  }

  // Handle ACCEPT: Verify Passcode
  const workspace = workspacesDb.get(invite.workspaceId);
  if (workspace && workspace.invitePasscode) {
    const provided = String(passcode || "").trim();
    if (!provided || provided !== String(workspace.invitePasscode).trim()) {
      throw new Error("Invalid 6-digit security passcode");
    }
  }

  const memberKey = `${invite.workspaceId}_${userId}`;
  const resolvedName = displayName || effectiveEmail.split("@")[0];

  membersDb.set(memberKey, {
    workspaceId: invite.workspaceId,
    userId,
    email: effectiveEmail || invite.invitedEmail,
    displayName: resolvedName,
    role: invite.role || "accountant",
    joinedAt: new Date(),
  });

  invite.status = "accepted";
  invite.acceptedBy = userId;

  activityLogsDb.push({
    workspaceId: invite.workspaceId,
    actorUid: userId,
    actorName: resolvedName,
    action: "member_join",
    entityType: "member",
    entityTitle: resolvedName,
  });

  return {
    success: true,
    action: "accepted",
    workspaceId: invite.workspaceId,
    role: invite.role || "accountant",
    membersDb,
    activityLogsDb,
  };
}

describe("B2B Secure Invite & Passcode Flow Tests", () => {
  it("successfully accepts invite when correct 6-digit passcode is provided", () => {
    const invitesDb = new Map([
      ["inv_1", { workspaceId: "ws_acme", invitedEmail: "bob@example.com", role: "accountant", status: "pending" }],
    ]);
    const workspacesDb = new Map([
      ["ws_acme", { id: "ws_acme", name: "Acme Corp", invitePasscode: "849201" }],
    ]);
    const membersDb = new Map();
    const activityLogsDb = [];

    const result = processInviteAcceptanceWithPasscode({
      userId: "user_bob",
      userEmail: "bob@example.com",
      inviteId: "inv_1",
      passcode: "849201",
      displayName: "Bob Smith",
      invitesDb,
      workspacesDb,
      membersDb,
      activityLogsDb,
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe("accepted");
    expect(membersDb.get("ws_acme_user_bob")).toMatchObject({
      workspaceId: "ws_acme",
      userId: "user_bob",
      email: "bob@example.com",
      role: "accountant",
    });
    expect(invitesDb.get("inv_1").status).toBe("accepted");
    expect(activityLogsDb).toHaveLength(1);
    expect(activityLogsDb[0].action).toBe("member_join");
  });

  it("strictly rejects acceptance when passcode is incorrect or missing", () => {
    const invitesDb = new Map([
      ["inv_2", { workspaceId: "ws_acme", invitedEmail: "bob@example.com", role: "accountant", status: "pending" }],
    ]);
    const workspacesDb = new Map([
      ["ws_acme", { id: "ws_acme", name: "Acme Corp", invitePasscode: "849201" }],
    ]);

    expect(() =>
      processInviteAcceptanceWithPasscode({
        userId: "user_bob",
        userEmail: "bob@example.com",
        inviteId: "inv_2",
        passcode: "000000",
        invitesDb,
        workspacesDb,
      })
    ).toThrow("Invalid 6-digit security passcode");

    expect(() =>
      processInviteAcceptanceWithPasscode({
        userId: "user_bob",
        userEmail: "bob@example.com",
        inviteId: "inv_2",
        passcode: "",
        invitesDb,
        workspacesDb,
      })
    ).toThrow("Invalid 6-digit security passcode");
  });

  it("successfully declines invitation and does not add user to workspace", () => {
    const invitesDb = new Map([
      ["inv_3", { workspaceId: "ws_acme", invitedEmail: "bob@example.com", role: "accountant", status: "pending" }],
    ]);
    const membersDb = new Map();

    const result = processInviteAcceptanceWithPasscode({
      userId: "user_bob",
      userEmail: "bob@example.com",
      inviteId: "inv_3",
      action: "decline",
      invitesDb,
      membersDb,
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe("declined");
    expect(invitesDb.get("inv_3").status).toBe("declined");
    expect(membersDb.has("ws_acme_user_bob")).toBe(false);
  });

  it("rejects acceptance if invite was already accepted", () => {
    const invitesDb = new Map([
      ["inv_4", { workspaceId: "ws_acme", invitedEmail: "bob@example.com", role: "accountant", status: "accepted" }],
    ]);

    expect(() =>
      processInviteAcceptanceWithPasscode({
        userId: "user_bob",
        userEmail: "bob@example.com",
        inviteId: "inv_4",
        passcode: "123456",
        invitesDb,
      })
    ).toThrow("Invite is already accepted");
  });

  it("rejects acceptance if email does not match invitation recipient", () => {
    const invitesDb = new Map([
      ["inv_5", { workspaceId: "ws_acme", invitedEmail: "alice@example.com", role: "accountant", status: "pending" }],
    ]);

    expect(() =>
      processInviteAcceptanceWithPasscode({
        userId: "user_bob",
        userEmail: "bob@example.com",
        inviteId: "inv_5",
        passcode: "123456",
        invitesDb,
      })
    ).toThrow("This invitation was sent to a different email address");
  });
});
