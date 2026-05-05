import { inject } from '@angular/core';
import { signalStoreFeature, withMethods } from '@ngrx/signals';
import { Dispatcher } from '@ngrx/signals/events';

import { AppEvents } from './app-events';

export function withAppEffects() {
  return signalStoreFeature(
    withMethods(() => {
      const dispatcher = inject(Dispatcher);

      return {
        initializeApp(): void {
          dispatcher.dispatch(AppEvents.initialized());
        },
      };
    }),
  );
}
