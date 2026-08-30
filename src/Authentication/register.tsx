import { FormEvent, useState } from 'react';
import { ArrowRight, FileText } from 'lucide-react';

interface RegisterProps {
  onRegister: (name: string, email: string, password: string) => Promise<void>;
  onSwitchToLogin: () => void;
  error: string | null;
}

export default function Register({ onRegister, onSwitchToLogin, error }: RegisterProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmation) { setValidationError('Passwords do not match.'); return; }
    setValidationError(null); setIsSubmitting(true);
    try { await onRegister(name, email, password); } finally { setIsSubmitting(false); }
  };

  return <AuthLayout eyebrow="Start reading smarter" title="Create your account"><form onSubmit={submit} className="space-y-4"><Field label="Name" type="text" value={name} onChange={setName} /><Field label="Email" type="email" value={email} onChange={setEmail} /><Field label="Password" type="password" value={password} onChange={setPassword} minLength={6} /><Field label="Confirm password" type="password" value={confirmation} onChange={setConfirmation} minLength={6} />{(validationError || error) && <p className="text-sm text-red-600">{validationError || error}</p>}<button disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? 'Creating account...' : 'Create account'}{!isSubmitting && <ArrowRight className="h-4 w-4" />}</button></form><p className="mt-6 text-center text-sm text-gray-500">Already have an account?{' '}<button type="button" onClick={onSwitchToLogin} className="font-semibold text-black hover:underline">Sign in</button></p></AuthLayout>;
}

function Field({ label, type, value, onChange, minLength }: { label: string; type: string; value: string; onChange: (value: string) => void; minLength?: number }) {
  return <label className="block text-sm font-medium text-gray-700">{label}<input required type={type} value={value} minLength={minLength} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10" /></label>;
}

export function AuthLayout({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center bg-[#f5f5f2] px-4 py-10"><section className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-7 shadow-xl shadow-black/5 sm:p-10"><div className="mb-8 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white"><FileText className="h-5 w-5" /></div><span className="text-lg font-bold tracking-tight">Reader AI</span></div><p className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">{eyebrow}</p><h1 className="mb-7 text-3xl font-bold tracking-tight text-black">{title}</h1>{children}</section></main>;
}
