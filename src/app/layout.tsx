import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ICE School Manager",
  description: "Institute management system for ICE School",
};

const themeScript = `
(function(){
  try{
    var t=localStorage.getItem('ice_theme');
    if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t;}
  }catch(e){}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
