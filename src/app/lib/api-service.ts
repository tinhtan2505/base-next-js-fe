const domain = process.env.NEXT_PUBLIC_API_BASE_URL;

export function post(
  urlSlug: string,
  data: unknown,
  controller?: AbortController
) {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  console.log('data', data);

  const requestOptions: RequestInit = {
    method: 'POST',
    headers: new Headers(headers),
    body: JSON.stringify(data),
    signal: controller?.signal,
  };

  return fetch(domain + urlSlug, requestOptions);
}
