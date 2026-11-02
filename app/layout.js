import "./globals.css";

export const metadata = {
  title: "Reachout — Job outreach",
  description: "Send and review job application emails.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
