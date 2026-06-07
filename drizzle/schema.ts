import { pgTable, index, uniqueIndex, foreignKey, uuid, boolean, timestamp, numeric, varchar, text, date, jsonb, inet, unique, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const candidateStatus = pgEnum("candidate_status", ['active', 'in_process', 'completed', 'rejected'])
export const expenseStatus = pgEnum("expense_status", ['pending', 'approved', 'rejected'])
export const overallStatus = pgEnum("overall_status", ['initiated', 'in_progress', 'completed', 'cancelled'])
export const paymentStatus = pgEnum("payment_status", ['pending', 'paid', 'rejected', 'refunded'])
export const paymentType = pgEnum("payment_type", ['medical', 'visa', 'protector', 'passport', 'flight'])
export const salaryPaymentStatus = pgEnum("salary_payment_status", ['pending', 'paid', 'cancelled'])
export const userRole = pgEnum("user_role", ['super_admin', 'admin', 'receptionist', 'process_agent', 'accountant'])
export const workflowStatus = pgEnum("workflow_status", ['pending', 'completed', 'rejected'])


export const agentCompanyAssignments = pgTable("agent_company_assignments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	agentId: uuid("agent_id").notNull(),
	companyId: uuid("company_id").notNull(),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_agent_company_assignments_agent").using("btree", table.agentId.asc().nullsLast().op("uuid_ops")),
	index("idx_agent_company_assignments_company").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_agent_company").using("btree", table.agentId.asc().nullsLast().op("uuid_ops"), table.companyId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.agentId],
			foreignColumns: [users.id],
			name: "agent_company_assignments_agent_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "agent_company_assignments_company_id_companies_id_fk"
		}).onDelete("cascade"),
]);

export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	candidateId: uuid("candidate_id").notNull(),
	workflowId: uuid("workflow_id"),
	paymentType: paymentType("payment_type").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	currency: varchar({ length: 10 }).default('SAR'),
	paymentStatus: paymentStatus("payment_status").default('pending'),
	paymentMethod: varchar("payment_method", { length: 50 }),
	transactionId: varchar("transaction_id", { length: 255 }),
	paymentDate: timestamp("payment_date", { mode: 'string' }),
	verifiedBy: uuid("verified_by"),
	verificationDate: timestamp("verification_date", { mode: 'string' }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_payments_candidate_id").using("btree", table.candidateId.asc().nullsLast().op("uuid_ops")),
	index("idx_payments_status").using("btree", table.paymentStatus.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.candidateId],
			foreignColumns: [candidates.id],
			name: "payments_candidate_id_candidates_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflowStages.id],
			name: "payments_workflow_id_workflow_stages_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.verifiedBy],
			foreignColumns: [users.id],
			name: "payments_verified_by_users_id_fk"
		}),
]);

export const workflowStages = pgTable("workflow_stages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	candidateId: uuid("candidate_id").notNull(),
	companyId: uuid("company_id"),
	medicalStatus: workflowStatus("medical_status").default('pending'),
	medicalPaymentStatus: paymentStatus("medical_payment_status").default('pending'),
	visaStatus: workflowStatus("visa_status").default('pending'),
	visaPaymentStatus: paymentStatus("visa_payment_status").default('pending'),
	protectorStatus: workflowStatus("protector_status").default('pending'),
	protectorPaymentStatus: paymentStatus("protector_payment_status").default('pending'),
	passportStatus: workflowStatus("passport_status").default('pending'),
	passportPaymentStatus: paymentStatus("passport_payment_status").default('pending'),
	flightStatus: workflowStatus("flight_status").default('pending'),
	flightPaymentStatus: paymentStatus("flight_payment_status").default('pending'),
	overallStatus: overallStatus("overall_status").default('initiated'),
	assignedAgent: uuid("assigned_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	medicalNotes: text("medical_notes"),
	visaNotes: text("visa_notes"),
	protectorNotes: text("protector_notes"),
	passportNotes: text("passport_notes"),
	flightNotes: text("flight_notes"),
}, (table) => [
	index("idx_workflow_stages_assigned_agent").using("btree", table.assignedAgent.asc().nullsLast().op("uuid_ops")),
	index("idx_workflow_stages_candidate_id").using("btree", table.candidateId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.candidateId],
			foreignColumns: [candidates.id],
			name: "workflow_stages_candidate_id_candidates_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "workflow_stages_company_id_companies_id_fk"
		}),
	foreignKey({
			columns: [table.assignedAgent],
			foreignColumns: [users.id],
			name: "workflow_stages_assigned_agent_users_id_fk"
		}),
]);

