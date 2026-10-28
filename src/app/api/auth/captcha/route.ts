import { route } from "@/lib/http";
import { signCaptcha } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const GET = route(async () => {
  const settings = await getSettings();
  if (!settings.captcha) return { enabled: false, token: "", question: "" };
  const a = 2 + Math.floor(Math.random() * 8);
  const b = 2 + Math.floor(Math.random() * 8);
  return {
    enabled: true,
    token: signCaptcha(a + b),
    question: `${a} + ${b} = ?`,
  };
});
