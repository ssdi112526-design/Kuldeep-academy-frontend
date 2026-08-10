import { useEffect, useMemo, useState } from 'react';
import { FaPrint, FaTimes, FaFilePdf } from 'react-icons/fa';
import { formatCurrencyINR, formatFinanceDate, paymentModeLabel, MONTHS } from '../../utils/financeUi';
import { companyInfo } from '../../data/akhada';
import logoImg from '../../assets/logo.webp';
import Button from '../ui/Button';

const MONTHS_HI = [
  '',
  'जनवरी',
  'फ़रवरी',
  'मार्च',
  'अप्रैल',
  'मई',
  'जून',
  'जुलाई',
  'अगस्त',
  'सितंबर',
  'अक्टूबर',
  'नवंबर',
  'दिसंबर',
];

const T = {
  en: {
    toolbarTitle: 'Payment Receipt',
    close: 'Close',
    print: 'Print',
    pdf: 'PDF',
    langEn: 'English',
    langHi: 'Hindi',
    format: 'Format',
    a4: 'A4',
    thermal: '80mm Thermal',
    orgName: companyInfo.name || 'Raghunandan wrestling academy',
    tagline: 'Traditional Wrestling & Fitness Training',
    phone: 'Phone',
    email: 'Email',
    title: 'PAYMENT RECEIPT',
    receiptNo: 'Receipt No',
    paymentDate: 'Payment Date',
    studentDetails: 'Student Details',
    regNo: 'Registration No',
    studentName: 'Student Name',
    fatherName: 'Father / Guardian Name',
    mobile: 'Mobile Number',
    feeMonth: 'Fee Month',
    paymentDetails: 'Payment Details',
    description: 'Description',
    amount: 'Amount',
    monthlyFee: 'Monthly Fee',
    previousDue: 'Previous Due',
    discount: 'Discount',
    paidAmount: 'Paid Amount',
    remainingDue: 'Remaining Due',
    totalPaid: 'Total Paid',
    paymentMode: 'Payment Mode',
    txnRef: 'Transaction / Reference No',
    remarks: 'Remarks',
    thanks: 'Thank you for your payment.',
    keep: 'Please keep this receipt for your records.',
    signature: 'Authorized Signature',
    orgShort: 'Raghunandan wrestling academy',
    disclaimer: 'Manual receipt — payment collected offline. Not an online payment confirmation.',
    modes: { Cash: 'Cash', UPI: 'UPI', BankTransfer: 'Bank Transfer', Other: 'Other' },
  },
  hi: {
    toolbarTitle: 'भुगतान रसीद',
    close: 'बंद करें',
    print: 'प्रिंट',
    pdf: 'PDF',
    langEn: 'English',
    langHi: 'हिंदी',
    format: 'फ़ॉर्मेट',
    a4: 'A4',
    thermal: '80mm थर्मल',
    orgName: companyInfo.name || 'रघुनांदन रेसलिंग अकादमी',
    tagline: 'पारंपरिक कुश्ती एवं फिटनेस प्रशिक्षण',
    phone: 'फ़ोन',
    email: 'ईमेल',
    title: 'भुगतान रसीद',
    receiptNo: 'रसीद संख्या',
    paymentDate: 'भुगतान तिथि',
    studentDetails: 'छात्र विवरण',
    regNo: 'पंजीकरण संख्या',
    studentName: 'छात्र का नाम',
    fatherName: 'पिता / अभिभावक का नाम',
    mobile: 'मोबाइल नंबर',
    feeMonth: 'शुल्क माह',
    paymentDetails: 'भुगतान विवरण',
    description: 'विवरण',
    amount: 'राशि',
    monthlyFee: 'मासिक शुल्क',
    previousDue: 'पिछला बकाया',
    discount: 'छूट',
    paidAmount: 'भुगतान राशि',
    remainingDue: 'शेष बकाया',
    totalPaid: 'कुल भुगतान',
    paymentMode: 'भुगतान का तरीका',
    txnRef: 'लेनदेन / संदर्भ संख्या',
    remarks: 'टिप्पणी',
    thanks: 'आपके भुगतान के लिए धन्यवाद।',
    keep: 'कृपया इस रसीद को अपने रिकॉर्ड के लिए रखें।',
    signature: 'अधिकृत हस्ताक्षर',
    orgShort: 'रघुनांदन रेसलिंग अकादमी',
    disclaimer: 'मैनुअल रसीद — भुगतान ऑफ़लाइन लिया गया। यह ऑनलाइन भुगतान की पुष्टि नहीं है।',
    modes: { Cash: 'नकद', UPI: 'UPI', BankTransfer: 'बैंक ट्रांसफ़र', Other: 'अन्य' },
  },
};

