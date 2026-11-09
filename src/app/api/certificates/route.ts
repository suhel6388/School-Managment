import { prisma } from "@/lib/prisma";
import { readJson, route } from "@/lib/http";
import { requireSchoolPermission, validateSameSchool, modelHasSchoolId } from "@/lib/tenant";
import { ApiError } from "@/lib/errors";
import { dmy, todayYmd } from "@/lib/dates";

export const POST = route(async (req) => {
  const context = await requireSchoolPermission("student.read");
  const schoolId = context.school.id;
  const body = await readJson(req);
  const templateId = String(body.templateId ?? "");
  const studentId = String(body.studentId ?? "");
  if (!templateId || !studentId) throw new ApiError(422, "Choose a template and a student.");

  await validateSameSchool(schoolId, [
    { model: "CertificateTemplate", id: templateId },
    { model: "Student", id: studentId },
  ]);

  const settingWhere: Record<string, unknown> = {};
  if (schoolId && modelHasSchoolId("Setting")) settingWhere.schoolId = schoolId;
  else settingWhere.id = 1;

  const [template, student, settings] = await Promise.all([
    prisma.certificateTemplate.findUnique({ where: { id: templateId } }),
    prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true, section: true },
    }),
    prisma.setting.findFirst({ where: settingWhere }),
  ]);
  if (!template) throw new ApiError(404, "Certificate template not found.");
  if (!student) throw new ApiError(404, "Student not found.");

  const values: Record<string, string> = {
    name: student.name,
    father: student.father ?? "",
    mother: student.mother ?? "",
    class: `${student.class?.name ?? ""}${student.section ? ` (${student.section.name})` : ""}`,
    admNo: student.admNo,
    rollNo: student.rollNo ?? "",
    dob: student.dob ? dmy(student.dob.toISOString().slice(0, 10)) : "",
    session: settings?.session ?? "",
    school: context.school.name,
    date: dmy(todayYmd()),
    address: student.address ?? "",
  };
  const bodyText = template.body.replace(/\{(\w+)\}/g, (match, key: string) =>
    values[key] !== undefined ? values[key] : match,
  );

  const auditData: Record<string, unknown> = {
    user: context.user.username,
    act: "generate",
    entity: "certificate",
    description: `${template.name} · ${student.name}`,
  };
  if (schoolId && modelHasSchoolId("AuditLog")) auditData.schoolId = schoolId;

  await prisma.auditLog.create({
    data: auditData as any,
  });

  return {
    title: template.name,
    body: bodyText,
    foot: template.foot ?? "Principal",
    student: { name: student.name, admNo: student.admNo },
    school: {
      name: context.school.name,
      address: settings?.address ?? "",
      phone: settings?.phone ?? "",
      header: settings?.headerText ?? "",
      footer: settings?.footerText ?? "",
    },
  };
});
