import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Sparkles, ClipboardCheck, Printer } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import Card from '../components/Card.jsx';
import { AI_SUMMARY_SYSTEM_PROMPT } from '../utils/constants.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AiWorkflowGuidePage() {
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
      <header className="px-6 py-5 max-w-4xl mx-auto flex items-center justify-between no-print">
        <Logo />
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.print()}
            className="text-sm text-navy-700 hover:text-navy-900 inline-flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <Link to={backHref} className="text-sm text-navy-700 hover:text-navy-900 inline-flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <p className="inline-block text-xs uppercase tracking-[0.2em] text-gold-600 mb-2">
            Manual AI workflow
          </p>
          <h1 className="text-3xl font-serif text-navy-900">How to use AI to draft summaries — safely</h1>
          <p className="mt-2 text-stone-500">
            For management at Assumption. A short, careful workflow that keeps student data
            under your control.
          </p>
        </div>

        <div className="space-y-5">
          <Card title="Why this workflow exists" icon={ShieldCheck}>
            <p className="text-navy-800">
              We don't send student data to an AI service automatically. Management decides what
              to share, with which tool, and what to publish. This makes Learning Lens safer to
              run, simpler to explain to parents, and aligned with POPIA expectations.
            </p>
          </Card>

          <Card title="One-time setup (15 minutes)" icon={Sparkles}>
            <ol className="list-decimal list-inside space-y-2 text-navy-800">
              <li>
                Choose your tool. <strong>NotebookLM</strong> (notebooklm.google.com) is recommended
                because answers stay grounded in the data you give it. A custom <strong>Gemini Gem</strong>
                is a good alternative.
              </li>
              <li>
                Create a notebook called <em>"Learning Lens summariser"</em>.
              </li>
              <li>
                Add a single source document containing the system instructions below. Name the
                source <em>"System instructions"</em>.
              </li>
            </ol>

            <div className="mt-4">
              <p className="text-xs uppercase tracking-wider text-stone-400 mb-1">
                System instructions to add to your notebook or Gem
              </p>
              <pre className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm text-navy-900 whitespace-pre-wrap">
{AI_SUMMARY_SYSTEM_PROMPT}
              </pre>
            </div>
          </Card>

          <Card title="Each cycle — the steps" icon={ClipboardCheck}>
            <ol className="list-decimal list-inside space-y-2 text-navy-800">
              <li>
                In Learning Lens, open <strong>Reviewed Summaries</strong> (under Management).
              </li>
              <li>
                Pick the cycle and a class. Click <strong>Copy data for AI tool</strong>.
              </li>
              <li>
                Open your NotebookLM notebook or Gemini Gem and paste the copied block as a new
                question or chat.
              </li>
              <li>
                Read the draft carefully. Check it does not name individuals, does not over-claim
                from a small sample, and stays focused on patterns.
              </li>
              <li>
                Edit it down to three short sections: <em>Strengths</em>, <em>Growth areas</em>,
                <em> Three small shifts</em>.
              </li>
              <li>
                Paste each section into the corresponding box in Learning Lens.
              </li>
              <li>
                Tick <strong>I have reviewed this</strong> and save. The teacher will see it
                clearly labelled as reviewed by management.
              </li>
            </ol>
          </Card>

          <Card title="Things to remove if the AI suggests them">
            <ul className="space-y-2 text-navy-800">
              <li>· Any student's first name, even if it appears in a quote.</li>
              <li>· Any specific incident that could identify someone.</li>
              <li>· Any ranking, scoring, or pass/fail language about staff.</li>
              <li>· Any prediction about a teacher's future performance.</li>
              <li>· Any claim that's based on only one or two responses.</li>
              <li>· Anything that reads as personal rather than learning-focused.</li>
            </ul>
          </Card>

          <Card title="What's safe to keep">
            <ul className="space-y-2 text-navy-800">
              <li>· Patterns named in plain language ("several learners want clearer goals").</li>
              <li>· Specific, doable shifts ("front-load Friday lessons with a 3-minute recap").</li>
              <li>· Strengths described as a class-level pattern.</li>
              <li>· Cautions about small sample sizes.</li>
            </ul>
          </Card>

          <Card title="If something feels off" icon={ShieldCheck}>
            <p className="text-navy-800">
              Trust your instinct. If a draft makes anyone sound singled out, blamed, or judged —
              don't save it. Rewrite it, ask the AI to rewrite it more gently, or skip the
              published summary for that class and have a conversation with the staff member
              directly instead. The tool is here to support professional growth, not to replace it.
            </p>
          </Card>
        </div>

        <p className="mt-8 text-xs text-stone-400">
          Reviewed summaries can be edited later. Past student submissions are never affected by
          changes made here.
        </p>
      </main>
    </div>
  );
}