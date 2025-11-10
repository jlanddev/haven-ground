export default function sitemap() {
  const baseUrl = 'https://havenground.netlify.app';

  // All property slugs from propertiesData.js
  const properties = [
    'willow-valley',
    'oak-hill',
    'desoto-estates',
    'opperman',
    'the-ranches',
    'nashboro',
    'kentucky-trails',
    'longview',
    'sardis',
    'mesquite-plains'
  ];

  const routes = [
    '',
    '/community',
    '/development',
    '/privacy-policy',
    '/properties',
    '/sell-your-land',
    '/team',
    '/terms-of-use',
  ];

  const propertyRoutes = properties.map((slug) => ({
    url: `${baseUrl}/properties/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const staticRoutes = routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.7,
  }));

  return [...staticRoutes, ...propertyRoutes];
}
