import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { TRPCProvider } from "@/providers/trpc-provider";
import { ReduxProvider } from "@/providers/redux-provider";
import { ToastContainer } from "react-toastify";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "LinguaFlow",
  description: "Your AI-powered language learning companion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geist.className} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <TRPCProvider>
          <ReduxProvider>
            <ThemeProvider>
              {children}

              <ToastContainer
                position="bottom-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
              />
            </ThemeProvider>
          </ReduxProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
