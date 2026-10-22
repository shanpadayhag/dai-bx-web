type AgendaItem = {
  id: string;
  timeLabel: string;
  title: string;
  kind: 'tracked' | 'running' | 'planned';
};

export default AgendaItem;
