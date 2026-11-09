import { prisma } from "./prisma";
import { ApiError } from "./errors";
import { modelHasSchoolId } from "./tenant";
import { normalizeRole, type SchoolRole } from "./permissions";
import { sendMail } from "./mailer";
import type { SessionUser } from "./auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STAFF_ROLES: SchoolRole[] = ["admin", "teacher", "accountant", "staff"];

function baseUrl(): string {
  return (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export type StaffMemberRecord = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: "active" | "inactive";
  empId?: string | null;
  department?: string | null;
  designation?: string | null;
  createdAt: Date;
};

export type StaffInvitationRecord = {
  id: string;
  schoolId: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  inviterName?: string | null;
};

/**
 * Lists all staff members belonging to a school.
 */
export async function listStaffMembers(
  schoolId: string,
  db: any = prisma,
): Promise<StaffMemberRecord[]> {
  const members = await db.member.findMany({
    where: { schoolId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Query Staff profiles for this school if modern schema has schoolId
  const staffProfiles = modelHasSchoolId("Staff")
    ? await db.staff.findMany({
        where: { schoolId },
        include: { department: true, designation: true },
      })
    : await db.staff.findMany({
        where: { email: { in: members.map((m: any) => m.user.email) } },
        include: { department: true, designation: true },
      });

  const staffByEmail = new Map<string, any>();
  for (const s of staffProfiles) {
    if (s.email) staffByEmail.set(s.email.toLowerCase(), s);
  }

  return members.map((m: any) => {
    const profile = staffByEmail.get(m.user.email.toLowerCase());
    return {
      id: m.id,
      userId: m.userId,
      name: m.user.name || profile?.name || "Staff Member",
      email: m.user.email,
      phone: profile?.phone ?? null,
      role: normalizeRole(m.role),
      status: m.status === "active" ? "active" : "inactive",
      empId: profile?.empId ?? null,
      department: profile?.department?.name ?? null,
      designation: profile?.designation?.name ?? null,
      createdAt: m.createdAt,
    };
  });
}

/**
 * Lists pending invitations for a school.
 */
export async function listPendingInvitations(
  schoolId: string,
  db: any = prisma,
): Promise<StaffInvitationRecord[]> {
  const invitations = await db.invitation.findMany({
    where: { schoolId, status: "pending" },
    include: {
      inviter: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return invitations.map((inv: any) => ({
    id: inv.id,
    schoolId: inv.schoolId,
    email: inv.email,
    role: normalizeRole(inv.role),
    status: inv.status,
    expiresAt: inv.expiresAt,
    createdAt: inv.createdAt,
    inviterName: inv.inviter?.name ?? inv.inviter?.email ?? null,
  }));
}

/**
 * Retrieves invitation by id.
 */
export async function getInvitationById(
  invitationId: string,
  db: any = prisma,
) {
  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
    include: {
      school: { select: { id: true, name: true, slug: true, logo: true } },
      inviter: { select: { name: true, email: true } },
    },
  });

  if (!invitation) {
    throw new ApiError(404, "Invitation not found.");
  }

  const isExpired = new Date() > new Date(invitation.expiresAt);
  return {
    ...invitation,
    role: normalizeRole(invitation.role),
    isExpired,
  };
}

/**
 * Invites a staff member through email.
 */
export async function inviteStaffMember(
  schoolId: string,
  inviter: SessionUser,
  input: { email: string; role: string; name?: string },
  db: any = prisma,
) {
  const email = (input.email ?? "").trim().toLowerCase();
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new ApiError(422, "Please enter a valid staff email address.");
  }

  const role = normalizeRole(input.role);
  if (!VALID_STAFF_ROLES.includes(role) && role !== "owner") {
    throw new ApiError(
      422,
      `Invalid role. Must be one of: ${VALID_STAFF_ROLES.join(", ")}.`,
    );
  }

  // Operator permission check: only owners can invite admins or owners
  const operatorRole = normalizeRole(inviter.role);
  if ((role === "owner" || role === "admin") && operatorRole !== "owner" && operatorRole !== "super_admin") {
    throw new ApiError(403, "Only the school owner can invite administrators.");
  }

  // Check if member already belongs to this school
  const existingMember = await db.member.findFirst({
    where: {
      schoolId,
      user: { email },
    },
  });
  if (existingMember) {
    throw new ApiError(409, "User is already a member of this school.");
  }

  // Check school exists
  const school = await db.school.findUnique({ where: { id: schoolId } });
  if (!school) throw new ApiError(404, "School not found.");

  // Check existing active invitation
  const existingInvitation = await db.invitation.findFirst({
    where: { schoolId, email, status: "pending" },
  });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  let invitation: any;
  if (existingInvitation) {
    invitation = await db.invitation.update({
      where: { id: existingInvitation.id },
      data: {
        role,
        expiresAt,
        inviterId: inviter.uid,
      },
    });
  } else {
    invitation = await db.invitation.create({
      data: {
        schoolId,
        email,
        role,
        status: "pending",
        expiresAt,
        inviterId: inviter.uid,
      },
    });
  }

  // Send invitation email
  const inviteUrl = `${baseUrl()}/invitations/${invitation.id}`;
  await sendMail({
    to: email,
    subject: `You have been invited to join ${school.name} on ICE School Manager`,
    text: [
      `Hello ${input.name || "there"},`,
      "",
      `You have been invited to join ${school.name} as a ${role.toUpperCase()}.`,
      "",
      `Click the link below to accept your invitation and set up your staff access:`,
      inviteUrl,
      "",
      "This invitation link expires in 7 days.",
      "",
      "If you did not expect this invitation, you can safely ignore this email.",
    ].join("\n"),
  });

  // Log audit activity
  if (modelHasSchoolId("AuditLog")) {
    await db.auditLog.create({
      data: {
        schoolId,
        user: inviter.username,
        act: "invite",
        entity: "staff",
        description: `Invited ${email} as ${role}`,
      },
    });
  }

  return {
    success: true,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    },
    message: `Invitation sent to ${email}.`,
  };
}

/**
 * Cancels a pending staff invitation.
 */
export async function cancelInvitation(
  schoolId: string,
  invitationId: string,
  operator: SessionUser,
  db: any = prisma,
) {
  const invitation = await db.invitation.findFirst({
    where: { id: invitationId, schoolId },
  });

  if (!invitation) throw new ApiError(404, "Invitation not found.");

  await db.invitation.delete({ where: { id: invitationId } });

  if (modelHasSchoolId("AuditLog")) {
    await db.auditLog.create({
      data: {
        schoolId,
        user: operator.username,
        act: "cancel",
        entity: "invitation",
        description: `Cancelled invitation for ${invitation.email}`,
      },
    });
  }

  return { success: true, message: "Invitation cancelled." };
}

/**
 * Accepts an invitation for an existing authenticated user.
 */
export async function acceptInvitation(
  invitationId: string,
  user: { id: string; email: string; name?: string },
  db: any = prisma,
) {
  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
    include: { school: true },
  });

  if (!invitation) throw new ApiError(404, "Invitation not found.");
  if (invitation.status !== "pending") {
    throw new ApiError(400, `This invitation has already been ${invitation.status}.`);
  }
  if (new Date() > new Date(invitation.expiresAt)) {
    throw new ApiError(410, "This invitation has expired. Please request a new one.");
  }

  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new ApiError(
      403,
      `This invitation was sent to ${invitation.email}. You are signed in as ${user.email}.`,
    );
  }

  const executeAccept = async (tx: any) => {
    // Check if membership already exists
    const existing = await tx.member.findFirst({
      where: { schoolId: invitation.schoolId, userId: user.id },
    });

    let member: any;
    if (existing) {
      member = await tx.member.update({
        where: { id: existing.id },
        data: { role: invitation.role, status: "active" },
      });
    } else {
      member = await tx.member.create({
        data: {
          schoolId: invitation.schoolId,
          userId: user.id,
          role: invitation.role,
          status: "active",
        },
      });
    }

    // Mark invitation accepted
    await tx.invitation.update({
      where: { id: invitationId },
      data: { status: "accepted" },
    });

    // Update active session organization
    if (tx.session?.updateMany) {
      await tx.session.updateMany({
        where: { userId: user.id },
        data: { activeOrganizationId: invitation.schoolId },
      });
    }

    // Sync Staff profile if exists
    const staffProfile = await tx.staff.findFirst({
      where: {
        email: user.email,
        ...(modelHasSchoolId("Staff") ? { schoolId: invitation.schoolId } : {}),
      },
    });

    if (staffProfile) {
      await tx.staff.update({
        where: { id: staffProfile.id },
        data: {
          status: "active",
          role: invitation.role,
        },
      });
    }

    // Audit log
    if (modelHasSchoolId("AuditLog")) {
      await tx.auditLog.create({
        data: {
          schoolId: invitation.schoolId,
          user: user.email,
          act: "join",
          entity: "staff",
          description: `${user.email} joined as ${invitation.role}`,
        },
      });
    }

    return member;
  };

  await (typeof db.$transaction === "function" ? db.$transaction(executeAccept) : executeAccept(db));

  return {
    success: true,
    schoolId: invitation.schoolId,
    schoolName: invitation.school.name,
    role: invitation.role,
    redirectUrl: "/",
  };
}

