const LINK_TOKEN_PARAMETER = 'token';

export const readEmailLinkToken = (linkLocation: Pick<Location, 'hash' | 'search'>) =>
  new URLSearchParams(linkLocation.hash.slice(1)).get(LINK_TOKEN_PARAMETER) ??
  new URLSearchParams(linkLocation.search).get(LINK_TOKEN_PARAMETER);

export const removeEmailLinkTokenFromAddress = () => {
  window.history.replaceState(window.history.state, '', window.location.pathname);
};
