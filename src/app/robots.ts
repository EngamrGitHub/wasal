import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/merchant/'],
    },
    // Replace with your actual domain when deploying
    sitemap: 'https://wafir.com/sitemap.xml',
  };
}
