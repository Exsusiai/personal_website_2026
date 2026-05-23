export const site = {
  name: 'Jason Chen',
  nameZh: '陈敬升',
  monogram: 'CJS',
  description: '工程师 / Builder · 在机械与软件之间',
  email: 'chjingsheng@gmail.com',
  github: 'https://github.com/chjingsheng',
  twitter: '',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  locale: 'zh-CN',
  location: 'Shenzhen · Beijing',
} as const;
