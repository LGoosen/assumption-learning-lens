import { Link } from 'react-router-dom';
import { MessageSquareHeart, NotebookPen, ShieldCheck, Sparkles } from 'lucide-react';
import Card from '../../components/Card.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { FEEDBACK_CYCLES } from '../../data/mockData.js';

export default function StudentDashboard() {
  const { user } = useAuth();
  const openCycle = FEEDBACK_CYCLES.find((c) => c.status === 'open');

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-gold-600">Welcome back</p>
        <h1 className="text-2xl sm:text-3xl font-serif text-navy-900 mt-1">
          Hi {user?.displayName?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-stone-500 mt-1">
          Your reflections help your teachers and the school listen and improve.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        <Card
          title={openCycle ? openCycle.title : 'No open feedback cycle'}
          subtitle={openCycle ? `Open until ${openCycle.endDate}` : 'Check back soon'}
          icon={MessageSquareHeart}
        >
          <p className="text-stone-600 mb-4">
            {openCycle
              ? openCycle.description
              : 'There is no active reflection cycle right now. We\'ll let you know when the next one opens.'}
          </p>
          {openCycle && (
            <Link to="/student/feedback" className="btn-primary">
              Give feedback
            </Link>
          )}
        </Card>

        <Card
          title="Why this matters"
          icon={Sparkles}
        >
          <ul className="space-y-2 text-navy-800 text-sm">
            <li>Be honest, kind, specific, and respectful.</li>
            <li>Focus on the learning, not on the person.</li>
            <li>Your feedback is summarised for teachers — never shown as a ranking.</li>
          </ul>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="My reflections" icon={NotebookPen}>
          <p className="text-stone-500 text-sm mb-4">
            See the reflections you've already submitted in past cycles.
          </p>
          <Link to="/student/reflections" className="btn-secondary">
            View my reflections
          </Link>
        </Card>

        <Card title="Privacy" icon={ShieldCheck}>
          <p className="text-stone-500 text-sm mb-4">
            How your voice is used — and how it's protected.
          </p>
          <Link to="/privacy" className="btn-secondary">
            Read privacy notice
          </Link>
        </Card>
      </div>
    </div>
  );
}