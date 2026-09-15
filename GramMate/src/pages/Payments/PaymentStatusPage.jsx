import { Link, useSearchParams } from 'react-router-dom';
import { Clock3, ShieldCheck } from 'lucide-react';

export default function PaymentStatusPage() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-4 py-10">
      <section className="gm-card w-full p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
          <Clock3 size={28} aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-[var(--gm-text)]">Payment verification in progress</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--gm-text-secondary)]">Your payment is being verified by the payment provider. Premium access will appear only after GramMate receives and verifies the provider event.</p>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-success"><ShieldCheck size={16} /> No access is granted from the redirect alone.</div>
        {sessionId && <p className="mt-4 break-all text-[10px] text-[var(--gm-text-tertiary)]">Checkout session: {sessionId}</p>}
        <Link to="/" className="gm-btn-secondary mt-8 inline-flex px-5 py-2.5">Return to GramMate</Link>
      </section>
    </div>
  );
}
