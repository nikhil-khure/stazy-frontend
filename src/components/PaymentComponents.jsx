import { useState } from 'react';
import { C, BTN } from '../constants/theme';
import Popup from './shared/Popup';

/**
 * Payment Management Components
 * Solves Requirement 29: Payment history popup and proper update UI
 */

/**
 * Payment History Popup
 * Shows monthly payment status for a student
 */
export function PaymentHistoryPopup({ payments, studentName, onClose }) {
  if (!payments || payments.length === 0) {
    return (
      <Popup title={`Payment History - ${studentName}`} onClose={onClose} width={700}>
        <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}>
          No payment history available
        </div>
      </Popup>
    );
  }

  return (
    <Popup title={`Payment History - ${studentName}`} onClose={onClose} width={800}>
      <div style={{ maxHeight: 500, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
            <tr style={{ background: C.bg, borderBottom: `2px solid ${C.border}` }}>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight }}>
                Month
              </th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight }}>
                Amount
              </th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight }}>
                Due Date
              </th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight }}>
                Status
              </th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.textLight }}>
                Paid On
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment, idx) => {
              const isPaid = payment.status === 'PAID';
              const monthLabel = formatMonthLabel(payment.periodStart, payment.periodEnd);
              
              return (
                <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '12px 8px', fontSize: 13, color: C.text }}>
                    {monthLabel}
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: 13, color: C.text, fontWeight: 600 }}>
                    ₹{payment.amount?.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: 13, color: C.text }}>
                    {formatDate(payment.dueDate)}
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      color: isPaid ? '#10B981' : '#F59E0B',
                      background: isPaid ? '#D1FAE5' : '#FEF3C7',
                    }}>
                      {isPaid ? 'PAID' : 'UNPAID'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: 13, color: C.textLight }}>
                    {payment.paidAt ? formatDate(payment.paidAt) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{
        marginTop: 16,
        padding: 16,
        background: C.bg,
        borderRadius: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 12, color: C.textLight, marginBottom: 4 }}>Total Payments</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.primary }}>
            {payments.length} months
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: C.textLight, marginBottom: 4 }}>Total Paid</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.success }}>
            ₹{payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: C.textLight, marginBottom: 4 }}>Total Due</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.danger }}>
            ₹{payments.filter(p => p.status === 'UNPAID').reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>
    </Popup>
  );
}

/**
 * Payment Update Popup (Redesigned per Requirement 29)
 */
export function PaymentUpdatePopup({ payment, onUpdate, onClose, loading }) {
  const [status, setStatus] = useState(payment.status || 'UNPAID');
  const [reminder, setReminder] = useState(payment.reminderMessage || '');

  const currentMonth = formatMonthLabel(payment.periodStart, payment.periodEnd);
  const isPaid = status === 'PAID';

  const handleSubmit = () => {
    onUpdate({
      status,
      ownerReminder: isPaid ? null : (reminder.trim() || null),
    });
  };

  return (
    <Popup title="Update Payment Status" onClose={onClose} width={550}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>
          Student: {payment.studentDisplayName}
        </div>
        <div style={{ fontSize: 13, color: C.textLight }}>
          Room: {payment.listingTitle} ({payment.roomCode})
        </div>
      </div>

      <div style={{
        background: C.bg,
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: C.textLight, marginBottom: 4 }}>Current Month</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{currentMonth}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: C.textLight, marginBottom: 4 }}>Amount</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.primary }}>₹{payment.amount?.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 8 }}>
          Payment Status
        </label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: `2px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 14,
            color: C.text,
            outline: 'none',
          }}
        >
          <option value="UNPAID">Unpaid</option>
          <option value="PAID">Paid</option>
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textLight, marginBottom: 8 }}>
          Owner Reminder {isPaid && <span style={{ color: C.textLight, fontWeight: 400 }}>(disabled when paid)</span>}
        </label>
        <textarea
          value={reminder}
          onChange={e => setReminder(e.target.value)}
          disabled={isPaid}
          placeholder={isPaid ? "Reminder is disabled for paid status" : "Enter reminder message for student..."}
          style={{
            width: '100%',
            minHeight: 80,
            padding: '10px 12px',
            border: `2px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 14,
            color: C.text,
            outline: 'none',
            resize: 'vertical',
            opacity: isPaid ? 0.5 : 1,
            background: isPaid ? '#f9fafb' : '#fff',
          }}
        />
        <div style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>
          {isPaid ? 'Reminder field is automatically cleared when status is marked as paid' : 'This message will be shown to the student in their dashboard'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ ...BTN.primary, flex: 1, padding: 12 }}
        >
          {loading ? 'Updating...' : 'Update Payment'}
        </button>
        <button
          onClick={onClose}
          disabled={loading}
          style={{ ...BTN.outline, padding: '12px 24px' }}
        >
          Cancel
        </button>
      </div>
    </Popup>
  );
}

// Helper functions
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMonthLabel(startDate, endDate) {
  if (!startDate) return 'Unknown';
  const date = new Date(startDate);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}
