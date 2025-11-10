import "./globals.css";

export const metadata = {
  title: "Haven Ground - Land and community, one meaningful handshake at a time",
  description: "Discover exceptional rural properties in Texas. Beautiful land for sale perfect for building your legacy. Haven Ground specializes in premium Texas land investments.",
  keywords: "Texas land for sale, rural property Texas, land investment, Texas acreage, Haven Ground, buy land Texas, ranch land for sale, Texas real estate",
  authors: [{ name: "Haven Ground" }],
  creator: "Haven Ground",
  publisher: "Haven Ground",
  metadataBase: new URL('https://havenground.netlify.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Haven Ground - Land and community, one meaningful handshake at a time",
    description: "Discover exceptional rural properties in Texas. Beautiful land for sale perfect for building your legacy.",
    url: 'https://havenground.netlify.app',
    siteName: 'Haven Ground',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Haven Ground - Texas Land for Sale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Haven Ground - Land and community',
    description: 'Discover exceptional rural properties in Texas. Beautiful land for sale perfect for building your legacy.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5VBRW53D');`,
          }}
        />
        {/* Microsoft Clarity */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "tuuehw3so6");`,
          }}
        />
        {/* Facebook Pixel */}
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '858117033546335');
fbq('track', 'PageView');`,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=858117033546335&ev=PageView&noscript=1"
          />
        </noscript>
        {/* Hyros Tracking */}
        <script
          dangerouslySetInnerHTML={{
            __html: `var head = document.head;
var script = document.createElement('script');
script.type = 'text/javascript';
script.src = "https://213419.t.hyros.com/v1/lst/universal-script?ph=84bfa7108c8c1acd1100d55c35a96a2224bfa37ad4a7cc4c0329d9d34cd2e9cd&tag=!clicked&ref_url=" + encodeURI(document.URL);
head.appendChild(script);`,
          }}
        />
        {/* Attrios AI Visitor Tracking */}
        <script src="https://attrios.netlify.app/track.js?id=client_vp1wfzhcd5e" />

        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "RealEstateAgent",
              "name": "Haven Ground",
              "description": "Discover exceptional rural properties in Texas. Beautiful land for sale perfect for building your legacy.",
              "url": "https://havenground.netlify.app",
              "logo": "https://havenground.netlify.app/favicon.png",
              "sameAs": [],
              "address": {
                "@type": "PostalAddress",
                "addressRegion": "TX",
                "addressCountry": "US"
              },
              "areaServed": [
                {
                  "@type": "State",
                  "name": "Texas"
                },
                {
                  "@type": "State",
                  "name": "Colorado"
                },
                {
                  "@type": "State",
                  "name": "Mississippi"
                },
                {
                  "@type": "State",
                  "name": "Tennessee"
                },
                {
                  "@type": "State",
                  "name": "Missouri"
                }
              ],
              "knowsAbout": [
                "Land Sales",
                "Rural Properties",
                "Acreage",
                "Real Estate Development",
                "Ranch Land",
                "Residential Lots"
              ]
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Haven Ground",
              "url": "https://havenground.netlify.app",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://havenground.netlify.app/properties?search={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5VBRW53D"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        {children}
      </body>
    </html>
  );
}
