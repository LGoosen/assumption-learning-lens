import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col items-center justify-center p-6 text-center">
      <Logo />
      <h1 className="mt-8 text-3xl font-serif text-navy-900">Page not found</h1>
      <p className="mt-2 text-stone-500">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary mt-6">
        Back to dashboard
      </Link>
    </div>
  );
}