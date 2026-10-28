import { Settings2, Trash2 } from 'lucide-react';
import { categoryColorStyle, type Category } from '@/core/category';
import Button from '@/core/components/atoms/button';
import Input from '@/core/components/atoms/input';
import Field from '@/core/components/molecules/field';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import TaskGroup from '@/features/tasks/entities/task-group';

type GroupSettingsDialogProps = {
  taskGroup: TaskGroup;
  categories: Category[];
};

const categoryOptionClassName =
  'inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-border px-2.5 text-[13px] font-medium text-foreground transition-colors duration-150 hover:border-border-strong has-checked:border-primary has-checked:bg-primary-soft/60 has-focus-visible:ring-4 has-focus-visible:ring-primary/15';

const GroupSettingsDialog = ({ taskGroup, categories }: GroupSettingsDialogProps) => (
  <PopoverPanel id="group-settings-dialog" label="Group settings">
    <form className="grid gap-5 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
          <Settings2 className="size-5" />
        </span>
        <div className="grid gap-1">
          <h2 className="text-base font-semibold text-foreground">Group settings</h2>
          <p className="text-sm text-muted-foreground">
            Rename the group or give it a category color.
          </p>
        </div>
      </div>
      <Field label="Name" htmlFor="group-settings-name">
        <Input id="group-settings-name" defaultValue={taskGroup.name} maxLength={200} />
      </Field>
      <fieldset className="grid gap-2">
        <legend className="mb-1.5 text-[13px] font-medium text-foreground">Category</legend>
        <div className="flex flex-wrap gap-2">
          <label className={categoryOptionClassName}>
            <input
              type="radio"
              name="group-category"
              value=""
              defaultChecked={taskGroup.category === null}
              className="sr-only"
            />
            <span className="size-2 rounded-full border border-border-strong" />
            No category
          </label>
          {categories.map((category) => (
            <label
              key={category.id}
              style={categoryColorStyle(category)}
              className={categoryOptionClassName}
            >
              <input
                type="radio"
                name="group-category"
                value={category.id}
                defaultChecked={taskGroup.category?.id === category.id}
                className="sr-only"
              />
              <span className="category-swatch size-2 rounded-full" />
              {category.name}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <Button
          variant="ghost"
          popoverTarget="delete-group-dialog"
          className="-ml-2 text-danger hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 />
          Delete group
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" popoverTarget="group-settings-dialog" popoverTargetAction="hide">
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </div>
    </form>
  </PopoverPanel>
);

export default GroupSettingsDialog;
