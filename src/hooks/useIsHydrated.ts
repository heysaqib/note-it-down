import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

export function useIsHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
