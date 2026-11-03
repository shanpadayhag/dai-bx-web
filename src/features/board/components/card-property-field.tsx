import { ChevronDown } from 'lucide-react';
import Input from '@/core/components/atoms/input';
import type BoardProperty from '@/features/board/entities/board-property';
import type CardPropertyValue from '@/features/board/entities/card-property-value';
import BoardPropertyKind from '@/features/board/enums/board-property-kind';

type CardPropertyFieldProps = {
  property: BoardProperty;
  value: CardPropertyValue | undefined;
  onEnterValue: (propertyId: string, enteredValue: string) => boolean;
};

const readValueText = (value: CardPropertyValue | undefined): string => {
  if (value === undefined) return '';
  if ('optionId' in value) return value.optionId;
  if ('text' in value) return value.text;
  return value.number;
};

const CardPropertyField = ({ property, value, onEnterValue }: CardPropertyFieldProps) => {
  const fieldId = `card-property-${property.id}`;
  const valueText = readValueText(value);

  return (
    <div className="grid gap-1.5 sm:grid-cols-[minmax(0,7rem)_minmax(0,1fr)] sm:items-center sm:gap-3">
      <label htmlFor={fieldId} className="truncate text-[13px] text-muted-foreground">
        {property.name}
      </label>
      {property.kind === BoardPropertyKind.Choice ? (
        <span className="relative">
          <select
            id={fieldId}
            value={valueText}
            onChange={(changeEvent) => onEnterValue(property.id, changeEvent.currentTarget.value)}
            className="h-9 w-full appearance-none rounded-[10px] border border-border-strong bg-background pr-8 pl-3 text-sm text-foreground shadow-soft transition-[border-color,box-shadow] duration-150 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none"
          >
            <option value="">Not set</option>
            {property.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        </span>
      ) : (
        <Input
          key={valueText}
          id={fieldId}
          defaultValue={valueText}
          placeholder="Not set"
          inputMode={property.kind === BoardPropertyKind.Number ? 'decimal' : undefined}
          maxLength={property.kind === BoardPropertyKind.Text ? 500 : 23}
          onKeyDown={(keyEvent) => {
            if (keyEvent.key === 'Enter') {
              keyEvent.preventDefault();
              keyEvent.currentTarget.blur();
            }
            if (keyEvent.key === 'Escape') {
              keyEvent.preventDefault();
              keyEvent.currentTarget.value = valueText;
              keyEvent.currentTarget.blur();
            }
          }}
          onBlur={(blurEvent) => {
            const enteredValue = blurEvent.currentTarget.value;
            if (enteredValue.trim() === valueText) return;
            if (!onEnterValue(property.id, enteredValue)) {
              blurEvent.currentTarget.value = valueText;
            }
          }}
          className="h-9 tabular-nums"
        />
      )}
    </div>
  );
};

export default CardPropertyField;
