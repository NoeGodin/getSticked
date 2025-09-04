export const verifRoomId = (formData: { name: string; secretKey: string }, newErrors: Record<string, string>) => {
  if (!formData.name.trim()) {
    newErrors.name = "Le nom du salon est requis";
  } else if (formData.name.length < 3) {
    newErrors.name = "Le nom doit contenir au moins 3 caractères";
  }

  if (!formData.secretKey.trim()) {
    newErrors.secretKey = "La clé secrète est requise";
  } else if (formData.secretKey.length < 4) {
    newErrors.secretKey = "La clé doit contenir au moins 4 caractères";
  }
  return newErrors;
};
