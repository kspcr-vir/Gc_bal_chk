import { Request, Response } from 'express';
import { checkBalanceViaDirectApi } from '../services/directApiService.js';
import { checkBalanceViaPuppeteer } from '../services/puppeteerService.js';

export const checkBalance = async (req: Request, res: Response) => {
  try {
    const { cardNumber, pin } = req.query;

    if (!cardNumber || !pin) {
      return res.status(400).json({
        success: false,
        error: "cardNumber and pin are required query parameters."
      });
    }

    console.log(`\n--- New Balance Check Request ---`);
    console.log(`Card: ${String(cardNumber).substring(0, 4)}... PIN: ***`);

    try {
      // 1. Attempt Direct API
      const directResult = await checkBalanceViaDirectApi(String(cardNumber), String(pin));
      if (directResult && directResult.success !== undefined) {
         return res.json(directResult);
      }
    } catch (apiError: any) {
      console.log(`Direct API failed, falling back to Puppeteer: ${apiError.message}`);
    }

    // 2. Fallback to Puppeteer Wrapper
    try {
      const puppeteerResult = await checkBalanceViaPuppeteer(String(cardNumber), String(pin));
      return res.json(puppeteerResult);
    } catch (puppeteerError: any) {
      console.error(`Puppeteer fallback also failed: ${puppeteerError.message}`);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch balance. Invalid details or temporary anti-bot block active.",
        details: puppeteerError.message
      });
    }

  } catch (error: any) {
    console.error("Critical error in checkBalance controller:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error."
    });
  }
};
