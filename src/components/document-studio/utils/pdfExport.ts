import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast';

export async function exportA4PDF(elementId: string, filename: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    toast.error('Document preview element not found');
    return false;
  }

  const toastId = toast.loading('Rendering high-clarity A4 PDF...');

  // Helper to check if an element is inside the dark header
  const isInsideDarkHeader = (el: Element | null): boolean => {
    let cur = el;
    while (cur && cur !== document.body) {
      if (cur.id === 'document-header-banner') return true;
      cur = cur.parentElement;
    }
    return false;
  };

  // Temporarily patch getComputedStyle to safely handle Tailwind v4's oklch colors
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = (el, pseudoElt) => {
    const style = originalGetComputedStyle(el, pseudoElt);
    const inDark = isInsideDarkHeader(el);

    return new Proxy(style, {
      get(target, prop) {
        if (prop === 'getPropertyValue') {
          return (propertyName: string) => {
            const value = target.getPropertyValue(propertyName);
            if (typeof value === 'string' && value.includes('oklch')) {
              const name = propertyName.toLowerCase();
              if (name.includes('background')) {
                return inDark ? '#180928' : '#ffffff';
              }
              if (name.includes('border') || name.includes('outline')) {
                return inDark ? 'rgba(255, 255, 255, 0.2)' : '#e2e8f0';
              }
              // Text color
              return inDark ? '#ffffff' : '#0f172a';
            }
            return value;
          };
        }

        const value = Reflect.get(target, prop);
        if (typeof value === 'string' && value.includes('oklch')) {
          const propStr = String(prop).toLowerCase();
          if (propStr.includes('background')) {
            return inDark ? '#180928' : '#ffffff';
          }
          if (propStr.includes('border') || propStr.includes('outline')) {
            return inDark ? 'rgba(255, 255, 255, 0.2)' : '#e2e8f0';
          }
          return inDark ? '#ffffff' : '#0f172a';
        }

        if (typeof value === 'function') {
          return value.bind(target);
        }
        return value;
      }
    }) as any;
  };

  try {
    // scale: 2 produces crisp retina clarity while keeping file size small
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // JPEG at 0.85 delivers crystal-clear text readability with compact file size (~180KB - 250KB)
    const imgData = canvas.toDataURL('image/jpeg', 0.85);

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
    // Restore original getComputedStyle
    window.getComputedStyle = originalGetComputedStyle;
  }
}

export function triggerA4Print(): void {
  window.print();
}
