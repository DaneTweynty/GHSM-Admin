import React, { useMemo, useState } from 'react';
import ThemedSelect from './ThemedSelect';
import { control } from './ui';
import type { Billing, Student, PaymentMethod } from '../types';
import { Card } from './Card';
import { ICONS } from '../constants';
import { useApp } from '../context/AppContext';
import type { BillingItem } from '../types';
import { InvoicePreviewModal } from './InvoicePreviewModal';

interface BillingListProps {
  billings: Billing[];
  students: Student[];
  onMarkAsPaid: (billingId: string) => void;
  onRecordPayment?: (billingId: string, payment: { amount: number; method: PaymentMethod; reference?: string; note?: string; overpayHandling?: 'next' | 'hold' }) => void;
}

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

const Avatar: React.FC<{ student?: Student }> = ({ student }) => {
    if (!student) return null;
    if (student.profilePictureUrl) {
        return <img src={student.profilePictureUrl} alt={student.name} className="h-9 w-9 rounded-full object-cover shrink-0" />;
    }
    const initials = getInitials(student.name);
    const colorIndex = (student.name.charCodeAt(0) || 0) % 6;
    const colors = ['bg-red-200', 'bg-blue-200', 'bg-green-200', 'bg-yellow-200', 'bg-purple-200', 'bg-pink-200'];
    const textColors = ['text-red-800', 'text-blue-800', 'text-green-800', 'text-yellow-800', 'text-purple-800', 'text-pink-800'];
    return (
        <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${colors[colorIndex]} ${textColors[colorIndex]}`}>
            <span className="text-xs font-bold">{initials}</span>
        </div>
    );
};


export const BillingList: React.FC<BillingListProps> = ({ billings, students, onMarkAsPaid, onRecordPayment }) => {
  const { handleUpdateBilling, handleRecordPayment } = useApp();
  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const [breakdownBill, setBreakdownBill] = useState<Billing | null>(null);

  const formatPHP = (amount: number) => `PHP ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const openPrintableInvoice = (bill: Billing) => {
    const student = studentMap.get(bill.studentId);
    const items: BillingItem[] = bill.items && bill.items.length > 0
      ? bill.items
      : [{ id: `item-base-${bill.id}` , description: 'Tuition Fee', quantity: 1, unitAmount: bill.amount }];
    const subtotal = items.reduce((s, it) => s + (Number(it.quantity)||0) * (Number(it.unitAmount)||0), 0);
    const issued = new Date(bill.dateIssued);
    const dateStr = issued.toLocaleDateString();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${bill.id} - ${bill.studentName}</title>
  <style>
    :root { --brand:#1e40af; --muted:#6b7280; --border:#e5e7eb; --accent:#ef4444; }
    * { box-sizing: border-box; }
    body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; color:#111827; margin:0; background:#f8fafc; }
    .page { width: 820px; margin: 24px auto; background:#fff; padding:32px 36px; border:1px solid var(--border); border-radius:12px; }
    .header { display:flex; align-items:center; justify-content:space-between; gap:16px; }
    .logo-box { display:flex; align-items:center; gap:12px; }
    .logo { width:220px; height:64px; border:1px dashed var(--border); border-radius:8px; display:flex; align-items:center; justify-content:center; color:var(--muted); font-weight:600; }
    .badge { width:64px; height:64px; border:1px dashed var(--border); border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--muted); font-size:12px; }
    h1 { margin:0; font-size:28px; color:#0f172a; letter-spacing:1px; }
    .meta { margin-top:12px; display:grid; grid-template-columns: 1fr 1fr; gap:8px; }
    .meta-row { display:flex; align-items:center; justify-content:space-between; color:#111827; font-size:14px; }
    .meta-row span.label { color:var(--muted); }
    .due { margin-top:8px; font-size:16px; }
    .due strong { color:var(--accent); font-size:18px; }
    .section { margin-top:24px; }
    .table { width:100%; border-collapse:collapse; border:1px solid var(--border); }
    .table th, .table td { border:1px solid var(--border); padding:10px 12px; font-size:14px; }
    .table th { background:#f1f5f9; text-align:left; color:#0f172a; }
    .totals { width:280px; margin-left:auto; margin-top:12px; }
    .totals-row { display:flex; align-items:center; justify-content:space-between; padding:6px 0; color:#111827; }
    .totals-row.muted { color:var(--muted); }
    .totals-row.total { font-weight:700; font-size:16px; border-top:1px solid var(--border); margin-top:6px; padding-top:10px; }
    .pay-box { border:1px solid var(--border); border-radius:8px; padding:12px; margin-top:16px; }
    .pay-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .bank-title { font-weight:600; margin-bottom:6px; color:#0f172a; }
    .note { margin-top:12px; font-size:12px; color:var(--muted); }
    .footer { margin-top:28px; display:flex; align-items:center; justify-content:space-between; color:var(--muted); font-size:12px; }
    .print-actions { text-align:right; margin: 16px auto 0; width: 820px; }
    .btn { display:inline-block; padding:8px 14px; border:1px solid var(--border); border-radius:8px; background:#fff; cursor:pointer; font-size:14px; }
    @media print { .print-actions { display:none; } body { background:#fff; } .page { border:none; margin:0; border-radius:0; } }
  </style>
  </head>
<body>
  <script>
    // Auto-print after load for convenience; users can cancel if needed
    window.addEventListener('load', () => {
      setTimeout(() => { try { window.focus(); window.print(); } catch(e){} }, 300);
    });
  </script>
  <div class="page">
    <div class="header">
      <div class="logo-box">
        <div class="logo">Your Logo Here</div>
        <div>
          <h1>Grey Harmonics School of Music</h1>
          <div class="meta-row" style="gap:12px;">
            <span>Invoice #: <strong>${bill.id}</strong></span>
          </div>
        </div>
      </div>
      <div class="badge">Logo</div>
    </div>

    <div class="meta">
      <div class="meta-row"><span class="label">Statement Date</span><span>${dateStr}</span></div>
      <div class="meta-row"><span class="label">Statement Due</span><span>${dateStr}</span></div>
    </div>
    <div class="due">Balance Due: <strong>${formatPHP(subtotal)}</strong></div>

    <div class="section">
      <table class="table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="width:120px;">Price</th>
            <th style="width:80px;">Qty</th>
            <th style="width:130px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(it => `<tr>
            <td>${(it.description||'Item').replace(/</g,'&lt;')}</td>
            <td>${formatPHP(Number(it.unitAmount)||0)}</td>
            <td>${Number(it.quantity)||0}</td>
            <td>${formatPHP((Number(it.quantity)||0) * (Number(it.unitAmount)||0))}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div class="totals">
        <div class="totals-row muted"><span>Subtotal</span><span>${formatPHP(subtotal)}</span></div>
        <div class="totals-row muted"><span>Discount</span><span>-</span></div>
        <div class="totals-row muted"><span>Tax</span><span>-</span></div>
        <div class="totals-row total"><span>Total</span><span>${formatPHP(subtotal)}</span></div>
      </div>
    </div>

    <div class="section pay-box">
      <div class="pay-grid">
        <div>
          <div class="bank-title">Bank: Banco de Oro</div>
          <div>Account Name: <strong>Grace P. Bonilla</strong></div>
          <div>Account Number: <strong>010140082948</strong></div>
        </div>
        <div>
          <div class="bank-title">GCash Account Details:</div>
          <div>Account Name: <strong>Grace P. Bonilla</strong></div>
          <div>Account Number: <strong>09321366812</strong></div>
        </div>
      </div>
      <div class="note">If payment is made online, please take a screenshot of the e-receipt and send it via direct message to the Grey Harmonics School of Music Facebook page. Thank you.</div>
    </div>

    <div class="section" style="margin-top:20px;">
      <div style="display:flex; gap:24px;">
        <div style="flex:1;">
          <div style="font-weight:600; margin-bottom:4px;">Billed To:</div>
          <div>${(student?.guardianFullName || student?.guardianName || student?.name || bill.studentName || '').replace(/</g,'&lt;')}</div>
          ${student?.contactNumber ? `<div>${student.contactNumber}</div>` : ''}
          ${student?.email ? `<div>${student.email}</div>` : ''}
        </div>
        <div style="flex:1;">
          <div style="font-weight:600; margin-bottom:4px;">Company</div>
          <div>Grey Harmonics School of Music</div>
          <div>greyharmonics@gmail.com</div>
          <div>facebook.com/greyharmonics</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div>Thank you for your business</div>
      <div>Invoice generated on ${new Date().toLocaleString()}</div>
    </div>
  </div>

  <div class="print-actions">
    <button class="btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
</body>
</html>`;
        try {
          const blob = new Blob([html], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const w = window.open(url, '_blank');
          // Optional: revoke later to free memory (keeping a delay to avoid early revoke)
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (e) {
          // Fallback to document.write in case Blob is not supported
          const w = window.open('', '_blank');
          if (!w) return;
          w.document.open();
          w.document.write(html);
          w.document.close();
        }
  };

  // Pending invoices pagination (unpaid only)
  const [unpaidPage, setUnpaidPage] = React.useState(1);
  const [query, setQuery] = React.useState('');
  // Payment history pagination (paid only)
  const [paidPage, setPaidPage] = React.useState(1);
  const [paidQuery, setPaidQuery] = React.useState('');
  const pageSize = 10;
  const unpaidBase = billings
    .filter(b => b.status === 'unpaid')
    .sort((a,b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime());
  const q = query.trim().toLowerCase();
  const unpaidBillsAll = q
    ? unpaidBase.filter(b => (b.studentName || '').toLowerCase().includes(q))
    : unpaidBase;
  const unpaidTotalPages = Math.max(1, Math.ceil(unpaidBillsAll.length / pageSize));
  const unpaidBills = unpaidBillsAll.slice((unpaidPage - 1) * pageSize, unpaidPage * pageSize);

  // Paid invoices base + search + pagination
  const paidBase = billings
    .filter(b => b.status === 'paid')
    .sort((a,b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime());
  const pq = paidQuery.trim().toLowerCase();
  const paidBillsAll = pq
    ? paidBase.filter(b => (b.studentName || '').toLowerCase().includes(pq))
    : paidBase;
  const paidTotalPages = Math.max(1, Math.ceil(paidBillsAll.length / pageSize));
  const paidBills = paidBillsAll.slice((paidPage - 1) * pageSize, paidPage * pageSize);

  // Edit Invoice Modal state
  const [editingBill, setEditingBill] = React.useState<Billing | null>(null);
  const [items, setItems] = React.useState<BillingItem[]>([]);
  const [subtotal, setSubtotal] = React.useState<number>(0);
  // Preview Invoice Modal state
  const [previewBill, setPreviewBill] = React.useState<Billing | null>(null);
  // Record Payment Modal state
  const [paymentBill, setPaymentBill] = React.useState<Billing | null>(null);
  const [payAmount, setPayAmount] = React.useState<number>(0);
  const [payMethod, setPayMethod] = React.useState<PaymentMethod>('Cash');
  const [payRef, setPayRef] = React.useState<string>('');
  const [payNote, setPayNote] = React.useState<string>('');
  const [useCredit, setUseCredit] = React.useState<boolean>(false);
  const [creditToApply, setCreditToApply] = React.useState<number>(0);

  const openPaymentModal = (bill: Billing) => {
    setPaymentBill(bill);
    const total = (bill.items && bill.items.length > 0)
      ? bill.items.reduce((s, it) => s + (Number(it.quantity)||0) * (Number(it.unitAmount)||0), 0)
      : bill.amount;
    const paid = bill.paidAmount ?? (bill.payments ? bill.payments.reduce((s, p) => s + (Number(p.amount)||0), 0) : 0);
    const remaining = Math.max(0, total - paid);
    setPayAmount(remaining || total);
    setPayMethod('Cash');
    setPayRef('');
    setPayNote('');
  // Default: don't auto-apply credit
    setUseCredit(false);
    setCreditToApply(0);
  };
  const closePaymentModal = () => {
    setPaymentBill(null);
    setPayAmount(0);
    setPayRef('');
    setPayNote('');
  setUseCredit(false);
  setCreditToApply(0);
  };

  const openEditModal = (bill: Billing) => {
    setEditingBill(bill);
    const seed = (bill.items && bill.items.length > 0)
      ? bill.items
      : [{ id: `item-base-${bill.id}`, description: 'Base amount', quantity: 1, unitAmount: bill.amount }];
    setItems(seed);
    setSubtotal(seed.reduce((s, it) => s + (Number(it.quantity)||0) * (Number(it.unitAmount)||0), 0));
  };
  const closeEditModal = () => { setEditingBill(null); setItems([]); setSubtotal(0); };

  const addItem = () => {
    const newItem: BillingItem = { id: `item-${Date.now()}`, description: '', quantity: 1, unitAmount: 0 };
    setItems(prev => {
      const next = [...prev, newItem];
      setSubtotal(next.reduce((s, it) => s + (Number(it.quantity)||0) * (Number(it.unitAmount)||0), 0));
      return next;
    });
  };
  const updateItem = (id: string, patch: Partial<BillingItem>) => {
    setItems(prev => {
      const next = prev.map(it => it.id === id ? { ...it, ...patch } : it);
      setSubtotal(next.reduce((s, it) => s + (Number(it.quantity)||0) * (Number(it.unitAmount)||0), 0));
      return next;
    });
  };
  const removeItem = (id: string) => setItems(prev => {
    const next = prev.filter(it => it.id !== id);
    setSubtotal(next.reduce((s, it) => s + (Number(it.quantity)||0) * (Number(it.unitAmount)||0), 0));
    return next;
  });
  const resetToCurrentTotal = () => {
    if (!editingBill) return;
    const base = [{ id: `item-base-${editingBill.id}`, description: 'Base amount', quantity: 1, unitAmount: editingBill.amount }];
    setItems(base);
    setSubtotal(editingBill.amount);
  };
  const saveItems = () => {
    if (!editingBill) return;
    handleUpdateBilling(editingBill.id, { items });
    closeEditModal();
  };

  const renderBillRow = (bill: Billing) => {
    const student = studentMap.get(bill.studentId);
    const effectiveAmount = bill.items && bill.items.length > 0 ? bill.items.reduce((s, it) => s + it.quantity * it.unitAmount, 0) : bill.amount;
    return (
    <tr key={bill.id} className="block md:table-row hover:bg-surface-hover dark:hover:bg-slate-700/50 transition-colors">
      <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap block md:table-cell">
        <div className="flex items-center">
            <Avatar student={student} />
            <div className="ml-4">
                <div className="text-sm font-medium text-text-primary dark:text-slate-100">{bill.studentName}</div>
                <div className="text-xs text-text-tertiary dark:text-slate-500">ID: {bill.id}</div>
            </div>
        </div>
      </td>
      <td data-label="Amount" className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm text-text-secondary dark:text-slate-300 block md:table-cell text-right md:text-left before:content-[attr(data-label)':'] before:font-bold before:text-text-secondary before:dark:text-slate-400 before:mr-2 md:before:content-none before:float-left">
        {formatPHP(effectiveAmount)}
      </td>
      <td data-label="Date Issued" className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm text-text-secondary dark:text-slate-300 block md:table-cell text-right md:text-left before:content-[attr(data-label)':'] before:font-bold before:text-text-secondary before:dark:text-slate-400 before:mr-2 md:before:content-none before:float-left">
        {new Date(bill.dateIssued).toLocaleDateString()}
      </td>
      <td data-label="Status" className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap block md:table-cell text-right md:text-left before:content-[attr(data-label)':'] before:font-bold before:text-text-secondary before:dark:text-slate-400 before:mr-2 md:before:content-none before:float-left">
        <span className={`px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
            bill.status === 'paid' ? 'bg-status-green-light dark:bg-status-green/20 text-status-green' : 'bg-status-yellow-light dark:bg-status-yellow/20 text-status-yellow'
        }`}>
            {bill.status === 'paid' ? ICONS.paid : ICONS.unpaid}
            <span className="ml-1 capitalize">{bill.status}</span>
        </span>
      </td>
      <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-right text-sm font-medium block md:table-cell">
        <div className="flex items-center justify-end gap-2">
          {bill.status === 'unpaid' && (
            <button
              onClick={() => setPreviewBill(bill)}
              title="Preview invoice"
              aria-label="Preview invoice"
              className="group inline-flex items-center space-x-2 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30 dark:hover:bg-indigo-500/25 px-3 py-1 rounded-md transition-colors"
            >
              {/* eye icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 3C5 3 1.73 7.11 1 10c.73 2.89 4 7 9 7s8.27-4.11 9-7c-.73-2.89-4-7-9-7zm0 12a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z"/></svg>
              <span className="hidden sm:inline font-semibold">Preview</span>
            </button>
          )}
      {/* Mark Paid opens the record payment modal */}
          {bill.status === 'unpaid' && (
            <button
              onClick={() => openPaymentModal(bill)}
              title="Mark as Paid"
              aria-label="Mark as Paid"
              className="group inline-flex items-center space-x-2 bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 px-3 py-1 rounded-md transition-colors"
            >
              {/* check-money icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 7h18v10H3z"/>
                <path d="M7 12h.01"/>
                <path d="M12 12h5"/>
                <path d="M9 16l2 2 4-4"/>
              </svg>
              <span className="hidden sm:inline font-semibold">Mark Paid</span>
            </button>
          )}
          <button
            onClick={() => openEditModal(bill)}
            title="Edit invoice"
            aria-label="Edit invoice"
            className="group inline-flex items-center space-x-2 bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:bg-slate-600/20 dark:text-slate-200 dark:border-slate-600/40 dark:hover:bg-slate-600/30 px-3 py-1 rounded-md transition-colors"
          >
            {ICONS.edit}
            <span className="hidden sm:inline font-semibold">Edit</span>
          </button>
          {/* legacy direct Mark Paid button removed to unify flow */}
        </div>
      </td>
    </tr>
   );
 };

  // History row without actions/edit
  const renderHistoryRow = (bill: Billing) => {
    const student = studentMap.get(bill.studentId);
    const effectiveAmount = bill.items && bill.items.length > 0 ? bill.items.reduce((s, it) => s + it.quantity * it.unitAmount, 0) : bill.amount;
    const paidBy = summarizePayment(bill);
    const paidIcon = (() => {
      if (!paidBy) return null;
      if (paidBy === 'Credit') return ICONS.payCredit;
      if (paidBy.startsWith('Cash')) return ICONS.payCash;
      if (paidBy.startsWith('BDO')) return ICONS.payBank;
      if (paidBy.startsWith('GCash')) return ICONS.payGCash;
      if (paidBy.startsWith('Mixed')) return ICONS.payMixed;
      return ICONS.payOther;
    })();
    const paidColor = (() => {
      if (!paidBy) return '';
      if (paidBy === 'Credit') return 'text-violet-600 dark:text-violet-400';
      if (paidBy.startsWith('Cash')) return 'text-emerald-600 dark:text-emerald-400';
      if (paidBy.startsWith('BDO') || paidBy.startsWith('GCash')) return 'text-sky-600 dark:text-sky-400';
      if (paidBy.startsWith('Mixed')) return 'text-amber-600 dark:text-amber-400';
      return 'text-slate-500 dark:text-slate-400';
    })();
    return (
      <tr key={bill.id} className="block md:table-row hover:bg-surface-hover dark:hover:bg-slate-700/50 transition-colors">
        <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap block md:table-cell">
          <div className="flex items-center">
              <Avatar student={student} />
              <div className="ml-4">
                  <div className="text-sm font-medium text-text-primary dark:text-slate-100">{bill.studentName}</div>
                  <div className="text-xs text-text-tertiary dark:text-slate-500">ID: {bill.id}</div>
              </div>
          </div>
        </td>
        <td data-label="Amount" className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm text-text-secondary dark:text-slate-300 block md:table-cell text-right md:text-left before:content-[attr(data-label)':'] before:font-bold before:text-text-secondary before:dark:text-slate-400 before:mr-2 md:before:content-none before:float-left">
          {formatPHP(effectiveAmount)}
        </td>
        <td data-label="Date Issued" className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm text-text-secondary dark:text-slate-300 block md:table-cell text-right md:text-left before:content-[attr(data-label)':'] before:font-bold before:text-text-secondary before:dark:text-slate-400 before:mr-2 md:before:content-none before:float-left">
          {new Date(bill.dateIssued).toLocaleDateString()}
        </td>
        <td data-label="Status" className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap block md:table-cell text-right md:text-left before:content-[attr(data-label)':'] before:font-bold before:text-text-secondary before:dark:text-slate-400 before:mr-2 md:before:content-none before:float-left">
          <div className="flex items-center gap-2">
            <span className={`px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
                bill.status === 'paid' ? 'bg-status-green-light dark:bg-status-green/20 text-status-green' : 'bg-status-yellow-light dark:bg-status-yellow/20 text-status-yellow'
            }`}>
                {bill.status === 'paid' ? ICONS.paid : ICONS.unpaid}
                <span className="ml-1 capitalize">{bill.status}</span>
            </span>
            {bill.status === 'paid' && paidBy ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-input dark:bg-slate-700 border border-surface-border dark:border-slate-600 text-[11px] text-text-secondary dark:text-slate-300">
                  <span className={paidColor}>{paidIcon}</span>
                  <span className="hidden md:inline">Paid by {paidBy}</span>
                  <span className="md:hidden">{paidBy}</span>
                </span>
                <button
                  type="button"
                  title="View payment breakdown"
                  aria-label="View payment breakdown"
                  onClick={() => setBreakdownBill(bill)}
                  className="p-1.5 rounded-full bg-surface-input dark:bg-slate-700 border border-surface-border dark:border-slate-600 text-text-secondary hover:bg-surface-main dark:hover:bg-slate-700/60"
                >
                  {ICONS.info}
                </button>
              </span>
            ) : null}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-8">
      <Card>
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-2xl font-bold text-brand-secondary-deep-dark dark:text-brand-secondary">Pending Invoices</h2>
          <div className="w-full sm:w-72">
            <label className="block">
              <span className="sr-only">Search student</span>
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setUnpaidPage(1); }}
                placeholder="Search student..."
                className={`${control} text-sm`}
                aria-label="Search pending invoices by student name"
              />
            </label>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-surface-border dark:divide-slate-700">
            <thead className="bg-surface-table-header dark:bg-slate-700 hidden md:table-header-group">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Student</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Date Issued</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody className="bg-surface-card dark:bg-slate-800 divide-y divide-surface-border dark:divide-slate-700">
              {unpaidBills.length > 0 ? unpaidBills.map(renderBillRow) : <tr><td colSpan={5} className="text-center py-8 text-text-secondary dark:text-slate-400">No pending invoices.</td></tr>}
            </tbody>
          </table>
        </div>
        {/* Pagination controls for unpaid bills */}
  {unpaidBillsAll.length > pageSize && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-surface-border dark:border-slate-700 bg-surface-header dark:bg-slate-700/50">
            <div className="text-xs text-text-secondary dark:text-slate-400">
              Page {unpaidPage} of {unpaidTotalPages} • {unpaidBillsAll.length} invoice(s)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-xs px-3 py-1 rounded-md bg-surface-main dark:bg-slate-700/50 border border-surface-border dark:border-slate-700 disabled:opacity-50"
                onClick={() => setUnpaidPage(p => Math.max(1, p - 1))}
                disabled={unpaidPage <= 1}
              >
                Prev
              </button>
              <button
                type="button"
                className="text-xs px-3 py-1 rounded-md bg-surface-main dark:bg-slate-700/50 border border-surface-border dark:border-slate-700 disabled:opacity-50"
                onClick={() => setUnpaidPage(p => Math.min(unpaidTotalPages, p + 1))}
                disabled={unpaidPage >= unpaidTotalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
      
      <Card>
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-2xl font-bold text-brand-secondary-deep-dark dark:text-brand-secondary">Payment History</h2>
          <div className="w-full sm:w-72">
            <label className="block">
              <span className="sr-only">Search student</span>
              <input
                type="text"
                value={paidQuery}
                onChange={(e) => { setPaidQuery(e.target.value); setPaidPage(1); }}
                placeholder="Search student..."
                className={`${control} text-sm`}
                aria-label="Search payment history by student name"
              />
            </label>
          </div>
        </div>
         <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-surface-border dark:divide-slate-700">
            <thead className="bg-surface-table-header dark:bg-slate-700 hidden md:table-header-group">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Student</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Date Issued</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-surface-card dark:bg-slate-800 divide-y divide-surface-border dark:divide-slate-700">
              {paidBills.length > 0 ? paidBills.map(renderHistoryRow) : <tr><td colSpan={4} className="text-center py-8 text-text-secondary dark:text-slate-400">No paid invoices yet.</td></tr>}
            </tbody>
          </table>
        </div>
        {/* Pagination controls for paid bills */}
        {paidBillsAll.length > pageSize && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-surface-border dark:border-slate-700 bg-surface-header dark:bg-slate-700/50">
            <div className="text-xs text-text-secondary dark:text-slate-400">
              Page {paidPage} of {paidTotalPages} • {paidBillsAll.length} invoice(s)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-xs px-3 py-1 rounded-md bg-surface-main dark:bg-slate-700/50 border border-surface-border dark:border-slate-700 disabled:opacity-50"
                onClick={() => setPaidPage(p => Math.max(1, p - 1))}
                disabled={paidPage <= 1}
              >
                Prev
              </button>
              <button
                type="button"
                className="text-xs px-3 py-1 rounded-md bg-surface-main dark:bg-slate-700/50 border border-surface-border dark:border-slate-700 disabled:opacity-50"
                onClick={() => setPaidPage(p => Math.min(paidTotalPages, p + 1))}
                disabled={paidPage >= paidTotalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Payment Breakdown Modal */}
      {breakdownBill && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Payment breakdown" onClick={() => setBreakdownBill(null)}>
          <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
            <Card>
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary dark:text-slate-100">Payment Breakdown</h3>
                    <p className="text-sm text-text-secondary dark:text-slate-400 mt-1">Invoice ID: {breakdownBill.id} • {breakdownBill.studentName}</p>
                  </div>
                  <button onClick={() => setBreakdownBill(null)} className="text-sm px-3 py-1.5 rounded-md bg-surface-input dark:bg-slate-700 border border-surface-border dark:border-slate-600">Close</button>
                </div>
                <div className="mt-4">
                  {(!breakdownBill.payments || breakdownBill.payments.length === 0) ? (
                    <div className="text-sm text-text-secondary dark:text-slate-400">No payments recorded.</div>
                  ) : (
                    <ul className="divide-y divide-surface-border dark:divide-slate-700">
                      {breakdownBill.payments.map(p => (
                        <li key={p.id} className="py-2 flex items-center justify-between text-sm">
                          <div className="space-y-0.5">
                            <div className="font-medium text-text-primary dark:text-slate-100">{p.method}</div>
                            <div className="text-[11px] text-text-tertiary dark:text-slate-400">{new Date(p.date).toLocaleString()}</div>
                            {p.reference ? <div className="text-[11px] text-text-tertiary dark:text-slate-400">Ref: {p.reference}</div> : null}
                            {p.note ? <div className="text-[11px] text-text-tertiary dark:text-slate-400">Note: {p.note}</div> : null}
                          </div>
                          <div className="font-semibold">{formatPHP(Number(p.amount)||0)}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {editingBill && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Edit invoice" onClick={closeEditModal}>
          <div className="w-full max-w-4xl" onClick={e => e.stopPropagation()}>
            <Card>
              <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-bold text-text-primary dark:text-slate-100">Edit Invoice</h3>
                    <p className="text-sm text-text-secondary dark:text-slate-400 mt-1 break-all">{editingBill.studentName} • ID: {editingBill.id}</p>
                  </div>
                  <button onClick={closeEditModal} className="text-sm px-3 py-1.5 rounded-md bg-surface-input dark:bg-slate-700 border border-surface-border dark:border-slate-600 hover:brightness-95">Close</button>
                </div>

                <div className="mt-5 space-y-3">
                  {items.length === 0 && (
                    <div className="text-xs text-text-tertiary dark:text-slate-400">No items. Add line items to build this invoice.</div>
                  )}
                  {items.map((it) => (
                    <div key={it.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <input
                        className={`${control} sm:col-span-6 col-span-1 text-sm`}
                        placeholder="Description"
                        value={it.description}
                        onChange={e => updateItem(it.id, { description: e.target.value })}
                      />
                      <input
                        type="number"
                        className={`${control} sm:col-span-2 col-span-1 text-sm`}
                        placeholder="Qty"
                        min={0}
                        value={it.quantity}
                        onChange={e => updateItem(it.id, { quantity: Number(e.target.value) })}
                      />
                      <input
                        type="number"
                        className={`${control} sm:col-span-3 col-span-1 text-sm`}
                        placeholder="Unit Amount"
                        min={0}
                        step="0.01"
                        value={it.unitAmount}
                        onChange={e => updateItem(it.id, { unitAmount: Number(e.target.value) })}
                      />
                      <button
                        type="button"
                        className="sm:col-span-1 col-span-1 justify-self-end text-xs px-2 py-1 rounded-md bg-status-red-light/60 dark:bg-status-red/20 text-status-red whitespace-nowrap"
                        onClick={() => removeItem(it.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-5 gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={addItem} className="text-xs sm:text-sm px-3 py-1.5 rounded-md bg-surface-main dark:bg-slate-700/50 border border-surface-border dark:border-slate-700">Add Item</button>
                    <button type="button" onClick={resetToCurrentTotal} className="text-xs sm:text-sm px-3 py-1.5 rounded-md bg-surface-main dark:bg-slate-700/50 border border-surface-border dark:border-slate-700">Reset to current total</button>
                  </div>
                  <div className="text-sm sm:text-base font-semibold text-text-primary dark:text-slate-100 whitespace-nowrap">Subtotal: ${subtotal.toFixed(2)}</div>
                </div>

                {(!editingBill.items || editingBill.items.length === 0) && (
                  <div className="mt-2 text-[11px] text-text-tertiary dark:text-slate-400">Prefilled with a base line equal to the current invoice total (${editingBill.amount.toFixed(2)}). Add items to adjust, then Save.</div>
                )}

                <div className="mt-5 pt-3 border-t border-surface-border dark:border-slate-700 text-right">
                  <button type="button" onClick={saveItems} className="text-sm px-5 py-2 rounded-md bg-brand-primary text-text-on-color hover:opacity-90">Save</button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
      {/* Record Payment Modal */}
      {paymentBill && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Record payment" onClick={closePaymentModal}>
          <div className="w-full max-w-xl" onClick={e => e.stopPropagation()}>
            <Card>
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Record Payment</h3>
                    <p className="text-sm text-text-secondary mt-1">{paymentBill.studentName} • Invoice ID: {paymentBill.id}</p>
                    {(() => {
                      const s = paymentBill ? studentMap.get(paymentBill.studentId) : undefined;
                      const credit = s?.creditBalance || 0;
                      if (credit > 0) {
                        return <div className="mt-2 text-xs text-status-green">Available credit: {formatPHP(credit)}</div>;
                      }
                      return null;
                    })()}
                  </div>
                  <button onClick={closePaymentModal} className="text-sm px-3 py-1.5 rounded-md bg-surface-input dark:bg-slate-700 border border-surface-border dark:border-slate-600">Close</button>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Apply credit option */}
                  {(() => {
                    const s = paymentBill ? studentMap.get(paymentBill.studentId) : undefined;
                    const credit = s?.creditBalance || 0;
                    if (credit > 0) {
                      return (
                        <div className="sm:col-span-2 p-2 rounded border border-surface-border dark:border-slate-700 bg-surface-main dark:bg-slate-700/30">
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={useCredit} onChange={e => {
                              const checked = e.target.checked;
                              setUseCredit(checked);
                              // Default apply min(credit, remaining), adjust cash accordingly
                              const total = (paymentBill.items && paymentBill.items.length > 0)
                                ? paymentBill.items.reduce((s, it) => s + (Number(it.quantity)||0) * (Number(it.unitAmount)||0), 0)
                                : paymentBill.amount;
                              const paid = paymentBill.paidAmount ?? (paymentBill.payments ? paymentBill.payments.reduce((s, p) => s + (Number(p.amount)||0), 0) : 0);
                              const remaining = Math.max(0, total - paid);
                              const apply = checked ? Math.min(credit, remaining) : 0;
                              setCreditToApply(apply);
                              setPayAmount(Math.max(0, remaining - apply));
                            }} />
                            <span>Apply available credit</span>
                          </label>
                          {useCredit && (
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <label className="text-sm">
                                <span className="block mb-1 text-text-secondary">Credit to apply</span>
                                <input type="number" min={0} step="0.01" value={creditToApply} onChange={e => {
                                  const max = credit;
                                  const total = (paymentBill.items && paymentBill.items.length > 0)
                                    ? paymentBill.items.reduce((s, it) => s + (Number(it.quantity)||0) * (Number(it.unitAmount)||0), 0)
                                    : paymentBill.amount;
                                  const paid = paymentBill.paidAmount ?? (paymentBill.payments ? paymentBill.payments.reduce((s, p) => s + (Number(p.amount)||0), 0) : 0);
                                  const remaining = Math.max(0, total - paid);
                                  const vRaw = Number(e.target.value);
                                  const v = Math.max(0, Math.min(max, Math.min(remaining, vRaw)));
                                  setCreditToApply(v);
                                  // Do not clamp payAmount here; overpayment is allowed and any excess converts to credit
                                }} className="w-full bg-surface-input dark:bg-slate-700 border-surface-border dark:border-slate-600 rounded-md p-2" />
                              </label>
                              <div className="text-sm self-end">
                                <div className="text-text-secondary">Balance due after credit:</div>
                                <div className="font-semibold">
                                  {(() => {
                                    const total = (paymentBill.items && paymentBill.items.length > 0)
                                      ? paymentBill.items.reduce((s, it) => s + (Number(it.quantity)||0) * (Number(it.unitAmount)||0), 0)
                                      : paymentBill.amount;
                                    const paid = paymentBill.paidAmount ?? (paymentBill.payments ? paymentBill.payments.reduce((s, p) => s + (Number(p.amount)||0), 0) : 0);
                                    const remaining = Math.max(0, total - paid);
                                    const after = Math.max(0, remaining - creditToApply);
                                    return formatPHP(after);
                                  })()}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <label className="text-sm">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-text-secondary">Amount</span>
                    </div>
                    <input type="number" min={0} step="0.01" value={payAmount} onChange={e => {
                      const v = Math.max(0, Number(e.target.value));
                      setPayAmount(v);
                    }} className={control} />
                    <span className="mt-1 block text-[11px] text-text-tertiary dark:text-slate-400">Any excess will be added as credit.</span>
                  </label>
                  <label className="text-sm">
                    <span className="block mb-1 text-text-secondary">Payment Method</span>
                    <ThemedSelect value={payMethod} onChange={e => setPayMethod(e.target.value as PaymentMethod)}>
                      <option>Cash</option>
                      <option>BDO</option>
                      <option>GCash</option>
                      <option>Other</option>
                    </ThemedSelect>
                  </label>
                  <label className="text-sm sm:col-span-2">
                    <span className="block mb-1 text-text-secondary">OR / Transaction No. (optional)</span>
                    <input type="text" value={payRef} onChange={e => setPayRef(e.target.value)} className={control} />
                  </label>
                  <label className="text-sm sm:col-span-2">
                    <span className="block mb-1 text-text-secondary">Note (optional)</span>
                    <textarea value={payNote} onChange={e => setPayNote(e.target.value)} rows={3} className={control} />
                  </label>
                </div>
                <div className="mt-5 text-right">
                  <button
                    onClick={() => {
                      if (!paymentBill) return;
                      const save = onRecordPayment || handleRecordPayment;
                      // Allow overpayment; any excess becomes credit automatically
                      const total = (paymentBill.items && paymentBill.items.length > 0)
                        ? paymentBill.items.reduce((s, it) => s + (Number(it.quantity)||0) * (Number(it.unitAmount)||0), 0)
                        : paymentBill.amount;
                      const alreadyPaid = paymentBill.paidAmount ?? (paymentBill.payments ? paymentBill.payments.reduce((s, p) => s + (Number(p.amount)||0), 0) : 0);
                      const remaining = Math.max(0, total - alreadyPaid);
                      const credit = (studentMap.get(paymentBill.studentId)?.creditBalance || 0);
                      const creditApplied = useCredit ? Math.max(0, Math.min(creditToApply, Math.min(credit, remaining))) : 0;
                      const moneyApplied = Math.max(0, Number(payAmount) || 0);
                      if (creditApplied > 0) {
                        save(paymentBill.id, { amount: creditApplied, method: 'Credit' });
                      }
                      if (moneyApplied > 0) {
                        save(paymentBill.id, { amount: moneyApplied, method: payMethod, reference: payRef, note: payNote, overpayHandling: 'next' });
                      }
                      closePaymentModal();
                    }}
                    disabled={(useCredit ? creditToApply : 0) + (payAmount || 0) <= 0}
                    className="text-sm px-5 py-2 rounded-md bg-brand-primary text-text-on-color hover:opacity-90 disabled:opacity-60"
                  >
                    Save Payment
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
      {/* Invoice Preview Modal (Save as PNG) */}
      <InvoicePreviewModal
        isOpen={!!previewBill}
        onClose={() => setPreviewBill(null)}
        billing={previewBill}
        student={previewBill ? studentMap.get(previewBill.studentId) : undefined}
      />
    </div>
  );
};

  // Helpers for payment breakdown
  const summarizePayment = (bill: Billing): string | null => {
    const payments = bill.payments || [];
    if (!payments.length) return null;
    const hasCredit = payments.some(p => p.method === 'Credit');
    const nonCredit = Array.from(new Set(payments.filter(p => p.method !== 'Credit').map(p => p.method)));
    if (nonCredit.length === 0) return 'Credit';
    if (nonCredit.length === 1 && !hasCredit) return nonCredit[0];
    if (nonCredit.length === 1 && hasCredit) return `${nonCredit[0]} + Credit`;
    const base = `Mixed (${nonCredit.join(', ')})`;
    return hasCredit ? `${base} + Credit` : base;
  };