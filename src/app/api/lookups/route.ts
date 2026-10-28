import { prisma } from "@/lib/prisma";
import { route } from "@/lib/http";
import { requireUser } from "@/lib/auth";

export type Option = { value: string; label: string; [key: string]: unknown };

export const GET = route(async (req) => {
  await requireUser();
  const wanted = new URL(req.url).searchParams.get("keys");
  const keys = wanted ? new Set(wanted.split(",")) : null;
  const need = (key: string) => !keys || keys.has(key);

  const [
    classes,
    sections,
    subjects,
    students,
    staff,
    feeGroups,
    feeTypes,
    examGroups,
    departments,
    designations,
    leaveTypes,
    books,
    members,
    items,
    itemCats,
    stores,
    suppliers,
    routes,
    pickups,
    hostels,
    roomTypes,
    rooms,
    feeDiscounts,
    sessions,
    categories,
    houses,
    disReasons,
    expenseHeads,
    contentTypes,
    roles,
    templates,
    frontSetup,
    lessons,
    vehicles,
  ] = await Promise.all([
    need("classes")
      ? prisma.schoolClass.findMany({
          orderBy: { order: "asc" },
          include: { sections: true },
        })
      : [],
    need("sections") ? prisma.section.findMany({ orderBy: { name: "asc" } }) : [],
    need("subjects") ? prisma.subject.findMany({ orderBy: { name: "asc" } }) : [],
    need("students")
      ? prisma.student.findMany({
          where: { status: "active" },
          include: { class: true, section: true },
          orderBy: { name: "asc" },
          take: 3000,
        })
      : [],
    need("staff")
      ? prisma.staff.findMany({ where: { status: "active" }, orderBy: { name: "asc" } })
      : [],
    need("feeGroups") ? prisma.feeGroup.findMany({ orderBy: { name: "asc" } }) : [],
    need("feeTypes") ? prisma.feeType.findMany({ orderBy: { name: "asc" } }) : [],
    need("examGroups") ? prisma.examGroup.findMany({ orderBy: { name: "asc" } }) : [],
    need("departments") ? prisma.department.findMany({ orderBy: { name: "asc" } }) : [],
    need("designations") ? prisma.designation.findMany({ orderBy: { name: "asc" } }) : [],
    need("leaveTypes") ? prisma.leaveType.findMany({ orderBy: { name: "asc" } }) : [],
    need("books") ? prisma.book.findMany({ orderBy: { title: "asc" } }) : [],
    need("members")
      ? prisma.libraryMember.findMany({ orderBy: { card: "asc" } })
      : [],
    need("items") ? prisma.item.findMany({ orderBy: { name: "asc" } }) : [],
    need("itemCats") ? prisma.itemCategory.findMany({ orderBy: { name: "asc" } }) : [],
    need("stores") ? prisma.itemStore.findMany({ orderBy: { name: "asc" } }) : [],
    need("suppliers") ? prisma.itemSupplier.findMany({ orderBy: { name: "asc" } }) : [],
    need("routes") ? prisma.transportRoute.findMany({ orderBy: { name: "asc" } }) : [],
    need("pickups") ? prisma.pickupPoint.findMany({ orderBy: { name: "asc" } }) : [],
    need("hostels") ? prisma.hostel.findMany({ orderBy: { name: "asc" } }) : [],
    need("roomTypes") ? prisma.roomType.findMany({ orderBy: { name: "asc" } }) : [],
    need("rooms")
      ? prisma.room.findMany({ include: { hostel: true, type: true }, orderBy: { roomNo: "asc" } })
      : [],
    need("feeDiscounts") ? prisma.feeDiscount.findMany({ orderBy: { name: "asc" } }) : [],
    need("sessions") ? prisma.academicSession.findMany({ orderBy: { name: "desc" } }) : [],
    need("categories") ? prisma.studentCategory.findMany({ orderBy: { name: "asc" } }) : [],
    need("houses") ? prisma.studentHouse.findMany({ orderBy: { name: "asc" } }) : [],
    need("disReasons") ? prisma.disableReason.findMany({ orderBy: { name: "asc" } }) : [],
    need("expenseHeads") ? prisma.expenseHead.findMany({ orderBy: { name: "asc" } }) : [],
    need("contentTypes") ? prisma.contentType.findMany({ orderBy: { name: "asc" } }) : [],
    need("roles") ? prisma.role.findMany({ orderBy: { name: "asc" } }) : [],
    need("templates") ? prisma.certificateTemplate.findMany({ orderBy: { name: "asc" } }) : [],
    need("sources") || need("purposes") || need("complaintTypes") || need("references")
      ? prisma.frontOfficeSetup.findMany({ orderBy: { name: "asc" } })
      : [],
    need("lessons")
      ? prisma.lesson.findMany({
          include: { subject: true, class: true },
          orderBy: { name: "asc" },
        })
      : [],
    need("vehicles") ? prisma.vehicle.findMany({ orderBy: { number: "asc" } }) : [],
  ]);

  const memberNames = new Map<string, string>();
  if (need("members") && members.length) {
    const [studentRefs, staffRefs] = await Promise.all([
      prisma.student.findMany({
        where: { id: { in: members.filter((m) => m.kind === "student").map((m) => m.refId) } },
        select: { id: true, name: true, admNo: true },
      }),
      prisma.staff.findMany({
        where: { id: { in: members.filter((m) => m.kind === "staff").map((m) => m.refId) } },
        select: { id: true, name: true, empId: true },
      }),
    ]);
    for (const s of studentRefs) memberNames.set(`student|${s.id}`, `${s.name} (${s.admNo})`);
    for (const s of staffRefs) memberNames.set(`staff|${s.id}`, `${s.name} (${s.empId})`);
  }

  return {
    classes: classes.map((c) => ({
      value: c.id,
      label: c.name,
      sectionIds: c.sections.map((s) => s.sectionId),
    })),
    sections: sections.map((s) => ({ value: s.id, label: s.name })),
    subjects: subjects.map((s) => ({
      value: s.id,
      label: s.name,
      type: s.type,
      code: s.code ?? "",
    })),
    students: students.map((s) => ({
      value: s.id,
      label: `${s.name} (${s.admNo})`,
      name: s.name,
      admNo: s.admNo,
      father: s.father ?? "",
      phone: s.phone ?? "",
      classId: s.classId ?? "",
      sectionId: s.sectionId ?? "",
      className: s.class?.name ?? "",
      sectionName: s.section?.name ?? "",
      status: s.status,
    })),
    staff: staff.map((s) => ({
      value: s.id,
      label: `${s.name} (${s.empId})`,
      name: s.name,
      empId: s.empId,
    })),
    feeGroups: feeGroups.map((g) => ({ value: g.id, label: g.name })),
    feeTypes: feeTypes.map((t) => ({ value: t.id, label: t.name })),
    examGroups: examGroups.map((g) => ({ value: g.id, label: g.name })),
    departments: departments.map((d) => ({ value: d.id, label: d.name })),
    designations: designations.map((d) => ({ value: d.id, label: d.name })),
    leaveTypes: leaveTypes.map((t) => ({ value: t.id, label: `${t.name} (${t.days} days)` })),
    books: books.map((b) => ({
      value: b.id,
      label: `${b.title}${b.no ? ` · ${b.no}` : ""}`,
      qty: b.qty,
    })),
    members: members.map((m) => ({
      value: m.id,
      label: `${m.card} · ${memberNames.get(`${m.kind}|${m.refId}`) ?? m.refId}`,
      kind: m.kind,
    })),
    items: items.map((i) => ({ value: i.id, label: i.name })),
    itemCats: itemCats.map((c) => ({ value: c.id, label: c.name })),
    stores: stores.map((s) => ({ value: s.id, label: s.name })),
    suppliers: suppliers.map((s) => ({ value: s.id, label: s.name })),
    routes: routes.map((r) => ({ value: r.id, label: r.name })),
    pickups: pickups.map((p) => ({ value: p.id, label: p.name })),
    hostels: hostels.map((h) => ({ value: h.id, label: h.name })),
    roomTypes: roomTypes.map((t) => ({ value: t.id, label: t.name })),
    rooms: rooms.map((r) => ({
      value: r.id,
      label: `${r.hostel.name} - ${r.roomNo} (${r.type.name})`,
      hostelId: r.hostelId,
      beds: r.beds,
    })),
    feeDiscounts: feeDiscounts.map((d) => ({
      value: d.id,
      label: `${d.name} (${d.type === "Percent" ? `${Number(d.amount)}%` : `₹${Number(d.amount)}`})`,
      type: d.type,
      amount: Number(d.amount),
    })),
    sessions: sessions.map((s) => ({ value: s.name, label: s.name })),
    categories: categories.map((c) => ({ value: c.id, label: c.name })),
    houses: houses.map((h) => ({ value: h.id, label: h.name })),
    disReasons: disReasons.map((d) => ({ value: d.id, label: d.name })),
    expenseHeads: expenseHeads.map((h) => ({ value: h.id, label: h.name })),
    contentTypes: contentTypes.map((c) => ({ value: c.id, label: c.name })),
    roles: roles.map((r) => ({ value: r.name, label: r.name })),
    templates: templates.map((t) => ({ value: t.id, label: t.name })),
    sources: frontSetup
      .filter((f) => f.kind === "source")
      .map((f) => ({ value: f.id, label: f.name })),
    purposes: frontSetup
      .filter((f) => f.kind === "purpose")
      .map((f) => ({ value: f.id, label: f.name })),
    complaintTypes: frontSetup
      .filter((f) => f.kind === "complaint")
      .map((f) => ({ value: f.id, label: f.name })),
    references: frontSetup
      .filter((f) => f.kind === "reference")
      .map((f) => ({ value: f.id, label: f.name })),
    lessons: lessons.map((l) => ({
      value: l.id,
      label: `${l.class?.name ?? ""} · ${l.subject?.name ?? ""} · ${l.name}`,
      classId: l.classId,
      subjectId: l.subjectId,
    })),
    vehicles: vehicles.map((v) => ({ value: v.id, label: `${v.number} (${v.driver ?? "—"})` })),
  };
});
