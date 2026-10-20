import { Request, Response } from "express";
import { getBankTransferInstructions } from "../services/bankTransferInstructions";

export const getBankTransferDetails = (_req: Request, res: Response) => {
  res.json(getBankTransferInstructions());
};