import { createSignal } from 'solid-js'
import { Plus, Upload } from 'lucide-solid'
import Button from '~/components/Button'
import IconButton from '~/components/IconButton'
import Input from '~/components/Input'

/**
 * "Create a new group…" input + submit button, with an icon trigger to import
 * a group from JSON. Trims on submit, clears the field on success.
 */

interface Props {
  onSubmit: (name: string) => void | Promise<unknown>
  onImport: () => void
}

export default function GroupCreateInput(props: Props) {
  const [name, setName] = createSignal('')

  const handleSubmit = (event: Event): void => {
    event.preventDefault()
    const trimmed = name().trim()
    if (!trimmed) return
    void props.onSubmit(trimmed)
    setName('')
  }

  return (
    <form onSubmit={handleSubmit} class="mb-10 flex gap-2">
      <Input
        value={name()}
        onInput={(e) => setName(e.currentTarget.value)}
        name="groupName"
        placeholder="Create a new group…"
        class="h-11 flex-1 text-base"
      />
      <Button size="lg" type="submit" disabled={!name().trim()}>
        <Plus size={20} />
        New
      </Button>
      <IconButton
        type="button"
        size="icon"
        btnClass="h-11 w-11"
        aria-label="Import group from JSON"
        title="Import group from JSON"
        onClick={() => props.onImport()}
      >
        <Upload size={20} />
      </IconButton>
    </form>
  )
}
