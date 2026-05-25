import express from 'express';
import { exec } from 'child_process';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/api/checkBalance', (req, res) => {
  const { cardNumber, pin } = req.query;

  if (!cardNumber || !pin) {
    return res.status(400).json({ error: 'cardNumber and pin are required' });
  }

  // Construct the exact curl command requested, dynamically replacing CARD_NUMBER and PIN
  const curlCommand = `curl -s 'https://meribachat.in/rm/v1/checkBalance' \
-X POST \
-H 'Accept: /' \
-H 'Accept-Encoding: gzip, deflate, br, zstd' \
-H 'Accept-Language: en-US,en;q=0.9' \
-H 'Origin: https://meribachat.in' \
-H 'Referer: https://meribachat.in/check-balance' \
-H 'Content-Type: application/json' \
-H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36' \
-H 'Cookie: role=user' \
--compressed \
--data-raw '{"cardNumber":"${cardNumber}","pin":"${pin}"}'`;

  // Execute CURL command in backend terminal
  exec(curlCommand, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).json({ error: 'Failed to execute curl command', details: error.message, stderr, stdout });
    }
    
    try {
      // Try to parse the stdout response as JSON and return it
      const jsonResponse = JSON.parse(stdout);
      if (jsonResponse.balance !== undefined) {
        return res.json({ balance: jsonResponse.balance });
      }
      return res.json(jsonResponse);
    } catch (parseError) {
      // If it's not valid JSON, return the raw response
      return res.status(500).json({ error: 'Invalid JSON response from curl', rawResponse: stdout, stderr });
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
