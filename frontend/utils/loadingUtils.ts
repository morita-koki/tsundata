/**
 * ローディング制御用ユーティリティ関数
 */

/**
 * 最小ローディング時間を保証する関数
 * プロミスの実行時間が指定時間より短い場合、残り時間だけ待機する
 */
export async function withMinimumDuration<T>(
  promise: Promise<T>,
  minimumDuration: number = 1000
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await promise;
    const elapsed = Date.now() - startTime;
    const remainingTime = Math.max(0, minimumDuration - elapsed);
    
    if (remainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, remainingTime));
    }
    
    return result;
  } catch (error) {
    const elapsed = Date.now() - startTime;
    const remainingTime = Math.max(0, minimumDuration - elapsed);
    
    if (remainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, remainingTime));
    }
    
    throw error;
  }
}

/**
 * 開発環境での最小ローディング設定
 */
export const getMinimumLoadingConfig = () => {
  const enabled = process.env.NEXT_PUBLIC_ENABLE_MINIMUM_LOADING !== 'false';
  const duration = parseInt(process.env.NEXT_PUBLIC_MINIMUM_LOADING_DURATION || '1000');
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    enabled: enabled && isDevelopment, // 開発環境でのみデフォルト有効
    duration,
    isDevelopment
  };
};

/**
 * 非同期操作を最小ローディング時間付きで実行
 */
export async function executeWithMinimumLoading<T>(
  asyncOperation: () => Promise<T>,
  options: {
    minimumDuration?: number;
    enabled?: boolean;
  } = {}
): Promise<T> {
  const config = getMinimumLoadingConfig();
  const {
    minimumDuration = config.duration,
    enabled = config.enabled
  } = options;

  if (!enabled) {
    return await asyncOperation();
  }

  return await withMinimumDuration(asyncOperation(), minimumDuration);
}

/**
 * ローディング状態の管理用ヘルパー
 */
export class LoadingManager {
  private loadingStates = new Map<string, boolean>();
  private listeners = new Set<() => void>();

  setLoading(key: string, isLoading: boolean) {
    this.loadingStates.set(key, isLoading);
    this.notifyListeners();
  }

  isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false;
  }

  isAnyLoading(): boolean {
    return Array.from(this.loadingStates.values()).some(loading => loading);
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

// グローバルローディングマネージャー
export const globalLoadingManager = new LoadingManager();