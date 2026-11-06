-- Make the tenant key immutable on every table that carries schoolId.
-- MySQL has no conditional trigger body without BEGIN...END + DELIMITER, so
-- the trigger assigns NULL when schoolId changes. schoolId is NOT NULL on
-- every tenant table, therefore MySQL aborts the UPDATE with
-- "Column 'schoolId' cannot be null". Keeping the same schoolId is allowed.
--
-- Regenerate this file when a new tenant table is added.

CREATE TRIGGER `academic_sessions_school_id_immutable`
BEFORE UPDATE ON `academic_sessions`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `admit_templates_school_id_immutable`
BEFORE UPDATE ON `admit_templates`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `alumni_school_id_immutable`
BEFORE UPDATE ON `alumni`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `alumni_events_school_id_immutable`
BEFORE UPDATE ON `alumni_events`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `app_users_school_id_immutable`
BEFORE UPDATE ON `app_users`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `assignment_vehicles_school_id_immutable`
BEFORE UPDATE ON `assignment_vehicles`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `audit_logs_school_id_immutable`
BEFORE UPDATE ON `audit_logs`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `bank_payments_school_id_immutable`
BEFORE UPDATE ON `bank_payments`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `book_issues_school_id_immutable`
BEFORE UPDATE ON `book_issues`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `books_school_id_immutable`
BEFORE UPDATE ON `books`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `carry_forwards_school_id_immutable`
BEFORE UPDATE ON `carry_forwards`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `certificate_templates_school_id_immutable`
BEFORE UPDATE ON `certificate_templates`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `class_sections_school_id_immutable`
BEFORE UPDATE ON `class_sections`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `classes_school_id_immutable`
BEFORE UPDATE ON `classes`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `complaints_school_id_immutable`
BEFORE UPDATE ON `complaints`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `content_types_school_id_immutable`
BEFORE UPDATE ON `content_types`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `contents_school_id_immutable`
BEFORE UPDATE ON `contents`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `counters_school_id_immutable`
BEFORE UPDATE ON `counters`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `custom_fields_school_id_immutable`
BEFORE UPDATE ON `custom_fields`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `departments_school_id_immutable`
BEFORE UPDATE ON `departments`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `designations_school_id_immutable`
BEFORE UPDATE ON `designations`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `disable_reasons_school_id_immutable`
BEFORE UPDATE ON `disable_reasons`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `divisions_school_id_immutable`
BEFORE UPDATE ON `divisions`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `email_templates_school_id_immutable`
BEFORE UPDATE ON `email_templates`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `enquiries_school_id_immutable`
BEFORE UPDATE ON `enquiries`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `exam_groups_school_id_immutable`
BEFORE UPDATE ON `exam_groups`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `exam_results_school_id_immutable`
BEFORE UPDATE ON `exam_results`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `exam_schedules_school_id_immutable`
BEFORE UPDATE ON `exam_schedules`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `expense_heads_school_id_immutable`
BEFORE UPDATE ON `expense_heads`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `expenses_school_id_immutable`
BEFORE UPDATE ON `expenses`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `fee_discounts_school_id_immutable`
BEFORE UPDATE ON `fee_discounts`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `fee_groups_school_id_immutable`
BEFORE UPDATE ON `fee_groups`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `fee_masters_school_id_immutable`
BEFORE UPDATE ON `fee_masters`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `fee_reminders_school_id_immutable`
BEFORE UPDATE ON `fee_reminders`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `fee_types_school_id_immutable`
BEFORE UPDATE ON `fee_types`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `front_office_setup_school_id_immutable`
BEFORE UPDATE ON `front_office_setup`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `grades_school_id_immutable`
BEFORE UPDATE ON `grades`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `homework_school_id_immutable`
BEFORE UPDATE ON `homework`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `homework_submissions_school_id_immutable`
BEFORE UPDATE ON `homework_submissions`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `hostel_allocations_school_id_immutable`
BEFORE UPDATE ON `hostel_allocations`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `hostels_school_id_immutable`
BEFORE UPDATE ON `hostels`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `id_card_templates_school_id_immutable`
BEFORE UPDATE ON `id_card_templates`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `item_categories_school_id_immutable`
BEFORE UPDATE ON `item_categories`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `item_issues_school_id_immutable`
BEFORE UPDATE ON `item_issues`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `item_stock_school_id_immutable`
BEFORE UPDATE ON `item_stock`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `item_stores_school_id_immutable`
BEFORE UPDATE ON `item_stores`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `item_suppliers_school_id_immutable`
BEFORE UPDATE ON `item_suppliers`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `items_school_id_immutable`
BEFORE UPDATE ON `items`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `languages_school_id_immutable`
BEFORE UPDATE ON `languages`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `leave_types_school_id_immutable`
BEFORE UPDATE ON `leave_types`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `lesson_plans_school_id_immutable`
BEFORE UPDATE ON `lesson_plans`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `lessons_school_id_immutable`
BEFORE UPDATE ON `lessons`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `library_members_school_id_immutable`
BEFORE UPDATE ON `library_members`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `mark_templates_school_id_immutable`
BEFORE UPDATE ON `mark_templates`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `message_logs_school_id_immutable`
BEFORE UPDATE ON `message_logs`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `multi_class_students_school_id_immutable`
BEFORE UPDATE ON `multi_class_students`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `notices_school_id_immutable`
BEFORE UPDATE ON `notices`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `online_admissions_school_id_immutable`
BEFORE UPDATE ON `online_admissions`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `online_exam_results_school_id_immutable`
BEFORE UPDATE ON `online_exam_results`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `online_exams_school_id_immutable`
BEFORE UPDATE ON `online_exams`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `payments_school_id_immutable`
BEFORE UPDATE ON `payments`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `payrolls_school_id_immutable`
BEFORE UPDATE ON `payrolls`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `phone_calls_school_id_immutable`
BEFORE UPDATE ON `phone_calls`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `pickup_points_school_id_immutable`
BEFORE UPDATE ON `pickup_points`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `postal_dispatch_school_id_immutable`
BEFORE UPDATE ON `postal_dispatch`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `postal_receive_school_id_immutable`
BEFORE UPDATE ON `postal_receive`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `questions_school_id_immutable`
BEFORE UPDATE ON `questions`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `roles_school_id_immutable`
BEFORE UPDATE ON `roles`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `room_types_school_id_immutable`
BEFORE UPDATE ON `room_types`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `rooms_school_id_immutable`
BEFORE UPDATE ON `rooms`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `route_pickups_school_id_immutable`
BEFORE UPDATE ON `route_pickups`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `scheduled_messages_school_id_immutable`
BEFORE UPDATE ON `scheduled_messages`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `school_events_school_id_immutable`
BEFORE UPDATE ON `school_events`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `school_memberships_school_id_immutable`
BEFORE UPDATE ON `school_memberships`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `sections_school_id_immutable`
BEFORE UPDATE ON `sections`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `settings_school_id_immutable`
BEFORE UPDATE ON `settings`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `sms_templates_school_id_immutable`
BEFORE UPDATE ON `sms_templates`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `staff_school_id_immutable`
BEFORE UPDATE ON `staff`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `staff_attendance_school_id_immutable`
BEFORE UPDATE ON `staff_attendance`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `staff_leaves_school_id_immutable`
BEFORE UPDATE ON `staff_leaves`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `staff_ratings_school_id_immutable`
BEFORE UPDATE ON `staff_ratings`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `student_attendance_school_id_immutable`
BEFORE UPDATE ON `student_attendance`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `student_categories_school_id_immutable`
BEFORE UPDATE ON `student_categories`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `student_houses_school_id_immutable`
BEFORE UPDATE ON `student_houses`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `student_leaves_school_id_immutable`
BEFORE UPDATE ON `student_leaves`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `students_school_id_immutable`
BEFORE UPDATE ON `students`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `subject_group_sections_school_id_immutable`
BEFORE UPDATE ON `subject_group_sections`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `subject_group_subjects_school_id_immutable`
BEFORE UPDATE ON `subject_group_subjects`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `subject_groups_school_id_immutable`
BEFORE UPDATE ON `subject_groups`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `subjects_school_id_immutable`
BEFORE UPDATE ON `subjects`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `topics_school_id_immutable`
BEFORE UPDATE ON `topics`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `transport_assignments_school_id_immutable`
BEFORE UPDATE ON `transport_assignments`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `transport_fees_school_id_immutable`
BEFORE UPDATE ON `transport_fees`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `transport_routes_school_id_immutable`
BEFORE UPDATE ON `transport_routes`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `user_logs_school_id_immutable`
BEFORE UPDATE ON `user_logs`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `vehicle_assignments_school_id_immutable`
BEFORE UPDATE ON `vehicle_assignments`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `vehicles_school_id_immutable`
BEFORE UPDATE ON `vehicles`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);

CREATE TRIGGER `visitors_school_id_immutable`
BEFORE UPDATE ON `visitors`
FOR EACH ROW
SET NEW.`schoolId` = IF(NEW.`schoolId` <=> OLD.`schoolId`, NEW.`schoolId`, NULL);
