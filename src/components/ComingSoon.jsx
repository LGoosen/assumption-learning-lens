import { Sparkles } from 'lucide-react';
import Card from './Card.jsx';

export default function ComingSoon({ title, phase }) {
  return (
    <div className="max-w-2xl mx-auto mt-8">
      <Card title={title} subtitle={phase ? `Built in ${phase}` : 'Coming soon'} icon={Sparkles}>
        <p className="text-stone-500">
          This page is part of Version 1 and will be filled in shortly.
          The route, navigation, and access control are already in place.
        </p>
      </Card>
    </div>
  );
}