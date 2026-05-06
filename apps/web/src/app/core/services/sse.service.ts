import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

/**
 * Generic Server-Sent Events service.
 * Opens a native EventSource connection and emits parsed message payloads.
 * The caller unsubscribes to close the connection.
 */
@Injectable({ providedIn: 'root' })
export class SseService {
  connect<T>(path: string): Observable<T> {
    const url = `${environment.apiUrl}${path}`;

    return new Observable<T>((observer) => {
      const source = new EventSource(url, { withCredentials: true });

      source.onmessage = (event) => {
        try {
          observer.next(JSON.parse(event.data) as T);
        } catch {
          // ignore parse errors — malformed events are silently dropped
        }
      };

      source.onerror = (err) => observer.error(err);

      return () => source.close();
    });
  }
}

