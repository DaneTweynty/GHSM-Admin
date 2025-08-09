import React, { useMemo } from 'react';
import type { Billing, Student } from '../types';
import { Card } from './Card';
import { ICONS } from '../constants';
import { useApp } from '../context/AppContext';
import type { BillingItem } from '../types';

interface BillingListProps {
  billings: Billing[];
  students: Student[];
  onMarkAsPaid: (billingId: string) => void;
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


export const BillingList: React.FC<BillingListProps> = ({ billings, students, onMarkAsPaid }) => {
  const { handleUpdateBilling } = useApp();
  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);

  const unpaidBills = billings.filter(b => b.status === 'unpaid').sort((a,b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime());
  const paidBills = billings.filter(b => b.status === 'paid').sort((a,b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime());

  const BillAccordion: React.FC<{ bill: Billing }> = ({ bill }) => {
    const [open, setOpen] = React.useState(false);
    // Seed items from bill.items if present; otherwise prefill with a base line using current bill.amount
    const [items, setItems] = React.useState<BillingItem[]>(() => (bill.items && bill.items.length > 0)
      ? bill.items
      : [{ id: `item-base-${bill.id}`, description: 'Base amount', quantity: 1, unitAmount: bill.amount }]
    );

    // Keep local items in sync when opening or when bill items/amount change externally
    React.useEffect(() => {
      if (!open) return;
      if (bill.items && bill.items.length > 0) {
        setItems(bill.items);
      } else {
        setItems([{ id: `item-base-${bill.id}`, description: 'Base amount', quantity: 1, unitAmount: bill.amount }]);
      }
    }, [open, bill.items, bill.amount, bill.id]);

    const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitAmount) || 0), 0);

    const addItem = () => {
      const newItem: BillingItem = { id: `item-${Date.now()}`, description: '', quantity: 1, unitAmount: 0 };
      setItems(prev => [...prev, newItem]);
    };
    const updateItem = (id: string, patch: Partial<BillingItem>) => {
      setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
    };
    const removeItem = (id: string) => setItems(prev => prev.filter(it => it.id !== id));
    const resetToCurrentTotal = () => setItems([{ id: `item-base-${bill.id}`, description: 'Base amount', quantity: 1, unitAmount: bill.amount }]);
    const saveItems = () => handleUpdateBilling(bill.id, { items });

    return (
      <div className="mt-2">
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs text-brand-primary hover:underline"
          onClick={() => setOpen(o => !o)}
        >
          {open ? 'Hide breakdown' : 'Show breakdown'}
        </button>
        {open && (
          <div className="mt-2 p-3 rounded-md border border-surface-border dark:border-slate-700 bg-surface-main dark:bg-slate-700/30">
            <div className="space-y-2">
              {items.length === 0 && (
                <div className="text-xs text-text-tertiary dark:text-slate-400">No items. Add line items to build this invoice.</div>
              )}
              {items.map((it) => (
                <div key={it.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <input
                    className="sm:col-span-6 col-span-1 bg-surface-input dark:bg-slate-700 border-surface-border dark:border-slate-600 rounded-md p-1.5 text-xs"
                    placeholder="Description"
                    value={it.description}
                    onChange={e => updateItem(it.id, { description: e.target.value })}
                  />
                  <input
                    type="number"
                    className="sm:col-span-2 col-span-1 bg-surface-input dark:bg-slate-700 border-surface-border dark:border-slate-600 rounded-md p-1.5 text-xs"
                    placeholder="Qty"
                    min={0}
                    value={it.quantity}
                    onChange={e => updateItem(it.id, { quantity: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    className="sm:col-span-3 col-span-1 bg-surface-input dark:bg-slate-700 border-surface-border dark:border-slate-600 rounded-md p-1.5 text-xs"
                    placeholder="Unit Amount"
                    min={0}
                    step="0.01"
                    value={it.unitAmount}
                    onChange={e => updateItem(it.id, { unitAmount: Number(e.target.value) })}
                  />
                  <button
                    type="button"
                    className="sm:col-span-1 col-span-1 text-xs px-2 py-1 rounded-md bg-status-red-light/60 dark:bg-status-red/20 text-status-red"
                    onClick={() => removeItem(it.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 gap-2">
              <div className="flex items-center gap-2">
                <button type="button" onClick={addItem} className="text-xs px-2 py-1 rounded-md bg-surface-main dark:bg-slate-700/50 border border-surface-border dark:border-slate-700">Add Item</button>
                <button type="button" onClick={resetToCurrentTotal} className="text-xs px-2 py-1 rounded-md bg-surface-main dark:bg-slate-700/50 border border-surface-border dark:border-slate-700">Reset to current total</button>
              </div>
              <div className="text-sm font-semibold text-text-primary dark:text-slate-100">Subtotal: ${subtotal.toFixed(2)}</div>
            </div>
            <div className="mt-2 text-right">
              <button type="button" onClick={saveItems} className="text-xs px-3 py-1 rounded-md bg-brand-primary text-text-on-color">Save</button>
            </div>
            {(!bill.items || bill.items.length === 0) && (
              <div className="mt-2 text-[11px] text-text-tertiary dark:text-slate-400">Prefilled with a base line equal to the current invoice total (${bill.amount.toFixed(2)}). Add items to adjust, then Save.</div>
            )}
          </div>
        )}
      </div>
    );
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
              <BillAccordion bill={bill} />
            </div>
        </div>
      </td>
      <td data-label="Amount" className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm text-text-secondary dark:text-slate-300 block md:table-cell text-right md:text-left before:content-[attr(data-label)':'] before:font-bold before:text-text-secondary before:dark:text-slate-400 before:mr-2 md:before:content-none before:float-left">
        ${effectiveAmount.toFixed(2)}
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
        {bill.status === 'unpaid' && (
          <button
            onClick={() => onMarkAsPaid(bill.id)}
            className="flex items-center space-x-2 text-status-green bg-status-green-light dark:bg-status-green/20 hover:bg-status-green/20 dark:hover:bg-status-green/30 font-semibold px-3 py-1 rounded-md transition-colors"
          >
            {ICONS.check}
            <span>Mark Paid</span>
          </button>
        )}
      </td>
    </tr>
   );
 };

  return (
    <div className="space-y-8">
      <Card>
        <div className="p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-brand-secondary-deep-dark dark:text-brand-secondary mb-4">Pending Invoices</h2>
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
      </Card>
      
      <Card>
        <div className="p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-brand-secondary-deep-dark dark:text-brand-secondary mb-4">Payment History</h2>
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
              {paidBills.length > 0 ? paidBills.map(renderBillRow) : <tr><td colSpan={5} className="text-center py-8 text-text-secondary dark:text-slate-400">No paid invoices yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};