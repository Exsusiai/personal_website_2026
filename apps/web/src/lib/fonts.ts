import { Inter, Inter_Tight, Noto_Sans_SC, Noto_Serif_SC, JetBrains_Mono } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  display: 'swap',
});

export const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
  preload: false,
});

export const notoSerifSC = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
  preload: false,
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const fontClassNames = [
  inter.variable,
  interTight.variable,
  notoSansSC.variable,
  notoSerifSC.variable,
  jetbrainsMono.variable,
].join(' ');
