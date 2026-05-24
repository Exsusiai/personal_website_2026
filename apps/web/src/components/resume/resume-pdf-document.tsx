'use client';

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { ResumeBundle, ResumeItem } from '@/lib/cms/types';

// Register Noto Serif SC for Chinese chars
// TODO: if the CDN URLs fail at runtime, @react-pdf will fall back to the default font
// and Chinese characters will not render correctly (non-blocking — replace URLs with
// self-hosted fonts once the project has a proper asset pipeline).
Font.register({
  family: 'Noto Serif SC',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/cn-fontsource-noto-serif-sc-regular/font.ttf', fontWeight: 'normal' },
    { src: 'https://cdn.jsdelivr.net/npm/cn-fontsource-noto-serif-sc-bold/font.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FAFAF7',
    padding: 48,
    fontFamily: 'Noto Serif SC',
    fontSize: 10,
    lineHeight: 1.55,
    color: '#1A1A1A',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  contact: {
    fontSize: 9,
    color: '#6B6B66',
    marginBottom: 16,
  },
  section: {
    marginTop: 14,
    marginBottom: 4,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1A1A1A',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E4DE',
    paddingBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  itemDate: {
    width: 90,
    fontSize: 9,
    color: '#6B6B66',
  },
  itemBody: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 10.5,
    fontWeight: 'bold',
    marginBottom: 1,
  },
  itemOrg: {
    fontSize: 9.5,
    color: '#6B6B66',
    marginBottom: 2,
  },
  tags: {
    fontSize: 8.5,
    color: '#6B6B66',
    marginTop: 1,
  },
});

interface Props {
  bundle: ResumeBundle;
  name: string;
  email: string;
  github: string;
}

function fmtDate(iso: string | null, fallback = '至今'): string {
  if (!iso) return fallback;
  return iso.slice(0, 7); // YYYY-MM
}

function ResumeItemRow({ item }: { item: ResumeItem }) {
  return (
    <View style={styles.itemRow} wrap={false}>
      <Text style={styles.itemDate}>
        {fmtDate(item.startDate)} — {fmtDate(item.endDate)}
      </Text>
      <View style={styles.itemBody}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemOrg}>
          {item.org}
          {item.location ? ` · ${item.location}` : ''}
        </Text>
        {item.tags.length > 0 && <Text style={styles.tags}>{item.tags.join(' · ')}</Text>}
      </View>
    </View>
  );
}

export function ResumePdfDocument({ bundle, name, email, github }: Props) {
  const sections: Array<[string, ResumeItem[]]> = [
    ['Experience · 经历', bundle.experience],
    ['Education · 教育', bundle.education],
    ['Skill · 技能', bundle.skill],
    ['Award · 奖项', bundle.award],
  ];

  return (
    <Document title={`${name} Resume`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.contact}>
          {email}  ·  {github}
        </Text>
        {sections
          .filter(([, items]) => items.length > 0)
          .map(([title, items]) => (
            <View key={title}>
              <Text style={styles.section}>{title}</Text>
              {items.map((item) => (
                <ResumeItemRow key={item.id} item={item} />
              ))}
            </View>
          ))}
      </Page>
    </Document>
  );
}
