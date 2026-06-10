import Card from '../../components/ui/Card';
import SectionHeader from '../../components/ui/SectionHeader';

const cards = [
  { title: 'Viral creator stories', description: 'Curated short-form videos that drive the highest engagement and reward momentum.' },
  { title: 'Studio trends', description: 'Latest creator studio insights so you can optimize upload strategy.' },
  { title: 'Community highlights', description: 'Top conversations, moderation updates, and support milestones.' },
];

export default function FeedPage() {
  return (
    <div className="space-y-8">
      <SectionHeader title="Feed" subtitle="Content, creator stories, and audience pulse." />
      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title} title={card.title} description={card.description} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="border-slate-200 bg-slate-50">
            <p className="mb-4 text-sm text-slate-500">Featured creator</p>
            <h3 className="text-xl font-semibold text-slate-950">Creator spotlight #{index + 1}</h3>
            <p className="mt-3 text-sm text-slate-600">Discover new creator growth tactics and engagement experiments from the community.</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
