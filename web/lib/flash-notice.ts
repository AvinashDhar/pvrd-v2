export const FLASH_COOKIE = "pvrd-flash";

export type FlashNotice = {
  id: string;
  tone: "success" | "error";
  message: string;
};
