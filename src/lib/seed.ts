import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const date = (value: string) => new Date(`${value}T00:00:00.000Z`);
const addDays = (value: string, days: number) => {
  const d = date(value);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

function rng(seed = 7) {
  let sd = seed;
  return () => {
    sd = (sd * 9301 + 49297) % 233280;
    return sd / 233280;
  };
}

export async function truncateAll(db: PrismaClient): Promise<void> {
  await db.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS=0");
  try {
    for (const model of Prisma.dmmf.datamodel.models) {
      const table = model.dbName ?? model.name;
      await db.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\``);
    }
  } finally {
    await db.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS=1");
  }
}

export async function seedDatabase(db: PrismaClient): Promise<{ students: number }> {
  await truncateAll(db);
  const rnd = rng(7);
  const pick = <T,>(list: T[]): T => list[Math.floor(rnd() * list.length)];

  await db.setting.create({
    data: {
      id: 1,
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
      planExpires: date("2027-03-31"),
    },
  });

  await db.academicSession.createMany({
    data: ["2024-25", "2025-26", "2026-27"].map((name) => ({ name })),
  });

  const sectionRows = await Promise.all(
    ["A", "B", "C"].map((name) => db.section.create({ data: { name } })),
  );
  const [secA, secB, secC] = sectionRows;

  const classes: { id: string; name: string; order: number; sectionIds: string[] }[] = [];
  for (let i = 1; i <= 8; i++) {
    const sectionIds = i <= 5 ? [secA.id, secB.id] : [secA.id, secB.id, secC.id];
    const created = await db.schoolClass.create({
      data: {
        name: `Class ${i}`,
        order: i,
        sections: { create: sectionIds.map((sectionId) => ({ sectionId })) },
      },
    });
    classes.push({ id: created.id, name: created.name, order: i, sectionIds });
  }

  const subjectNames = [
    "English",
    "Hindi",
    "Mathematics",
    "Science",
    "Social Science",
    "Computer",
    "Drawing",
  ];
  const subjects: { id: string; name: string }[] = [];
  for (let i = 0; i < subjectNames.length; i++) {
    const name = subjectNames[i];
    const created = await db.subject.create({
      data: {
        name,
        code: `${name.slice(0, 3).toUpperCase()}10${i}`,
        type: i === 5 || i === 6 ? "Practical" : "Theory",
      },
    });
    subjects.push({ id: created.id, name });
  }

  await db.subjectGroup.create({
    data: {
      name: "Core Subjects",
      classId: classes[4].id,
      sections: { create: [{ sectionId: secA.id }, { sectionId: secB.id }] },
      subjects: {
        create: subjects.slice(0, 5).map((s) => ({ subjectId: s.id })),
      },
    },
  });

  const categories: { id: string; name: string }[] = [];
  for (const name of ["General", "OBC", "SC", "ST"]) {
    categories.push(await db.studentCategory.create({ data: { name } }));
  }
  const houses: { id: string; name: string }[] = [];
  for (const [name, desc] of [
    ["Red", "Aryabhatta"],
    ["Blue", "Raman"],
    ["Green", "Tagore"],
    ["Yellow", "Bose"],
  ]) {
    houses.push(await db.studentHouse.create({ data: { name: `${name} House`, desc } }));
  }
  const disReasons: { id: string; name: string }[] = [];
  for (const name of [
    "Transfer to other school",
    "Fee default",
    "Left for relocation",
    "Long absence",
  ]) {
    disReasons.push(await db.disableReason.create({ data: { name } }));
  }

  const boys = ["Rohan", "Amit", "Arjun", "Mohit", "Vikas", "Rahul", "Aarav", "Kabir", "Ishaan", "Yash", "Dev", "Karan", "Aryan", "Nikhil", "Sahil", "Harsh"];
  const girls = ["Sneha", "Pooja", "Neha", "Simran", "Ananya", "Diya", "Riya", "Kavya", "Meera", "Priya", "Aditi", "Tanvi", "Isha", "Nisha", "Pari", "Muskan"];
  const last = ["Kumar", "Yadav", "Singh", "Gupta", "Verma", "Sharma", "Patel", "Mishra", "Pandey", "Tiwari"];
  const dads = ["Rajesh", "Sunil", "Anil", "Manoj", "Dinesh", "Ramesh", "Suresh", "Vijay", "Ashok", "Sanjay"];
  const moms = ["Sunita", "Anita", "Geeta", "Rekha", "Poonam", "Seema", "Kavita", "Meena"];

  const students: {
    id: string;
    name: string;
    admNo: string;
    father: string;
    phone: string;
    classId: string;
    className: string;
    sectionId: string;
    sectionName: string;
    admDate: string;
  }[] = [];
  const rollCounter: Record<string, number> = {};

  for (let i = 0; i < 48; i++) {
    const gender = i % 2 ? "Female" : "Male";
    const classIndex = i % 8;
    const cls = classes[classIndex];
    rollCounter[cls.id] = (rollCounter[cls.id] ?? 0) + 1;
    const sectionId = cls.sectionIds[i % cls.sectionIds.length];
    const surname = pick(last);
    const admNo = `ICE${1001 + i}`;
    const admDate = `2026-04-${pad(1 + (i % 28))}`;
    const created = await db.student.create({
      data: {
        admNo,
        rollNo: String(rollCounter[cls.id]),
        name: `${(gender === "Male" ? boys : girls)[Math.floor(i / 2) % 16]} ${surname}`,
        classId: cls.id,
        sectionId,
        gender,
        dob: date(`${2026 - 5 - (classIndex + 1)}-${pad(1 + Math.floor(rnd() * 12))}-${pad(1 + Math.floor(rnd() * 27))}`),
        father: `${pick(dads)} ${surname}`,
        mother: `${pick(moms)} ${surname}`,
        phone: `9${Math.floor(100000000 + rnd() * 899999999)}`,
        email: i % 3 === 0 ? `parent${i}@example.com` : null,
        address: "Lucknow, Uttar Pradesh",
        categoryId: pick(categories).id,
        houseId: pick(houses).id,
        admDate: date(admDate),
        status: i === 47 ? "disabled" : "active",
        disReasonId: i === 47 ? disReasons[0].id : null,
        portalPassword: `ice@${admNo}`,
      },
    });
    students.push({
      id: created.id,
      name: created.name,
      admNo,
      father: created.father ?? "",
      phone: created.phone ?? "",
      classId: cls.id,
      className: cls.name,
      sectionId,
      sectionName: sectionId === secA.id ? "A" : sectionId === secB.id ? "B" : "C",
      admDate,
    });
  }

  // ── Fees ──
  const feeGroup = await db.feeGroup.create({
    data: { name: "Regular Fees", desc: "Fees for all classes" },
  });
  const feeTypes = await Promise.all(
    [
      ["Admission Fee", "ADM"],
      ["Tuition Fee", "TUI"],
      ["Exam Fee", "EXM"],
      ["Library Fee", "LIB"],
    ].map(([name, code]) => db.feeType.create({ data: { name, code } })),
  );
  await db.feeDiscount.createMany({
    data: [
      { name: "Sibling Discount", code: "SIB", type: "Fixed", amount: 500 },
      { name: "Merit Scholarship", code: "MER", type: "Percent", amount: 10 },
      { name: "Staff Ward", code: "STF", type: "Percent", amount: 25 },
    ],
  });

  const feeMasters: {
    id: string;
    classId: string;
    amount: number;
    due: string;
    code: string;
    label: string;
  }[] = [];
  for (const cls of classes) {
    const k = cls.order;
    const defs: [string, string, number, string][] = [
      ["ADM", "", 1500 + k * 100, "2026-04-15"],
      ["TUI", "Term 1", 5000 + k * 400, "2026-07-10"],
      ["TUI", "Term 2", 5000 + k * 400, "2026-10-10"],
      ["EXM", "", 800, "2026-09-15"],
      ["LIB", "", 300, "2026-06-30"],
    ];
    for (const [code, label, amount, due] of defs) {
      const type = feeTypes.find((t) => t.code === code)!;
      const master = await db.feeMaster.create({
        data: {
          groupId: feeGroup.id,
          typeId: type.id,
          classId: cls.id,
          label: label || null,
          amount,
          due: date(due),
          fine: 50,
        },
      });
      feeMasters.push({ id: master.id, classId: cls.id, amount, due, code, label });
    }
  }

  let receipt = 1001;
  const payments: Prisma.PaymentCreateManyInput[] = [];
  const todayValue = today();
  for (const student of students) {
    if (student.admNo === "ICE1048") continue;
    for (const master of feeMasters.filter((m) => m.classId === student.classId)) {
      const r = rnd();
      let pay = 0;
      if (master.code === "ADM") pay = master.amount;
      else if (master.code === "LIB") pay = r < 0.8 ? master.amount : 0;
      else if (master.code === "TUI" && master.label === "Term 1") {
        pay = r < 0.7 ? master.amount : r < 0.85 ? Math.round(master.amount / 2) : 0;
      } else if (master.code === "EXM") pay = r < 0.6 ? master.amount : 0;
      else if (master.code === "TUI") pay = r < 0.3 ? master.amount : 0;
      if (!pay) continue;

      let payDate = addDays(master.due, -Math.floor(rnd() * 8));
      if (master.code === "ADM") payDate = date(student.admDate);
      if (payDate < date(student.admDate)) payDate = date(student.admDate);
      if (ymd(payDate) > todayValue) continue;
      payments.push({
        rc: `RCPT-${receipt++}`,
        studentId: student.id,
        feeKey: master.id,
        amount: pay,
        discount: 0,
        fine: 0,
        mode: pick(["Cash", "UPI", "Card", "Cash"]),
        date: payDate,
        note: null,
      });
    }
  }
  await db.payment.createMany({ data: payments });

  // ── Staff ──
  const departments: { id: string; name: string }[] = [];
  for (const name of ["Academics", "Administration", "Accounts", "Library", "Transport"]) {
    departments.push(await db.department.create({ data: { name } }));
  }
  const designations: { id: string; name: string }[] = [];
  for (const name of ["Principal", "Senior Teacher", "Teacher", "Accountant", "Librarian", "Driver", "Clerk"]) {
    designations.push(await db.designation.create({ data: { name } }));
  }
  const leaveTypeRows = await Promise.all(
    [
      ["Casual Leave", 12],
      ["Sick Leave", 10],
      ["Earned Leave", 15],
    ].map(([name, days]) => db.leaveType.create({ data: { name: String(name), days: Number(days) } })),
  );

  const staffDefs: [string, string, string, number, string][] = [
    ["Dr. Meenakshi Rao", "Principal", "Academics", 65000, "Female"],
    ["Suresh Kumar", "Senior Teacher", "Academics", 42000, "Male"],
    ["Anjali Mishra", "Teacher", "Academics", 32000, "Female"],
    ["Rakesh Tiwari", "Teacher", "Academics", 30000, "Male"],
    ["Pooja Srivastava", "Teacher", "Academics", 31000, "Female"],
    ["Manish Gupta", "Accountant", "Accounts", 28000, "Male"],
    ["Rekha Verma", "Librarian", "Library", 24000, "Female"],
    ["Ramprasad", "Driver", "Transport", 18000, "Male"],
  ];
  const staff: { id: string; name: string; empId: string; basic: number }[] = [];
  for (let i = 0; i < staffDefs.length; i++) {
    const [name, desig, dept, basic, gender] = staffDefs[i];
    const empId = `EMP${101 + i}`;
    const created = await db.staff.create({
      data: {
        empId,
        name,
        desigId: designations.find((d) => d.name === desig)!.id,
        deptId: departments.find((d) => d.name === dept)!.id,
        gender,
        phone: `98${Math.floor(10000000 + rnd() * 89999999)}`,
        email: `${name.split(" ").pop()!.toLowerCase()}@iceschool.in`,
        joinDate: date(`202${1 + (i % 4)}-04-01`),
        basic,
        status: "active",
        address: "Lucknow",
        qual: desig === "Driver" ? null : "M.Ed / B.Ed",
      },
    });
    staff.push({ id: created.id, name, empId, basic });
  }

  await db.staffLeave.create({
    data: {
      staffId: staff[2].id,
      typeId: leaveTypeRows[1].id,
      from: date("2026-10-14"),
      to: date("2026-10-15"),
      reason: "Fever",
      status: "Pending",
    },
  });
  await db.staffRating.createMany({
    data: [
      { staffId: staff[1].id, rating: 5, by: "Parent", comment: "Excellent maths teacher", date: date("2026-09-20") },
      { staffId: staff[2].id, rating: 4, by: "Parent", comment: "Very caring", date: date("2026-09-22") },
    ],
  });
  await db.studentLeave.create({
    data: {
      studentId: students[3].id,
      from: date("2026-10-14"),
      to: date("2026-10-14"),
      reason: "Family function",
      status: "Pending",
    },
  });

  // ── Attendance (last 10 weekdays) ──
  const activeStudents = students.filter((s) => s.admNo !== "ICE1048");
  const attendanceRows: Prisma.StudentAttendanceCreateManyInput[] = [];
  const staffAttRows: Prisma.StaffAttendanceCreateManyInput[] = [];
  const base = new Date();
  for (let k = 1; k <= 10; k++) {
    const d = new Date(base);
    d.setDate(d.getDate() - k);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const day = date(ymd(d));
    for (const student of activeStudents) {
      attendanceRows.push({
        studentId: student.id,
        date: day,
        status: rnd() < 0.92 ? "Present" : "Absent",
      });
    }
    for (const member of staff) {
      staffAttRows.push({
        staffId: member.id,
        date: day,
        status: rnd() < 0.95 ? "Present" : "Absent",
      });
    }
  }
  await db.studentAttendance.createMany({ data: attendanceRows });
  await db.staffAttendance.createMany({ data: staffAttRows });

  // ── Front office ──
  const frontDefs: [string, string][] = [
    ["purpose", "Admission Enquiry"],
    ["purpose", "Fee Related"],
    ["purpose", "Meeting with Principal"],
    ["purpose", "Parent Visit"],
    ["complaint", "Transport"],
    ["complaint", "Teaching"],
    ["complaint", "Facilities"],
    ["source", "Website"],
    ["source", "Walk-in"],
    ["source", "Advertisement"],
    ["reference", "Existing Parent"],
    ["reference", "Staff"],
  ];
  const front: { id: string; kind: string; name: string }[] = [];
  for (const [kind, name] of frontDefs) {
    front.push(await db.frontOfficeSetup.create({ data: { kind, name } }));
  }
  const frontId = (kind: string) => front.find((f) => f.kind === kind)!.id;

  await db.enquiry.createMany({
    data: [
      {
        name: "Sandeep Rawat",
        phone: "9812345670",
        address: "Aliganj",
        desc: "Admission for son in Class 4",
        classId: classes[3].id,
        sourceId: frontId("source"),
        date: date("2026-10-09"),
        follow: date("2026-10-15"),
        status: "Active",
      },
      {
        name: "Farah Khan",
        phone: "9876501234",
        address: "Indira Nagar",
        desc: "Daughter in Class 1",
        classId: classes[0].id,
        sourceId: frontId("source"),
        date: date("2026-10-11"),
        follow: date("2026-10-18"),
        status: "Active",
      },
    ],
  });
  await db.visitor.create({
    data: {
      purposeId: frontId("purpose"),
      name: "Ravi Shankar",
      phone: "9900112233",
      idCard: "Aadhaar",
      persons: 1,
      date: date("2026-10-12"),
      inTime: "10:15",
      outTime: "10:40",
    },
  });
  await db.phoneCall.create({
    data: {
      name: "Mrs. Gupta",
      phone: "9811122233",
      date: date("2026-10-12"),
      type: "Incoming",
      desc: "Asked about bus timing",
      duration: "3 min",
    },
  });
  await db.complaint.create({
    data: {
      typeId: frontId("complaint"),
      by: "Mr. Verma",
      phone: "9822334455",
      date: date("2026-10-10"),
      desc: "Bus arrives late on Route 2",
      status: "Pending",
    },
  });
  await db.onlineAdmission.create({
    data: {
      name: "Aarohi Saxena",
      classId: classes[1].id,
      gender: "Female",
      dob: date("2019-05-04"),
      father: "Amit Saxena",
      phone: "9877788899",
      email: "amit@example.com",
      address: "Gomti Nagar",
      date: date("2026-10-11"),
      status: "Pending",
    },
  });

  // ── Expenses ──
  const headNames = ["Electricity Bill", "Stationery", "Maintenance", "Salary", "Events"];
  const heads: { id: string; name: string }[] = [];
  for (const name of headNames) {
    heads.push(await db.expenseHead.create({ data: { name } }));
  }
  await db.expense.createMany({
    data: [
      { headId: heads[0].id, name: "Electricity - September", invoice: "EB/0926", amount: 12400, date: date("2026-10-02"), mode: "Cash" },
      { headId: heads[1].id, name: "Chart paper & markers", invoice: "INV-221", amount: 3150, date: date("2026-10-05"), mode: "Cash" },
      { headId: heads[2].id, name: "Lab repair", invoice: "MR-18", amount: 5800, date: date("2026-09-22"), mode: "Cash" },
      { headId: heads[4].id, name: "Teachers Day programme", invoice: "EV-09", amount: 7200, date: date("2026-09-05"), mode: "Cash" },
    ],
  });

  // ── Exams ──
  const examGroups = await Promise.all([
    db.examGroup.create({ data: { name: "Unit Test 1", session: "2026-27", desc: "July unit test" } }),
    db.examGroup.create({ data: { name: "Half Yearly", session: "2026-27", desc: "Half yearly exams" } }),
  ]);

  const schedules: { id: string; classId: string; max: number; pass: number; groupId: string }[] = [];
  for (const cls of classes) {
    for (let j = 0; j < 5; j++) {
      const unit = await db.examSchedule.create({
        data: {
          groupId: examGroups[0].id,
          classId: cls.id,
          subjectId: subjects[j].id,
          date: date(`2026-07-${pad(15 + j)}`),
          time: "09:00",
          room: `Room ${cls.order}`,
          max: 50,
          pass: 17,
        },
      });
      const half = await db.examSchedule.create({
        data: {
          groupId: examGroups[1].id,
          classId: cls.id,
          subjectId: subjects[j].id,
          date: date(`2026-10-${pad(20 + j)}`),
          time: "09:00",
          room: `Room ${cls.order}`,
          max: 100,
          pass: 33,
        },
      });
      schedules.push({ id: unit.id, classId: cls.id, max: 50, pass: 17, groupId: examGroups[0].id });
      schedules.push({ id: half.id, classId: cls.id, max: 100, pass: 33, groupId: examGroups[1].id });
    }
  }
  const resultRows: Prisma.ExamResultCreateManyInput[] = [];
  for (const schedule of schedules) {
    for (const student of activeStudents.filter((s) => s.classId === schedule.classId)) {
      resultRows.push({
        schedId: schedule.id,
        studentId: student.id,
        marks: schedule.max === 50 ? Math.round(18 + rnd() * 30) : Math.round(40 + rnd() * 52),
        absent: false,
      });
    }
  }
  await db.examResult.createMany({ data: resultRows });

  await db.grade.createMany({
    data: [
      { name: "A+", from: 90, to: 100, point: 10, remark: "Outstanding" },
      { name: "A", from: 80, to: 89.99, point: 9, remark: "Excellent" },
      { name: "B", from: 70, to: 79.99, point: 8, remark: "Very Good" },
      { name: "C", from: 60, to: 69.99, point: 7, remark: "Good" },
      { name: "D", from: 50, to: 59.99, point: 6, remark: "Satisfactory" },
      { name: "E", from: 33, to: 49.99, point: 5, remark: "Needs Improvement" },
      { name: "F", from: 0, to: 32.99, point: 0, remark: "Fail" },
    ],
  });
  await db.division.createMany({
    data: [
      { name: "First Division", from: 60, to: 100 },
      { name: "Second Division", from: 45, to: 59.99 },
      { name: "Third Division", from: 33, to: 44.99 },
      { name: "Fail", from: 0, to: 32.99 },
    ],
  });
  await db.admitTemplate.create({
    data: {
      id: 1,
      title: "ADMIT CARD",
      exam: "Half Yearly Examination 2026-27",
      instructions:
        "Carry this card to every exam. Reach 15 minutes early. Mobile phones are not allowed.",
      sign: "Principal",
    },
  });
  await db.markTemplate.create({
    data: {
      id: 1,
      title: "REPORT CARD",
      remarks: "Keep up the good work.",
      signL: "Class Teacher",
      signR: "Principal",
    },
  });
  await db.idCardTemplate.create({
    data: { id: 1, color: "#1d3a8a", validity: "Valid till March 2027" },
  });
  const onlineExam = await db.onlineExam.create({
    data: {
      title: "Maths Quiz - Class 5",
      classId: classes[4].id,
      subjectId: subjects[2].id,
      start: date("2026-10-01"),
      end: date("2026-12-31"),
      duration: 10,
      passPct: 40,
      active: true,
    },
  });
  await db.question.createMany({
    data: [
      { classId: classes[4].id, subjectId: subjects[2].id, question: "What is 12 x 8?", a: "86", b: "96", c: "98", d: "108", ans: "B", marks: 1 },
      { classId: classes[4].id, subjectId: subjects[2].id, question: "Which is a prime number?", a: "21", b: "27", c: "29", d: "33", ans: "C", marks: 1 },
      { classId: classes[4].id, subjectId: subjects[2].id, question: "What is 3/4 + 1/4?", a: "1", b: "1/2", c: "2", d: "3/4", ans: "A", marks: 1 },
      { classId: classes[4].id, subjectId: subjects[2].id, question: "Square root of 144?", a: "10", b: "11", c: "12", d: "14", ans: "C", marks: 1 },
    ],
  });
  await db.onlineExamResult.create({
    data: {
      examId: onlineExam.id,
      studentId: students.find((s) => s.classId === classes[4].id)!.id,
      score: 3,
      total: 4,
      pct: 75,
      date: date("2026-10-20"),
    },
  });

  // ── Lessons ──
  const lessonDefs: [string, string[]][] = [
    ["Mathematics", ["Fractions", "Decimals", "Geometry"]],
    ["Science", ["Plants", "Light and Shadow"]],
  ];
  for (const [subjectName, names] of lessonDefs) {
    const subjectId = subjects.find((s) => s.name === subjectName)!.id;
    for (let i = 0; i < names.length; i++) {
      const lesson = await db.lesson.create({
        data: { classId: classes[4].id, subjectId, name: names[i] },
      });
      for (const part of [1, 2]) {
        await db.topic.create({
          data: {
            lessonId: lesson.id,
            name: `${names[i]} - Part ${part}`,
            planDate: date(`2026-0${7 + i}-1${part}`),
            status: i === 0 ? "Completed" : i === 1 && part === 1 ? "In Progress" : "Pending",
          },
        });
      }
    }
  }
  const mathLesson = await db.lesson.findFirst({
    where: { classId: classes[4].id, subjectId: subjects[2].id },
  });
  await db.lessonPlan.create({
    data: {
      classId: classes[4].id,
      subjectId: subjects[2].id,
      lessonId: mathLesson!.id,
      date: date("2026-10-14"),
      teacherId: staff[1].id,
      note: "Chapter revision",
    },
  });

  // ── Communication ──
  await db.notice.createMany({
    data: [
      {
        title: "Diwali Holidays",
        msg: "School will remain closed from 19 Oct to 24 Oct for Diwali.",
        date: date("2026-10-10"),
        audience: ["Students", "Parents", "Staff"],
      },
      {
        title: "Half Yearly Exam Schedule",
        msg: "Half yearly exams begin from 20 October. Check the admit card.",
        date: date("2026-10-08"),
        audience: ["Students", "Parents"],
      },
    ],
  });
  await db.emailTemplate.createMany({
    data: [
      { title: "Fee Reminder", body: "Dear {name}, fee for {class} is pending. Please pay soon. - ICE School" },
      { title: "Holiday Notice", body: "Dear {name}, school will remain closed for the festival. - ICE School" },
    ],
  });
  await db.smsTemplate.createMany({
    data: [
      { title: "Absent Alert", body: "Dear Parent, {name} was absent today. - ICE School" },
      { title: "Exam Reminder", body: "Dear Parent, exams of {name} start on 20 Oct. - ICE School" },
    ],
  });
  await db.scheduledMessage.create({
    data: {
      title: "Exam reminder to parents",
      channel: "SMS",
      audience: "All Students",
      date: date("2026-10-18"),
      time: "09:00",
      msg: "Half yearly exams begin from 20 Oct.",
      status: "Scheduled",
    },
  });

  // ── Download center ──
  const contentTypes: { id: string; name: string }[] = [];
  for (const name of ["Syllabus", "Assignments", "Study Material", "Other Downloads"]) {
    contentTypes.push(await db.contentType.create({ data: { name } }));
  }
  await db.content.create({
    data: {
      title: "Class 5 Maths Syllabus",
      typeId: contentTypes[0].id,
      classId: classes[4].id,
      date: date("2026-09-01"),
      valid: date("2026-12-31"),
      url: "https://example.com/syllabus",
      desc: "Term 2 syllabus",
      shared: true,
    },
  });

  // ── Events / homework ──
  await db.schoolEvent.createMany({
    data: [
      { title: "Science Exhibition", date: date("2026-10-16"), time: "10:00", place: "Science Lab" },
      { title: "Half Yearly Exams Start", date: date("2026-10-20"), time: "10:00", place: "All Classrooms" },
      { title: "Fee Submission Last Date", date: date("2026-10-25"), time: "10:00", place: "Accounts Office" },
      { title: "Parent-Teacher Meeting", date: date("2026-10-30"), time: "10:00", place: "Main Hall" },
      { title: "Annual Sports Day", date: date("2026-11-08"), time: "10:00", place: "Ground" },
    ],
  });
  await db.homework.create({
    data: {
      classId: classes[4].id,
      sectionId: secA.id,
      subjectId: subjects[2].id,
      date: date("2026-10-12"),
      due: date("2026-10-15"),
      desc: "Exercise 4.2 questions 1-10",
      max: 10,
    },
  });

  // ── Library ──
  const bookDefs: [string, string, string, string, number][] = [
    ["Wings of Fire", "B-101", "A.P.J. Abdul Kalam", "Biography", 5],
    ["Panchatantra Stories", "B-102", "Vishnu Sharma", "Stories", 4],
    ["NCERT Maths Class 5", "B-103", "NCERT", "Textbook", 10],
    ["Malgudi Days", "B-104", "R.K. Narayan", "Stories", 3],
    ["Discovery of India", "B-105", "J. Nehru", "History", 2],
    ["Oxford Dictionary", "B-106", "Oxford", "Reference", 3],
  ];
  const books: { id: string; title: string }[] = [];
  for (const [title, no, author, subject, qty] of bookDefs) {
    books.push(
      await db.book.create({
        data: {
          title,
          no,
          isbn: `978-${Math.floor(1e9 + rnd() * 8e9)}`,
          author,
          subject,
          rack: `R${1 + Math.floor(rnd() * 5)}`,
          qty,
          price: 150 + Math.floor(rnd() * 300),
          date: date("2026-04-10"),
        },
      }),
    );
  }
  const members: { id: string }[] = [];
  for (let i = 0; i < 3; i++) {
    members.push(
      await db.libraryMember.create({
        data: {
          kind: i === 2 ? "staff" : "student",
          refId: i === 2 ? staff[1].id : students[i * 4].id,
          card: `LIB00${i + 1}`,
        },
      }),
    );
  }
  await db.bookIssue.createMany({
    data: [
      { memberId: members[0].id, bookId: books[0].id, issue: date("2026-10-01"), due: date("2026-10-08") },
      { memberId: members[1].id, bookId: books[2].id, issue: date("2026-10-05"), due: date("2026-10-19") },
    ],
  });

  // ── Inventory ──
  const itemCats: { id: string; name: string }[] = [];
  for (const name of ["Stationery", "Sports", "Lab Equipment", "Furniture"]) {
    itemCats.push(await db.itemCategory.create({ data: { name } }));
  }
  const store = await db.itemStore.create({ data: { name: "Main Store", code: "MS" } });
  const supplier = await db.itemSupplier.create({
    data: { name: "Lucknow Stationers", contact: "Mr. Arora", phone: "9811100011", address: "Hazratganj" },
  });
  const itemDefs: [string, string, string][] = [
    ["Chalk Box", "Stationery", "Box"],
    ["Cricket Bat", "Sports", "Piece"],
    ["Beaker 250ml", "Lab Equipment", "Piece"],
    ["Notebook", "Stationery", "Piece"],
  ];
  const items: { id: string; name: string }[] = [];
  for (const [name, cat, unit] of itemDefs) {
    items.push(
      await db.item.create({
        data: { name, catId: itemCats.find((c) => c.name === cat)!.id, unit },
      }),
    );
  }
  const stockDefs: [string, number, number][] = [
    [items[0].id, 100, 60],
    [items[1].id, 10, 650],
    [items[2].id, 30, 90],
    [items[3].id, 300, 25],
  ];
  for (const [itemId, qty, price] of stockDefs) {
    await db.itemStock.create({
      data: {
        itemId,
        supId: supplier.id,
        storeId: store.id,
        qty,
        price,
        date: date("2026-08-01"),
        purchaseNo: `PO-${Math.floor(rnd() * 900)}`,
      },
    });
  }
  await db.itemIssue.create({
    data: {
      itemId: items[0].id,
      staffId: staff[1].id,
      qty: 5,
      issue: date("2026-10-02"),
      status: "Issued",
    },
  });

  // ── Transport ──
  const routes: { id: string; name: string }[] = [];
  for (const name of ["Gomti Nagar Route", "Aliganj Route", "Indira Nagar Route"]) {
    routes.push(await db.transportRoute.create({ data: { name } }));
  }
  const vehicles: { id: string; number: string }[] = [];
  for (const [number, model, driver, phone, capacity] of [
    ["UP32 AB 1234", "Tata Starbus", "Ramprasad", "9811111111", 40],
    ["UP32 CD 5678", "Eicher Skyline", "Mohan Lal", "9822222222", 35],
  ] as [string, string, string, string, number][]) {
    vehicles.push(
      await db.vehicle.create({
        data: {
          number,
          model,
          year: "2022",
          driver,
          phone,
          licence: `DL-${1000 + vehicles.length}`,
          capacity,
        },
      }),
    );
  }
  const pickups: { id: string; name: string }[] = [];
  for (const name of ["Gomti Nagar Chauraha", "Aliganj Market", "Indira Nagar Park", "Hazratganj"]) {
    pickups.push(await db.pickupPoint.create({ data: { name } }));
  }
  for (let i = 0; i < 4; i++) {
    await db.routePickup.create({
      data: {
        routeId: routes[Math.min(i, 2)].id,
        pickupId: pickups[i].id,
        time: `07:${pad(10 + i * 10)}`,
      },
    });
  }
  for (let i = 0; i < 2; i++) {
    await db.vehicleAssignment.create({
      data: {
        routeId: routes[i].id,
        vehicles: { create: [{ vehicleId: vehicles[i].id }] },
      },
    });
  }
  const transportFees: { id: string; monthlyFee: number; months: number; fine: number }[] = [];
  for (let i = 0; i < 4; i++) {
    const fee = await db.transportFee.create({
      data: { pickupId: pickups[i].id, monthlyFee: [900, 700, 800, 1000][i], months: 10, fine: 50 },
    });
    transportFees.push({ id: fee.id, monthlyFee: [900, 700, 800, 1000][i], months: 10, fine: 50 });
  }
  for (let i = 0; i < 2; i++) {
    await db.transportAssignment.create({
      data: {
        studentId: students[i + 1].id,
        routeId: routes[i].id,
        pickupId: pickups[i].id,
        due: date("2026-10-31"),
      },
    });
  }

  // ── Hostel ──
  const hostels = await Promise.all([
    db.hostel.create({ data: { name: "Sunrise Boys Hostel", type: "Boys", address: "Campus Block B", intake: 60 } }),
    db.hostel.create({ data: { name: "Lotus Girls Hostel", type: "Girls", address: "Campus Block C", intake: 50 } }),
  ]);
  const roomTypes = await Promise.all(
    ["Single", "Double", "Dormitory"].map((name) => db.roomType.create({ data: { name } })),
  );
  const roomDefs: [string, string, string, number, number][] = [
    [hostels[0].id, roomTypes[1].id, "101", 2, 1800],
    [hostels[0].id, roomTypes[1].id, "102", 2, 1800],
    [hostels[1].id, roomTypes[0].id, "201", 1, 2500],
    [hostels[1].id, roomTypes[1].id, "202", 2, 1800],
  ];
  for (const [hostelId, typeId, roomNo, beds, cost] of roomDefs) {
    await db.room.create({ data: { hostelId, typeId, roomNo, beds, cost } });
  }

  // ── Certificates / alumni ──
  await db.certificateTemplate.createMany({
    data: [
      {
        name: "Bonafide Certificate",
        body: "This is to certify that {name}, son/daughter of {father}, is a bonafide student of this school studying in {class} (Admission No. {admNo}) during the session {session}. His/her date of birth as per school records is {dob}.",
        foot: "Principal",
      },
      {
        name: "Character Certificate",
        body: "This is to certify that {name}, son/daughter of {father}, Admission No. {admNo}, studied in {class} at {school}. During this period the conduct and character of the student were found to be good.",
        foot: "Principal",
      },
    ],
  });
  await db.alumni.createMany({
    data: [
      { name: "Anshul Pandey", year: "2018", occupation: "Software Engineer", phone: "9833344455", email: "anshul@example.com", address: "Bengaluru" },
      { name: "Ritika Sharma", year: "2019", occupation: "Doctor (MBBS)", phone: "9844455566", address: "Delhi" },
    ],
  });
  await db.alumniEvent.create({
    data: { title: "Alumni Meet 2026", from: date("2026-12-20"), to: date("2026-12-20"), place: "School Auditorium", note: "Annual get-together" },
  });

  // ── System ──
  await db.language.createMany({
    data: [
      { name: "English", code: "en", enabled: true },
      { name: "हिन्दी", code: "hi", enabled: true },
    ],
  });
  await db.role.createMany({
    data: [
      { name: "Admin", perms: "all" },
      { name: "Teacher", perms: ["stu", "att", "exam", "lesson", "hw", "comm", "dl", "acad", "lib"] },
      { name: "Accountant", perms: ["fees", "exp", "stu", "rep"] },
      { name: "Receptionist", perms: ["front", "stu", "comm"] },
    ],
  });
  const admin = await db.appUser.create({
    data: {
      name: "School Admin",
      username: "admin",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "Admin",
      active: true,
    },
  });
  await db.appUser.create({
    data: {
      name: "Anjali Mishra",
      username: "teacher",
      passwordHash: await bcrypt.hash("teacher123", 10),
      role: "Teacher",
      active: true,
    },
  });
  await db.appUser.create({
    data: {
      name: "Manish Gupta",
      username: "accounts",
      passwordHash: await bcrypt.hash("acc123", 10),
      role: "Accountant",
      active: true,
    },
  });
  await db.userLog.create({ data: { user: admin.username, act: "Seed demo data" } });

  await db.counter.createMany({
    data: [
      { key: "adm", value: 1048 },
      { key: "emp", value: 108 },
      { key: "receipt", value: receipt },
    ],
  });

  return { students: students.length };
}
