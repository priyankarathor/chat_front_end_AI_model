import { FormEvent, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { AuthLayout } from './register';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSwitchToRegister: () => void;
  error: string | null;
  notice?: string | null;
}

export default function Login({ onLogin, onSwitchToRegister, error, notice }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setIsSubmitting(true); try { await onLogin(email, password); } finally { setIsSubmitting(false); } };
  return <AuthLayout eyebrow="Welcome back" title="Sign in to Reader AI"><form onSubmit={submit} className="space-y-4"><label className="block text-sm font-medium text-gray-700">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10" /></label><label className="block text-sm font-medium text-gray-700">Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10" /></label>{notice && !error && <p className="text-sm text-green-700">{notice}</p>}{error && <p className="text-sm text-red-600">{error}</p>}<button disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? 'Signing in...' : 'Sign in'}{!isSubmitting && <ArrowRight className="h-4 w-4" />}</button></form><p className="mt-6 text-center text-sm text-gray-500">New here?{' '}<button type="button" onClick={onSwitchToRegister} className="font-semibold text-black hover:underline">Create an account</button></p></AuthLayout>;
}
