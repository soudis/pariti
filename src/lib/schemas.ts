import { z } from "zod";

export const expenseSchema = z
	.object({
		title: z.string().min(1, "Title is required"),
		description: z.string().nullish(),
		amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
		paidById: z.string().min(1, "Please select who paid"),
		date: z.coerce.date(),
		splitAll: z.coerce.boolean(),
		selectedMembers: z
			.array(z.string())
			.min(1, "Please select at least one member"),
		isRecurring: z.coerce.boolean(),
		recurringType: z.enum(["weekly", "monthly", "yearly"]).nullish(),
		recurringStartDate: z.coerce.date().nullish(),
	})
	.refine(
		(data) => {
			// If splitAll is false, selectedMembers must have at least one member
			if (!data.splitAll && data.selectedMembers.length === 0) {
				return false;
			}
			return true;
		},
		{
			message: "Please select at least one member",
			path: ["selectedMembers"],
		},
	)
	.refine(
		(data) => {
			// If isRecurring is true, recurringStartDate must be provided
			if (data.isRecurring && !data.recurringStartDate) {
				return false;
			}
			return true;
		},
		{
			message: "Please select a start date for recurring expenses",
			path: ["recurringStartDate"],
		},
	);

export const resourceSchema = z
	.object({
		name: z.string().min(1, "Name is required"),
		description: z.string().nullish(),
		hasUnit: z.coerce.boolean().optional(),
		unit: z.string().nullish(),
		unitPrice: z.coerce.number().min(0).nullish(),
	})
	.refine(
		(data) => {
			// If hasUnit is true, unit and unitPrice must be provided
			if (data.hasUnit && (!data.unit || !data.unitPrice)) {
				return false;
			}
			return true;
		},
		{
			message: "Unit and unit price are required when using units",
			path: ["unit"],
		},
	);

export const consumptionSchema = z.object({
	resourceId: z.string().min(1, "Please select a resource"),
	description: z.string().nullish(),
	amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
	isUnitAmount: z.coerce.boolean(),
	date: z.coerce.date(),
	selectedMembers: z
		.array(z.string())
		.min(1, "Please select at least one member"),
});

export const memberSchema = z.object({
	name: z.string().min(1, "Name is required"),
	iban: z.string().optional(),
	activeFrom: z.coerce.date().optional(),
	activeTo: z.coerce.date().optional(),
	hasEndDate: z.coerce.boolean().optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type ResourceFormData = z.infer<typeof resourceSchema>;
export type ConsumptionFormData = z.infer<typeof consumptionSchema>;
export type MemberFormData = z.infer<typeof memberSchema>;
