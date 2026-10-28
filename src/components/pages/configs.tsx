"use client";

import { apiPost } from "@/lib/api";
import type { CrudConfig } from "@/components/crud/types";
import type { Field } from "@/components/DynamicForm";

const GENDERS = ["Male", "Female", "Other"].map((value) => ({ value, label: value }));
const STATUS2 = ["active", "disabled"].map((value) => ({ value, label: value }));
const PAY_MODES = ["Cash", "Bank Transfer", "Cheque", "UPI", "Card"].map((value) => ({
  value,
  label: value,
}));

function f(name: string, label: string, extra: Partial<Field> = {}): Field {
  return { name, label, ...extra };
}

function section(name: string, label: string): Field {
  return { name, label, type: "section" };
}

function inDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const nameDesc: Field[] = [
  f("name", "Name", { required: true }),
  f("desc", "Description", { type: "textarea" }),
];

export const CRUD_PAGES: Record<string, CrudConfig> = {
  // ── Students ──
  students: {
    resource: "students",
    title: "Student Details",
    singular: "Student",
    description:
      "Search, edit and manage every student record. Use Student Admission for a guided new admission, or click a row to open the full profile.",
    fields: [
      section("basic", "Student details"),
      f("admNo", "Admission number", { help: "Leave blank to generate automatically." }),
      f("rollNo", "Roll number"),
      f("name", "Full name", { required: true }),
      f("gender", "Gender", { type: "select", options: GENDERS }),
      f("dob", "Date of birth", { type: "date" }),
      f("admDate", "Admission date", { type: "date" }),
      section("academic", "Class and category"),
      f("classId", "Class", { type: "select", lookup: "classes", required: true }),
      f("sectionId", "Section", { type: "select", lookup: "sections", required: true }),
      f("categoryId", "Category", { type: "select", lookup: "categories" }),
      f("houseId", "House", { type: "select", lookup: "houses" }),
      f("status", "Status", { type: "select", options: STATUS2 }),
      f("disReasonId", "Disable reason", { type: "select", lookup: "disReasons" }),
      section("contact", "Parent and contact"),
      f("father", "Father's name"),
      f("mother", "Mother's name"),
      f("phone", "Guardian phone"),
      f("email", "Email", { type: "email" }),
      f("address", "Address", { type: "textarea" }),
      f("photo", "Photo", { type: "file", accept: "image/*", maxKb: 400 }),
      f("portalPassword", "Portal password", { help: "Shared with the family from Communicate." }),
    ],
    columns: [
      { key: "admNo", label: "Adm No" },
      { key: "name", label: "Name" },
      { key: "classId", label: "Class", lookup: "classes" },
      { key: "sectionId", label: "Section", lookup: "sections" },
      { key: "father", label: "Father" },
      { key: "phone", label: "Phone" },
      { key: "status", label: "Status", type: "badge" },
    ],
    filters: [
      { name: "classId", label: "Class", lookup: "classes" },
      { name: "sectionId", label: "Section", lookup: "sections" },
    ],
    pageSize: 12,
  },

  disabled: {
    resource: "students",
    title: "Disabled Students",
    singular: "Student",
    description: "Students whose records are disabled. Enable a student to return them to active lists.",
    fields: [],
    columns: [
      { key: "admNo", label: "Adm No" },
      { key: "name", label: "Name" },
      { key: "classId", label: "Class", lookup: "classes" },
      { key: "phone", label: "Phone" },
      { key: "disReasonId", label: "Reason", lookup: "disReasons" },
    ],
    defaultFilters: { status: "disabled" },
    canAdd: false,
    canEdit: false,
    rowActions: (row, helpers) => (
      <button
        type="button"
        className="mini ok"
        onClick={async () => {
          try {
            await apiPost("/api/actions/student-status", { id: row.id, status: "active" });
            helpers.refresh();
            helpers.toast("Student enabled.");
          } catch (err) {
            helpers.toast(err instanceof Error ? err.message : "Could not enable.", "err");
          }
        }}
      >
        Enable
      </button>
    ),
  },

  multiclass: {
    resource: "multiclass",
    title: "Multi Class Student",
    singular: "Class link",
    fields: [
      f("studentId", "Student", { type: "select", lookup: "students", required: true }),
      f("classId", "Additional class", { type: "select", lookup: "classes", required: true }),
      f("sectionId", "Section", { type: "select", lookup: "sections" }),
    ],
    columns: [
      { key: "studentId", label: "Student", lookup: "students" },
      { key: "classId", label: "Additional class", lookup: "classes" },
      { key: "sectionId", label: "Section", lookup: "sections" },
    ],
  },

  categories: {
    resource: "categories",
    title: "Student Categories",
    singular: "Category",
    fields: nameDesc,
    columns: [{ key: "name", label: "Category" }, { key: "desc", label: "Description" }],
  },
  houses: {
    resource: "houses",
    title: "Student Houses",
    singular: "House",
    fields: nameDesc,
    columns: [{ key: "name", label: "House" }, { key: "desc", label: "Description" }],
  },
  disreasons: {
    resource: "disReasons",
    title: "Disable Reasons",
    singular: "Reason",
    fields: nameDesc,
    columns: [{ key: "name", label: "Reason" }, { key: "desc", label: "Description" }],
  },

  // ── Academics ──
  classes: {
    resource: "classes",
    title: "Classes",
    singular: "Class",
    description: "Classes determine fee masters, exam schedules, attendance groups and reports.",
    fields: [
      f("name", "Class name", { required: true }),
      f("order", "Display order", { type: "number", def: 0 }),
      f("sectionIds", "Sections", { type: "multi", lookup: "sections" }),
    ],
    columns: [
      { key: "name", label: "Class" },
      { key: "order", label: "Order", type: "num" },
      {
        label: "Sections",
        render: (row) => {
          const ids = Array.isArray(row.sectionIds) ? (row.sectionIds as string[]) : [];
          return ids.length ? `${ids.length} linked` : <span className="muted">None</span>;
        },
      },
    ],
  },
  sections: {
    resource: "sections",
    title: "Sections",
    singular: "Section",
    fields: [f("name", "Section name", { required: true })],
    columns: [{ key: "name", label: "Section" }],
  },
  subjects: {
    resource: "subjects",
    title: "Subjects",
    singular: "Subject",
    fields: [
      f("name", "Subject name", { required: true }),
      f("code", "Subject code"),
      f("type", "Type", {
        type: "select",
        options: ["Theory", "Practical"].map((value) => ({ value, label: value })),
        def: "Theory",
      }),
    ],
    columns: [
      { key: "name", label: "Subject" },
      { key: "code", label: "Code" },
      { key: "type", label: "Type", type: "badge" },
    ],
  },
  subGroups: {
    resource: "subGroups",
    title: "Subject Groups",
    singular: "Subject group",
    fields: [
      f("name", "Group name", { required: true }),
      f("classId", "Class", { type: "select", lookup: "classes" }),
      f("sectionIds", "Sections", { type: "multi", lookup: "sections" }),
      f("subjectIds", "Subjects", { type: "multi", lookup: "subjects" }),
    ],
    columns: [
      { key: "name", label: "Group" },
      { key: "classId", label: "Class", lookup: "classes" },
      {
        label: "Subjects",
        render: (row) => `${Array.isArray(row.subjectIds) ? (row.subjectIds as string[]).length : 0} subjects`,
      },
      {
        label: "Sections",
        render: (row) => `${Array.isArray(row.sectionIds) ? (row.sectionIds as string[]).length : 0} sections`,
      },
    ],
  },
  sessions: {
    resource: "sessions",
    title: "Academic Sessions",
    singular: "Session",
    fields: [f("name", "Session", { required: true, placeholder: "2027-28" })],
    columns: [{ key: "name", label: "Session" }],
  },

  // ── Fees masters ──
  feesgroup: {
    resource: "feesGroup",
    title: "Fees Groups",
    singular: "Fee group",
    fields: nameDesc,
    columns: [{ key: "name", label: "Group" }, { key: "desc", label: "Description" }],
  },
  feestype: {
    resource: "feestype",
    title: "Fees Types",
    singular: "Fee type",
    fields: [
      f("name", "Fee type", { required: true }),
      f("code", "Code"),
      f("desc", "Description", { type: "textarea" }),
    ],
    columns: [
      { key: "name", label: "Fee type" },
      { key: "code", label: "Code" },
      { key: "desc", label: "Description" },
    ],
  },
  feesdisc: {
    resource: "feesdisc",
    title: "Fees Discounts",
    singular: "Discount",
    fields: [
      f("name", "Discount name", { required: true }),
      f("code", "Code"),
      f("type", "Type", {
        type: "select",
        options: ["Fixed", "Percent"].map((value) => ({ value, label: value })),
        def: "Fixed",
      }),
      f("amount", "Amount / percentage", { type: "money", required: true }),
    ],
    columns: [
      { key: "name", label: "Discount" },
      { key: "code", label: "Code" },
      { key: "type", label: "Type" },
      { key: "amount", label: "Value", type: "money" },
    ],
  },
  feesmaster: {
    resource: "feesmaster",
    title: "Fees Master",
    singular: "Fee",
    description:
      "A fee master row creates the fee for every student in the selected class. Set a due date to make it collectable.",
    fields: [
      f("groupId", "Fee group", { type: "select", lookup: "feeGroups", required: true }),
      f("typeId", "Fee type", { type: "select", lookup: "feeTypes", required: true }),
      f("classId", "Class", { type: "select", lookup: "classes", required: true }),
      f("label", "Label", { help: "Optional, e.g. Term 1 or Transport" }),
      f("amount", "Amount", { type: "money", required: true }),
      f("due", "Due date", { type: "date" }),
      f("fine", "Fine", { type: "money", def: 0 }),
    ],
    columns: [
      { key: "classId", label: "Class", lookup: "classes" },
      { key: "groupId", label: "Group", lookup: "feeGroups" },
      { key: "typeId", label: "Fee type", lookup: "feeTypes" },
      { key: "label", label: "Label" },
      { key: "amount", label: "Amount", type: "money" },
      { key: "due", label: "Due", type: "date" },
      { key: "fine", label: "Fine", type: "money" },
    ],
    filters: [
      { name: "classId", label: "Class", lookup: "classes" },
      {
        name: "groupId",
        label: "Group",
        lookup: "feeGroups",
      },
    ],
    dateRange: true,
    pageSize: 25,
  },
  carry: {
    resource: "carry",
    title: "Fees Carry Forward",
    singular: "Carry-forward fee",
    description: "Bring an unpaid previous-session balance into a student's current fee ledger.",
    fields: [
      f("studentId", "Student", { type: "select", lookup: "students", required: true }),
      f("fromSession", "From session", { required: true, placeholder: "2025-26" }),
      f("amount", "Balance amount", { type: "money", required: true }),
      f("due", "Due date", { type: "date" }),
    ],
    columns: [
      { key: "studentId", label: "Student", lookup: "students" },
      { key: "fromSession", label: "From session" },
      { key: "amount", label: "Amount", type: "money" },
      { key: "due", label: "Due", type: "date" },
    ],
    filters: [{ name: "studentId", label: "Student", lookup: "students" }],
  },
  feeremind: {
    resource: "feeremind",
    title: "Fees Reminder",
    singular: "Reminder rule",
    description: "Reminder rules are used by Communicate → WhatsApp and Fee Reminder runs.",
    fields: [
      f("name", "Rule name", { required: true }),
      f("kind", "Timing", {
        type: "select",
        options: ["Before due", "After due"].map((value) => ({ value, label: value })),
        def: "Before due",
      }),
      f("days", "Days", { type: "number", def: 3, min: 0 }),
      f("sms", "SMS", { type: "checkbox", def: true, help: "Send by SMS" }),
      f("email", "Email", { type: "checkbox", help: "Send by email" }),
      f("wa", "WhatsApp", { type: "checkbox", help: "Send by WhatsApp" }),
      f("active", "Active", { type: "checkbox", def: true, help: "Use this rule" }),
    ],
    columns: [
      { key: "name", label: "Rule" },
      { key: "kind", label: "Timing" },
      { key: "days", label: "Days", type: "num" },
      { key: "active", label: "Active", type: "bool" },
    ],
  },

  // ── Front office ──
  enquiry: {
    resource: "enquiries",
    title: "Admission Enquiry",
    singular: "Enquiry",
    fields: [
      f("name", "Name", { required: true }),
      f("phone", "Phone", { required: true }),
      f("email", "Email", { type: "email" }),
      f("classId", "Class", { type: "select", lookup: "classes" }),
      f("sourceId", "Source", { type: "select", lookup: "sources" }),
      f("date", "Enquiry date", { type: "date" }),
      f("follow", "Follow-up date", { type: "date" }),
      f("status", "Status", {
        type: "select",
        options: ["Active", "Closed", "Converted"].map((value) => ({ value, label: value })),
        def: "Active",
      }),
      f("address", "Address", { type: "textarea" }),
      f("desc", "Enquiry details", { type: "textarea" }),
      f("note", "Follow-up note", { type: "textarea" }),
    ],
    columns: [
      { key: "name", label: "Name" },
      { key: "phone", label: "Phone" },
      { key: "classId", label: "Class", lookup: "classes" },
      { key: "sourceId", label: "Source", lookup: "sources" },
      { key: "follow", label: "Follow-up", type: "date" },
      { key: "status", label: "Status", type: "badge" },
    ],
    filters: [{ name: "status", label: "Status", options: ["Active", "Closed", "Converted"].map((x) => ({ value: x, label: x })) }],
    dateRange: true,
  },
  visitors: {
    resource: "visitors",
    title: "Visitor Book",
    singular: "Visitor",
    fields: [
      f("name", "Visitor name", { required: true }),
      f("purposeId", "Purpose", { type: "select", lookup: "purposes" }),
      f("phone", "Phone"),
      f("idCard", "ID card number"),
      f("persons", "Number of persons", { type: "number", def: 1 }),
      f("date", "Date", { type: "date" }),
      f("inTime", "In time", { type: "time" }),
      f("outTime", "Out time", { type: "time" }),
      f("note", "Note", { type: "textarea" }),
    ],
    columns: [
      { key: "name", label: "Visitor" },
      { key: "purposeId", label: "Purpose", lookup: "purposes" },
      { key: "phone", label: "Phone" },
      { key: "persons", label: "Persons", type: "num" },
      { key: "date", label: "Date", type: "date" },
      { key: "inTime", label: "In" },
      { key: "outTime", label: "Out" },
    ],
    dateRange: true,
  },
  calls: {
    resource: "calls",
    title: "Phone Call Log",
    singular: "Call",
    fields: [
      f("name", "Caller name", { required: true }),
      f("phone", "Phone", { required: true }),
      f("date", "Date", { type: "date" }),
      f("type", "Type", {
        type: "select",
        options: ["Incoming", "Outgoing"].map((value) => ({ value, label: value })),
        def: "Incoming",
      }),
      f("duration", "Duration"),
      f("follow", "Follow-up date", { type: "date" }),
      f("desc", "Call summary", { type: "textarea" }),
      f("note", "Note", { type: "textarea" }),
    ],
    columns: [
      { key: "name", label: "Caller" },
      { key: "phone", label: "Phone" },
      { key: "type", label: "Type" },
      { key: "date", label: "Date", type: "date" },
      { key: "duration", label: "Duration" },
    ],
    dateRange: true,
  },
  dispatch: {
    resource: "dispatch",
    title: "Postal Dispatch",
    singular: "Dispatch",
    fields: [
      f("toTitle", "To", { required: true }),
      f("refNo", "Reference no"),
      f("fromTitle", "From"),
      f("address", "Address", { type: "textarea" }),
      f("date", "Date", { type: "date" }),
      f("note", "Note", { type: "textarea" }),
    ],
    columns: [
      { key: "toTitle", label: "To" },
      { key: "refNo", label: "Ref no" },
      { key: "fromTitle", label: "From" },
      { key: "date", label: "Date", type: "date" },
    ],
    dateRange: true,
  },
  receive: {
    resource: "receive",
    title: "Postal Receive",
    singular: "Postal record",
    fields: [
      f("fromTitle", "From", { required: true }),
      f("refNo", "Reference no"),
      f("toTitle", "To"),
      f("address", "Address", { type: "textarea" }),
      f("date", "Date", { type: "date" }),
      f("note", "Note", { type: "textarea" }),
    ],
    columns: [
      { key: "fromTitle", label: "From" },
      { key: "refNo", label: "Ref no" },
      { key: "toTitle", label: "To" },
      { key: "date", label: "Date", type: "date" },
    ],
    dateRange: true,
  },
  complaint: {
    resource: "complaint",
    title: "Complaints",
    singular: "Complaint",
    fields: [
      f("by", "Complainant", { required: true }),
      f("typeId", "Complaint type", { type: "select", lookup: "complaintTypes" }),
      f("phone", "Phone"),
      f("date", "Date", { type: "date" }),
      f("desc", "Complaint", { type: "textarea" }),
      f("action", "Action taken", { type: "textarea" }),
      f("note", "Note", { type: "textarea" }),
      f("status", "Status", {
        type: "select",
        options: ["Pending", "Resolved", "Closed"].map((value) => ({ value, label: value })),
        def: "Pending",
      }),
    ],
    columns: [
      { key: "by", label: "By" },
      { key: "typeId", label: "Type", lookup: "complaintTypes" },
      { key: "date", label: "Date", type: "date" },
      { key: "status", label: "Status", type: "badge" },
    ],
    filters: [{ name: "status", label: "Status", options: ["Pending", "Resolved", "Closed"].map((x) => ({ value: x, label: x })) }],
    dateRange: true,
  },
  frontsetup: {
    resource: "frontsetup",
    title: "Setup Front Office",
    singular: "Setup entry",
    description: "Sources, purposes, complaint types and reference lists used by Front Office forms.",
    fields: [
      f("kind", "Type", {
        type: "select",
        options: [
          { value: "source", label: "Enquiry source" },
          { value: "purpose", label: "Visitor purpose" },
          { value: "complaint", label: "Complaint type" },
          { value: "reference", label: "Reference" },
        ],
        required: true,
      }),
      f("name", "Name", { required: true }),
      f("desc", "Description", { type: "textarea" }),
    ],
    columns: [
      { key: "kind", label: "Type" },
      { key: "name", label: "Name" },
      { key: "desc", label: "Description" },
    ],
  },

  // ── Expenses ──
  addexp: {
    resource: "addexp",
    title: "Expenses",
    singular: "Expense",
    fields: [
      f("headId", "Expense head", { type: "select", lookup: "expenseHeads", required: true }),
      f("name", "Expense name", { required: true }),
      f("invoice", "Invoice number"),
      f("amount", "Amount", { type: "money", required: true }),
      f("date", "Date", { type: "date", required: true }),
      f("mode", "Payment mode", { type: "select", options: PAY_MODES, def: "Cash" }),
      f("note", "Note", { type: "textarea" }),
    ],
    columns: [
      { key: "name", label: "Expense" },
      { key: "headId", label: "Head", lookup: "expenseHeads" },
      { key: "invoice", label: "Invoice" },
      { key: "amount", label: "Amount", type: "money" },
      { key: "date", label: "Date", type: "date" },
      { key: "mode", label: "Mode" },
    ],
    filters: [{ name: "headId", label: "Head", lookup: "expenseHeads" }],
    dateRange: true,
  },
  searchexp: {
    resource: "addexp",
    title: "Search Expenses",
    singular: "Expense",
    description: "Filter recorded expenses by keyword, head and date range. Export the result to CSV.",
    fields: [],
    columns: [
      { key: "name", label: "Expense" },
      { key: "headId", label: "Head", lookup: "expenseHeads" },
      { key: "invoice", label: "Invoice" },
      { key: "amount", label: "Amount", type: "money" },
      { key: "date", label: "Date", type: "date" },
      { key: "mode", label: "Mode" },
    ],
    filters: [{ name: "headId", label: "Head", lookup: "expenseHeads" }],
    dateRange: true,
    canAdd: false,
    canEdit: false,
    canDelete: false,
    pageSize: 25,
  },
  exphead: {
    resource: "expHeads",
    title: "Expense Heads",
    singular: "Expense head",
    fields: nameDesc,
    columns: [{ key: "name", label: "Head" }, { key: "desc", label: "Description" }],
  },

  // ── Staff ──
  staff: {
    resource: "staff",
    title: "Staff Directory",
    singular: "Staff member",
    fields: [
      f("empId", "Employee ID", { help: "Leave blank to generate automatically." }),
      f("name", "Full name", { required: true }),
      f("desigId", "Designation", { type: "select", lookup: "designations" }),
      f("deptId", "Department", { type: "select", lookup: "departments" }),
      f("gender", "Gender", { type: "select", options: GENDERS }),
      f("phone", "Phone"),
      f("email", "Email", { type: "email" }),
      f("joinDate", "Joining date", { type: "date" }),
      f("basic", "Basic salary", { type: "money", def: 0 }),
      f("status", "Status", {
        type: "select",
        options: ["active", "inactive"].map((value) => ({ value, label: value })),
      }),
      f("qual", "Qualification"),
      f("address", "Address", { type: "textarea" }),
    ],
    columns: [
      { key: "empId", label: "Emp ID" },
      { key: "name", label: "Name" },
      { key: "desigId", label: "Designation", lookup: "designations" },
      { key: "deptId", label: "Department", lookup: "departments" },
      { key: "phone", label: "Phone" },
      { key: "basic", label: "Basic", type: "money" },
      { key: "status", label: "Status", type: "badge" },
    ],
    filters: [
      { name: "deptId", label: "Department", lookup: "departments" },
      { name: "status", label: "Status", options: ["active", "inactive"].map((x) => ({ value: x, label: x })) },
    ],
  },
  disstaff: {
    resource: "staff",
    title: "Disabled Staff",
    singular: "Staff member",
    fields: [],
    columns: [
      { key: "empId", label: "Emp ID" },
      { key: "name", label: "Name" },
      { key: "desigId", label: "Designation", lookup: "designations" },
      { key: "phone", label: "Phone" },
    ],
    defaultFilters: { status: "inactive" },
    canAdd: false,
    canEdit: false,
    rowActions: (row, helpers) => (
      <button
        type="button"
        className="mini ok"
        onClick={async () => {
          try {
            await apiPost("/api/actions/staff-status", { id: row.id, status: "active" });
            helpers.refresh();
            helpers.toast("Staff member enabled.");
          } catch (err) {
            helpers.toast(err instanceof Error ? err.message : "Could not enable.", "err");
          }
        }}
      >
        Enable
      </button>
    ),
  },
  dept: {
    resource: "departments",
    title: "Departments",
    singular: "Department",
    fields: nameDesc,
    columns: [{ key: "name", label: "Department" }, { key: "desc", label: "Description" }],
  },
  desig: {
    resource: "designations",
    title: "Designations",
    singular: "Designation",
    fields: nameDesc,
    columns: [{ key: "name", label: "Designation" }, { key: "desc", label: "Description" }],
  },
  leavetypes: {
    resource: "leaveTypes",
    title: "Leave Types",
    singular: "Leave type",
    fields: [
      f("name", "Leave type", { required: true }),
      f("days", "Days allowed", { type: "number", def: 0 }),
    ],
    columns: [
      { key: "name", label: "Leave type" },
      { key: "days", label: "Days", type: "num" },
    ],
  },
  staffleave: {
    resource: "staffLeaves",
    title: "Approve Staff Leave",
    singular: "Leave request",
    fields: [
      f("staffId", "Staff member", { type: "select", lookup: "staff", required: true }),
      f("typeId", "Leave type", { type: "select", lookup: "leaveTypes" }),
      f("from", "From", { type: "date", required: true }),
      f("to", "To", { type: "date", required: true }),
      f("status", "Status", {
        type: "select",
        options: ["Pending", "Approved", "Rejected"].map((value) => ({ value, label: value })),
        def: "Pending",
      }),
      f("reason", "Reason", { type: "textarea" }),
    ],
    columns: [
      { key: "staffId", label: "Staff", lookup: "staff" },
      { key: "typeId", label: "Type", lookup: "leaveTypes" },
      { key: "from", label: "From", type: "date" },
      { key: "to", label: "To", type: "date" },
      { key: "status", label: "Status", type: "badge" },
    ],
    filters: [{ name: "status", label: "Status", options: ["Pending", "Approved", "Rejected"].map((x) => ({ value: x, label: x })) }],
    rowActions: (row, helpers) => (
      <>
        <button
          type="button"
          className="mini ok"
          onClick={async () => {
            try {
              await apiPost("/api/actions/leave-status", { kind: "staff", id: row.id, status: "Approved" });
              helpers.refresh();
              helpers.toast("Leave approved.");
            } catch (err) {
              helpers.toast(err instanceof Error ? err.message : "Could not approve.", "err");
            }
          }}
        >
          Approve
        </button>
        <button
          type="button"
          className="mini no"
          onClick={async () => {
            try {
              await apiPost("/api/actions/leave-status", { kind: "staff", id: row.id, status: "Rejected" });
              helpers.refresh();
              helpers.toast("Leave rejected.");
            } catch (err) {
              helpers.toast(err instanceof Error ? err.message : "Could not reject.", "err");
            }
          }}
        >
          Reject
        </button>
      </>
    ),
  },
  stuleave: {
    resource: "studentLeaves",
    title: "Student Leave Requests",
    singular: "Leave request",
    description:
      "Leave requests submitted for students. Approving or rejecting a request records the decision in the audit trail.",
    fields: [
      f("studentId", "Student", { type: "select", lookup: "students", required: true }),
      f("from", "From", { type: "date", required: true }),
      f("to", "To", { type: "date", required: true }),
      f("status", "Status", {
        type: "select",
        options: ["Pending", "Approved", "Rejected"].map((value) => ({ value, label: value })),
        def: "Pending",
      }),
      f("reason", "Reason", { type: "textarea" }),
    ],
    columns: [
      { key: "studentId", label: "Student", lookup: "students" },
      { key: "from", label: "From", type: "date" },
      { key: "to", label: "To", type: "date" },
      { key: "reason", label: "Reason" },
      { key: "status", label: "Status", type: "badge" },
    ],
    filters: [
      {
        name: "status",
        label: "Status",
        options: ["Pending", "Approved", "Rejected"].map((value) => ({ value, label: value })),
      },
    ],
    rowActions: (row, helpers) => (
      <>
        <button
          type="button"
          className="mini ok"
          onClick={async () => {
            try {
              await apiPost("/api/actions/leave-status", {
                kind: "student",
                id: row.id,
                status: "Approved",
              });
              helpers.refresh();
              helpers.toast("Leave approved.");
            } catch (err) {
              helpers.toast(err instanceof Error ? err.message : "Could not approve.", "err");
            }
          }}
        >
          Approve
        </button>
        <button
          type="button"
          className="mini no"
          onClick={async () => {
            try {
              await apiPost("/api/actions/leave-status", {
                kind: "student",
                id: row.id,
                status: "Rejected",
              });
              helpers.refresh();
              helpers.toast("Leave rejected.");
            } catch (err) {
              helpers.toast(err instanceof Error ? err.message : "Could not reject.", "err");
            }
          }}
        >
          Reject
        </button>
      </>
    ),
  },
  applyleave: {
    resource: "staffLeaves",
    title: "Apply Leave",
    singular: "Leave request",
    fields: [
      f("staffId", "Staff member", { type: "select", lookup: "staff", required: true }),
      f("typeId", "Leave type", { type: "select", lookup: "leaveTypes" }),
      f("from", "From", { type: "date", required: true }),
      f("to", "To", { type: "date", required: true }),
      f("reason", "Reason", { type: "textarea" }),
      f("status", "Status", {
        type: "select",
        options: ["Pending", "Approved", "Rejected"].map((value) => ({ value, label: value })),
        def: "Pending",
      }),
    ],
    columns: [
      { key: "staffId", label: "Staff", lookup: "staff" },
      { key: "typeId", label: "Type", lookup: "leaveTypes" },
      { key: "from", label: "From", type: "date" },
      { key: "to", label: "To", type: "date" },
      { key: "status", label: "Status", type: "badge" },
    ],
  },
  rating: {
    resource: "rating",
    title: "Teachers Rating",
    singular: "Rating",
    fields: [
      f("staffId", "Staff member", { type: "select", lookup: "staff", required: true }),
      f("rating", "Rating (1-5)", { type: "number", min: 1, max: 5, required: true }),
      f("by", "Rated by"),
      f("date", "Date", { type: "date" }),
      f("comment", "Comment", { type: "textarea" }),
    ],
    columns: [
      { key: "staffId", label: "Staff", lookup: "staff" },
      { key: "rating", label: "Rating", type: "stars" },
      { key: "by", label: "By" },
      { key: "date", label: "Date", type: "date" },
    ],
    filters: [{ name: "staffId", label: "Staff", lookup: "staff" }],
  },

  // ── Exams ──
  examgroup: {
    resource: "examGroups",
    title: "Exam Groups",
    singular: "Exam group",
    fields: [
      f("name", "Exam name", { required: true }),
      f("session", "Session", { required: true, def: "2026-27" }),
      f("desc", "Description", { type: "textarea" }),
    ],
    columns: [
      { key: "name", label: "Exam" },
      { key: "session", label: "Session" },
      { key: "desc", label: "Description" },
    ],
  },
  examsched: {
    resource: "examSched",
    title: "Exam Schedule",
    singular: "Exam paper",
    fields: [
      f("groupId", "Exam group", { type: "select", lookup: "examGroups", required: true }),
      f("classId", "Class", { type: "select", lookup: "classes", required: true }),
      f("subjectId", "Subject", { type: "select", lookup: "subjects", required: true }),
      f("date", "Date", { type: "date", required: true }),
      f("time", "Time", { type: "time" }),
      f("room", "Room"),
      f("max", "Maximum marks", { type: "number", def: 50, required: true }),
      f("pass", "Pass marks", { type: "number", def: 17, required: true }),
    ],
    columns: [
      { key: "groupId", label: "Exam", lookup: "examGroups" },
      { key: "classId", label: "Class", lookup: "classes" },
      { key: "subjectId", label: "Subject", lookup: "subjects" },
      { key: "date", label: "Date", type: "date" },
      { key: "time", label: "Time" },
      { key: "max", label: "Max", type: "num" },
      { key: "pass", label: "Pass", type: "num" },
    ],
    filters: [
      { name: "groupId", label: "Exam", lookup: "examGroups" },
      { name: "classId", label: "Class", lookup: "classes" },
    ],
    pageSize: 25,
  },
  grades: {
    resource: "grades",
    title: "Marks Grades",
    singular: "Grade",
    fields: [
      f("name", "Grade", { required: true }),
      f("from", "From %", { type: "number", required: true }),
      f("to", "To %", { type: "number", required: true }),
      f("point", "Grade point", { type: "number", def: 0 }),
      f("remark", "Remark"),
    ],
    columns: [
      { key: "name", label: "Grade" },
      { key: "from", label: "From", type: "num" },
      { key: "to", label: "To", type: "num" },
      { key: "point", label: "Point", type: "num" },
      { key: "remark", label: "Remark" },
    ],
  },
  divisions: {
    resource: "divisions",
    title: "Marks Divisions",
    singular: "Division",
    fields: [
      f("name", "Division", { required: true }),
      f("from", "From %", { type: "number", required: true }),
      f("to", "To %", { type: "number", required: true }),
    ],
    columns: [
      { key: "name", label: "Division" },
      { key: "from", label: "From", type: "num" },
      { key: "to", label: "To", type: "num" },
    ],
  },

  // ── Online exams ──
  onlineexam: {
    resource: "onlineExams",
    title: "Online Exams",
    singular: "Online exam",
    fields: [
      f("title", "Title", { required: true }),
      f("classId", "Class", { type: "select", lookup: "classes", required: true }),
      f("subjectId", "Subject", { type: "select", lookup: "subjects", required: true }),
      f("start", "Start date", { type: "date" }),
      f("end", "End date", { type: "date" }),
      f("duration", "Duration (minutes)", { type: "number", def: 10 }),
      f("passPct", "Pass %", { type: "number", def: 40 }),
      f("active", "Active", { type: "checkbox", def: true, help: "Available to students" }),
    ],
    columns: [
      { key: "title", label: "Exam" },
      { key: "classId", label: "Class", lookup: "classes" },
      { key: "subjectId", label: "Subject", lookup: "subjects" },
      { key: "start", label: "Start", type: "date" },
      { key: "duration", label: "Minutes", type: "num" },
      { key: "active", label: "Active", type: "bool" },
    ],
  },
  qbank: {
    resource: "qbank",
    title: "Question Bank",
    singular: "Question",
    fields: [
      f("classId", "Class", { type: "select", lookup: "classes", required: true }),
      f("subjectId", "Subject", { type: "select", lookup: "subjects", required: true }),
      f("question", "Question", { type: "textarea", required: true }),
      f("a", "Option A", { required: true }),
      f("b", "Option B", { required: true }),
      f("c", "Option C"),
      f("d", "Option D"),
      f("ans", "Correct answer", {
        type: "select",
        options: ["A", "B", "C", "D"].map((value) => ({ value, label: value })),
        def: "A",
      }),
      f("marks", "Marks", { type: "number", def: 1 }),
    ],
    columns: [
      { key: "question", label: "Question" },
      { key: "classId", label: "Class", lookup: "classes" },
      { key: "subjectId", label: "Subject", lookup: "subjects" },
      { key: "ans", label: "Answer" },
      { key: "marks", label: "Marks", type: "num" },
    ],
    filters: [
      { name: "classId", label: "Class", lookup: "classes" },
      { name: "subjectId", label: "Subject", lookup: "subjects" },
    ],
  },

  // ── Lessons ──
  lessons: {
    resource: "lessons",
    title: "Lessons",
    singular: "Lesson",
    fields: [
      f("classId", "Class", { type: "select", lookup: "classes", required: true }),
      f("subjectId", "Subject", { type: "select", lookup: "subjects", required: true }),
      f("name", "Lesson name", { required: true }),
    ],
    columns: [
      { key: "classId", label: "Class", lookup: "classes" },
      { key: "subjectId", label: "Subject", lookup: "subjects" },
      { key: "name", label: "Lesson" },
    ],
    filters: [
      { name: "classId", label: "Class", lookup: "classes" },
      { name: "subjectId", label: "Subject", lookup: "subjects" },
    ],
  },
  topics: {
    resource: "topics",
    title: "Topics",
    singular: "Topic",
    fields: [
      f("lessonId", "Lesson", { type: "select", lookup: "lessons", required: true }),
      f("name", "Topic name", { required: true }),
      f("planDate", "Planned date", { type: "date" }),
      f("status", "Status", {
        type: "select",
        options: ["Pending", "In Progress", "Completed"].map((value) => ({ value, label: value })),
        def: "Pending",
      }),
    ],
    columns: [
      { key: "lessonId", label: "Lesson", lookup: "lessons" },
      { key: "name", label: "Topic" },
      { key: "planDate", label: "Planned", type: "date" },
      { key: "status", label: "Status", type: "badge" },
    ],
  },
  lessonplan: {
    resource: "lessonPlans",
    title: "Manage Lesson Plan",
    singular: "Lesson plan",
    fields: [
      f("classId", "Class", { type: "select", lookup: "classes", required: true }),
      f("subjectId", "Subject", { type: "select", lookup: "subjects", required: true }),
      f("lessonId", "Lesson", { type: "select", lookup: "lessons", required: true }),
      f("teacherId", "Teacher", { type: "select", lookup: "staff" }),
      f("date", "Date", { type: "date", required: true }),
      f("note", "Note", { type: "textarea" }),
    ],
    columns: [
      { key: "classId", label: "Class", lookup: "classes" },
      { key: "subjectId", label: "Subject", lookup: "subjects" },
      { key: "lessonId", label: "Lesson", lookup: "lessons" },
      { key: "teacherId", label: "Teacher", lookup: "staff" },
      { key: "date", label: "Date", type: "date" },
    ],
    dateRange: true,
  },

  // ── Communication ──
  notices: {
    resource: "notices",
    title: "Notice Board",
    singular: "Notice",
    fields: [
      f("title", "Title", { required: true }),
      f("msg", "Message", { type: "textarea", required: true, rows: 5 }),
      f("date", "Date", { type: "date" }),
      f("audience", "Audience", {
        type: "multi",
        options: [
          { value: "students", label: "Students" },
          { value: "parents", label: "Parents" },
          { value: "staff", label: "Staff" },
        ],
        def: ["students", "parents"],
      }),
    ],
    columns: [
      { key: "title", label: "Title" },
      { key: "msg", label: "Message" },
      { key: "date", label: "Date", type: "date" },
      {
        label: "Audience",
        render: (row) => (Array.isArray(row.audience) ? (row.audience as string[]).join(", ") : ""),
      },
    ],
    dateRange: true,
  },
  emailtpl: {
    resource: "emailTpl",
    title: "Email Templates",
    singular: "Email template",
    fields: [
      f("title", "Title", { required: true }),
      f("body", "Body", { type: "textarea", required: true, rows: 6 }),
    ],
    columns: [
      { key: "title", label: "Title" },
      { key: "body", label: "Body" },
    ],
  },
  smstpl: {
    resource: "smsTpl",
    title: "SMS Templates",
    singular: "SMS template",
    fields: [
      f("title", "Title", { required: true }),
      f("body", "Body", { type: "textarea", required: true, rows: 5 }),
    ],
    columns: [
      { key: "title", label: "Title" },
      { key: "body", label: "Body" },
    ],
  },
  schedlog: {
    resource: "sched",
    title: "Schedule Email / SMS",
    singular: "Scheduled message",
    fields: [
      f("title", "Title", { required: true }),
      f("channel", "Channel", {
        type: "select",
        options: ["SMS", "Email", "WhatsApp"].map((value) => ({ value, label: value })),
        def: "SMS",
      }),
      f("audience", "Audience", {
        type: "select",
        options: [
          { value: "All Students", label: "All students" },
          { value: "All Staff", label: "All staff" },
        ],
        def: "All Students",
      }),
      f("date", "Date", { type: "date" }),
      f("time", "Time", { type: "time" }),
      f("msg", "Message", { type: "textarea", required: true, rows: 4 }),
      f("status", "Status", {
        type: "select",
        options: ["Scheduled", "Sent", "Cancelled"].map((value) => ({ value, label: value })),
        def: "Scheduled",
      }),
    ],
    columns: [
      { key: "title", label: "Title" },
      { key: "channel", label: "Channel" },
      { key: "audience", label: "Audience" },
      { key: "date", label: "Date", type: "date" },
      { key: "status", label: "Status", type: "badge" },
    ],
    rowActions: (row, helpers) =>
      row.status === "Scheduled" ? (
        <button
          type="button"
          className="mini pri"
          onClick={async () => {
            try {
              await apiPost(`/api/communications/schedule/${String(row.id)}/send`, {});
              helpers.refresh();
              helpers.toast("Scheduled message sent.");
            } catch (err) {
              helpers.toast(err instanceof Error ? err.message : "Could not send.", "err");
            }
          }}
        >
          Send now
        </button>
      ) : null,
  },
  msglog: {
    resource: "msgLog",
    title: "Email / SMS Log",
    singular: "Log entry",
    fields: [],
    columns: [
      { key: "time", label: "Time" },
      { key: "channel", label: "Channel" },
      { key: "to", label: "To" },
      { key: "phone", label: "Phone / email" },
      { key: "subject", label: "Subject" },
      { key: "body", label: "Body" },
    ],
    canAdd: false,
    canEdit: false,
    canDelete: false,
    pageSize: 25,
  },

  // ── Download center ──
  ctypes: {
    resource: "ctypes",
    title: "Content Types",
    singular: "Content type",
    fields: nameDesc,
    columns: [{ key: "name", label: "Type" }, { key: "desc", label: "Description" }],
  },
  sharelist: {
    resource: "contents",
    title: "Content Share List",
    singular: "Content",
    description: "Shared study material. Files are stored in the database; keep uploads below the configured size limit.",
    fields: [
      f("title", "Title", { required: true }),
      f("typeId", "Content type", { type: "select", lookup: "contentTypes", required: true }),
      f("classId", "Class", { type: "select", lookup: "classes" }),
      f("date", "Date", { type: "date" }),
      f("valid", "Valid until", { type: "date" }),
      f("url", "External URL", { type: "url" }),
      f("file", "File", { type: "file", maxKb: 1200, alsoSet: "fileName", accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4" }),
      f("fileName", "File name", { type: "hidden" }),
      f("desc", "Description", { type: "textarea" }),
      f("shared", "Shared", { type: "checkbox", def: true, help: "Visible to students" }),
    ],
    columns: [
      { key: "title", label: "Title" },
      { key: "typeId", label: "Type", lookup: "contentTypes" },
      { key: "classId", label: "Class", lookup: "classes" },
      { key: "date", label: "Date", type: "date" },
      { key: "fileName", label: "File" },
      {
        key: "shared",
        label: "Shared",
        render: (row) => (row.shared ? "Yes" : "No"),
      },
    ],
    filters: [{ name: "typeId", label: "Type", lookup: "contentTypes" }],
    dateRange: true,
  },

  upload: {
    resource: "contents",
    title: "Upload / Share Content",
    singular: "Content",
    description:
      "Upload study material or link an external resource. Files are stored in MySQL and listed without their binary body.",
    fields: [
      f("title", "Title", { required: true }),
      f("typeId", "Content type", { type: "select", lookup: "contentTypes", required: true }),
      f("classId", "Class", { type: "select", lookup: "classes", help: "Leave blank to share with all classes." }),
      f("date", "Share date", { type: "date" }),
      f("valid", "Valid until", { type: "date" }),
      f("url", "External URL", { type: "url" }),
      f("file", "File", {
        type: "file",
        maxKb: 1200,
        alsoSet: "fileName",
        accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4",
      }),
      f("fileName", "File name", { type: "hidden" }),
      f("desc", "Description", { type: "textarea" }),
      f("shared", "Shared", { type: "checkbox", def: true, help: "Visible to students" }),
    ],
    columns: [
      { key: "title", label: "Title" },
      { key: "typeId", label: "Type", lookup: "contentTypes" },
      { key: "classId", label: "Class", lookup: "classes" },
      { key: "date", label: "Shared", type: "date" },
      {
        label: "File / link",
        render: (row) =>
          row.url ? (
            <a href={String(row.url)} target="_blank" rel="noopener noreferrer">Open link</a>
          ) : (
            String(row.fileName ?? "") || "—"
          ),
      },
      { key: "shared", label: "Shared", type: "bool" },
    ],
    filters: [
      { name: "typeId", label: "Type", lookup: "contentTypes" },
      { name: "classId", label: "Class", lookup: "classes" },
    ],
    dateRange: true,
  },

  // ── Homework ──
  homework: {
    resource: "homework",
    title: "Homework",
    singular: "Homework",
    fields: [
      f("classId", "Class", { type: "select", lookup: "classes", required: true }),
      f("sectionId", "Section", { type: "select", lookup: "sections" }),
      f("subjectId", "Subject", { type: "select", lookup: "subjects", required: true }),
      f("date", "Given on", { type: "date" }),
      f("due", "Submit by", { type: "date", required: true }),
      f("max", "Maximum marks", { type: "number", def: 10 }),
      f("desc", "Homework", { type: "textarea", required: true, rows: 5 }),
    ],
    columns: [
      { key: "classId", label: "Class", lookup: "classes" },
      { key: "sectionId", label: "Section", lookup: "sections" },
      { key: "subjectId", label: "Subject", lookup: "subjects" },
      { key: "date", label: "Given", type: "date" },
      { key: "due", label: "Due", type: "date" },
      { key: "max", label: "Max", type: "num" },
    ],
    filters: [
      { name: "classId", label: "Class", lookup: "classes" },
      { name: "subjectId", label: "Subject", lookup: "subjects" },
    ],
    dateRange: true,
  },

  // ── Library ──
  books: {
    resource: "books",
    title: "Book List",
    singular: "Book",
    fields: [
      f("title", "Title", { required: true }),
      f("no", "Book number"),
      f("isbn", "ISBN"),
      f("publisher", "Publisher"),
      f("author", "Author"),
      f("subject", "Subject"),
      f("rack", "Rack"),
      f("qty", "Copies", { type: "number", def: 1 }),
      f("price", "Price", { type: "money", def: 0 }),
      f("date", "Purchase date", { type: "date" }),
    ],
    columns: [
      { key: "title", label: "Title" },
      { key: "no", label: "Book no" },
      { key: "author", label: "Author" },
      { key: "subject", label: "Subject" },
      { key: "rack", label: "Rack" },
      { key: "qty", label: "Copies", type: "num" },
      { key: "price", label: "Price", type: "money" },
    ],
  },

  issue: {
    resource: "bookIssues",
    title: "Book Issue",
    singular: "Book issue",
    description:
      "Issue a library book to a member and record returns. Copies are checked against available stock before issuing.",
    fields: [
      f("memberId", "Member", { type: "select", lookup: "members", required: true }),
      f("bookId", "Book", { type: "select", lookup: "books", required: true }),
      f("issue", "Issue date", { type: "date", required: true, def: inDays(0) }),
      f("due", "Due date", { type: "date", required: true, def: inDays(14) }),
      f("ret", "Return date", { type: "date" }),
    ],
    columns: [
      {
        label: "Member card",
        render: (row) => String(row.memberCard ?? row.memberId ?? "—"),
      },
      {
        label: "Book",
        render: (row) => String(row.bookTitle ?? row.bookId ?? "—"),
      },
      { key: "issue", label: "Issued", type: "date" },
      { key: "due", label: "Due", type: "date" },
      { key: "ret", label: "Returned", type: "date" },
      {
        label: "Status",
        render: (row) =>
          row.ret ? (
            <span className="bd ok">Returned</span>
          ) : (
            <span className="bd warn">Issued</span>
          ),
      },
    ],
    filters: [{ name: "bookId", label: "Book", lookup: "books" }],
    dateRange: true,
    rowActions: (row, helpers) =>
      !row.ret ? (
        <button
          type="button"
          className="mini ok"
          onClick={async () => {
            if (!window.confirm("Mark this book as returned today?")) return;
            try {
              await apiPost("/api/actions/book-return", { id: row.id });
              helpers.refresh();
              helpers.toast("Book returned.");
            } catch (err) {
              helpers.toast(err instanceof Error ? err.message : "Could not record return.", "err");
            }
          }}
        >
          Return
        </button>
      ) : null,
  },
  libstu: {
    resource: "libMembers",
    title: "Student Library Members",
    singular: "Student member",
    description: "Library cards issued to students.",
    fields: [
      f("kind", "Kind", { type: "hidden", def: "student" }),
      f("refId", "Student", { type: "select", lookup: "students", required: true }),
      f("card", "Library card number", { required: true }),
    ],
    columns: [
      { key: "card", label: "Card" },
      { key: "refId", label: "Student", lookup: "students" },
    ],
    defaultFilters: { kind: "student" },
    defaults: { kind: "student" },
    transformSubmit: (values) => ({ ...values, kind: "student" }),
  },
  libstaff: {
    resource: "libMembers",
    title: "Staff Library Members",
    singular: "Staff member",
    description: "Library cards issued to staff.",
    fields: [
      f("kind", "Kind", { type: "hidden", def: "staff" }),
      f("refId", "Staff member", { type: "select", lookup: "staff", required: true }),
      f("card", "Library card number", { required: true }),
    ],
    columns: [
      { key: "card", label: "Card" },
      { key: "refId", label: "Staff", lookup: "staff" },
    ],
    defaultFilters: { kind: "staff" },
    defaults: { kind: "staff" },
    transformSubmit: (values) => ({ ...values, kind: "staff" }),
  },

  // ── Inventory ──
  itemcat: {
    resource: "itemCats",
    title: "Item Categories",
    singular: "Category",
    fields: nameDesc,
    columns: [{ key: "name", label: "Category" }, { key: "desc", label: "Description" }],
  },
  itemstore: {
    resource: "itemStores",
    title: "Item Stores",
    singular: "Store",
    fields: [
      f("name", "Store name", { required: true }),
      f("code", "Code"),
      f("desc", "Description", { type: "textarea" }),
    ],
    columns: [
      { key: "name", label: "Store" },
      { key: "code", label: "Code" },
      { key: "desc", label: "Description" },
    ],
  },
  itemsup: {
    resource: "itemSup",
    title: "Item Suppliers",
    singular: "Supplier",
    fields: [
      f("name", "Supplier name", { required: true }),
      f("contact", "Contact person"),
      f("phone", "Phone"),
      f("address", "Address", { type: "textarea" }),
      f("desc", "Description", { type: "textarea" }),
    ],
    columns: [
      { key: "name", label: "Supplier" },
      { key: "contact", label: "Contact" },
      { key: "phone", label: "Phone" },
    ],
  },
  items: {
    resource: "items",
    title: "Items",
    singular: "Item",
    fields: [
      f("name", "Item name", { required: true }),
      f("catId", "Category", { type: "select", lookup: "itemCats", required: true }),
      f("unit", "Unit"),
      f("desc", "Description", { type: "textarea" }),
    ],
    columns: [
      { key: "name", label: "Item" },
      { key: "catId", label: "Category", lookup: "itemCats" },
      { key: "unit", label: "Unit" },
    ],
    filters: [{ name: "catId", label: "Category", lookup: "itemCats" }],
  },
  itemstock: {
    resource: "itemStock",
    title: "Add Item Stock",
    singular: "Stock entry",
    fields: [
      f("itemId", "Item", { type: "select", lookup: "items", required: true }),
      f("supId", "Supplier", { type: "select", lookup: "suppliers" }),
      f("storeId", "Store", { type: "select", lookup: "stores" }),
      f("qty", "Quantity", { type: "number", required: true }),
      f("price", "Unit price", { type: "money", def: 0 }),
      f("date", "Date", { type: "date" }),
      f("purchaseNo", "Purchase number"),
      f("desc", "Description", { type: "textarea" }),
    ],
    columns: [
      { key: "itemId", label: "Item", lookup: "items" },
      { key: "storeId", label: "Store", lookup: "stores" },
      { key: "qty", label: "Qty", type: "num" },
      { key: "price", label: "Price", type: "money" },
      { key: "date", label: "Date", type: "date" },
      { key: "purchaseNo", label: "Purchase no" },
    ],
    filters: [{ name: "itemId", label: "Item", lookup: "items" }],
    dateRange: true,
  },
  issueitem: {
    resource: "itemIssue",
    title: "Issue Item",
    singular: "Item issue",
    fields: [
      f("itemId", "Item", { type: "select", lookup: "items", required: true }),
      f("staffId", "Issued to", { type: "select", lookup: "staff" }),
      f("qty", "Quantity", { type: "number", required: true }),
      f("issue", "Issue date", { type: "date", required: true }),
      f("ret", "Return date", { type: "date" }),
      f("status", "Status", {
        type: "select",
        options: ["Issued", "Returned"].map((value) => ({ value, label: value })),
        def: "Issued",
      }),
      f("note", "Note", { type: "textarea" }),
    ],
    columns: [
      { key: "itemId", label: "Item", lookup: "items" },
      { key: "staffId", label: "Issued to", lookup: "staff" },
      { key: "qty", label: "Qty", type: "num" },
      { key: "issue", label: "Issued", type: "date" },
      { key: "ret", label: "Returned", type: "date" },
      { key: "status", label: "Status", type: "badge" },
    ],
    dateRange: true,
  },

  // ── Transport ──
  tfees: {
    resource: "transportFees",
    title: "Transport Fees Master",
    singular: "Transport fee",
    fields: [
      f("pickupId", "Pickup point", { type: "select", lookup: "pickups", required: true }),
      f("monthlyFee", "Monthly fee", { type: "money", required: true }),
      f("months", "Months charged", { type: "number", def: 10 }),
      f("fine", "Fine", { type: "money", def: 0 }),
    ],
    columns: [
      { key: "pickupId", label: "Pickup point", lookup: "pickups" },
      { key: "monthlyFee", label: "Monthly", type: "money" },
      { key: "months", label: "Months", type: "num" },
      { key: "fine", label: "Fine", type: "money" },
    ],
  },
  pickups: {
    resource: "pickups",
    title: "Pickup Points",
    singular: "Pickup point",
    fields: [f("name", "Pickup point", { required: true })],
    columns: [{ key: "name", label: "Pickup point" }],
  },
  routes: {
    resource: "routes",
    title: "Transport Routes",
    singular: "Route",
    fields: [
      f("name", "Route name", { required: true }),
      f("desc", "Description", { type: "textarea" }),
    ],
    columns: [{ key: "name", label: "Route" }, { key: "desc", label: "Description" }],
  },
  vehicles: {
    resource: "vehicles",
    title: "Vehicles",
    singular: "Vehicle",
    fields: [
      f("number", "Vehicle number", { required: true }),
      f("model", "Model"),
      f("year", "Year"),
      f("driver", "Driver"),
      f("phone", "Driver phone"),
      f("licence", "Licence number"),
      f("capacity", "Capacity", { type: "number", def: 0 }),
    ],
    columns: [
      { key: "number", label: "Number" },
      { key: "model", label: "Model" },
      { key: "driver", label: "Driver" },
      { key: "phone", label: "Phone" },
      { key: "capacity", label: "Capacity", type: "num" },
    ],
  },
  assignveh: {
    resource: "assignVeh",
    title: "Assign Vehicle",
    singular: "Vehicle assignment",
    fields: [
      f("routeId", "Route", { type: "select", lookup: "routes", required: true }),
      f("vehicleIds", "Vehicles", { type: "multi", lookup: "vehicles" }),
    ],
    columns: [
      { key: "routeId", label: "Route", lookup: "routes" },
      {
        label: "Vehicles",
        render: (row) => `${Array.isArray(row.vehicleIds) ? (row.vehicleIds as string[]).length : 0} assigned`,
      },
    ],
  },
  routepick: {
    resource: "routePick",
    title: "Route Pickup Points",
    singular: "Route pickup",
    fields: [
      f("routeId", "Route", { type: "select", lookup: "routes", required: true }),
      f("pickupId", "Pickup point", { type: "select", lookup: "pickups", required: true }),
      f("time", "Pickup time", { type: "time" }),
    ],
    columns: [
      { key: "routeId", label: "Route", lookup: "routes" },
      { key: "pickupId", label: "Pickup point", lookup: "pickups" },
      { key: "time", label: "Time" },
    ],
    filters: [{ name: "routeId", label: "Route", lookup: "routes" }],
  },
  tassign: {
    resource: "transportAssign",
    title: "Student Transport Fees",
    singular: "Transport assignment",
    fields: [
      f("studentId", "Student", { type: "select", lookup: "students", required: true }),
      f("routeId", "Route", { type: "select", lookup: "routes", required: true }),
      f("pickupId", "Pickup point", { type: "select", lookup: "pickups", required: true }),
      f("due", "Fee due date", { type: "date" }),
    ],
    columns: [
      { key: "studentId", label: "Student", lookup: "students" },
      { key: "routeId", label: "Route", lookup: "routes" },
      { key: "pickupId", label: "Pickup point", lookup: "pickups" },
      { key: "due", label: "Due", type: "date" },
    ],
    filters: [
      { name: "routeId", label: "Route", lookup: "routes" },
      { name: "pickupId", label: "Pickup", lookup: "pickups" },
    ],
  },

  // ── Hostel ──
  hostels: {
    resource: "hostels",
    title: "Hostels",
    singular: "Hostel",
    fields: [
      f("name", "Hostel name", { required: true }),
      f("type", "Type", {
        type: "select",
        options: ["Boys", "Girls"].map((value) => ({ value, label: value })),
      }),
      f("address", "Address"),
      f("intake", "Intake", { type: "number", def: 0 }),
      f("desc", "Description", { type: "textarea" }),
    ],
    columns: [
      { key: "name", label: "Hostel" },
      { key: "type", label: "Type" },
      { key: "intake", label: "Intake", type: "num" },
      { key: "address", label: "Address" },
    ],
  },
  roomtypes: {
    resource: "roomTypes",
    title: "Room Types",
    singular: "Room type",
    fields: nameDesc,
    columns: [{ key: "name", label: "Room type" }, { key: "desc", label: "Description" }],
  },
  rooms: {
    resource: "rooms",
    title: "Hostel Rooms",
    singular: "Room",
    fields: [
      f("hostelId", "Hostel", { type: "select", lookup: "hostels", required: true }),
      f("typeId", "Room type", { type: "select", lookup: "roomTypes", required: true, help: "Choose a room type from the Room Type page." }),
      f("roomNo", "Room number", { required: true }),
      f("beds", "Beds", { type: "number", def: 1 }),
      f("cost", "Monthly cost", { type: "money", def: 0 }),
      f("desc", "Description", { type: "textarea" }),
    ],
    columns: [
      { key: "hostelId", label: "Hostel", lookup: "hostels" },
      { key: "roomNo", label: "Room" },
      { key: "beds", label: "Beds", type: "num" },
      { key: "cost", label: "Cost", type: "money" },
    ],
    filters: [{ name: "hostelId", label: "Hostel", lookup: "hostels" }],
  },
  hostelalloc: {
    resource: "hostelAlloc",
    title: "Allot Room",
    singular: "Room allocation",
    fields: [
      f("studentId", "Student", { type: "select", lookup: "students", required: true }),
      f("roomId", "Room", { type: "select", lookup: "rooms", required: true }),
      f("date", "Allocation date", { type: "date" }),
    ],
    columns: [
      { key: "studentId", label: "Student", lookup: "students" },
      { key: "roomId", label: "Room", lookup: "rooms" },
      { key: "date", label: "Date", type: "date" },
    ],
    dateRange: true,
  },

  // ── Certificates / alumni ──
  certtpl: {
    resource: "certTpl",
    title: "Student Certificate Templates",
    singular: "Certificate template",
    description:
      "Use placeholders such as {name}, {father}, {class}, {admNo}, {dob}, {session}, {school} and {date} in the certificate body.",
    fields: [
      f("name", "Template name", { required: true }),
      f("body", "Certificate body", { type: "textarea", required: true, rows: 9 }),
      f("foot", "Signature line", { def: "Principal" }),
    ],
    columns: [
      { key: "name", label: "Template" },
      { key: "body", label: "Body" },
      { key: "foot", label: "Signature" },
    ],
  },
  alumni: {
    resource: "alumni",
    title: "Alumni",
    singular: "Alumnus",
    fields: [
      f("name", "Name", { required: true }),
      f("year", "Passing year"),
      f("occupation", "Occupation"),
      f("phone", "Phone"),
      f("email", "Email", { type: "email" }),
      f("address", "Address", { type: "textarea" }),
      f("note", "Note", { type: "textarea" }),
    ],
    columns: [
      { key: "name", label: "Name" },
      { key: "year", label: "Year" },
      { key: "occupation", label: "Occupation" },
      { key: "phone", label: "Phone" },
    ],
  },
  alumnievents: {
    resource: "alumniEvents",
    title: "Alumni Events",
    singular: "Alumni event",
    fields: [
      f("title", "Event title", { required: true }),
      f("from", "From", { type: "date", required: true }),
      f("to", "To", { type: "date" }),
      f("place", "Place"),
      f("note", "Note", { type: "textarea" }),
    ],
    columns: [
      { key: "title", label: "Event" },
      { key: "from", label: "From", type: "date" },
      { key: "to", label: "To", type: "date" },
      { key: "place", label: "Place" },
    ],
    dateRange: true,
  },

  // ── System ──
  roles: {
    resource: "roles",
    title: "Roles & Permissions",
    singular: "Role",
    description:
      "Permissions are module ids (front, stu, fees, exp, att, exam, online, lesson, acad, hr, comm, dl, hw, lib, inv, trans, hostel, cert, alumni, rep, sys) or the word all.",
    fields: [
      f("name", "Role name", { required: true }),
      f("perms", "Permissions", {
        type: "textarea",
        required: true,
        def: "all",
        help: "Type 'all' or a comma-separated list of module ids.",
      }),
    ],
    columns: [
      { key: "name", label: "Role" },
      {
        key: "perms",
        label: "Permissions",
        render: (row) =>
          row.perms === "all"
            ? "All modules"
            : Array.isArray(row.perms)
              ? (row.perms as string[]).join(", ")
              : String(row.perms ?? ""),
      },
    ],
    transformSubmit: (values) => {
      const raw = String(values.perms ?? "").trim();
      return {
        ...values,
        perms: raw === "all" ? "all" : raw.split(",").map((x) => x.trim()).filter(Boolean),
      };
    },
  },
  languages: {
    resource: "languages",
    title: "Languages",
    singular: "Language",
    fields: [
      f("name", "Language", { required: true }),
      f("code", "Code", { required: true }),
      f("enabled", "Enabled", { type: "checkbox", def: true, help: "Show in language picker" }),
    ],
    columns: [
      { key: "name", label: "Language" },
      { key: "code", label: "Code" },
      { key: "enabled", label: "Enabled", type: "bool" },
    ],
  },
  users: {
    resource: "users",
    title: "Users",
    singular: "User",
    fields: [
      f("name", "Full name", { required: true }),
      f("username", "Username", { required: true }),
      f("password", "Password", { type: "password", help: "Required for new users. Leave blank to keep the current password." }),
      f("role", "Role", { type: "select", lookup: "roles", required: true }),
      f("active", "Active", { type: "checkbox", def: true, help: "Can sign in" }),
    ],
    columns: [
      { key: "name", label: "Name" },
      { key: "username", label: "Username" },
      { key: "role", label: "Role", type: "badge" },
      { key: "active", label: "Active", type: "bool" },
    ],
  },
  customfields: {
    resource: "customFields",
    title: "Custom Fields",
    singular: "Custom field",
    fields: [
      f("name", "Field name", { required: true }),
      f("for", "Applies to", {
        type: "select",
        options: [{ value: "Student", label: "Student" }],
        def: "Student",
      }),
      f("type", "Field type", {
        type: "select",
        options: ["Text", "Number", "Date"].map((value) => ({ value, label: value })),
        def: "Text",
      }),
    ],
    columns: [
      { key: "name", label: "Field" },
      { key: "for", label: "Applies to" },
      { key: "type", label: "Type" },
    ],
  },
};

export function getCrudConfig(id: string): CrudConfig | null {
  return CRUD_PAGES[id] ?? null;
}
