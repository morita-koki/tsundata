import { useState, useEffect, useCallback } from 'react';

interface UseMinimumLoadingOptions {
  minimumDuration?: number;
  enabled?: boolean;
}

interface UseMinimumLoadingReturn {
  isLoading: boolean;
  executeWithLoading: (asyncOperation: () => Promise<any>) => Promise<void>;
}

/**
 * カスタムフック：最小ローディング時間を保証する
 * ローディングアニメーションを確実に表示するため、指定時間は必ずローディング状態を維持
 */
export function useMinimumLoading(
  options: UseMinimumLoadingOptions = {}
): UseMinimumLoadingReturn {
  const {
    minimumDuration = parseInt(process.env.NEXT_PUBLIC_MINIMUM_LOADING_DURATION || '1000'),
    enabled = process.env.NEXT_PUBLIC_ENABLE_MINIMUM_LOADING !== 'false'
  } = options;

  const [isLoading, setIsLoading] = useState(false);

  const executeWithLoading = useCallback(async (asyncOperation: () => Promise<any>) => {
    setIsLoading(true);
    
    if (!enabled) {
      // 最小ローディングが無効の場合は通常通り実行
      try {
        await asyncOperation();
      } catch (error) {
        console.error('Operation failed:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const startTime = Date.now();
    
    try {
      await asyncOperation();
    } catch (error) {
      console.error('Operation failed:', error);
      throw error;
    }
    
    const elapsed = Date.now() - startTime;
    const remainingTime = Math.max(0, minimumDuration - elapsed);
    
    if (remainingTime > 0) {
      setTimeout(() => setIsLoading(false), remainingTime);
    } else {
      setIsLoading(false);
    }
  }, [minimumDuration, enabled]);

  return { isLoading, executeWithLoading };
}

/**
 * 初期化時のローディング用フック
 * useEffectと組み合わせて使用
 */
export function useInitialMinimumLoading(
  asyncOperation: () => Promise<any>,
  deps: React.DependencyList = [],
  options: UseMinimumLoadingOptions = {}
) {
  const { isLoading, executeWithLoading } = useMinimumLoading(options);

  useEffect(() => {
    executeWithLoading(asyncOperation);
  }, deps);

  return isLoading;
}