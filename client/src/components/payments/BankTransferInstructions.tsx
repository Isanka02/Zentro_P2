import { useEffect, useState } from "react";
import { fetchBankTransferInstructions, type BankTransferInstructions as BankDetails } from "../../api/payments";

interface BankTransferInstructionsProps {
  orderNumber: string;
  total: number;
}

const BankTransferInstructions = ({ orderNumber, total }: BankTransferInstructionsProps) => {
  const [details, setDetails] = useState<BankDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchBankTransferInstructions()
      .then((result) => { if (active) setDetails(result); })
      .catch(() => { if (active) setDetails(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <section className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
      <h2 className="font-semibold text-gray-900">Bank transfer instructions</h2>
      <p className="mt-1 text-sm text-gray-600">
        Transfer the exact amount below and use your order number as the payment reference.
      </p>
      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Loading account details...</p>
      ) : details?.configured ? (
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-gray-500">Bank</dt><dd className="font-medium text-gray-900">{details.bankName}</dd></div>
          <div><dt className="text-gray-500">Account name</dt><dd className="font-medium text-gray-900">{details.accountName}</dd></div>
          <div><dt className="text-gray-500">Account number</dt><dd className="font-medium text-gray-900">{details.accountNumber}</dd></div>
          {details.branch && <div><dt className="text-gray-500">Branch</dt><dd className="font-medium text-gray-900">{details.branch}</dd></div>}
          <div><dt className="text-gray-500">Amount</dt><dd className="font-semibold text-gray-900">LKR {total.toLocaleString("en-LK")}</dd></div>
          <div><dt className="text-gray-500">Payment reference</dt><dd className="font-semibold text-blue-700">{orderNumber}</dd></div>
        </dl>
      ) : (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Bank transfer details are temporarily unavailable. Please contact Zentro support before sending money.
        </p>
      )}
    </section>
  );
};

export default BankTransferInstructions;