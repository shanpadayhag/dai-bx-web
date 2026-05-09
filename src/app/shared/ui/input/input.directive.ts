import { Directive } from '@angular/core';

const BASE =
  'flex h-10 w-full rounded-md border-2 border-border bg-secondary-background px-3 py-2 text-sm font-medium text-foreground placeholder:text-subtle-foreground placeholder:font-normal shadow-brutal-sm transition-shadow focus-visible:shadow-brutal disabled:cursor-not-allowed disabled:opacity-50';

@Directive({
  selector: 'input[appInput]',
  host: {
    class: BASE,
    autocomplete: 'off',
    autocorrect: 'off',
    autocapitalize: 'off',
    spellcheck: 'false',
  },
})
export class InputDirective {}
