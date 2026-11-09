import { prisma } from "@/lib/prisma";
import { query, route } from "@/lib/http";
import { requireSchoolPermission, validateSameSchool, modelHasSchoolId } from "@/lib/tenant";
import { ApiError } from "@/lib/errors";
import { toYmd } from "@/lib/dates";

export const GET = route(async (req) => {
  const context = await requireSchoolPermission("lesson.read");
  const schoolId = context.school.id;
  const params = query(req);
  const classId = params.get("classId") ?? "";
  const subjectId = params.get("subjectId") ?? "";
  if (!classId || !subjectId) {
    throw new ApiError(422, "Choose a class and subject.");
  }

  await validateSameSchool(schoolId, [
    { model: "SchoolClass", id: classId },
    { model: "Subject", id: subjectId },
  ]);

  const lessonWhere: Record<string, unknown> = { classId, subjectId };
  if (schoolId && modelHasSchoolId("Lesson")) lessonWhere.schoolId = schoolId;

  const lessons = await prisma.lesson.findMany({
    where: lessonWhere,
    include: { topics: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });

  const scopedLessons = schoolId
    ? lessons.filter((l: Record<string, unknown>) => !l.schoolId || l.schoolId === schoolId)
    : lessons;

  const topics = scopedLessons.flatMap((lesson) =>
    lesson.topics.map((topic) => ({
      id: topic.id,
      lessonId: lesson.id,
      lesson: lesson.name,
      name: topic.name,
      planDate: topic.planDate ? toYmd(topic.planDate) : "",
      status: topic.status,
    })),
  );
  const completed = topics.filter((t) => t.status === "Completed").length;

  return {
    lessons: scopedLessons.map((l) => ({ id: l.id, name: l.name, topics: l.topics.length })),
    topics,
    summary: {
      lessons: scopedLessons.length,
      topics: topics.length,
      completed,
      percent: topics.length ? Math.round((100 * completed) / topics.length) : 0,
    },
  };
});
