import { type JSX, Show } from 'solid-js'
import { WorkspaceContextProvider, useWorkspace } from '~/state/workspaceContext'
import StatusStrip from '~/components/StatusStrip'
import DbErrorScreen from '~/components/DbErrorScreen'
import AlarmFiringModal from '~/features/alarms/AlarmFiringModal'
import TimerRunningBanner from '~/features/timers/TimerRunningBanner'

/**
 * Root layout. Mounted once by the router via `<Router root={App}>`; receives
 * the matched route's component as `props.children`. Provides the workspace
 * context and gates the entire surface on IndexedDB availability.
 *
 * Two global overlays are mounted here so they can appear over any route:
 *   - `AlarmFiringModal` — when the alarms scheduler reports a firing alarm.
 *   - `TimerRunningBanner` — when one or more timers need user attention
 *     (awaiting advance or completed).
 */

function Shell(props: { children?: JSX.Element }) {
  const ws = useWorkspace()
  return (
    <Show when={ws.dbError() == null} fallback={<DbErrorScreen />}>
      <StatusStrip />
      {props.children}
      <AlarmFiringModal />
      <TimerRunningBanner />
    </Show>
  )
}

export default function App(props: { children?: JSX.Element }) {
  return (
    <WorkspaceContextProvider>
      <Shell>{props.children}</Shell>
    </WorkspaceContextProvider>
  )
}
