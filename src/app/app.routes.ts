import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'import',
    loadChildren: () => import('@features/import/import.routes').then((m) => m.IMPORT_ROUTES),
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('@features/settings/settings.routes').then((m) => m.SETTINGS_ROUTES),
  },
  {
    path: '',
    loadChildren: () =>
      import('@features/workspace/workspace.routes').then((m) => m.WORKSPACE_ROUTES),
  },
];
