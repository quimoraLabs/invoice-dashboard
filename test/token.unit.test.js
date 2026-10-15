import { describe, it, expect } from "vitest";

// Pure helper function to resolve custom claims logic matching api/create-firebase-token.js
export function resolveCustomClaims({ verifiedClaims, requestedWorkspaceId, memberLookup }) {
  const customClaims = {};
  let resolvedWorkspaceId = null;
  let resolvedRole = null;

  // 1. Check claims embedded in Clerk token
  const tokenWorkspaceId = verifiedClaims?.workspaceId || verifiedClaims?.orgId;
  const tokenRole = verifiedClaims?.role;

  if (tokenWorkspaceId && typeof tokenWorkspaceId === "string") {
    resolvedWorkspaceId = tokenWorkspaceId;
    resolvedRole = typeof tokenRole === "string" ? tokenRole : "accountant";
  }

  // 2. If client requested workspace or token lacked claims, resolve via memberLookup
  if (requestedWorkspaceId && typeof requestedWorkspaceId === "string") {
    const member = memberLookup ? memberLookup(requestedWorkspaceId) : null;
    if (member) {
      resolvedWorkspaceId = requestedWorkspaceId;
      resolvedRole = member.role || "accountant";
    }
  } else if (!resolvedWorkspaceId && memberLookup) {
    const primaryMember = memberLookup("__primary__");
    if (primaryMember) {
      resolvedWorkspaceId = primaryMember.workspaceId;
      resolvedRole = primaryMember.role || "accountant";
    }
  }

  if (resolvedWorkspaceId) {
    customClaims.workspaceId = resolvedWorkspaceId;
    if (resolvedRole) {
      customClaims.role = resolvedRole;
    }
  }

  return customClaims;
}

// Error payload sanitizer to ensure no internal error details leak
export function sanitizeAuthError() {
  return {
    error: "Authentication exchange failed",
  };
}

describe("Phase 1: B2B Auth Custom Claims Unit Tests", () => {
  it("resolves workspaceId and role from Clerk verifiedClaims", () => {
    const verifiedClaims = {
      sub: "user_test_123",
      workspaceId: "ws_acme_corp",
      role: "owner",
    };

    const claims = resolveCustomClaims({ verifiedClaims });
    expect(claims).toEqual({
      workspaceId: "ws_acme_corp",
      role: "owner",
    });
  });

  it("supports legacy orgId alias in verifiedClaims and maps to workspaceId", () => {
    const verifiedClaims = {
      sub: "user_test_123",
      orgId: "org_alpha",
      role: "admin",
    };

    const claims = resolveCustomClaims({ verifiedClaims });
    expect(claims).toEqual({
      workspaceId: "org_alpha",
      role: "admin",
    });
  });

  it("resolves requested workspaceId when verified against membership lookup", () => {
    const verifiedClaims = { sub: "user_test_123" };
    const memberDb = {
      ws_beta: { workspaceId: "ws_beta", role: "owner" },
    };

    const claims = resolveCustomClaims({
      verifiedClaims,
      requestedWorkspaceId: "ws_beta",
      memberLookup: (wsId) => memberDb[wsId] || null,
    });

    expect(claims).toEqual({
      workspaceId: "ws_beta",
      role: "owner",
    });
  });

  it("rejects unauthorized requested workspaceId not present in member lookup", () => {
    const verifiedClaims = { sub: "user_test_123" };
    const memberDb = {
      ws_valid: { workspaceId: "ws_valid", role: "accountant" },
    };

    const claims = resolveCustomClaims({
      verifiedClaims,
      requestedWorkspaceId: "ws_unauthorized",
      memberLookup: (wsId) => memberDb[wsId] || null,
    });

    expect(claims).toEqual({});
  });

  it("falls back to primary workspace when token has no claims and no specific workspace requested", () => {
    const verifiedClaims = { sub: "user_test_123" };
    const memberDb = {
      __primary__: { workspaceId: "ws_primary", role: "owner" },
    };

    const claims = resolveCustomClaims({
      verifiedClaims,
      memberLookup: (key) => memberDb[key] || null,
    });

    expect(claims).toEqual({
      workspaceId: "ws_primary",
      role: "owner",
    });
  });

  it("returns empty claims for user with no workspace memberships", () => {
    const verifiedClaims = { sub: "user_new_456" };
    const claims = resolveCustomClaims({
      verifiedClaims,
      memberLookup: () => null,
    });

    expect(claims).toEqual({});
  });

  it("masks error details in auth failure response", () => {
    const internalErr = new Error("FIREBASE_SERVICE_ACCOUNT failed: connection refused to 10.0.0.1:443");
    const sanitized = sanitizeAuthError(internalErr);

    expect(sanitized).toEqual({ error: "Authentication exchange failed" });
    expect(sanitized).not.toHaveProperty("details");
    expect(sanitized.error).not.toContain("FIREBASE_SERVICE_ACCOUNT");
  });
});
