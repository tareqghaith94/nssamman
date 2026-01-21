/**
 * Print an HTML element in an isolated iframe to avoid duplication issues
 * with modals/dialogs and their overlays.
 */
export function printHtmlNode(
  node: HTMLElement,
  opts?: { title?: string }
): void {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.left = '-9999px';
  iframe.style.top = '-9999px';
  
  document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    console.error('Failed to access iframe document');
    document.body.removeChild(iframe);
    return;
  }
  
  // Collect stylesheets from the main document
  const stylesheets: string[] = [];
  
  // Get all link stylesheets
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const href = (link as HTMLLinkElement).href;
    if (href) {
      stylesheets.push(`<link rel="stylesheet" href="${href}" />`);
    }
  });
  
  // Get all inline styles
  document.querySelectorAll('style').forEach((style) => {
    stylesheets.push(`<style>${style.innerHTML}</style>`);
  });
  
  // Clone the node
  const clonedNode = node.cloneNode(true) as HTMLElement;
  
  // Build the print document
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${opts?.title || 'Print'}</title>
        ${stylesheets.join('\n')}
        <style>
          @media print {
            @page {
              margin: 15mm;
              size: A4;
            }
            body {
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          body {
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body>
        ${clonedNode.outerHTML}
      </body>
    </html>
  `;
  
  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();
  
  // Wait for stylesheets to load before printing
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print();
      // Clean up after print dialog closes
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);
  };
  
  // Fallback: trigger print if onload doesn't fire
  setTimeout(() => {
    if (iframe.parentNode) {
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }
  }, 500);
}
