"use client";

import { useEffect } from "react";
import { addVisitedGroup } from "./visited-groups-section";

interface GroupVisitTrackerProps {
	groupId: string;
	groupName: string;
}

export function GroupVisitTracker({
	groupId,
	groupName,
}: GroupVisitTrackerProps) {
	useEffect(() => {
		// Track the group visit when the component mounts
		addVisitedGroup(groupId, groupName);
	}, [groupId, groupName]);

	// This component doesn't render anything
	return null;
}
