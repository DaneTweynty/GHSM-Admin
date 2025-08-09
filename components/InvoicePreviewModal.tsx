import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import html2canvas from 'html2canvas';
import { Card } from './Card';
import type { Billing, BillingItem, Student } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  billing: Billing | null;
  student?: Student;
}

const formatPHP = (amount: number) => `PHP ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const InvoicePreviewModal: React.FC<Props> = ({ isOpen, onClose, billing, student }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    // Lock background scroll
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => {}, 50);
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      clearTimeout(t);
    };
  }, [isOpen]);

  if (!isOpen || !billing) return null;

  const items: BillingItem[] = billing.items && billing.items.length > 0
    ? billing.items
    : [{ id: `item-base-${billing.id}`, description: 'Tuition Fee', quantity: 1, unitAmount: billing.amount }];
  const subtotal = items.reduce((s, it) => s + (Number(it.quantity)||0) * (Number(it.unitAmount)||0), 0);
  const issued = new Date(billing.dateIssued);
  const dateStr = issued.toLocaleDateString();

  const handleSavePng = async () => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `invoice-${billing.id}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 backdrop-blur-md backdrop-saturate-150" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="w-full max-w-5xl px-4 py-10 overflow-hidden" onClick={e => e.stopPropagation()}>
        <Card>
          <div className="p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-2xl font-bold">Invoice Preview</h3>
                <p className="text-sm text-text-secondary">{billing.studentName} • ID: {billing.id}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSavePng} className="text-sm px-3 py-1.5 rounded-md bg-surface-main dark:bg-slate-700/50 border border-surface-border dark:border-slate-700">Save as PNG</button>
                <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-md bg-surface-input dark:bg-slate-700 border border-surface-border dark:border-slate-600">Close</button>
              </div>
            </div>

            {/* Printable-looking content */}
            <div ref={ref} className="bg-white text-black p-8 rounded-lg border border-surface-border" style={{width:'100%', maxWidth: '960px', margin: '0 auto'}}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-[240px] h-16 border border-dashed border-surface-border rounded-md flex items-center justify-center text-sm text-text-secondary">Your Logo Here</div>
                  <div>
                    <div className="text-2xl font-bold">Grey Harmonics School of Music</div>
                    <div className="mt-1 text-sm">Invoice #: <strong>{billing.id}</strong></div>
                  </div>
                </div>
                <div className="w-16 h-16 rounded-full border border-dashed border-surface-border flex items-center justify-center text-xs text-text-secondary">Logo</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-sm">
                <div className="flex items-center justify-between"><span className="text-text-secondary">Statement Date</span><span>{dateStr}</span></div>
                <div className="flex items-center justify-between"><span className="text-text-secondary">Statement Due</span><span>{dateStr}</span></div>
              </div>
              <div className="mt-2 text-base">Balance Due: <span className="font-bold text-status-red">{formatPHP(subtotal)}</span></div>

              <div className="mt-4">
                <table className="w-full border border-surface-border text-sm">
                  <thead className="bg-surface-table-header">
                    <tr>
                      <th className="text-left p-2 border border-surface-border">Description</th>
                      <th className="text-left p-2 border border-surface-border w-32">Price</th>
                      <th className="text-left p-2 border border-surface-border w-16">Qty</th>
                      <th className="text-left p-2 border border-surface-border w-36">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(it => (
                      <tr key={it.id}>
                        <td className="p-2 border border-surface-border">{it.description || 'Item'}</td>
                        <td className="p-2 border border-surface-border">{formatPHP(Number(it.unitAmount)||0)}</td>
                        <td className="p-2 border border-surface-border">{Number(it.quantity)||0}</td>
                        <td className="p-2 border border-surface-border">{formatPHP((Number(it.quantity)||0) * (Number(it.unitAmount)||0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2 ml-auto w-64">
                  <div className="flex items-center justify-between text-sm"><span className="text-text-secondary">Subtotal</span><span>{formatPHP(subtotal)}</span></div>
                  <div className="flex items-center justify-between text-sm"><span className="text-text-secondary">Discount</span><span>-</span></div>
                  <div className="flex items-center justify-between text-sm"><span className="text-text-secondary">Tax</span><span>-</span></div>
                  <div className="flex items-center justify-between text-base font-semibold border-t border-surface-border mt-1 pt-1"><span>Total</span><span>{formatPHP(subtotal)}</span></div>
                </div>
              </div>

              <div className="mt-4 border border-surface-border rounded-md p-3 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="font-semibold">Bank: Banco de Oro</div>
                    <div>Account Name: <strong>Grace P. Bonilla</strong></div>
                    <div>Account Number: <strong>010140082948</strong></div>
                  </div>
                  <div>
                    <div className="font-semibold">GCash Account Details:</div>
                    <div>Account Name: <strong>Grace P. Bonilla</strong></div>
                    <div>Account Number: <strong>09321366812</strong></div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-text-secondary">If payment is made online, please take a screenshot of the e-receipt and send it via direct message to the Grey Harmonics School of Music Facebook page. Thank you.</div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold mb-1">Billed To:</div>
                  <div>{student?.guardianFullName || student?.guardianName || student?.name || billing.studentName}</div>
                  {student?.contactNumber && <div>{student.contactNumber}</div>}
                  {student?.email && <div>{student.email}</div>}
                </div>
                <div>
                  <div className="font-semibold mb-1">Company</div>
                  <div>Grey Harmonics School of Music</div>
                  <div>greyharmonics@gmail.com</div>
                  <div>facebook.com/greyharmonics</div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between text-xs text-text-secondary">
                <div>Thank you for your business</div>
                <div>Invoice generated on {new Date().toLocaleString()}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>,
    document.body
  );
};