/**
 * Registers a new staff account and accepts an invitation in one step.
 */
export async function registerAndAcceptInvitation(
  invitationId: string,
  input: { name: string; password: string; confirmPassword?: string },
  db: any = prisma,
) {
  const invitation = await getInvitationById(invitationId, db);
  if (invitation.status !== "pending") {
    throw new ApiError(400, `This invitation has already been ${invitation.status}.`);
  }
  if (invitation.isExpired) {
    throw new ApiError(410, "This invitation has expired. Please request a new one.");
  }

  const name = (input.name ?? "").trim();
  if (!name || name.length < 2) {
    throw new ApiError(422, "Please enter your full name.");
  }

  const password = input.password ?? "";
  if (password.length < 8) {
    throw new ApiError(422, "Password must be at least 8 characters.");
  }
  if (input.confirmPassword !== undefined && password !== input.confirmPassword) {
    throw new ApiError(422, "Password confirmation does not match.");
  }

  // Check if account already exists
  const existingUser = await db.user.findUnique({
    where: { email: invitation.email },
  });

  if (existingUser) {
    throw new ApiError(
      409,
      "An account with this email address already exists. Please sign in to accept this invitation.",
    );
  }

  // Create user via Better Auth
  const { auth } = await import("./auth-server");
  const signUpRes = await auth.api.signUpEmail({
    body: {
      name,
      email: invitation.email,
      password,
      callbackURL: "/login?verified=1",
    },
  });

  if (!signUpRes?.user) {
    throw new ApiError(500, "Failed to create staff account.");
  }

  // Accept the invitation for newly created user
  return acceptInvitation(invitationId, signUpRes.user, db);
}

