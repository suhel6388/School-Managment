import { prisma } from "./prisma";
import { ApiError } from "./errors";
import { modelHasSchoolId } from "./tenant";
import { DEFAULT_SETTINGS } from "./settings";
import { generateSchoolSlug } from "./slug";
import type { SessionUser } from "./auth";

export { generateSchoolSlug };

export type SchoolOnboardingInput = {
  // School information
  name: string;
  slug?: string;
  email?: string;
  phone?: string;
  address?: string;
  subscriptionPlan?: string;
  session?: string;

  // Owner information (required when unauthenticated)
  ownerName?: string;
  ownerEmail?: string;
  password?: string;
  confirmPassword?: string;
};

export type OnboardingResult = {
  success: boolean;
  school: {
    id: string;
    name: string;
    slug: string;
    email: string | null;
    status: string;
    subscriptionPlan: string;
  };
  owner: {
    id: string;
    name: string;
    email: string;
    role: "owner";
  };
  redirectUrl: string;
  requiresEmailVerification?: boolean;
};

/** Email address validation pattern */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Resolves a unique school slug by appending incrementing numbers if collisions occur.
 */
export async function resolveUniqueSchoolSlug(
  name: string,
  customSlug?: string,
  db: any = prisma,
): Promise<string> {
  const base = customSlug ? generateSchoolSlug(customSlug) : generateSchoolSlug(name);
  let candidate = base;
  let counter = 1;

  while (true) {
    const existing = await db.school.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    counter += 1;
    candidate = `${base}-${counter}`;
  }
}

/**
 * Validates onboarding payload inputs.
 */
export function validateOnboardingInput(
  input: SchoolOnboardingInput,
  isNewUser: boolean,
): void {
  const schoolName = (input.name ?? "").trim();
  if (!schoolName || schoolName.length < 2 || schoolName.length > 150) {
    throw new ApiError(422, "School name must be between 2 and 150 characters.");
  }

  if (input.email) {
    const email = input.email.trim();
    if (!EMAIL_REGEX.test(email)) {
      throw new ApiError(422, "Please enter a valid school email address.");
    }
  }

  if (input.slug) {
    const slug = input.slug.trim().toLowerCase();
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length < 2 || slug.length > 80) {
      throw new ApiError(
        422,
        "School slug must contain only lowercase letters, numbers, and single hyphens (2-80 characters).",
      );
    }
  }

  if (isNewUser) {
    const ownerName = (input.ownerName ?? "").trim();
    if (!ownerName || ownerName.length < 2 || ownerName.length > 150) {
      throw new ApiError(422, "Owner name must be between 2 and 150 characters.");
    }

    const ownerEmail = (input.ownerEmail ?? "").trim();
    if (!ownerEmail || !EMAIL_REGEX.test(ownerEmail)) {
      throw new ApiError(422, "Please enter a valid owner email address.");
    }

    const password = input.password ?? "";
    if (password.length < 8 || password.length > 128) {
      throw new ApiError(422, "Password must be between 8 and 128 characters.");
    }

    if (input.confirmPassword !== undefined && password !== input.confirmPassword) {
      throw new ApiError(422, "The password confirmation does not match.");
    }
  }
}

/**
 * Onboards a new school, registers the owner, establishes the owner membership,
 * initializes school settings, creates default academic session, and sets up templates.
 *
 * Security:
 * - Always enforces role = "owner" (SCHOOL_OWNER). Client-provided roles are ignored.
 * - Prevents duplicate school creation with matching slug or identical name + email.
 * - Validates all inputs before database operations.
 */
