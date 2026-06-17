
import { useEffect, useState } from 'react';

export function useVisualViewportOffset() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport as VisualViewport | undefined;
    if (!vv) return;
    const onResize = () => {
      // Calculate keyboard height accounting for iOS viewport changes
      const keyboardHeight = window.innerHeight - vv.height;
      // Only apply offset if keyboard is actually open (threshold: 150px)
      // Keyboards are typically > 150px tall
      const threshold = 150;
      setOffset(keyboardHeight > threshold ? keyboardHeight : 0);
    };
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize); // iOS Safari also scrolls viewport
    onResize();
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, []);
  return offset;
}
