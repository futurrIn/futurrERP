import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast';

export async function exportA4PDF(elementId: string, filename: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    toast.error('Document preview element not found');
    return false;
  }

  const toastId = toast.loading('Rendering optimized A4 PDF...');

  // Save original getComputedStyle to bypass Tailwind v4 oklch issues during canvas capture
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = (el, pseudoElt) => {
    const style = originalGetComputedStyle(el, pseudoElt);
    return new Proxy(style, {
      get(target, prop) {
        if (prop === 'getPropertyValue') {
          return (propertyName: string) => {
            const value = target.getPropertyValue(propertyName);
            if (typeof value === 'string' && value.includes('oklch')) {
              const name = propertyName.toLowerCase();
              if (name.includes('background')) return '#ffffff';
              if (name.includes('border') || name.includes('outline')) return '#e2e8f0';
              return '#1e293b';
            }
            return value;
          };
        }

        const value = Reflect.get(target, prop);
        if (typeof value === 'string' && value.includes('oklch')) {
          const propStr = String(prop).toLowerCase();
          if (propStr.includes('background')) return '#ffffff';
          if (propStr.includes('border') || propStr.includes('outline')) return '#e2e8f0';
          return '#1e293b';
        }

        if (typeof value === 'function') {
          return value.bind(target);
        }
        return value;
      }
    }) as any;
  };

  try {
    // scale: 2 produces high-DPI retina sharpness without excessive memory
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // JPEG with 0.82 quality produces ~150-250KB file size with crystal-clear text readability
    const imgData = canvas.toDataURL('image/jpeg', 0.82);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // Standard A4 dimensions in mm
    const pdfWidth = 210;
    const pdfHeight = 297;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);

    toast.success('A4 PDF downloaded successfully!', { id: toastId });
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

