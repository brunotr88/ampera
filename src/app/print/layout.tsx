/**
 * Print routes layout: force LIGHT theme for PDF/print preview.
 * Overrides any dark mode set on <html> by the root layout.
 */
import "../globals.css";

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          html, html.dark { color-scheme: light !important; background: #ffffff !important; }
          html.dark body { background: #ffffff !important; color: #111111 !important; }
          .print-root, .print-root * { color-scheme: light !important; }
          .print-root { background: #ffffff !important; color: #111111 !important; }
          @media print { html, body { background: white !important; color: black !important; } }
        `
      }} />
      <div className="print-root">{children}</div>
    </>
  );
}
