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
export const getTotalPoints = (
  items: import("../types/item-type.types").UserItem[],
  itemType: import("../types/item-type.types").ItemType
) => {
  return items.reduce((total, item) => {
    if (item.isRemoved) return total;

    const option = itemType.options.find((opt) => opt.id === item.optionId);
    if (!option) return total;

    const count = item.count || 1;
    return total + count * option.points;
  }, 0);
};

// Calculate total items count
export const getTotalItems = (
  items: import("../types/item-type.types").UserItem[]
) => {
  return items.reduce((total, item) => {
    if (item.isRemoved) return total;
    const count = item.count || 1;
    return total + count;
  }, 0);
};