/**
 * Updates a staff member's role.
 */
export async function updateStaffRole(
  schoolId: string,
  memberId: string,
  newRole: string,
  operator: SessionUser,
  db: any = prisma,
) {
  const member = await db.member.findFirst({
    where: { id: memberId, schoolId },
    include: { user: true },
  });
  if (!member) throw new ApiError(404, "Staff member not found.");

  const role = normalizeRole(newRole);
  if (!VALID_STAFF_ROLES.includes(role) && role !== "owner") {
    throw new ApiError(422, `Invalid role: ${newRole}.`);
  }

  // Protect owner role: only owner/super_admin can promote to owner or demote an owner
  const operatorRole = normalizeRole(operator.role);
  if ((role === "owner" || member.role === "owner") && operatorRole !== "owner" && operatorRole !== "super_admin") {
    throw new ApiError(403, "Only the school owner can modify owner roles.");
  }

  // Guard against demoting the last active owner
  if (member.role === "owner" && role !== "owner") {
    const ownerCount = await db.member.count({
      where: { schoolId, role: "owner", status: "active" },
    });
    if (ownerCount <= 1) {
      throw new ApiError(400, "Cannot change role of the last active school owner.");
    }
  }

  await db.member.update({
    where: { id: memberId },
    data: { role },
  });

  // Sync Staff profile role if exists
  await db.staff.updateMany({
    where: {
      email: member.user.email,
      ...(modelHasSchoolId("Staff") ? { schoolId } : {}),
    },
    data: { role },
  });

  if (modelHasSchoolId("AuditLog")) {
    await db.auditLog.create({
      data: {
        schoolId,
        user: operator.username,
        act: "update_role",
        entity: "staff",
        description: `Changed role of ${member.user.email} to ${role}`,
      },
    });
  }

  return { success: true, memberId, role };
}

/**
 * Activates or deactivates a staff member's access.
 */
