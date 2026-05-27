/**
 * Augments Solid's JSX namespace with the `attr:*` keys we actually use.
 *
 * Solid ships `ExplicitAttributes` as an empty interface so projects can
 * declare which `attr:foo={...}` bindings are valid. We use `attr:value` on
 * the TimeSpinner inputs to force HTML-attribute (vs DOM property) semantics
 * — without that, Solid's default property binding overwrites the user's
 * in-flight typing every keystroke and the `maxLength=2` then blocks the
 * second digit. See `features/alarms/TimeSpinner.tsx`.
 */

import 'solid-js'

declare module 'solid-js' {
  namespace JSX {
    interface ExplicitAttributes {
      value: string
    }
  }
}
