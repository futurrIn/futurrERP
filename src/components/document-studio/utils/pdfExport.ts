import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { toast } from 'react-hot-toast';

export async function exportA4PDF(elementId: string, filename: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    toast.error('Document preview element not found');
    return false;
  }

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
    await new Promise((resolve) => setTimeout(resolve, 60));

    // html2canvas-pro natively parses oklch, lab, and modern CSS color spaces
    const canvas = await html2canvas(element, {
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
      }
    });

    // High quality JPEG for crisp text with small file size (~200KB - 300KB)
    const imgData = canvas.toDataURL('image/jpeg', 0.88);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // Exact A4 dimensions in mm
    const pdfWidth = 210;
    const pdfHeight = 297;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);

    toast.success('High-clarity A4 PDF downloaded successfully!', { id: toastId });
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
