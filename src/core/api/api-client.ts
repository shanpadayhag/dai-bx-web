import {
  ApiError,
  SIGNED_OUT_EVENT_NAME,
  SignedOutError,
  UNREACHABLE_STATUS,
} from '@/core/api/api-error';
import UnauthorizedHandling from '@/core/api/unauthorized-handling';
import appConfig from '@/core/config/app-config';

type RequestMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type ApiRequestOptions = {
  unauthorizedHandling?: UnauthorizedHandling;
};

type ApiRequest = {
  method: RequestMethod;
  path: string;
  body?: unknown;
  unauthorizedHandling: UnauthorizedHandling;
};

const UNAUTHORIZED_STATUS = 401;
const REFRESH_PATH = '/auth/refresh';
const FALLBACK_ERROR_MESSAGE = 'try again in a moment';
const UNREACHABLE_MESSAGE = 'check your connection and try again';

const buildBackendUrl = (requestPath: string) =>
  `${window.location.origin}${appConfig.backendPath}${requestPath}`;

const sendRequest = async (apiRequest: Pick<ApiRequest, 'method' | 'path' | 'body'>) => {
  const hasJsonBody = apiRequest.method !== 'GET';
  try {
    return await fetch(buildBackendUrl(apiRequest.path), {
      method: apiRequest.method,
      credentials: 'same-origin',
      headers: hasJsonBody ? { 'Content-Type': 'application/json' } : undefined,
      body: hasJsonBody ? JSON.stringify(apiRequest.body ?? {}) : undefined,
    });
  } catch {
    throw new ApiError(UNREACHABLE_STATUS, UNREACHABLE_MESSAGE, null);
  }
};

type SafeErrorBody = {
  safeMessage: string;
  errorPath: string | null;
};

const readSafeErrorBody = async (errorResponse: Response): Promise<SafeErrorBody> => {
  const errorBody: unknown = await errorResponse.json().catch(() => null);
  if (
    typeof errorBody !== 'object' ||
    errorBody === null ||
    !('error' in errorBody) ||
    typeof errorBody.error !== 'string'
  ) {
    return { safeMessage: FALLBACK_ERROR_MESSAGE, errorPath: null };
  }
  return {
    safeMessage: errorBody.error,
    errorPath: 'path' in errorBody && typeof errorBody.path === 'string' ? errorBody.path : null,
  };
};

const parseRetryAfterSeconds = (retryAfterText: string | null) => {
  const retryAfterSeconds = Number(retryAfterText);
  return retryAfterText !== null && Number.isInteger(retryAfterSeconds) && retryAfterSeconds > 0
    ? retryAfterSeconds
    : null;
};

const toApiError = async (errorResponse: Response) => {
  const safeErrorBody = await readSafeErrorBody(errorResponse);
  return new ApiError(
    errorResponse.status,
    safeErrorBody.safeMessage,
    parseRetryAfterSeconds(errorResponse.headers.get('Retry-After')),
    safeErrorBody.errorPath,
  );
};

const readResponse = async <ResponseBody>(response: Response): Promise<ResponseBody> => {
  if (!response.ok) throw await toApiError(response);
  return (await response.json()) as ResponseBody;
};

export const createApiClient = () => {
  let pendingRenewal: Promise<boolean> | null = null;
  let completedRenewalCount = 0;

  const renewSession = () => {
    pendingRenewal ??= sendRequest({ method: 'POST', path: REFRESH_PATH })
      .then((refreshResponse) => refreshResponse.ok)
      .finally(() => {
        completedRenewalCount += 1;
        pendingRenewal = null;
      });
    return pendingRenewal;
  };

  const rejectUnauthorized = async (apiRequest: ApiRequest, unauthorizedResponse: Response) => {
    if (apiRequest.unauthorizedHandling === UnauthorizedHandling.RenewOrSignOut) {
      window.dispatchEvent(new Event(SIGNED_OUT_EVENT_NAME));
      throw new SignedOutError();
    }
    throw await toApiError(unauthorizedResponse);
  };

  const request = async <ResponseBody>(apiRequest: ApiRequest): Promise<ResponseBody> => {
    const renewalCountAtSend = completedRenewalCount;
    const firstResponse = await sendRequest(apiRequest);
    const shouldRenew =
      firstResponse.status === UNAUTHORIZED_STATUS &&
      apiRequest.unauthorizedHandling !== UnauthorizedHandling.Report;
    if (!shouldRenew) return readResponse<ResponseBody>(firstResponse);

    const hasRenewedSinceSend =
      pendingRenewal === null && completedRenewalCount > renewalCountAtSend;
    const isRenewed = hasRenewedSinceSend || (await renewSession());
    if (!isRenewed) return rejectUnauthorized(apiRequest, firstResponse);
    const retriedResponse = await sendRequest(apiRequest);
    if (retriedResponse.status === UNAUTHORIZED_STATUS) {
      return rejectUnauthorized(apiRequest, retriedResponse);
    }
    return readResponse<ResponseBody>(retriedResponse);
  };

  const unauthorizedHandlingFrom = (requestOptions?: ApiRequestOptions) =>
    requestOptions?.unauthorizedHandling ?? UnauthorizedHandling.RenewOrSignOut;

  return {
    get: <ResponseBody>(requestPath: string, requestOptions?: ApiRequestOptions) =>
      request<ResponseBody>({
        method: 'GET',
        path: requestPath,
        unauthorizedHandling: unauthorizedHandlingFrom(requestOptions),
      }),
    post: <ResponseBody>(
      requestPath: string,
      requestBody?: unknown,
      requestOptions?: ApiRequestOptions,
    ) =>
      request<ResponseBody>({
        method: 'POST',
        path: requestPath,
        body: requestBody,
        unauthorizedHandling: unauthorizedHandlingFrom(requestOptions),
      }),
    patch: <ResponseBody>(
      requestPath: string,
      requestBody: unknown,
      requestOptions?: ApiRequestOptions,
    ) =>
      request<ResponseBody>({
        method: 'PATCH',
        path: requestPath,
        body: requestBody,
        unauthorizedHandling: unauthorizedHandlingFrom(requestOptions),
      }),
    delete: <ResponseBody>(requestPath: string, requestOptions?: ApiRequestOptions) =>
      request<ResponseBody>({
        method: 'DELETE',
        path: requestPath,
        unauthorizedHandling: unauthorizedHandlingFrom(requestOptions),
      }),
  };
};

const apiClient = createApiClient();

export default apiClient;
