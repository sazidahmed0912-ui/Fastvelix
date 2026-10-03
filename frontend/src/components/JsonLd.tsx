import { APP_NAME, BASE_URL } from '@/lib/seo';

interface JsonLdProps {
  data: Record<string, unknown>;
}

export default function JsonLd({ data }: JsonLdProps) {
  const html = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function BrandJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: APP_NAME,
        url: BASE_URL,
        logo: `${BASE_URL}/favicon.ico`,
      }}
    />
  );
}
