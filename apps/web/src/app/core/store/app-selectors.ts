import { computed } from '@angular/core';
import { signalStoreFeature, withComputed } from '@ngrx/signals';

import { type AppState } from './app-reducers';

/**
 * Reusable selectors feature for the app store.
 * Can be composed into the store via signalStoreFeature.
 */
export function withAppSelectors() {
  return signalStoreFeature(
    { state: {} as AppState },
    withComputed((state) => ({
      isReady: computed(() => state.initialized() && !state.loading()),
      hasError: computed(() => state.error() !== null),
    })),
  );
}
