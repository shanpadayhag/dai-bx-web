import Button from '@/core/components/atoms/button';
import Input from '@/core/components/atoms/input';
import Switch from '@/core/components/atoms/switch';
import Field from '@/core/components/molecules/field';
import PageHeader from '@/core/components/molecules/page-header';
import SegmentedControl from '@/core/components/molecules/segmented-control';
import AccentPicker from '@/features/settings/components/accent-picker';
import SettingRow from '@/features/settings/components/setting-row';
import SettingsSection from '@/features/settings/components/settings-section';

const SettingsPage = () => (
  <div className="mx-auto grid max-w-4xl gap-8">
    <PageHeader
      title="Settings"
      description="Your profile, how DaiBX looks, and how it tracks time."
    />
    <div className="rounded-2xl border border-border bg-background px-5 py-8 shadow-soft sm:px-8">
      <SettingsSection title="Profile" description="Shown on your workspace and in shared boards.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="profile-name">
            <Input id="profile-name" defaultValue="Shan Padayhag" />
          </Field>
          <Field label="Email" htmlFor="profile-email">
            <Input id="profile-email" type="email" defaultValue="you@example.com" />
          </Field>
        </div>
      </SettingsSection>
      <SettingsSection
        title="Appearance"
        description="Blue is the default. The accent colors buttons, selection and tracked events."
      >
        <AccentPicker />
        <SettingRow
          title="Mode"
          description="System follows your device."
          control={
            <SegmentedControl
              label="Color mode"
              options={['System', 'Light', 'Dark']}
              selectedOption="System"
            />
          }
        />
      </SettingsSection>
      <SettingsSection
        title="Time tracking"
        description="Starting a task creates a calendar event. Finishing it sets the end."
      >
        <SettingRow
          title="Check in on running tasks"
          description="A notification asks if you’re still on it once a task passes its estimate."
          control={<Switch isOn label="Check in on running tasks" />}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Check in every"
            htmlFor="check-in-interval"
            hint="After the first check-in, this repeats until you finish."
          >
            <Input id="check-in-interval" defaultValue="30 min" className="font-mono" />
          </Field>
          <Field
            label="First check-in with no estimate"
            htmlFor="first-check-in"
            hint="Used when a task has no estimate."
          >
            <Input id="first-check-in" defaultValue="30 min" className="font-mono" />
          </Field>
        </div>
        <SettingRow
          title="Suggest my last check-in as the end"
          description="When a check-in went unanswered, finishing suggests the last time you confirmed."
          control={<Switch isOn label="Suggest my last check-in as the end" />}
        />
      </SettingsSection>
      <SettingsSection
        title="Working hours"
        description="The calendar opens on these hours and the planner fills them first."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Day starts" htmlFor="day-starts">
            <Input id="day-starts" type="time" defaultValue="16:00" />
          </Field>
          <Field label="Day ends" htmlFor="day-ends" hint="Past midnight counts as the same day.">
            <Input id="day-ends" type="time" defaultValue="02:00" />
          </Field>
        </div>
      </SettingsSection>
      <SettingsSection
        title="Account"
        description="Sign out here, or remove the account and everything in it."
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary">Sign out</Button>
          <Button variant="ghost" className="text-danger hover:bg-danger-soft hover:text-danger">
            Delete account
          </Button>
        </div>
      </SettingsSection>
    </div>
  </div>
);

export default SettingsPage;
