export const urlLinkedInValidator = {
  validator: (v: string) => v.startsWith("https") && v.includes("linkedin.com"),
  message: "El link debe ser una URL válida de LinkedIn",
};
