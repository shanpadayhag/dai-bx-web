export type ApiProxySettings = { apiOrigin: string; originSecret: string };

export const readApiProxySettings = (): ApiProxySettings | null => {
  const apiOrigin = process.env.API_ORIGIN?.trim();
  if (!apiOrigin) return null;
  const originSecret = process.env.ORIGIN_SECRET?.trim();
  if (!originSecret) throw new Error('ORIGIN_SECRET must be set whenever API_ORIGIN is');
  return { apiOrigin, originSecret };
};
