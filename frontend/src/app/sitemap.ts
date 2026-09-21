import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://coworking-ukk.local',
      lastModified: new Date(),
    },
  ]
}
