# Meribachat Gift Card Balance API (CURL Wrapper)

A simple Node.js + Express backend wrapper that executes `curl` via `child_process.exec` to check Gift Card Balances. 

## Structure
- `server.js`: Express server that executes CURL.
- `public/`: Simple HTML/CSS/JS Vanilla Web UI.
- `render.yaml`: Render Deployment specs.

## API Endpoint
`GET /api/checkBalance?cardNumber=XXXX&pin=XXXX`

Will execute a backend CURL POST request using the EXACT required headers and payload format to Meribachat.

Example usage:
```http
GET http://localhost:3000/api/checkBalance?cardNumber=1006770147949188&pin=194374
```

## Setup & Run Locally
1. `npm install`
2. `npm start`
3. Visit http://localhost:3000 in your browser.

## Render Deployment
Just connect this repository to a standard **Render Web Service (Node.js)** environment using the included `render.yaml`. Use `npm install` and `npm start`.
