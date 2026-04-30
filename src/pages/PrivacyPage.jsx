import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import Card from '../components/Card.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function PrivacyPage() {
  const { user } = useAuth();
  const backHref = !user
    ? '/login'
    : user.role === 'student'
    ? '/student/dashboard'
    : user.role === 'staff'
    ? '/staff/dashboard'
    : '/management/dashboard';

  return (
    <div className="min-h-screen bg-ivory-50">
      <header className="px-6 py-5 max-w-4xl mx-auto flex items-center justify-between">
        <Logo />
        <Link to={backHref} className="text-sm text-navy-700 hover:text-navy-900 inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </header>

      <main className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <p className="inline-block text-xs uppercase tracking-[0.2em] text-gold-600 mb-2">
            Trust by design
          </p>
          <h1 className="text-3xl font-serif text-navy-900">Privacy and Responsible Use</h1>
          <p className="mt-2 text-stone-500">
            How Assumption Learning Lens handles student voice, fairly and carefully.
          </p>
        </div>

        <div className="space-y-5">
          <Card title="What this tool is for" icon={ShieldCheck}>
            <ul className="space-y-2 text-navy-800">
              <li>Feedback is collected to improve learning, not to judge people.</li>
              <li>It is not a popularity contest, leaderboard, or ranking tool.</li>
              <li>Student voice should be honest, specific, kind, and respectful.</li>
              <li>Teachers are professionals; feedback is used to support growth.</li>
              <li>Management interprets data carefully and contextually.</li>
            </ul>
          </Card>

          <Card title="Privacy promises">
            <ul className="space-y-2 text-navy-800">
              <li>Feedback summaries are aggregated by default; raw comments are not exposed broadly.</li>
              <li>The app collects only what is needed: name, email, role, grade, and subject(s).</li>
              <li>Student feedback to staff is anonymous unless explicitly configured otherwise.</li>
              <li>Submissions are stored to your school's Firebase project and protected by role-based rules.</li>
              <li>You can ask the school administrator to view, correct, or remove your data.</li>
            </ul>
          </Card>

          <Card title="How AI summaries are used">
            <p className="text-navy-800 mb-2">
              The system can generate draft summaries from student feedback to help teachers reflect.
              These are <strong>suggestions, not verdicts</strong>. Every summary is reviewed by a person
              before it influences any decision.
            </p>
            <ul className="space-y-2 text-navy-800">
              <li>AI is asked to focus on patterns, not isolated comments.</li>
              <li>AI is told not to rank or blame, and to flag low sample sizes.</li>
              <li>No AI keys are exposed to your browser; AI calls happen server-side.</li>
            </ul>
          </Card>

          <Card title="Comment guardrails">
            <p className="text-navy-800">
              When students write a comment, the app helps them keep it specific, kind, and learning-focused.
              Comments that read as personal attacks, profanity, or shouting will be flagged and the student
              will be asked to rewrite them. This is a first pass; final review is human.
            </p>
          </Card>

          <Card title="Data retention">
            <p className="text-navy-800">
              Feedback cycles are retained for the academic year and reviewed at year-end.
              Aggregated reports may be retained longer for trend analysis. Individual raw responses
              should not be retained beyond their useful life.
            </p>
          </Card>

          <Card title="POPIA-style alignment">
            <p className="text-navy-800">
              This tool is designed in line with POPIA-style expectations: lawful purpose, minimal
              data, role-based access, learner protection, and accountability for human review of
              automated outputs.
            </p>
          </Card>
        </div>

        <p className="mt-8 text-xs text-stone-400">
          Have a question or concern about your data? Speak to your school's privacy contact.
        </p>
      </main>
    </div>
  );
}