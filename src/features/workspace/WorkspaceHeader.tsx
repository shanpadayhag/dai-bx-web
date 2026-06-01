import { Show } from 'solid-js'
import { ChevronsDownUp, Eye } from 'lucide-solid'
import { useWorkspace } from '~/state/workspaceContext'
import IconButton from '~/components/IconButton'
import { isVisibleToday } from '~/features/tasks/tree'

/**
 * Top-of-page header. Today's date (locale-formatted short weekday/month/day),
 * a "X groups · Y tasks" readout (only when groups exist), and the
 * manage-groups eye button (only when groups exist).
 */

const todayLabel = (): string =>
  new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

interface Props {
  onManage: () => void
}

export default function WorkspaceHeader(props: Props) {
  const ws = useWorkspace()

  const visibleGroupCount = (): number => ws.groups.visibleGroups().length

  const visibleTaskCount = (): number => {
    let count = 0
    for (const g of ws.groups.visibleGroups()) {
      for (const t of ws.tasks.tasksFor(g.id)) {
        if (isVisibleToday(t)) count++
      }
    }
    return count
  }

  /**
   * Collapses everything currently on screen: tasks/subtasks inside each open
   * visible group, then the visible groups themselves. Hidden groups and
   * date-hidden or already-collapsed-deeper items are left untouched.
   */
  const collapseAll = (): void => {
    for (const g of ws.groups.visibleGroups()) {
      if (g.isOpen) void ws.tasks.collapseVisible(g.id)
    }
    void ws.groups.collapseVisible()
  }

  return (
    <header class="mb-8 flex items-end justify-between gap-4">
      <div class="min-w-0 flex-1">
        <p class="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-subtle-foreground">
          Today
        </p>
        <h1 class="mt-2 text-4xl sm:text-5xl font-black tracking-tighter text-foreground leading-none">
          {todayLabel()}
        </h1>
        <Show when={ws.groups.state.loaded && ws.groups.hasGroups()}>
          <p class="mt-3 readout text-sm font-semibold text-muted-foreground">
            {visibleGroupCount()} {visibleGroupCount() === 1 ? 'group' : 'groups'}
            <span class="opacity-50 mx-1" aria-hidden="true">·</span>
            {visibleTaskCount()} {visibleTaskCount() === 1 ? 'task' : 'tasks'}
          </p>
        </Show>
      </div>
      <Show when={ws.groups.hasGroups()}>
        <div class="flex items-center gap-2">
          <IconButton
            onClick={collapseAll}
            title="Collapse all"
            aria-label="Collapse all groups, tasks, and subtasks"
          >
            <ChevronsDownUp size={20} />
          </IconButton>
          <IconButton
            onClick={props.onManage}
            title="Manage visible groups"
            aria-label="Manage visible groups"
          >
            <Eye size={20} />
          </IconButton>
        </div>
      </Show>
    </header>
  )
}
