import { Pipe, PipeTransform } from '@angular/core';
import { formatBytes } from '@shared/utils/bytes';

@Pipe({ name: 'bytes' })
export class BytesPipe implements PipeTransform {
  transform(value: number): string {
    return formatBytes(value);
  }
}
