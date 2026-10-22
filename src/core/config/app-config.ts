const readApiBaseUrl = (): string => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:9000';
  return apiBaseUrl.replace(/\/$/, '');
};

const appConfig = {
  apiBaseUrl: readApiBaseUrl(),
  productName: 'DaiBX',
  repositoryUrl: 'https://github.com/shanpadayhag/dai-bx-web',
} as const;

export default appConfig;
