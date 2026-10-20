export interface BankTransferInstructions {
  configured: boolean;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
}

export const getBankTransferInstructions = (): BankTransferInstructions => {
  const bankName = process.env.BANK_TRANSFER_BANK_NAME?.trim() ?? "";
  const accountName = process.env.BANK_TRANSFER_ACCOUNT_NAME?.trim() ?? "";
  const accountNumber = process.env.BANK_TRANSFER_ACCOUNT_NUMBER?.trim() ?? "";
  const branch = process.env.BANK_TRANSFER_BRANCH?.trim() ?? "";

  return {
    configured: Boolean(bankName && accountName && accountNumber),
    bankName,
    accountName,
    accountNumber,
    branch,
  };
};