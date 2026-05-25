document.getElementById('balanceForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const cardNumber = document.getElementById('cardNumber').value.trim();
    const pin = document.getElementById('pin').value.trim();
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const errorNode = document.getElementById('error');
    const submitBtn = document.getElementById('submitBtn');

    // UI Reset
    loading.classList.remove('hidden');
    result.classList.add('hidden');
    errorNode.classList.add('hidden');
    submitBtn.disabled = true;

    try {
        const response = await fetch(`/api/checkBalance?cardNumber=${encodeURIComponent(cardNumber)}&pin=${encodeURIComponent(pin)}`);
        const data = await response.json();
        
        result.classList.remove('hidden');
        
        if (data.balance !== undefined) {
            result.innerHTML = `<div class="balance-display">Balance: ${data.balance}</div>`;
        } else {
            result.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        }

        if (!response.ok) {
            errorNode.classList.remove('hidden');
            errorNode.textContent = 'API Error: ' + (data.error || response.statusText);
            result.classList.add('hidden');
        }
    } catch (err) {
        errorNode.classList.remove('hidden');
        errorNode.textContent = 'Fetch failed: ' + err.message;
    } finally {
        loading.classList.add('hidden');
        submitBtn.disabled = false;
    }
});
