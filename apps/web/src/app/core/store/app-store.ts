import { computed } from '@angular/core';
import { signalStore, withComputed, withState } from '@ngrx/signals';
import { withReducer } from '@ngrx/signals/events';

import { appInitializedReducer, appErrorReducer, initialAppState } from './app-reducers';
import { withAppEffects } from './app-effects';

export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(initialAppState),
  withReducer(appInitializedReducer, appErrorReducer),
  withComputed((state) => ({
    isReady: computed(() => state.initialized() && !state.loading()),
    hasError: computed(() => state.error() !== null),
  })),
  withAppEffects(),
);
