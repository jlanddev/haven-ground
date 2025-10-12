import { properties } from '../propertiesData';

export const dynamicParams = false;

export function generateStaticParams() {
  return properties.map((property) => ({
    slug: property.slug
  }));
}

export default function PropertyLayout({ children }) {
  return children;
}