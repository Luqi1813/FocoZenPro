function loadDailyQuote() {
    try {
        const today = new Date().toDateString();
        let quoteIndex = parseInt(
            storageService?.readStorageValue
                ? storageService.readStorageValue(storageKeys.QUOTE_INDEX, '0')
                : localStorage.getItem(storageKeys.QUOTE_INDEX),
            10
        );
        if (isNaN(quoteIndex) || quoteIndex >= quotes.length || quoteIndex < 0) quoteIndex = 0;
        const lastQuoteDate = storageService?.readStorageValue
            ? storageService.readStorageValue(storageKeys.LAST_QUOTE_DATE, null)
            : localStorage.getItem(storageKeys.LAST_QUOTE_DATE);
        if (lastQuoteDate !== today) {
            quoteIndex = Math.floor(Math.random() * quotes.length);
            if (storageService?.writeStorageValue) {
                storageService.writeStorageValue(storageKeys.QUOTE_INDEX, quoteIndex);
                storageService.writeStorageValue(storageKeys.LAST_QUOTE_DATE, today);
            } else {
                localStorage.setItem(storageKeys.QUOTE_INDEX, quoteIndex);
                localStorage.setItem(storageKeys.LAST_QUOTE_DATE, today);
            }
        }
        const quote = quotes[quoteIndex] || quotes[0];
        const quoteText = document.getElementById('quoteText');
        const quoteAuthor = document.getElementById('quoteAuthor');
        if (quoteText) quoteText.textContent = `"${quote.text}"`;
        if (quoteAuthor) quoteAuthor.textContent = `— ${quote.author}`;
    } catch(e) { console.error(e); }
}
