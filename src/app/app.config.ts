import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {
  LUCIDE_ICONS,
  LucideIconProvider,
  Check,
  ChevronDown,
  Circle,
  Folder,
  FolderOpen,
  GripVertical,
  Plus,
  Trash2,
  Undo2,
} from 'lucide-angular';

import { routes } from '@app/app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Check,
        ChevronDown,
        Circle,
        Folder,
        FolderOpen,
        GripVertical,
        Plus,
        Trash2,
        Undo2,
      }),
    },
  ],
};
