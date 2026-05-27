/**
 * Full-page error rendered when `openDaibxDb()` rejects.
 * Reaches the user when IndexedDB is unavailable — most commonly in browsers
 * that disable storage in private/incognito modes.
 */

export default function DbErrorScreen() {
  return (
    <main class="min-h-screen flex items-center justify-center px-4">
      <div class="max-w-md text-center bg-secondary-background border-2 border-border rounded-md shadow-brutal p-6">
        <p class="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-subtle-foreground">
          Storage error
        </p>
        <h1 class="mt-2 text-xl font-bold tracking-tight">IndexedDB unavailable</h1>
        <p class="mt-3 text-sm text-muted-foreground">
          DaiBX needs IndexedDB to store your tasks. Check your browser settings —
          private/incognito mode disables it on some browsers — and reload.
        </p>
      </div>
    </main>
  )
}
