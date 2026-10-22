const changelogDateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

const ChangelogDate = ({ date }: { date: string }) => (
  <time dateTime={date}>{changelogDateFormat.format(new Date(`${date}T00:00:00Z`))}</time>
);

export default ChangelogDate;
