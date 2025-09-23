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

export const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getTotalSticks = (
  sticks: { count: number; isRemoved?: boolean }[]
) => {
  return sticks.reduce((total, stick) => {
    return stick.isRemoved ? total - stick.count : total + stick.count;
  }, 0);
};
