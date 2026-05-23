interface Site {
  readonly name: string;
  readonly nameZh: string;
  readonly monogram: string;
  readonly description: string;
  readonly email: string;
  readonly github: string;
  readonly twitter: string | null;
  readonly url: string;
  readonly locale: string;
  readonly location: string;
}

export const site: Site = {
  name: 'Jason Chen',
  nameZh: '陈敬升',
  monogram: 'CJS',
  description: '工程师 / Builder · 在机械与软件之间',
  email: 'chjingsheng@gmail.com',
  github: 'https://github.com/chjingsheng',
  twitter: null,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  locale: 'zh-CN',
  location: 'Shenzhen · Beijing',
};
