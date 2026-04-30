import { Link, useLocation, Navigate } from 'react-router-dom';
import { CheckCircle2, NotebookPen, LayoutDashboard, ShieldCheck } from 'lucide-react';
import Card from '../../components/Card.jsx';

export default function StudentSubmissionConfirmation() {
  const location = useLocation();
  const state = location.state;

  // Direct visits without a fresh submission go back to the dashboard.
  if (!state?.submissionId) {
    return <Navigate to="/student/dashboard" replace />;
  }

  const { subject, cycleTitle } = state;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-14 h-14 rounded-full bg-gold-300/30 text-gold-600 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-serif text-navy-900">Thank you for reflecting.</h1>
          <p className="mt-2 text-stone-600 max-w-md">
            Your feedback for <strong>{subject}</strong>
            {cycleTitle ? <> in <strong>{cycleTitle}</strong></> : null} has been saved.
            It will be summarised carefully and reviewed by a person before any decisions are made.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-2">
            <Link to="/student/dashboard" className="btn-secondary">
              <LayoutDashboard className="w-4 h-4" />
              Back to dashboard
            </Link>
            <Link to="/student/reflections" className="btn-primary">
              <NotebookPen className="w-4 h-4" />
              View my reflections
            </Link>
          </div>
        </div>
      </Card>

      <Card title="What happens with my reflection?" icon={ShieldCheck}>
        <ul className="space-y-2 text-navy-800 text-sm">
          <li>· It is grouped with reflections from other students for the same subject and cycle.</li>
          <li>· A draft summary may be generated to help your teacher see patterns.</li>
          <li>· A staff member reads the summary and decides one small thing to try next.</li>
          <li>· No reflection is shared as a ranking or used to embarrass anyone.</li>
        </ul>
      </Card>
    </div>
  );
}