export const experienceDetails = pgTable("experience_details", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	candidateId: uuid("candidate_id").notNull(),
	companyName: varchar("company_name", { length: 255 }).notNull(),
	duration: varchar({ length: 100 }),
	trade: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.candidateId],
			foreignColumns: [candidates.id],
			name: "experience_details_candidate_id_candidates_id_fk"
		}).onDelete("cascade"),
]);

export const technicalQualificationDetails = pgTable("technical_qualification_details", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	candidateId: uuid("candidate_id").notNull(),
	qualificationName: varchar("qualification_name", { length: 255 }).notNull(),
	institution: varchar({ length: 255 }),
	year: varchar({ length: 20 }),
	certificateFile: varchar("certificate_file", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.candidateId],
			foreignColumns: [candidates.id],
			name: "technical_qualification_details_candidate_id_candidates_id_fk"
		}).onDelete("cascade"),
]);

export const candidateCertificates = pgTable("candidate_certificates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	candidateId: uuid("candidate_id").notNull(),
	fileUrl: varchar("file_url", { length: 500 }).notNull(),
	fileName: varchar("file_name", { length: 255 }),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.candidateId],
			foreignColumns: [candidates.id],
			name: "candidate_certificates_candidate_id_candidates_id_fk"
		}).onDelete("cascade"),
]);

export const companies = pgTable("companies", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	contactPerson: varchar("contact_person", { length: 255 }),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 20 }),
	address: text(),
	country: varchar({ length: 100 }),
	requirements: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const salaries = pgTable("salaries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	basicSalary: numeric("basic_salary", { precision: 10, scale:  2 }).notNull(),
	allowances: numeric({ precision: 10, scale:  2 }).default('0'),
	deductions: numeric({ precision: 10, scale:  2 }).default('0'),
	netSalary: numeric("net_salary", { precision: 10, scale:  2 }).notNull(),
	salaryMonth: date("salary_month").notNull(),
	paymentStatus: salaryPaymentStatus("payment_status").default('pending'),
	paymentDate: timestamp("payment_date", { mode: 'string' }),
	processedBy: uuid("processed_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "salaries_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.processedBy],
			foreignColumns: [users.id],
			name: "salaries_processed_by_users_id_fk"
		}),
]);

export const auditLogs = pgTable("audit_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	action: varchar({ length: 255 }).notNull(),
	tableName: varchar("table_name", { length: 100 }),
	recordId: uuid("record_id"),
	oldValues: jsonb("old_values"),
	newValues: jsonb("new_values"),
	ipAddress: inet("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_audit_logs_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_audit_logs_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "audit_logs_user_id_users_id_fk"
		}),
]);

