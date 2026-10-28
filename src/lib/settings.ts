import { prisma } from "./prisma";
import { ApiError } from "./errors";
import { parseYmd } from "./dates";

export const DEFAULT_SETTINGS = {
  name: "ICE School",
  address: "12 Station Road, Lucknow, Uttar Pradesh 226001",
  phone: "+91 98765 43210",
  email: "info@iceschool.in",
  session: "2026-27",
  headerText: "ICE School",
  footerText: "This is a computer generated document.",
  captcha: false,
  waMessage:
    "Dear {name}, fee of {due} is pending for {class}. Please pay at the earliest. - ICE School",
  fileTypes: "jpg,jpeg,png,pdf,doc,docx,xls,xlsx,mp4",
  planName: "Premium",
  planExpires: "2027-03-31",
};

export async function getSettings() {
  let settings = await prisma.setting.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.setting.create({
      data: {
        id: 1,
        name: DEFAULT_SETTINGS.name,
        address: DEFAULT_SETTINGS.address,
        phone: DEFAULT_SETTINGS.phone,
        email: DEFAULT_SETTINGS.email,
        session: DEFAULT_SETTINGS.session,
        headerText: DEFAULT_SETTINGS.headerText,
        footerText: DEFAULT_SETTINGS.footerText,
        captcha: DEFAULT_SETTINGS.captcha,
        waMessage: DEFAULT_SETTINGS.waMessage,
        fileTypes: DEFAULT_SETTINGS.fileTypes,
        planName: DEFAULT_SETTINGS.planName,
        planExpires: parseYmd(DEFAULT_SETTINGS.planExpires),
      },
    });
  }
  return settings;
}

const TEXT_FIELDS = [
  "name",
  "address",
  "phone",
  "email",
  "session",
  "headerText",
  "footerText",
  "waMessage",
  "fileTypes",
  "planName",
] as const;

const BOOL_FIELDS = ["captcha", "profilePhone", "profileAddr", "profileEmail", "profilePhoto"] as const;

export async function updateSettings(patch: Record<string, unknown>, username: string) {
  const current = await getSettings();
  const data: Record<string, unknown> = {};

  for (const key of TEXT_FIELDS) {
    if (!(key in patch)) continue;
    const value = patch[key];
    if (value === null || value === undefined) {
      data[key] = null;
      continue;
    }
    const text = String(value).trim();
    if (key === "name" && !text) throw new ApiError(422, "School name is required.");
    data[key] = text || null;
  }

  if ("planExpires" in patch) {
    const value = patch.planExpires;
    if (!value) data.planExpires = null;
    else {
      const date = parseYmd(String(value));
      if (!date) throw new ApiError(422, "Plan expiry must be a valid date.");
      data.planExpires = date;
    }
  }

  for (const key of BOOL_FIELDS) {
    if (!(key in patch)) continue;
    data[key] = patch[key] === true || patch[key] === "true" || patch[key] === 1;
  }

  // Support nested profile.* keys from the legacy UI.
  const profileMap: Record<string, string> = {
    "profile.phone": "profilePhone",
    "profile.address": "profileAddr",
    "profile.email": "profileEmail",
    "profile.photo": "profilePhoto",
  };
  for (const [legacy, modern] of Object.entries(profileMap)) {
    if (legacy in patch) data[modern] = patch[legacy] === true || patch[legacy] === "true";
  }

  if (!Object.keys(data).length) throw new ApiError(400, "No settings were submitted.");

  const updated = await prisma.setting.update({ where: { id: current.id }, data });
  await prisma.auditLog.create({
    data: { user: username, act: "update", entity: "settings", description: Object.keys(data).join(", ") },
  });
  return updated;
}

export async function getTemplates() {
  const [admit, mark, idCard] = await Promise.all([
    prisma.admitTemplate.findUnique({ where: { id: 1 } }),
    prisma.markTemplate.findUnique({ where: { id: 1 } }),
    prisma.idCardTemplate.findUnique({ where: { id: 1 } }),
  ]);
  return {
    admit: admit ?? { title: "ADMIT CARD", exam: "", instructions: "", sign: "Principal" },
    mark: mark ?? { title: "REPORT CARD", remarks: "", signL: "Class Teacher", signR: "Principal" },
    idCard: idCard ?? { color: "#1d3a8a", validity: "Valid till March 2027" },
  };
}

export async function updateTemplate(
  type: "admit" | "mark" | "id",
  patch: Record<string, unknown>,
  username: string,
) {
  if (type === "admit") {
    const data = {
      title: String(patch.title ?? "ADMIT CARD").slice(0, 80),
      exam: patch.exam ? String(patch.exam).slice(0, 150) : null,
      instructions: patch.instructions ? String(patch.instructions) : null,
      sign: patch.sign ? String(patch.sign).slice(0, 80) : null,
    };
    await prisma.admitTemplate.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });
  } else if (type === "mark") {
    const data = {
      title: String(patch.title ?? "REPORT CARD").slice(0, 80),
      remarks: patch.remarks ? String(patch.remarks) : null,
      signL: patch.signL ? String(patch.signL).slice(0, 80) : null,
      signR: patch.signR ? String(patch.signR).slice(0, 80) : null,
    };
    await prisma.markTemplate.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });
  } else {
    const color = String(patch.color ?? "#1d3a8a");
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new ApiError(422, "Colour must be a hex value.");
    const data = {
      color,
      validity: patch.validity ? String(patch.validity).slice(0, 80) : null,
    };
    await prisma.idCardTemplate.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });
  }
  await prisma.auditLog.create({
    data: { user: username, act: "update", entity: "template", description: type },
  });
  return getTemplates();
}
