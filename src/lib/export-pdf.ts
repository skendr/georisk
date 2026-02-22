export async function exportReportAsPdf(
  element: HTMLElement,
  filename = "georisk-report.pdf"
): Promise<void> {
  const [{ toPng }, { jsPDF }] = await Promise.all([
    import("html-to-image"),
    import("jspdf"),
  ]);

  const imgData = await toPng(element, {
    pixelRatio: 2,
    cacheBust: true,
    filter: (node: HTMLElement) => {
      // Keep text nodes and non-element nodes
      if (!(node instanceof HTMLElement)) return true;
      // Exclude elements marked with data-pdf-hide (e.g. Leaflet maps)
      return !node.hasAttribute("data-pdf-hide");
    },
  });

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = imgData;
  });

  const pdf = new jsPDF("p", "mm", "a4");

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  const imgWidth = contentWidth;
  const imgHeight = (img.height * imgWidth) / img.width;

  let heightLeft = imgHeight;
  let page = 0;

  while (heightLeft > 0) {
    if (page > 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, margin - page * contentHeight, imgWidth, imgHeight);
    heightLeft -= contentHeight;
    page++;
  }

  pdf.save(filename);
}
