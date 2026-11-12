type OccurrenceScope = 'this' | 'following' | 'all';

type OccurrenceScopeAnswer = OccurrenceScope | 'cancel';

type OccurrenceScopeRequest = {
  action: 'change' | 'delete';
  eventTitle: string;
  isRepeatChange?: boolean;
};

export type { OccurrenceScope, OccurrenceScopeAnswer, OccurrenceScopeRequest };
