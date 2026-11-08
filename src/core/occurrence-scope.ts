type OccurrenceScope = 'this' | 'following' | 'all';

type OccurrenceScopeAnswer = OccurrenceScope | 'cancel';

type OccurrenceScopeRequest = {
  action: 'change' | 'delete';
  eventTitle: string;
};

export type { OccurrenceScope, OccurrenceScopeAnswer, OccurrenceScopeRequest };