export async function onboardSchool(
  input: SchoolOnboardingInput,
  options?: {
    currentUser?: SessionUser | null;
    db?: any;
  },
): Promise<OnboardingResult> {
  const db = options?.db ?? prisma;
  const currentUser = options?.currentUser ?? null;
  const isNewUser = !currentUser;

  // 1. Validate inputs
  validateOnboardingInput(input, isNewUser);

  const schoolName = input.name.trim();
  const ownerEmail = isNewUser
    ? input.ownerEmail!.trim().toLowerCase()
    : (currentUser.email ?? "").trim().toLowerCase();
  const ownerName = isNewUser ? input.ownerName!.trim() : (currentUser.name ?? currentUser.username);
  const schoolEmail = (input.email ?? ownerEmail).trim().toLowerCase();

  // 2. Prevent duplicate school creation (name + email match)
  const existingSchool = await db.school.findFirst({
    where: {
      name: schoolName,
      email: schoolEmail,
    },
  });
  if (existingSchool) {
    throw new ApiError(409, "A school with this name and email is already registered.", {
      code: "DUPLICATE_SCHOOL",
    });
  }

  // 3. Resolve unique slug
  const slug = await resolveUniqueSchoolSlug(schoolName, input.slug, db);

  // 4. Resolve or create owner User record
  let ownerUserId: string;
  let requiresVerification = false;

  if (isNewUser) {
    const existingUser = await db.user.findUnique({
      where: { email: ownerEmail },
    });
    if (existingUser) {
      throw new ApiError(
        409,
        "An account with this email address already exists. Please log in first to create a school.",
        { code: "USER_ALREADY_EXISTS" },
      );
    }

    // Lazy load Better Auth to create owner account
    const { auth } = await import("./auth-server");
    const signUpResult = await auth.api.signUpEmail({
      body: {
        name: ownerName,
        email: ownerEmail,
        password: input.password!,
        callbackURL: "/login?verified=1",
      },
    });

    if (!signUpResult?.user) {
      throw new ApiError(500, "Failed to create school owner account.");
    }
    ownerUserId = signUpResult.user.id;
    requiresVerification = !signUpResult.user.emailVerified;
  } else {
    ownerUserId = currentUser.uid;
  }

  // 5. Create School, Member, Settings, and AcademicSession
  const sessionName = input.session?.trim() || DEFAULT_SETTINGS.session;

  // Execute school creation and associated record initialization
  const executeCreation = async (tx: any) => {
    // 5a. Create the School record
    const school = await tx.school.create({
      data: {
        name: schoolName,
        slug,
        email: schoolEmail,
        phone: input.phone?.trim() || null,
        address: input.address?.trim() || null,
        status: "active",
        subscriptionPlan: input.subscriptionPlan || "free",
      },
    });

    // 5b. Associate owner with the school - STRICTLY "owner" (SCHOOL_OWNER)
    await tx.member.create({
      data: {
        schoolId: school.id,
        userId: ownerUserId,
        role: "owner",
        status: "active",
      },
    });

    // 5c. Initialize school Settings
    if (modelHasSchoolId("Setting")) {
      await tx.setting.create({
        data: {
          schoolId: school.id,
          name: school.name,
          address: school.address ?? DEFAULT_SETTINGS.address,
          phone: school.phone ?? DEFAULT_SETTINGS.phone,
          email: school.email ?? DEFAULT_SETTINGS.email,
          session: sessionName,
          headerText: school.name,
          footerText: DEFAULT_SETTINGS.footerText,
          captcha: false,
          waMessage: `Dear {name}, fee of {due} is pending for {class}. Please pay at the earliest. - ${school.name}`,
          fileTypes: DEFAULT_SETTINGS.fileTypes,
          planName: school.subscriptionPlan || "Free",
          planExpires: null,
        },
      });
    }

    // 5d. Create default AcademicSession
    if (modelHasSchoolId("AcademicSession")) {
      await tx.academicSession.create({
        data: {
          schoolId: school.id,
          name: sessionName,
        },
      });
    }

    // 5e. Initialize default templates
    if (modelHasSchoolId("AdmitTemplate")) {
      await tx.admitTemplate.create({
        data: {
          schoolId: school.id,
          title: "ADMIT CARD",
          sign: "Principal",
        },
      });
    }
    if (modelHasSchoolId("MarkTemplate")) {
      await tx.markTemplate.create({
        data: {
          schoolId: school.id,
          title: "REPORT CARD",
          signL: "Class Teacher",
          signR: "Principal",
        },
      });
    }
    if (modelHasSchoolId("IdCardTemplate")) {
      await tx.idCardTemplate.create({
        data: {
          schoolId: school.id,
          color: "#1d3a8a",
          validity: "Valid till March 2027",
        },
      });
    }

    // 5f. Update user active session if present
    if (tx.session?.updateMany) {
      await tx.session.updateMany({
        where: { userId: ownerUserId },
        data: { activeOrganizationId: school.id },
      });
    }

    // 5g. Create audit log
    if (modelHasSchoolId("AuditLog")) {
      await tx.auditLog.create({
        data: {
          schoolId: school.id,
          user: ownerEmail,
          act: "create",
          entity: "school",
          description: `Onboarded school "${school.name}" (${school.slug}) with owner ${ownerEmail}`,
        },
      });
    }

    return school;
  };

  const createdSchool = typeof db.$transaction === "function"
    ? await db.$transaction(executeCreation)
    : await executeCreation(db);

  return {
    success: true,
    school: {
      id: createdSchool.id,
      name: createdSchool.name,
      slug: createdSchool.slug,
      email: createdSchool.email,
      status: createdSchool.status,
      subscriptionPlan: createdSchool.subscriptionPlan,
    },
    owner: {
      id: ownerUserId,
      name: ownerName,
      email: ownerEmail,
      role: "owner",
    },
    redirectUrl: isNewUser && requiresVerification ? "/login?verified=1" : "/",
    requiresEmailVerification: requiresVerification,
  };
}
