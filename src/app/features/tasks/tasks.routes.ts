import { Routes } from '@angular/router';

export const TASKS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@features/tasks/feature/tasks-page/tasks-page.component').then(
        (m) => m.TasksPageComponent,
      ),
  },
];
