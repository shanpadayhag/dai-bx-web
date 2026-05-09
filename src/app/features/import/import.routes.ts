import { Routes } from '@angular/router';

export const IMPORT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@features/import/feature/import-page/import-page.component').then(
        (m) => m.ImportPageComponent,
      ),
  },
];
