export const safeJsonParse = (text: string) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
};
