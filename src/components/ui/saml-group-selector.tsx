"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SamlGroupSelectorProps {
	value: string[];
	onChange: (groups: string[]) => void;
	userGroups?: string[];
}

export function SamlGroupSelector({
	value,
	onChange,
	userGroups = [],
}: SamlGroupSelectorProps) {
	const t = useTranslations("forms.group.samlGroups");
	const [customInput, setCustomInput] = useState("");

	const addGroup = (group: string) => {
		const trimmed = group.trim();
		if (trimmed && !value.includes(trimmed)) {
			onChange([...value, trimmed]);
		}
	};

	const removeGroup = (group: string) => {
		onChange(value.filter((g) => g !== group));
	};

	const handleAddCustom = () => {
		if (customInput.trim()) {
			addGroup(customInput.trim());
			setCustomInput("");
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleAddCustom();
		}
	};

	const availableUserGroups = userGroups.filter((g) => !value.includes(g));

	return (
		<div className="space-y-3 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
			<h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
				{t("title")}
			</h4>
			<p className="text-xs text-gray-500 dark:text-gray-400">
				{t("description")}
			</p>

			{value.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{value.map((group) => (
						<Badge
							key={group}
							variant="secondary"
							className="flex items-center gap-1 pr-1"
						>
							{group}
							<button
								type="button"
								onClick={() => removeGroup(group)}
								className="ml-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 p-0.5"
							>
								<X className="w-3 h-3" />
							</button>
						</Badge>
					))}
				</div>
			)}

			{availableUserGroups.length > 0 && (
				<div className="space-y-1">
					<p className="text-xs font-medium text-gray-600 dark:text-gray-400">
						{t("yourGroups")}
					</p>
					<div className="flex flex-wrap gap-1">
						{availableUserGroups.map((group) => (
							<Button
								key={group}
								type="button"
								variant="outline"
								size="sm"
								onClick={() => addGroup(group)}
								className="text-xs h-7"
							>
								<Plus className="w-3 h-3 mr-1" />
								{group}
							</Button>
						))}
					</div>
				</div>
			)}

			<div className="flex gap-2">
				<input
					type="text"
					value={customInput}
					onChange={(e) => setCustomInput(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={t("addCustomPlaceholder")}
					className="flex-1 px-2 py-1 text-sm border rounded bg-transparent"
				/>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleAddCustom}
					disabled={!customInput.trim()}
				>
					<Plus className="w-4 h-4" />
				</Button>
			</div>
		</div>
	);
}
