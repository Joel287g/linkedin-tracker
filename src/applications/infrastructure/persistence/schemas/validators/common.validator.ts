export const urlLinkedInValidator = {
  validator: (v: string) => {
    if (!v) return false;
    v = v.trim();
    if (v.length === 0) return false;
    if (v == "Enlace no disponible") return true;

    return v.startsWith("https") && v.includes("linkedin.com");
  },
  message: `El link debe ser una URL válida de LinkedIn`,
};
