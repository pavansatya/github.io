/**
 * Single source of truth for identity, contact and SEO.
 * Every page, the JSON-LD block and the résumé page read from here.
 */

export const site = {
  url: 'https://pavanvenigalla.vercel.app',
  name: 'Pavan Satya Krishna Venigalla',
  shortName: 'Pavan Venigalla',
  initials: 'PV',
  /** Résumé headline. Also the <title> suffix. */
  role: 'Data Analytics Engineer',
  /** Positioning: platform engineering as the discipline, health data as the proving ground. */
  discipline: 'Cloud & data platform engineer',
  location: 'Los Angeles, CA',
  email: 'krishvenigalla06@gmail.com',
  phone: '+1 267-734-7347',
  phoneHref: 'tel:+12677347347',

  headline: 'I build the data platforms health systems run on.',

  intro:
    'Cloud and data platform engineer with 5+ years across healthcare, pharma and financial services. ' +
    'I design Azure and Databricks lakehouses, ship them through CI/CD like software, and build the ' +
    'validation and observability that prove a number is right before anyone acts on it.',

  /** Shown under the hero as quick orientation. */
  facts: [
    { k: 'Now', v: 'Data Analytics Engineer, LA County DHS' },
    { k: 'Stack', v: 'Azure Synapse · Databricks · Delta Lake · PySpark' },
    { k: 'Focus', v: 'CI/CD, governance and pipeline reliability' },
    { k: 'Degree', v: 'MS Data Science, Rutgers' },
  ],

  links: {
    github: 'https://github.com/pavansatya',
    linkedin: 'https://www.linkedin.com/in/pavan-venigalla',
    resumePdf: '/resume.pdf',
    /** Filename a visitor gets when they save the PDF. */
    resumeFilename: 'Pavan_Venigalla_Data_Analytics_Engineer.pdf',
    paper: 'https://www.neuroquantology.com/media/article_pdfs/264-271.pdf',
  },

  seo: {
    title: 'Pavan Venigalla — Data Analytics Engineer',
    description:
      'Cloud and data platform engineer in Los Angeles. Azure Synapse, Databricks, Delta Lake and ' +
      'PySpark pipelines for healthcare data — with the CI/CD, governance and validation around them.',
    ogImage: '/og.png',
  },
} as const;

export const education = [
  {
    degree: 'MS, Data Science',
    org: 'Rutgers University',
    place: 'New Jersey, USA',
    period: '2023 — 2025',
    note: 'GPA 4.0',
  },
  {
    degree: 'B.Tech, Instrumentation & Control Engineering',
    org: 'National Institute of Technology, Tiruchirappalli',
    place: 'India',
    period: '2018 — 2022',
    note: null,
  },
] as const;

export type CertStatus = 'active' | 'in-progress' | 'lapsed';

export const certifications: {
  name: string;
  issuer: string;
  status: CertStatus;
}[] = [
  { name: 'AWS Certified AI Practitioner', issuer: 'Amazon Web Services', status: 'active' },
  { name: 'Google Data Analytics Professional', issuer: 'Google', status: 'active' },
  { name: 'AZ-400 — DevOps Engineer Expert', issuer: 'Microsoft', status: 'in-progress' },
  { name: 'DP-700 — Fabric Data Engineer', issuer: 'Microsoft', status: 'lapsed' },
];

export const publication = {
  title: 'Published research',
  venue: 'NeuroQuantology',
  year: 2022,
  url: site.links.paper,
} as const;
