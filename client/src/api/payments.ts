import { api } from "./axios";

export interface BankTransferInstructions {
  configured: boolean;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
}

export const fetchBankTransferInstructions = async (): Promise<BankTransferInstructions> => {
  const response = await api.get<BankTransferInstructions>("/payments/bank-transfer");
  return response.data;
};