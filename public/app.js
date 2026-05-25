document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('balanceForm');
    const resultBox = document.getElementById('resultBox');
    const errorBox = document.getElementById('errorBox');
    const errorMessage = document.getElementById('errorMessage');
    
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
    const resetBtn = document.getElementById('resetBtn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const cardNumber = document.getElementById('cardNumber').value.trim();
        const pin = document.getElementById('pin').value.trim();

        if (!cardNumber || !pin) {
            showError('Please enter both Card Number and PIN.');
            return;
        }

        // UI Loading state
        setLoading(true);
        hideError();

        try {
            const response = await fetch(`/api/checkBalance?cardNumber=${encodeURIComponent(cardNumber)}&pin=${encodeURIComponent(pin)}`);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to fetch balance. Please try again.');
            }

            // Show result
            showResult(data);
        } catch (err) {
            showError(err.message || 'An unexpected error occurred while communicating with the server.');
        } finally {
            setLoading(false);
        }
    });

    resetBtn.addEventListener('click', () => {
        form.classList.remove('hidden');
        resultBox.classList.add('hidden');
        form.reset();
        hideError();
    });

    function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        if (isLoading) {
            btnText.textContent = 'Checking...';
            btnLoader.classList.remove('hidden');
            Array.from(form.elements).forEach(el => el.disabled = true);
        } else {
            btnText.textContent = 'Check Balance';
            btnLoader.classList.add('hidden');
            Array.from(form.elements).forEach(el => el.disabled = false);
        }
    }

    function showResult(data) {
        form.classList.add('hidden');
        resultBox.classList.remove('hidden');
        
        document.getElementById('balanceValue').textContent = data.balance;
        document.getElementById('cardStatus').textContent = data.status || 'Active';
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorBox.classList.remove('hidden');
    }

    function hideError() {
        errorBox.classList.add('hidden');
    }
});
