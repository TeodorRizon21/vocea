import { NextResponse } from 'next/server';

export async function GET() {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
      xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

<url>
  <loc>https://www.voceacampusului.ro/</loc>
  <lastmod>2025-06-02T08:28:28+00:00</lastmod>
  <changefreq>daily</changefreq>
  <priority>1.00</priority>
</url>

<url>
  <loc>https://www.voceacampusului.ro/browse</loc>
  <lastmod>2025-06-02T08:28:28+00:00</lastmod>
  <changefreq>daily</changefreq>
  <priority>0.90</priority>
</url>

<url>
  <loc>https://www.voceacampusului.ro/forum</loc>
  <lastmod>2025-06-02T08:28:28+00:00</lastmod>
  <changefreq>daily</changefreq>
  <priority>0.90</priority>
</url>

<url>
  <loc>https://www.voceacampusului.ro/projects</loc>
  <lastmod>2025-06-02T08:28:28+00:00</lastmod>
  <changefreq>daily</changefreq>
  <priority>0.90</priority>
</url>

<url>
  <loc>https://www.voceacampusului.ro/contact</loc>
  <lastmod>2025-06-02T08:28:28+00:00</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.70</priority>
</url>

<url>
  <loc>https://www.voceacampusului.ro/terms</loc>
  <lastmod>2025-06-02T08:28:28+00:00</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.50</priority>
</url>

<url>
  <loc>https://www.voceacampusului.ro/gdpr</loc>
  <lastmod>2025-06-02T08:28:28+00:00</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.50</priority>
</url>

<url>
  <loc>https://www.voceacampusului.ro/sign-in</loc>
  <lastmod>2025-06-02T08:28:28+00:00</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.80</priority>
</url>

<url>
  <loc>https://www.voceacampusului.ro/sign-up</loc>
  <lastmod>2025-06-02T08:28:28+00:00</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.80</priority>
</url>

</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
} 