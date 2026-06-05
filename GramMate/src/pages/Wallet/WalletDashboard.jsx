import { useState } from 'react';
import { ArrowUpRight, BadgeDollarSign, Clock, CreditCard, Download, ShieldCheck, Wallet } from 'lucide-react';
import { walletTransactions } from '../../data/platformData';

const breakdown = [
  { label: 'Creator earnings', value: '$18,240.40' },
  { label: 'Viewer rewards', value: '$184.12' },
  { label: 'Tips and donations', value: '$3,610.00' },
  { label: 'Campaign rewards', value: '$830.65' },
];

export default function WalletDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">Wallet</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-950">Earnings and withdrawals</h1>
          <p className="mt-3 max-w-2xl text-slate-600">Track available balance, pending clearing, payout methods, and all reward sources from a single ledger.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700">
          Withdraw funds
          <ArrowUpRight size={18} aria-hidden="true" />
        </button>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Available balance</p>
              <p className="mt-2 text-5xl font-bold tracking-normal text-slate-950">$22,865.17</p>
            </div>
            <div className="rounded-md bg-blue-50 p-3 text-blue-700">
              <Wallet size={24} aria-hidden="true" />
            </div>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ['Pending', '$3,420.80', Clock],
              ['Last payout', '$1,200.00', CreditCard],
              ['Risk holds', '$0.00', ShieldCheck],
            ].map(([label, value, Icon]) => (
              <div key={label} className="rounded-md bg-slate-50 p-4">
                <Icon size={18} className="text-slate-500" aria-hidden="true" />
                <p className="mt-3 text-sm text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-bold text-slate-950">{value}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-slate-950 p-6 text-white">
          <ShieldCheck size={24} className="text-green-400" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-bold">Withdrawal safeguards</h2>
          <p className="mt-3 leading-7 text-slate-300">Every withdrawal runs through account verification, fake view detection, campaign rule checks, and manual review when risk increases.</p>
          <div className="mt-6 grid gap-3">
            {['Stripe Connect ready', '48h clearing window', 'Audit trail on payout decisions'].map((item) => (
              <div key={item} className="rounded-md bg-white/10 p-3 text-sm font-semibold text-slate-100">{item}</div>
            ))}
          </div>
        </article>
      </section>

      <div className="mt-6 flex gap-2 border-b border-slate-200">
        {['overview', 'transactions', 'methods'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-3 text-sm font-bold capitalize ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500 hover:text-slate-900'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <section className="mt-6 grid gap-4 md:grid-cols-4">
          {breakdown.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-5">
              <BadgeDollarSign size={20} className="text-blue-600" aria-hidden="true" />
              <p className="mt-4 text-sm text-slate-500">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{item.value}</p>
            </div>
          ))}
        </section>
      )}

      {activeTab === 'transactions' && (
        <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-slate-200 p-4 text-sm font-bold text-slate-500">
            <span>Type</span><span>Amount</span><span>Status</span><span>Date</span>
          </div>
          {walletTransactions.map((tx) => (
            <div key={`${tx.type}-${tx.date}`} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-slate-100 p-4 text-sm last:border-b-0">
              <span className="font-semibold text-slate-900">{tx.type}</span>
              <span className="font-bold text-slate-950">{tx.amount}</span>
              <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700">{tx.status}</span>
              <span className="text-slate-500">{tx.date}</span>
            </div>
          ))}
        </section>
      )}

      {activeTab === 'methods' && (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-950">Payout methods</h2>
          <p className="mt-2 text-slate-600">Connect Stripe, verify identity, and download monthly tax-ready statements.</p>
          <button className="mt-6 inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-3 font-bold text-slate-900 hover:bg-slate-50">
            <Download size={18} aria-hidden="true" />
            Download statement
          </button>
        </section>
      )}
    </div>
  );
}
