export const formatShortDate = (isoString: string) => {
  if (!isoString) return "Date inconnue";

  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "Date invalide";

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
// Calculate total points from user items

// Calculate user totals with proper handling of removed items
export const calculateUserTotals = (
  items: import("../types/item-type.types").UserItem[],
  itemType: import("../types/item-type.types").ItemType
) => {
  let totalPoints = 0;
  let totalItems = 0;

  items.forEach((item) => {
    const option = itemType.options.find((opt) => opt.id === item.optionId);
    if (option) {
      const itemCount = item.count || 1;
      if (item.isRemoved) {
        // Subtract removed items from the total
        totalItems -= itemCount;
        totalPoints -= itemCount * option.points;
      } else {
        // Add regular items to the total
        totalItems += itemCount;
        totalPoints += itemCount * option.points;
      }
    }
  });

  return { totalPoints, totalItems };
};

// Calculate totals from aggregated items
export const getTotalFromAggregated = (
  aggregatedItems: import("../types/item-type.types").AggregatedItem[]
) => {
  return aggregatedItems.reduce(
    (totals, item) => ({
      totalPoints: totals.totalPoints + item.totalPoints,
      totalItems: totals.totalItems + item.count,
    }),
    { totalPoints: 0, totalItems: 0 }
  );
};
