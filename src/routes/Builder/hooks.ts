import { useEffect, useCallback, useState } from 'react';
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
  isRightSide = false,
  setIsDragging?: (value: boolean) => void
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
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setIsDragging?.(false);
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
  }, [isDragging, setWidth, minWidth, maxWidth, isRightSide, setIsDragging]);
};

export const useContentHeight = <T extends HTMLElement>(
  contentRef: React.RefObject<T>,
  deps: React.DependencyList = []
) => {
  const [contentHeight, setContentHeight] = useState(0);

  const updateHeight = useCallback(() => {
    const contentEl = contentRef.current;
    if (!contentEl) return;
    requestAnimationFrame(() => {
      const next = contentRef.current;
      if (next) {
        setContentHeight(next.scrollHeight);
      }
    });
  }, [contentRef]);

  useEffect(() => {
    updateHeight();
  }, [updateHeight, ...deps]);

  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl) return;

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(contentEl);

    const mutationObserver = new MutationObserver(updateHeight);
    mutationObserver.observe(contentEl, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [contentRef, updateHeight, ...deps]);

  return contentHeight;
};
