export const generateInvitationLink = (roomId: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/?roomId=${encodeURIComponent(roomId)}`;
};

export const extractRoomIdFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("roomId");
};

export const copyInvitationLink = async (roomId: string): Promise<boolean> => {
  try {
    const invitationLink = generateInvitationLink(roomId);
    await navigator.clipboard.writeText(invitationLink);
    return true;
  } catch (error) {
    console.error("Failed to copy invitation link:", error);
    // Fallback for older browsers
    try {
      const textArea = document.createElement("textarea");
      textArea.value = generateInvitationLink(roomId);
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
      return true;
    } catch (fallbackError) {
      console.error("Fallback copy failed:", fallbackError);
      return false;
    }
  }
};

export const clearRoomIdFromUrl = (): void => {
  const url = new URL(window.location.href);
  url.searchParams.delete("roomId");
  window.history.replaceState({}, document.title, url.toString());
};
