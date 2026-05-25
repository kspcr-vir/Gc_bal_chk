import axios from 'axios';

export const checkBalanceViaDirectApi = async (cardNumber: string, pin: string) => {
  console.log(`Initial direct API check for card: ${cardNumber}`);
  try {
    const url = "https://meribachat.in/rm/v1/checkBalance";
    
    // As per user requirements, these headers must be used exactly
    const headers = {
      "Accept": "/",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "en-US,en;q=0.9",
      "Origin": "https://meribachat.in",
      "Referer": "https://meribachat.in/check-balance",
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
      "Cookie": "role=user"
    };

    const payload = {
      cardNumber: String(cardNumber).trim(),
      pin: String(pin).trim()
    };

    const response = await axios.post(url, payload, {
      headers,
      timeout: 10000,
      validateStatus: () => true // Handle 4xx/5xx manually
    });

    console.log(`Direct API Response Status: ${response.status}`);

    if (response.status === 200 && response.data) {
      if (response.data.success || response.data.balance !== undefined) {
          console.log(`Direct API Success.`);
          return {
              success: true,
              balance: response.data.balance || response.data.data?.balance || "Available",
              status: response.data.status || "Active",
              raw: response.data
          };
      }
    }

    if (response.status === 403 || response.status === 503) {
      throw new Error(`Anti-bot protection active (Status ${response.status})`);
    }

    // In case it returns JSON error
    if (response.data && response.data.error) {
      return { success: false, error: response.data.error };
    }

    throw new Error(`Direct API returned unexpected status: ${response.status}`);

  } catch (err: any) {
    console.error(`Direct API check failed: ${err.message}`);
    throw err;
  }
};
