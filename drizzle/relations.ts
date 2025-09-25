import { relations } from "drizzle-orm/relations";
import { users, agentCompanyAssignments, companies, candidates, payments, workflowStages, experienceDetails, salaries, auditLogs, expenses, candidateCompanyEngagements, employees } from "./schema";

export const agentCompanyAssignmentsRelations = relations(agentCompanyAssignments, ({one}) => ({
	user: one(users, {
		fields: [agentCompanyAssignments.agentId],
		references: [users.id]
	}),
	company: one(companies, {
		fields: [agentCompanyAssignments.companyId],
		references: [companies.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	agentCompanyAssignments: many(agentCompanyAssignments),
	payments: many(payments),
	workflowStages: many(workflowStages),
	salaries_userId: many(salaries, {
		relationName: "salaries_userId_users_id"
	}),
	salaries_processedBy: many(salaries, {
		relationName: "salaries_processedBy_users_id"
	}),
	auditLogs: many(auditLogs),
	candidates: many(candidates),
	expenses_createdBy: many(expenses, {
		relationName: "expenses_createdBy_users_id"
	}),
	expenses_approvedBy: many(expenses, {
		relationName: "expenses_approvedBy_users_id"
	}),
	candidateCompanyEngagements: many(candidateCompanyEngagements),
}));

export const companiesRelations = relations(companies, ({many}) => ({
	agentCompanyAssignments: many(agentCompanyAssignments),
	workflowStages: many(workflowStages),
	candidateCompanyEngagements: many(candidateCompanyEngagements),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	candidate: one(candidates, {
		fields: [payments.candidateId],
		references: [candidates.id]
	}),
	workflowStage: one(workflowStages, {
		fields: [payments.workflowId],
		references: [workflowStages.id]
	}),
	user: one(users, {
		fields: [payments.verifiedBy],
		references: [users.id]
	}),
}));

export const candidatesRelations = relations(candidates, ({one, many}) => ({
	payments: many(payments),
	workflowStages: many(workflowStages),
	experienceDetails: many(experienceDetails),
	user: one(users, {
		fields: [candidates.createdBy],
		references: [users.id]
	}),
	candidateCompanyEngagements: many(candidateCompanyEngagements),
}));

export const workflowStagesRelations = relations(workflowStages, ({one, many}) => ({
	payments: many(payments),
	candidate: one(candidates, {
		fields: [workflowStages.candidateId],
		references: [candidates.id]
	}),
	company: one(companies, {
		fields: [workflowStages.companyId],
		references: [companies.id]
	}),
	user: one(users, {
		fields: [workflowStages.assignedAgent],
		references: [users.id]
	}),
}));

export const experienceDetailsRelations = relations(experienceDetails, ({one}) => ({
	candidate: one(candidates, {
		fields: [experienceDetails.candidateId],
		references: [candidates.id]
	}),
}));

export const salariesRelations = relations(salaries, ({one}) => ({
	user_userId: one(users, {
		fields: [salaries.userId],
		references: [users.id],
		relationName: "salaries_userId_users_id"
	}),
	user_processedBy: one(users, {
		fields: [salaries.processedBy],
		references: [users.id],
		relationName: "salaries_processedBy_users_id"
	}),
}));

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	user: one(users, {
		fields: [auditLogs.userId],
		references: [users.id]
	}),
}));

export const expensesRelations = relations(expenses, ({one}) => ({
	user_createdBy: one(users, {
		fields: [expenses.createdBy],
		references: [users.id],
		relationName: "expenses_createdBy_users_id"
	}),
	user_approvedBy: one(users, {
		fields: [expenses.approvedBy],
		references: [users.id],
		relationName: "expenses_approvedBy_users_id"
	}),
}));

export const candidateCompanyEngagementsRelations = relations(candidateCompanyEngagements, ({one}) => ({
	candidate: one(candidates, {
		fields: [candidateCompanyEngagements.candidateId],
		references: [candidates.id]
	}),
	company: one(companies, {
		fields: [candidateCompanyEngagements.companyId],
		references: [companies.id]
	}),
	user: one(users, {
		fields: [candidateCompanyEngagements.agentId],
		references: [users.id]
	}),
}));

export const employeesRelations = relations(employees, ({}) => ({}));