export async function updateStaffStatus(
  schoolId: string,
  memberId: string,
  status: "active" | "inactive",
  operator: SessionUser,
  db: any = prisma,
) {
  const member = await db.member.findFirst({
    where: { id: memberId, schoolId },
    include: { user: true },
  });
  if (!member) throw new ApiError(404, "Staff member not found.");

  // Prevent deactivating the last active owner
  if (member.role === "owner" && status === "inactive") {
    const activeOwners = await db.member.count({
      where: { schoolId, role: "owner", status: "active" },
    });
    if (activeOwners <= 1) {
      throw new ApiError(400, "Cannot deactivate the only active school owner.");
    }
  }

  await db.member.update({
    where: { id: memberId },
    data: { status },
  });

  // Update staff profile status
  await db.staff.updateMany({
    where: {
      email: member.user.email,
      ...(modelHasSchoolId("Staff") ? { schoolId } : {}),
    },
    data: { status },
  });

  if (modelHasSchoolId("AuditLog")) {
    await db.auditLog.create({
      data: {
        schoolId,
        user: operator.username,
        act: status === "active" ? "activate" : "deactivate",
        entity: "staff",
        description: `${status === "active" ? "Activated" : "Deactivated"} ${member.user.email}`,
      },
    });
  }

  return { success: true, memberId, status };
}

/**
 * Removes a staff member's access from the school.
 */
export async function removeStaffMember(
  schoolId: string,
  memberId: string,
  operator: SessionUser,
  db: any = prisma,
) {
  const member = await db.member.findFirst({
    where: { id: memberId, schoolId },
    include: { user: true },
  });
  if (!member) throw new ApiError(404, "Staff member not found.");

  // Prevent removing the last active owner
  if (member.role === "owner") {
    const activeOwners = await db.member.count({
      where: { schoolId, role: "owner", status: "active" },
    });
    if (activeOwners <= 1) {
      throw new ApiError(400, "Cannot remove the only active school owner.");
    }
  }

  await db.member.delete({ where: { id: memberId } });

  // Clear activeOrganizationId if user is currently active on this school
  if (db.session?.updateMany) {
    await db.session.updateMany({
      where: { userId: member.userId, activeOrganizationId: schoolId },
      data: { activeOrganizationId: null },
    });
  }

  if (modelHasSchoolId("AuditLog")) {
    await db.auditLog.create({
      data: {
        schoolId,
        user: operator.username,
        act: "remove",
        entity: "staff",
        description: `Removed staff access for ${member.user.email}`,
      },
    });
  }

  return { success: true, message: "Staff member access removed." };
}

/**
 * Fetches staff activity logs for a school.
 */
export async function getStaffActivityLogs(
  schoolId: string,
  options?: { staffEmail?: string; limit?: number },
  db: any = prisma,
) {
  const limit = options?.limit ?? 50;

  if (modelHasSchoolId("AuditLog")) {
    const where: any = { schoolId };
    if (options?.staffEmail) where.user = options.staffEmail;

    const logs = await db.auditLog.findMany({
      where,
      orderBy: { at: "desc" },
      take: limit,
    });
    return logs;
  }

  // Transitional fallback
  const logs = await db.auditLog.findMany({
    where: options?.staffEmail ? { user: options.staffEmail } : {},
    orderBy: { at: "desc" },
    take: limit,
  });
  return logs;
}

/**
 * Switches the active school for an authenticated user after verifying active membership.
 * Never allows switching to a school the user does not have active membership in.
 */
export async function switchActiveSchool(
  userId: string,
  targetSchoolId: string,
  db: any = prisma,
) {
  // Database membership verification
  const membership = await db.member.findFirst({
    where: {
      userId,
      schoolId: targetSchoolId,
      status: "active",
      school: { status: "active" },
    },
    include: {
      school: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          subscriptionPlan: true,
        },
      },
    },
  });

  if (!membership) {
    throw new ApiError(403, "You do not have active access to this school.", {
      code: "FORBIDDEN_SCHOOL_ACCESS",
    });
  }

  // Update activeOrganizationId in database session
  if (db.session?.updateMany) {
    await db.session.updateMany({
      where: { userId },
      data: { activeOrganizationId: targetSchoolId },
    });
  }

  return {
    success: true,
    school: {
      id: membership.school.id,
      name: membership.school.name,
      slug: membership.school.slug,
      role: normalizeRole(membership.role),
    },
  };
}
