import { Routes } from '@angular/router';

export const WORKSPACE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@features/workspace/feature/workspace-page/workspace-page.component').then(
        (m) => m.WorkspacePageComponent,
      ),
  },
];
