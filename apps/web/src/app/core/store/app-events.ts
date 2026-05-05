import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

export const AppEvents = eventGroup({
  source: 'App',
  events: {
    initialized: type<void>(),
    userLoaded: type<{ userId: string }>(),
    errorOccurred: type<{ message: string }>(),
  },
});