/**
 * Professional fee receipt — screen preview + print/PDF.
 * Sticky toolbar stays visible (print was getting scrolled off-screen).
 */
export default function FeeReceiptModal({ payment, onClose }) {
  const [printFormat, setPrintFormat] = useState('a4');
  const [lang, setLang] = useState('en');
  const t = T[lang] || T.en;

  useEffect(() => {
    if (!payment) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.body.classList.add('finance-receipt-open');
    window.addEventListener('keydown', onKey);
    requestAnimationFrame(() => {
      const overlay = document.querySelector('.finance-receipt-overlay');
      if (overlay) overlay.scrollTop = 0;
    });
    return () => {
      document.body.classList.remove('finance-receipt-open');
      document.body.classList.remove('finance-receipt-thermal');
      window.removeEventListener('keydown', onKey);
    };
  }, [payment, onClose]);

  useEffect(() => {
    if (!payment) return;
    if (printFormat === 'thermal') {
      document.body.classList.add('finance-receipt-thermal');
    } else {
      document.body.classList.remove('finance-receipt-thermal');
    }
  }, [printFormat, payment]);

  const monthLabel = useMemo(() => {
    if (!payment) return '—';
    const feeMonth = payment.feeMonth || {};
    const m = Number(feeMonth.month);
    const y = feeMonth.year;
    if (!m || !y) return payment.monthLabel || '—';
    if (lang === 'hi') return `${MONTHS_HI[m] || m} ${y}`;
    const en = MONTHS.find((x) => x.value === m)?.label || m;
    return `${en} ${y}`;
  }, [payment, lang]);

  if (!payment) return null;

  const student = payment.student || {};
  const feeMonth = payment.feeMonth || {};
  const modeKey = payment.paymentMode;
  const mode = t.modes[modeKey] || paymentModeLabel(modeKey);
  const showRef =
    (modeKey === 'UPI' || modeKey === 'BankTransfer') &&
    Boolean(String(payment.transactionReference || '').trim());

  const rows = [
    { key: 'monthlyFee', amount: payment.feeAmountSnapshot ?? feeMonth.feeAmount },
    { key: 'previousDue', amount: payment.previousDueSnapshot },
    { key: 'discount', amount: payment.discountApplied },
    { key: 'paidAmount', amount: payment.amount, strong: true },
    { key: 'remainingDue', amount: payment.remainingAfter },
  ];

  const printReceipt = () => window.print();

  return (
    <div
      className="finance-receipt-overlay fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-ink/50 p-3 pt-3 backdrop-blur-sm sm:p-4 sm:pt-4"
      role="dialog"
      aria-modal="true"
      aria-label={t.toolbarTitle}
    >
      <div className="finance-receipt-dialog my-0 w-full max-w-[720px] overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Sticky actions — always visible while scrolling the receipt */}
        <div className="finance-receipt-toolbar sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:px-4">
          <p className="text-sm font-semibold text-ink">{t.toolbarTitle}</p>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex rounded-lg border border-slate-200 p-0.5 text-xs font-semibold"
              role="group"
              aria-label="Receipt language"
            >
              <button
                type="button"
                className={`rounded-md px-2.5 py-1.5 ${
                  lang === 'en' ? 'bg-brand text-white' : 'text-muted hover:bg-slate-50'
                }`}
                onClick={() => setLang('en')}
              >
                {t.langEn}
              </button>
              <button
                type="button"
                className={`rounded-md px-2.5 py-1.5 ${
                  lang === 'hi' ? 'bg-brand text-white' : 'text-muted hover:bg-slate-50'
                }`}
                onClick={() => setLang('hi')}
              >
                {t.langHi}
              </button>
            </div>
            <select
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-ink"
              value={printFormat}
              onChange={(e) => setPrintFormat(e.target.value)}
              aria-label={t.format}
            >
              <option value="a4">{t.a4}</option>
              <option value="thermal">{t.thermal}</option>
            </select>
            <Button
              variant="secondary"
              className="rounded-lg text-sm"
              onClick={onClose}
              aria-label={t.close}
            >
              <FaTimes size={12} aria-hidden /> {t.close}
            </Button>
            <Button
              variant="secondary"
              className="rounded-lg text-sm"
              onClick={printReceipt}
              aria-label={t.print}
            >
              <FaPrint size={13} aria-hidden /> {t.print}
            </Button>
            <Button className="rounded-lg text-sm" onClick={printReceipt} aria-label={t.pdf}>
              <FaFilePdf size={13} aria-hidden /> {t.pdf}
            </Button>
          </div>
        </div>

        <div
          className={`finance-receipt-sheet mx-auto bg-white px-5 py-6 text-ink sm:px-8 sm:py-8 ${
            lang === 'hi' ? 'font-hindi' : ''
          }`}
        >
          <header className="finance-receipt-header border-b border-slate-200 pb-4 text-center">
            <img
              src={logoImg}
              alt={t.orgName}
              className="mx-auto h-14 w-14 rounded-full object-contain"
            />
            <h1 className="mt-2 text-xl font-bold tracking-tight text-ink sm:text-2xl">{t.orgName}</h1>
            <p className="mt-0.5 text-xs font-medium text-slate-600 sm:text-sm">{t.tagline}</p>
            <div className="mx-auto mt-3 max-w-md space-y-0.5 text-[11px] leading-relaxed text-slate-600 sm:text-xs">
              {companyInfo.address ? <p>{companyInfo.address}</p> : null}
              {companyInfo.phones?.length ? (
                <p>
                  {t.phone}: {companyInfo.phones.join(' · ')}
                </p>
              ) : null}
              {companyInfo.email ? (
                <p>
                  {t.email}: {companyInfo.email}
                </p>
              ) : null}
            </div>
          </header>

          <div className="mt-4 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-700">{t.title}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm">
              <p>
                <span className="text-slate-500">{t.receiptNo}:</span>{' '}
                <span className="font-mono font-bold">{payment.receiptNumber}</span>
              </p>
              <p>
                <span className="text-slate-500">{t.paymentDate}:</span>{' '}
                <span className="font-semibold">{formatFinanceDate(payment.paymentDate)}</span>
              </p>
            </div>
          </div>

          <section className="mt-5 rounded-lg border border-slate-200 p-3 sm:p-4">
            <h2 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              {t.studentDetails}
            </h2>
            <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
              <Info label={t.regNo} value={student.registrationNumber} />
              <Info label={t.studentName} value={student.fullName} />
              <Info label={t.fatherName} value={student.fatherName} />
              <Info label={t.mobile} value={student.mobileNumber} />
              <Info label={t.feeMonth} value={monthLabel} />
            </dl>
          </section>

          <section className="mt-5">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              {t.paymentDetails}
            </h2>
            <table className="finance-receipt-table w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-50 text-left">
                  <th className="px-3 py-2 font-semibold text-slate-700">{t.description}</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700">{t.amount}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.key}
                    className={`border-b border-slate-100 ${row.strong ? 'bg-[#F8FAFC]' : ''}`}
                  >
                    <td className={`px-3 py-2 ${row.strong ? 'font-bold text-ink' : 'text-slate-700'}`}>
                      {t[row.key]}
                    </td>
                    <td
                      className={`px-3 py-2 text-right tabular-nums ${
                        row.strong ? 'text-base font-bold text-ink' : 'font-medium text-ink'
                      }`}
                    >
                      {formatCurrencyINR(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-3 py-3">
              <span className="text-sm font-bold uppercase tracking-wide text-ink">{t.totalPaid}</span>
              <span className="text-lg font-bold tabular-nums text-ink">
                {formatCurrencyINR(payment.amount)}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-medium text-slate-500">{t.paymentMode}:</span> {mode}
            </p>
            {showRef ? (
              <p className="mt-1 text-sm text-slate-600">
                <span className="font-medium text-slate-500">{t.txnRef}:</span>{' '}
                {payment.transactionReference}
              </p>
            ) : null}
            {payment.remarks ? (
              <p className="mt-1 text-sm text-slate-600">
                <span className="font-medium text-slate-500">{t.remarks}:</span> {payment.remarks}
              </p>
            ) : null}
          </section>

          <footer className="finance-receipt-footer mt-8 border-t border-slate-200 pt-4">
            <p className="text-center text-sm text-slate-600">{t.thanks}</p>
            <p className="mt-0.5 text-center text-xs text-slate-500">{t.keep}</p>
            <div className="mt-8 flex justify-end">
              <div className="min-w-[160px] text-center">
                <div className="mb-8 border-b border-slate-400" />
                <p className="text-xs font-semibold text-ink">{t.signature}</p>
                <p className="text-[11px] text-slate-500">{t.orgShort}</p>
              </div>
            </div>
            <p className="mt-6 text-center text-[10px] text-slate-400">{t.disclaimer}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex flex-col sm:flex-row sm:gap-2">
      <dt className="shrink-0 text-slate-500">{label}:</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
