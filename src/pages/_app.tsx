import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "next-themes";
import { Roboto } from "next/font/google";
import Layout from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";

const roboto = Roboto({
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  subsets: ["latin", "vietnamese"],
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className={`${roboto.variable} font-sans min-h-screen`}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
