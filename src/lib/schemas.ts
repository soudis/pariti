import { z } from "zod";

// Weight type definition
export const weightTypeSchema = z.object({
	id: z.string(),
	name: z.string().min(1, "Weight type name is required"),
	isDefault: z.boolean().default(false),
});

export type WeightType = z.infer<typeof weightTypeSchema>;

// Utility functions for weight types
export const getDefaultWeightType = (): WeightType => ({
	id: "default",
	name: "Default",
	isDefault: true,
});

export const getDefaultWeightTypes = (): WeightType[] => [
	getDefaultWeightType(),
];

export const getDefaultSharingMethod = ({
	weightsEnabled,
	weightTypes,
}: {
	weightsEnabled: boolean;
	weightTypes: WeightType[];
}): string => {
	if (weightsEnabled && weightTypes.length > 1) {
		return weightTypes.find((wt) => wt.isDefault)?.id || "equal";
	}
	if (weightsEnabled && weightTypes.length === 1) {
		return weightTypes[0].id;
	}
	return "equal";
};

export const getWeightTypeById = (
	weightTypes: WeightType[],
	id: string,
): WeightType | undefined => {
	return weightTypes.find((wt) => wt.id === id);
};

export const getDefaultWeightTypeFromList = (
	weightTypes: WeightType[],
): WeightType => {
	return weightTypes.find((wt) => wt.isDefault) || getDefaultWeightType();
};

export const memberAmountSchema = z.object({
	memberId: z.string(),
	amount: z.coerce.number().nullish(),
	weight: z.coerce.number().nullish(),
});

export const expenseSchema = z
	.object({
		title: z.string().min(1, "Title is required"),
		description: z.string().nullish(),
		amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
		paidById: z.string().min(1, "Please select who paid"),
		date: z.coerce.date(),
		splitAll: z.coerce.boolean(),
		selectedMembers: z.array(z.string()),
		sharingMethod: z.string(),
		memberAmounts: z.array(memberAmountSchema).optional(),
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
	splitAll: z.coerce.boolean(),
	selectedMembers: z.array(z.string()),
	sharingMethod: z.string(),
	memberAmounts: z.array(memberAmountSchema).optional(),
});

export const memberSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.email().nullish().or(z.literal("")),
	iban: z.string().nullish(),
	weight: z.coerce.number().min(0, "Weight must be non-negative").optional(), // Legacy field for backward compatibility
	weights: z
		.record(z.string(), z.coerce.number().min(0, "Weight must be non-negative"))
		.optional(), // Object with weight type IDs as keys
	activeFrom: z.coerce.date(),
	activeTo: z.coerce.date().nullish(),
	hasEndDate: z.coerce.boolean().nullish(),
});

// Group schemas
export const groupSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().nullish(),
	currency: z.string().min(1, "Currency is required"),
	weightsEnabled: z.coerce.boolean(),
	weightTypes: z.array(weightTypeSchema).optional(),
});

export const createGroupInputSchema = z.object({
	group: groupSchema,
});

export const createGroupReturnSchema = z.object({
	id: z.string(),
});

export const updateGroupInputSchema = z.object({
	groupId: z.string().min(1, "Group ID is required"),
	group: groupSchema,
});

export const updateGroupReturnSchema = z.object({
	id: z.string(),
});

// Member schemas
export const addMemberInputSchema = z.object({
	groupId: z.string().min(1, "Group ID is required"),
	member: memberSchema,
});

export const addMemberReturnSchema = z.object({
	member: z.any(), // Allow any member type from database
});

export const updateMemberInputSchema = z.object({
	memberId: z.string().min(1, "Member ID is required"),
	member: memberSchema,
});

export const updateMemberReturnSchema = z.object({
	member: z.any(), // Allow any member type from database
});

export const removeMemberInputSchema = z.object({
	memberId: z.string().min(1, "Member ID is required"),
});

export const removeMemberReturnSchema = z.object({
	success: z.boolean(),
});

// Expense schemas
export const createExpenseInputSchema = z.object({
	groupId: z.string().min(1, "Group ID is required"),
	expense: expenseSchema,
});

export const createExpenseReturnSchema = z.object({
	expense: z.any(), // Allow any expense type from database
});

export const removeExpenseInputSchema = z.object({
	expenseId: z.string().min(1, "Expense ID is required"),
});

export const removeExpenseReturnSchema = z.object({
	success: z.boolean(),
});

export const editExpenseInputSchema = z.object({
	expenseId: z.string().min(1, "Expense ID is required"),
	expense: expenseSchema,
});

export const editExpenseReturnSchema = z.object({
	expense: z.any(), // Allow any expense type from database
});

// Resource schemas
export const createResourceInputSchema = z.object({
	groupId: z.string().min(1, "Group ID is required"),
	resource: resourceSchema,
});

export const createResourceReturnSchema = z.object({
	resource: z.any(), // Allow any resource type from database
});

export const updateResourceInputSchema = z.object({
	resourceId: z.string().min(1, "Resource ID is required"),
	resource: resourceSchema,
});

export const updateResourceReturnSchema = z.object({
	resource: z.any(), // Allow any resource type from database
});

export const removeResourceInputSchema = z.object({
	resourceId: z.string().min(1, "Resource ID is required"),
});

export const removeResourceReturnSchema = z.object({
	success: z.boolean(),
});

export const editResourceInputSchema = z.object({
	resourceId: z.string().min(1, "Resource ID is required"),
	resource: resourceSchema,
});

export const editResourceReturnSchema = z.object({
	resource: z.any(), // Allow any resource type from database
});

// Consumption schemas
export const createConsumptionInputSchema = z.object({
	consumption: consumptionSchema,
});

export const createConsumptionReturnSchema = z.object({
	consumption: z.any(), // Allow any consumption type from database
});

export const removeConsumptionInputSchema = z.object({
	consumptionId: z.string().min(1, "Consumption ID is required"),
});

export const removeConsumptionReturnSchema = z.object({
	success: z.boolean(),
});

export const editConsumptionInputSchema = z.object({
	consumptionId: z.string().min(1, "Consumption ID is required"),
	consumption: consumptionSchema,
});

export const editConsumptionReturnSchema = z.object({
	consumption: z.any(), // Allow any consumption type from database
});

// Settlement schemas
export const settlementSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().nullish(),
	settlementType: z.enum(["optimized", "around_member", "around_resource"]),
	centerId: z.string().optional(),
});

export const createSettlementInputSchema = z.object({
	groupId: z.string().min(1, "Group ID is required"),
	settlement: settlementSchema,
});

export const createSettlementReturnSchema = z.object({
	settlement: z.any(), // Allow any settlement type from database
});

export const updateSettlementMemberStatusInputSchema = z.object({
	settlementMemberId: z.string().min(1, "Settlement Member ID is required"),
	status: z.enum(["open", "completed"]),
});

export const updateSettlementMemberStatusReturnSchema = z.object({
	success: z.boolean(),
});

export const removeSettlementInputSchema = z.object({
	settlementId: z.string().min(1, "Settlement ID is required"),
});

export const removeSettlementReturnSchema = z.object({
	success: z.boolean(),
});

// Type exports
export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type ResourceFormData = z.infer<typeof resourceSchema>;
export type ConsumptionFormData = z.infer<typeof consumptionSchema>;
export type MemberFormData = z.infer<typeof memberSchema>;
export type GroupFormData = z.infer<typeof groupSchema>;
export type SettlementFormData = z.infer<typeof settlementSchema>;
