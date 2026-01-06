/**
 * 撤销栈管理 Hook
 */
import { useState, useCallback } from 'react';

// 最大撤销栈深度
const MAX_UNDO_DEPTH = 10;

export function useUndoStack<T>() {
  const [undoStack, setUndoStack] = useState<T[]>([]);

  // 保存状态到撤销栈
  const pushState = useCallback((state: T) => {
    setUndoStack(prev => {
      const newStack = [...prev, state];
      // 限制栈深度
      if (newStack.length > MAX_UNDO_DEPTH) {
        return newStack.slice(-MAX_UNDO_DEPTH);
      }
      return newStack;
    });
  }, []);

  // 弹出最近的状态
  const popState = useCallback((): T | undefined => {
    let poppedState: T | undefined;
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      poppedState = prev[prev.length - 1];
      return prev.slice(0, -1);
    });
    return poppedState;
  }, []);

  // 清空撤销栈
  const clearStack = useCallback(() => {
    setUndoStack([]);
  }, []);

  // 是否可以撤销
  const canUndo = undoStack.length > 0;

  // 获取栈深度
  const stackDepth = undoStack.length;

  return {
    pushState,
    popState,
    clearStack,
    canUndo,
    stackDepth,
  };
}
