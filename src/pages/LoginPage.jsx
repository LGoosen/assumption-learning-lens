import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Users, Building2, ShieldCheck } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import Button from '../components/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const DEMO_OPTIONS = [
  {
    role: 'student',
    title: 'Student',
    description: 'Give structured, respectful feedback about your learning.',
    icon: GraduationCap,
  },
  {
    role: 'staff',
    title: 'Staff',
    description: 'See class summaries and choose one shift to try next.',
    icon: Users,
  },
  {
    role: 'management',
    title: 'Management',
    description: 'View whole-school patterns and lead constructive action.',
    icon: Building2,
  },
];

export default function LoginPage() {
  const {
    user,
    loading,
    firebaseEnabled,
    signInWithGoogle,
    signInAsDemo,
    authError,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    }
  }, [loading, user, navigate, location.state]);

  const handleGoogle = async () => {
    setSubmitting(true);

    try {
      await signInWithGoogle();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = (role) => {
    signInAsDemo(role);
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl w-full mx-auto">
        <Logo />

        <a
          href="/privacy"
          className="text-sm text-navy-700 hover:text-navy-900 inline-flex items-center gap-1.5"
        >
          <ShieldCheck className="w-4 h-4" />
          Privacy
        </a>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-8 max-w-6xl w-full mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        <section className="lg:pt-10">
          <p className="inline-block text-xs uppercase tracking-[0.2em] text-gold-600 mb-3">
            Student voice · Staff reflection · Leadership insight
          </p>

          <h1 className="text-3xl sm:text-4xl font-serif text-navy-900 leading-tight">
            A calmer way to listen, reflect, and improve learning together.
          </h1>

          <p className="mt-4 text-stone-500 max-w-xl">
            Assumption Learning Lens helps students give honest, kind, and
            specific feedback; helps teachers see patterns and choose one
            small shift; and helps leaders support growth — without ranking
            or exposing anyone unfairly.
          </p>

          <ul className="mt-6 space-y-3 text-sm text-navy-800">
            <li className="flex items-start gap-2.5">
              <span
                className="mt-0.5 w-1.5 h-1.5 rounded-full bg-gold-500"
                aria-hidden="true"
              />
              Aggregated by default. No public ranking. No leaderboard.
            </li>

            <li className="flex items-start gap-2.5">
              <span
                className="mt-0.5 w-1.5 h-1.5 rounded-full bg-gold-500"
                aria-hidden="true"
              />
              AI summaries are drafts that always need a human review.
            </li>

            <li className="flex items-start gap-2.5">
              <span
                className="mt-0.5 w-1.5 h-1.5 rounded-full bg-gold-500"
                aria-hidden="true"
              />
              Comments are guided to be specific, kind, and learning-focused.
            </li>
          </ul>
        </section>

        <section className="card">
          <h2 className="text-xl font-semibold text-navy-900">Sign in</h2>

          <p className="text-sm text-stone-500 mt-1">
            Use your school Google account, or try a demo role.
          </p>

          <Button
            variant="primary"
            className="w-full mt-5"
            onClick={handleGoogle}
            disabled={submitting || !firebaseEnabled}
          >
            <GoogleIcon />
            {firebaseEnabled
              ? 'Continue with Google'
              : 'Google sign-in unavailable until Firebase is configured'}
          </Button>

          {authError && (
            <p
              role="alert"
              className="mt-3 text-sm text-navy-900 bg-gold-300/30 border border-gold-300 rounded-lg px-3 py-2"
            >
              {authError}
            </p>
          )}

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-stone-400">
            <span className="h-px flex-1 bg-stone-200" />
            <span>Or try a demo role</span>
            <span className="h-px flex-1 bg-stone-200" />
          </div>

          <div className="space-y-3">
            {DEMO_OPTIONS.map((opt) => {
              const Icon = opt.icon;

              return (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => handleDemo(opt.role)}
                  className="w-full text-left flex items-start gap-3 p-3.5 rounded-lg border border-stone-200 hover:border-navy-400 hover:bg-stone-50 transition-colors"
                >
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-navy-50 text-navy-700 shrink-0">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </span>

                  <span className="min-w-0">
                    <span className="block font-medium text-navy-900">
                      {opt.title}
                    </span>
                    <span className="block text-sm text-stone-500">
                      {opt.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-xs text-stone-400">
            By signing in you agree to use this tool respectfully and in line
            with the school&apos;s privacy expectations. Read the{' '}
            <a className="underline text-navy-700" href="/privacy">
              Privacy and Responsible Use
            </a>{' '}
            page.
          </p>
        </section>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" className="w-4 h-4" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.61z"
        fill="#fff"
      />
      <path
        d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.9v2.33A9 9 0 0 0 9 18z"
        fill="#fff"
        opacity=".7"
      />
      <path
        d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.9A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33z"
        fill="#fff"
        opacity=".5"
      />
      <path
        d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .9 4.95L3.97 7.28C4.68 5.16 6.66 3.58 9 3.58z"
        fill="#fff"
        opacity=".4"
      />
    </svg>
  );
}