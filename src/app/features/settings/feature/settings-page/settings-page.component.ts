import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import { BytesPipe } from '@shared/ui/bytes/bytes.pipe';
import { CardComponent } from '@shared/ui/card/card.component';
import { PluralPipe } from '@shared/ui/plural/plural.pipe';
import { primeAudio, playSoundBlob, stopAlarm } from '@features/alarms/data-access/alarm-sound';
import { SoundsState } from '@features/sounds/data-access/sounds.state';

@Component({
  selector: 'app-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule, ButtonDirective, BytesPipe, CardComponent, PluralPipe],
  templateUrl: './settings-page.component.html',
})
export class SettingsPageComponent {
  protected readonly state = inject(SoundsState);

  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly playingId = signal<string | null>(null);
  protected readonly busy = signal(false);

  protected readonly sounds = this.state.sounds;
  protected readonly defaultSoundId = this.state.defaultSoundId;

  protected readonly hasSounds = computed(() => this.sounds().length > 0);

  protected onUploadClick(): void {
    this.fileInput()?.nativeElement.click();
  }

  protected async onFileChange(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files ?? []);
    target.value = '';
    if (files.length === 0 || this.busy()) return;
    this.busy.set(true);
    try {
      for (const file of files) {
        if (!file.type.startsWith('audio/')) continue;
        await this.state.addSound(file);
      }
    } finally {
      this.busy.set(false);
    }
  }

  protected async onPreview(soundId: string): Promise<void> {
    if (this.playingId() === soundId) {
      stopAlarm();
      this.playingId.set(null);
      return;
    }
    await primeAudio();
    const blob = await this.state.getBlob(soundId);
    if (!blob) return;
    playSoundBlob(blob, { loop: false });
    this.playingId.set(soundId);
  }

  protected async onSetDefault(soundId: string): Promise<void> {
    const next = this.defaultSoundId() === soundId ? null : soundId;
    await this.state.setDefault(next);
  }

  protected async onDelete(soundId: string): Promise<void> {
    if (this.playingId() === soundId) {
      stopAlarm();
      this.playingId.set(null);
    }
    await this.state.removeSound(soundId);
  }
}
