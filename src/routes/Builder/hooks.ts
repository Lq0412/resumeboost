import { useEffect, useCallback } from 'react';
import { throttle } from './utils';

// 自动调整 textarea 高度的 hook
export const useAutoResizeTextarea = () => {
  const handleResize = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';
  }, []);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';
  }, []);

  return { handleResize, handleFocus };
};

// 拖拽调节宽度的 hook
export const useDragResize = (
  isDragging: boolean,
  setWidth: (width: number) => void,
  minWidth: number,
  maxWidth: number,
  isRightSide = false
) => {
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = throttle((e: MouseEvent) => {
      if (isRightSide) {
        setWidth(Math.max(minWidth, Math.min(maxWidth, window.innerWidth - e.clientX)));
      } else {
        setWidth(Math.max(minWidth, Math.min(maxWidth, e.clientX)));
      }
    }, 16); // ~60fps

    const handleMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, setWidth, minWidth, maxWidth, isRightSide]);
};
