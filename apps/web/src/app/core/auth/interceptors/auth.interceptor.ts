import { HttpInterceptorFn } from '@angular/common/http';

/**
 * S5: Tokens are stored in httpOnly cookies, so we only need to ensure
 * `withCredentials: true` is set so cookies are sent cross-origin.
 * The Authorization header approach is kept as a fallback for Swagger/Postman usage
 * but is not needed for browser requests.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Attach withCredentials so httpOnly cookies are sent with every request
  const withCreds = req.clone({ withCredentials: true });
  return next(withCreds);
};
