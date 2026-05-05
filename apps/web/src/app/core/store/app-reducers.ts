import { on } from '@ngrx/signals/events';

import { AppEvents } from './app-events';

export interface AppState {
  initialized: boolean;
  loading: boolean;
  error: string | null;
}

export const initialAppState: AppState = {
  initialized: false,
  loading: false,
  error: null,
};

export const appInitializedReducer = on(
  AppEvents.initialized,
  (_event, _state) => ({
    initialized: true,
    loading: false,
    error: null,
  }),
);

export const appErrorReducer = on(
  AppEvents.errorOccurred,
  (event, _state) => ({
    initialized: true,
    loading: false,
    error: event.payload.message,
  }),
);

