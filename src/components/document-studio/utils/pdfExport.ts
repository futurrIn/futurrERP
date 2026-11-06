import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { toast } from 'react-hot-toast';

export async function exportA4PDF(elementId: string, filename: string): Promise<boolean> {
  const toastId = toast.loading('Rendering high-clarity A4 PDF...');

  // Save the transform state of the preview wrapper to avoid zoom-induced text metrics distortion
  const scaleWrapper = document.getElementById('document-a4-scale-wrapper');
  const prevTransform = scaleWrapper ? scaleWrapper.style.transform : '';
  const prevTransition = scaleWrapper ? scaleWrapper.style.transition : '';

  try {
    // Temporarily reset zoom transform so html2canvas measures at true 1:1 A4 geometry (794px x 1123px)
    if (scaleWrapper) {
      scaleWrapper.style.transform = 'none';
      scaleWrapper.style.transition = 'none';
    }

    // Ensure all web and system fonts are fully loaded
    if (document.fonts) {
      await document.fonts.ready;
    }

    // Allow DOM to settle at unscaled layout
    await new Promise((resolve) => setTimeout(resolve, 80));

    // Find all individual A4 page elements
    let pageElements = Array.from(document.querySelectorAll<HTMLElement>('.document-a4-page'));
    if (pageElements.length === 0) {
      const fallbackEl = document.getElementById(elementId) || document.getElementById('document-a4-sheet');
      if (fallbackEl) {
        pageElements = [fallbackEl];
      }
    }

    if (pageElements.length === 0) {
      toast.error('Document preview elements not found', { id: toastId });
      return false;
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // Exact A4 dimensions in mm
    const pdfWidth = 210;
    const pdfHeight = 297;

    for (let i = 0; i < pageElements.length; i++) {
      const pageEl = pageElements[i];
      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      // html2canvas-pro natively parses modern CSS color spaces
      const canvas = await html2canvas(pageEl, {
        scale: 2.5, // 2.5x retina clarity for ultra-sharp typography
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc, clonedEl) => {
          // Strip any residual transforms from ancestors in cloned document
          let cur: HTMLElement | null = clonedEl;
          while (cur && cur !== clonedDoc.body) {
            cur.style.transform = 'none';
            cur.style.transition = 'none';
            cur = cur.parentElement;
          }

          // Enforce explicit spacing and clean font stack
          clonedEl.style.fontFamily = '"Segoe UI", Roboto, -apple-system, BlinkMacSystemFont, Arial, sans-serif';
          clonedEl.style.letterSpacing = '0.015em';
          clonedEl.style.wordSpacing = '0.04em';
          clonedEl.style.marginBottom = '0px';
        }
      });

      // High quality JPEG for crisp text with small file size (~200KB - 300KB per page)
      const imgData = canvas.toDataURL('image/jpeg', 0.88);
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }

    const finalName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(finalName);

    toast.success(
      pageElements.length > 1
        ? `Multi-page PDF (${pageElements.length} pages) downloaded successfully!`
        : 'High-clarity A4 PDF downloaded successfully!',
      { id: toastId }
    );
    return true;
  } catch (error: any) {
    console.error('PDF Export Error:', error);
    toast.error('Failed to generate PDF: ' + (error?.message || 'Unknown error'), { id: toastId });
    return false;
  } finally {
    // Restore original interactive zoom transform
    if (scaleWrapper) {
      scaleWrapper.style.transform = prevTransform;
      scaleWrapper.style.transition = prevTransition;
    }
  }
}

export function triggerA4Print(): void {
  window.print();
}
