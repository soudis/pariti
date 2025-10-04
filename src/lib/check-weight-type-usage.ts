import type { getCalculatedGroup } from "@/actions/get-group";
import type { WeightType } from "./schemas";

/**
 * Checks if a weight type is currently in use by any members, expenses, or consumptions
 * @param weightTypeId - The ID of the weight type to check
 * @param group - The group data containing members, expenses, and consumptions
 * @returns true if the weight type is in use, false otherwise
 */
export function isWeightTypeInUse(
	weightTypeId: string,
	group: Awaited<ReturnType<typeof getCalculatedGroup>>,
): boolean {
	// Check if any expense uses this weight type (when sharing method is "equal" and weights are enabled)
	// Note: We can't determine this from the expense data alone since the weight type selection
	// happens at the UI level. However, if weights are enabled and there are expenses with "equal" sharing,
	// they might be using weight types. For now, we'll be conservative and assume they might be in use
	// if there are any expenses with equal sharing method.
	const hasEqualSharingExpenses = group.expenses.some(
		(expense) => expense.sharingMethod === weightTypeId,
	);

	// Check if any consumption uses this weight type
	const hasEqualSharingConsumptions = group.resources.some((resource) =>
		resource.consumptions.some(
			(consumption) => consumption.sharingMethod === weightTypeId,
		),
	);

	// If there are expenses or consumptions with equal sharing, we assume the weight type might be in use
	// This is a conservative approach to prevent data loss
	return hasEqualSharingExpenses || hasEqualSharingConsumptions;
}

/**
 * Checks if any weight type is currently in use
 * @param weightTypes - Array of weight types to check
 * @param group - The group data containing members, expenses, and consumptions
 * @returns true if any weight type is in use, false otherwise
 */
export function isAnyWeightTypeInUse(
	weightTypes: WeightType[],
	group: Awaited<ReturnType<typeof getCalculatedGroup>>,
): boolean {
	return weightTypes.some((weightType) =>
		isWeightTypeInUse(weightType.id, group),
	);
}
