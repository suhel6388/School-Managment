import { prisma } from "@/lib/prisma";
import { query, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { toYmd } from "@/lib/dates";

export const GET = route(async (req) => {
  await requirePermission("lesson");
  const params = query(req);
  const classId = params.get("classId") ?? "";
  const subjectId = params.get("subjectId") ?? "";
  if (!classId || !subjectId) {
    throw new ApiError(422, "Choose a class and subject.");
  }

  const lessons = await prisma.lesson.findMany({
    where: { classId, subjectId },
    include: { topics: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });

  const topics = lessons.flatMap((lesson) =>
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
    lessons: lessons.map((l) => ({ id: l.id, name: l.name, topics: l.topics.length })),
    topics,
    summary: {
      lessons: lessons.length,
      topics: topics.length,
      completed,
      percent: topics.length ? Math.round((100 * completed) / topics.length) : 0,
    },
  };
});
