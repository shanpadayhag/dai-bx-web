import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {
  LUCIDE_ICONS,
  LucideIconProvider,
  Bell,
  BellOff,
  BellRing,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Folder,
  FolderOpen,
  GripVertical,
  Music,
  Play,
  Plus,
  Settings,
  Square,
  Star,
  Trash2,
  Undo2,
  Upload,
  X,
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
        Bell,
        BellOff,
        BellRing,
        Check,
        ChevronDown,
        ChevronUp,
        Circle,
        Folder,
        FolderOpen,
        GripVertical,
        Music,
        Play,
        Plus,
        Settings,
        Square,
        Star,
        Trash2,
        Undo2,
        Upload,
        X,
      }),
    },
  ],
};
