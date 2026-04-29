export const siteConfig = {
  name: "Arcana Flow",
  title: "Arcana Flow | 在线塔罗解读",
  description:
    "面向中文用户的在线塔罗手札，提供洗牌、抽牌、牌面展示、直觉补充和中文解读。",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}
