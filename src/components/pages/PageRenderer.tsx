"use client";

import { GenericCrud } from "@/components/crud/GenericCrud";
import { CRUD_PAGES, getCrudConfig } from "./configs";
import { Dashboard } from "./Dashboard";
import {
  AdmissionPage,
  BulkDeletePage,
  OnlineAdmissionsPage,
  StudentListPage,
} from "./StudentPages";
import {
  BankPaymentsPage,
  CollectFeesPage,
  DueFeesPage,
  FeeSearchPage,
} from "./FeePages";
import {
  AttendanceByDatePage,
  AttendancePage,
  StudentLeavePage,
} from "./AttendancePages";
import {
  AdmitDesignPage,
  AdmitPrintPage,
  ExamResultsPage,
  IdCardDesignPage,
  MarksDesignPage,
  MarksPrintPage,
} from "./ExamPages";
import { ReportsPage } from "./ReportsPage";
import {
  AssistantPage,
  BackupPage,
  CaptchaSettingsPage,
  FileTypesPage,
  GeneralSettingsPage,
  PrintSettingsPage,
  ProfileSettingsPage,
  RolesPage,
  SessionsPage,
  SubscriptionPage,
  WhatsAppSettingsPage,
} from "./SettingsPages";
import {
  ComposerPage,
  CredentialsPage,
  WhatsAppPage,
} from "./CommunicationPages";
import { CertificatePage, IdCardPage } from "./CertificatePages";
import { LessonCopyPage, NotFoundPage, PayrollPage, SyllabusPage } from "./MiscPages";

export function PageRenderer({ slug }: { slug: string[] }) {
  const id = slug[0] ?? "dashboard";

  switch (id) {
    case "dashboard":
      return <Dashboard />;

    // Students
    case "students":
      return <StudentListPage />;
    case "admission":
      return <AdmissionPage />;
    case "onlineadm":
      return <OnlineAdmissionsPage />;
    case "bulkdel":
      return <BulkDeletePage />;

    // Fees
    case "collect":
      return <CollectFeesPage />;
    case "bankpay":
      return <BankPaymentsPage />;
    case "feesearch":
      return <FeeSearchPage />;
    case "duefees":
      return <DueFeesPage />;

    // Attendance
    case "stuatt":
      return <AttendancePage type="student" />;
    case "staffatt":
      return <AttendancePage type="staff" />;
    case "attdate":
      return <AttendanceByDatePage />;
    case "stuleave":
      return <StudentLeavePage />;

    // Examinations
    case "examresult":
      return <ExamResultsPage />;
    case "admitdesign":
      return <AdmitDesignPage />;
    case "marksdesign":
      return <MarksDesignPage />;
    case "admitprint":
      return <AdmitPrintPage />;
    case "marksprint":
      return <MarksPrintPage />;

    // Lessons
    case "lessoncopy":
      return <LessonCopyPage />;
    case "syllabus":
      return <SyllabusPage />;

    // HR
    case "payroll":
      return <PayrollPage />;

    // Communication
    case "sendemail":
      return <ComposerPage channel="Email" />;
    case "sendsms":
      return <ComposerPage channel="SMS" />;
    case "whatsapp":
      return <WhatsAppPage />;
    case "creds":
      return <CredentialsPage />;

    // Certificates
    case "certgen":
      return <CertificatePage />;
    case "idcard":
      return <IdCardPage />;
    case "iddesign":
      return <IdCardDesignPage />;

    // Settings
    case "set_general":
      return <GeneralSettingsPage />;
    case "set_sub":
      return <SubscriptionPage />;
    case "set_ai":
      return <AssistantPage />;
    case "set_wa":
      return <WhatsAppSettingsPage />;
    case "set_session":
      return <SessionsPage />;
    case "set_print":
      return <PrintSettingsPage />;
    case "set_roles":
      return <RolesPage />;
    case "set_captcha":
      return <CaptchaSettingsPage />;
    case "set_profile":
      return <ProfileSettingsPage />;
    case "set_files":
      return <FileTypesPage />;
    case "set_backup":
      return <BackupPage />;
    case "set_lang":
      return <GenericCrud config={CRUD_PAGES.languages} />;
    case "set_users":
      return <GenericCrud config={CRUD_PAGES.users} />;
    case "set_custom":
      return <GenericCrud config={CRUD_PAGES.customfields} />;

    default:
      break;
  }

  if (id.startsWith("rep_")) {
    return <ReportsPage id={id} />;
  }

  const config = getCrudConfig(id);
  if (config) {
    return <GenericCrud config={config} />;
  }

  return <NotFoundPage id={id} />;
}