export const candidates = pgTable("candidates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	fullName: varchar("full_name", { length: 255 }).notNull(),
	surname: varchar("surname", { length: 255 }),
	fatherName: varchar("father_name", { length: 255 }),
	dateOfBirth: date("date_of_birth"),
	maritalStatus: varchar("marital_status", { length: 50 }),
	religion: varchar({ length: 100 }),
	sex: varchar("sex", { length: 10 }),
	citizenshipNo: varchar("citizenship_no", { length: 50 }),
	passportNo: varchar("passport_no", { length: 50 }),
	dateOfIssue: date("date_of_issue"),
	dateOfExpiry: date("date_of_expiry"),
	placeOfIssue: varchar("place_of_issue", { length: 255 }),
	cnicFrontImage: varchar("cnic_front_image", { length: 500 }),
	cnicBackImage: varchar("cnic_back_image", { length: 500 }),
	primarySchool: text("primary_school"),
	secondarySchool: text("secondary_school"),
	higherEducation: text("higher_education"),
	diploma: text(),
	matricCertificate: varchar("matric_certificate", { length: 500 }),
	intermediateCertificate: varchar("intermediate_certificate", { length: 500 }),
	diplomaCertificate: varchar("diploma_certificate", { length: 500 }),
	academicQualifications: text("academic_qualifications"),
	technicalQualifications: text("technical_qualifications"),
	languagesKnown: text("languages_known").array(),
	gccExperience: varchar("gcc_experience", { length: 50 }),
	ksaExperience: varchar("ksa_experience", { length: 50 }),
	localExperience: varchar("local_experience", { length: 50 }),
	experienceTotal: varchar("experience_total", { length: 50 }),
	postAppliedFor: varchar("post_applied_for", { length: 255 }),
	referredBy: varchar("referred_by", { length: 255 }),
	experienceLetter: varchar("experience_letter", { length: 500 }),
	profileImage: varchar("profile_image", { length: 500 }),
	cvFile: varchar("cv_file", { length: 500 }),
	remarks: text(),
	status: candidateStatus().default('active'),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_candidates_created_by").using("btree", table.createdBy.asc().nullsLast().op("uuid_ops")),
	index("idx_candidates_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "candidates_created_by_users_id_fk"
		}),
	unique("candidates_passport_no_unique").on(table.passportNo),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	role: userRole().notNull(),
	fullName: varchar("full_name", { length: 255 }).notNull(),
	phone: varchar({ length: 20 }),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_users_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_users_role").using("btree", table.role.asc().nullsLast().op("enum_ops")),
	unique("users_email_unique").on(table.email),
]);

export const expenses = pgTable("expenses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	category: varchar({ length: 100 }).notNull(),
	description: text(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	currency: varchar({ length: 10 }).default('SAR'),
	expenseDate: date("expense_date").notNull(),
	createdBy: uuid("created_by"),
	approvedBy: uuid("approved_by"),
	status: expenseStatus().default('pending'),
	receiptFile: varchar("receipt_file", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "expenses_created_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [users.id],
			name: "expenses_approved_by_users_id_fk"
		}),
]);

export const candidateCompanyEngagements = pgTable("candidate_company_engagements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	candidateId: uuid("candidate_id").notNull(),
	companyId: uuid("company_id").notNull(),
	agentId: uuid("agent_id"),
	interviewStatus: varchar("interview_status", { length: 50 }).default('pending'),
	interviewResult: varchar("interview_result", { length: 50 }).default('pending'),
	lockedByWorkflow: boolean("locked_by_workflow").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	note: text(),
}, (table) => [
	index("idx_engagement_agent").using("btree", table.agentId.asc().nullsLast().op("uuid_ops")),
	index("idx_engagement_candidate").using("btree", table.candidateId.asc().nullsLast().op("uuid_ops")),
	index("idx_engagement_company").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_candidate_company").using("btree", table.candidateId.asc().nullsLast().op("uuid_ops"), table.companyId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.candidateId],
			foreignColumns: [candidates.id],
			name: "candidate_company_engagements_candidate_id_candidates_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "candidate_company_engagements_company_id_companies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.agentId],
			foreignColumns: [users.id],
			name: "candidate_company_engagements_agent_id_users_id_fk"
		}).onDelete("set null"),
]);

export const employees = pgTable("employees", {
    id: uuid().defaultRandom().primaryKey().notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    email: varchar({ length: 255 }),
    phone: varchar({ length: 20 }),
    department: varchar({ length: 100 }),
    position: varchar({ length: 100 }),
    joinDate: date("join_date"),
    status: varchar({ length: 50 }).default('active'),
    createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});
