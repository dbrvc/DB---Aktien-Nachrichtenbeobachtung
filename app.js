const stockButton = document.getElementById('get-stock-data');
const clearButton = document.getElementById('clear-stock-data');
const stockDataDiv = document.getElementById('stock-data');
const stockChartDiv = document.getElementById('stock-chart');
const stockLoading = document.getElementById('stock-loading');
const newsSection = document.getElementById('news-articles');
const newsLoading = document.getElementById('news-loading');
const stockSymbolInput = document.getElementById('stock-symbol');

// Deine API-Schlüssel hier einfügen
const alphaVantageApiKey = 'C9KDH762UYP3AL90';
const newsApiKey = '9f93ea8923da420399009e9ec07ce70b';

// Funktion, um Aktienkurse von Alpha Vantage abzurufen und Chart anzuzeigen
async function getStockData(symbol) {
    stockLoading.classList.remove('hidden');
    stockDataDiv.innerHTML = '';
    stockChartDiv.innerHTML = '';
    try {
        // Validate symbol format (basic check for alphanumeric and dots)
        if (!/^[A-Z0-9.]{1,10}$/.test(symbol)) {
            throw new Error('Ungültiges Aktien-Symbol. Verwende z.B. AAPL.');
        }

        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${alphaVantageApiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        console.log('Stock API Response:', data);

        if (data['Time Series (5min)']) {
            const latestData = data['Time Series (5min)'][Object.keys(data['Time Series (5min)'])[0]];
            const stockInfo = `
                <p><strong>Symbol:</strong> ${symbol}</p>
                <p><strong>Preis:</strong> $${latestData['4. close']}</p>
                <p><strong>Letzte Aktualisierung:</strong> ${Object.keys(data['Time Series (5min)'])[0]}</p>
            `;
            stockDataDiv.innerHTML = stockInfo;

            // TradingView Chart anzeigen
            new TradingView.widget({
                "container_id": "stock-chart",
                "width": "100%",
                "height": "100%",
                "symbol": symbol,
                "interval": "D",
                "timezone": "Etc/UTC",
                "theme": "light",
                "style": "1",
                "locale": "de",
                "toolbar_bg": "#f1f3f6",
                "enable_publishing": false,
                "allow_symbol_change": false,
                "studies": [
                    "MACD@tv-basicstudies",
                    "RSI@tv-basicstudies"
                ]
            });
        } else {
            const errorMsg = data['Error Message'] || data['Note'] || 'Unbekannter Fehler';
            if (errorMsg.includes('Invalid API call')) {
                stockDataDiv.innerHTML = `<p>Fehler: Ungültiger API-Aufruf. Überprüfe das Aktien-Symbol (z.B. AAPL) oder den API-Schlüssel.</p>`;
            } else if (errorMsg.includes('rate limit')) {
                stockDataDiv.innerHTML = `<p>Fehler: API-Ratenlimit überschritten. Warte einen Moment und versuche es erneut.</p>`;
            } else {
                stockDataDiv.innerHTML = `<p>Aktie nicht gefunden: ${errorMsg}</p>`;
            }
        }
    } catch (error) {
        console.error('Stock API Error:', error);
        stockDataDiv.innerHTML = `<p>Fehler beim Abrufen der Aktienkurse: ${error.message}</p>`;
    } finally {
        stockLoading.classList.add('hidden');
    }
}

// Funktion, um aktuelle Wirtschaftsnachrichten von NewsAPI abzurufen
async function getNewsData() {
    newsLoading.classList.remove('hidden');
    newsSection.innerHTML = '';
    try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const url = `https://newsapi.org/v2/everything?q=finance&from=${sevenDaysAgo}&sortBy=publishedAt&apiKey=${newsApiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        console.log('News API Response:', data);

        if (data.status === 'ok' && data.articles && data.articles.length > 0) {
            let newsContent = '';
            data.articles.slice(0, 10).forEach(article => {
                const thumbnail = article.urlToImage ? `<img src="${article.urlToImage}" alt="${article.title}">` : '';
                newsContent += `
                    <article>
                        ${thumbnail}
                        <div class="article-content">
                            <h3><a href="${article.url}" target="_blank">${article.title}</a></h3>
                            <p>${article.description || 'Keine Beschreibung verfügbar.'}</p>
                            <p><em>Veröffentlicht: ${new Date(article.publishedAt).toLocaleDateString('de-DE')}</em></p>
                        </div>
                    </article>
                `;
            });
            newsSection.innerHTML = newsContent;
        } else {
            newsSection.innerHTML = `<p>Keine Nachrichten gefunden: ${data.message || 'Unbekannter Fehler'}</p>`;
        }
    } catch (error) {
        console.error('News API Error:', error);
        newsSection.innerHTML = `<p>Fehler beim Abrufen der Nachrichten: ${error.message}</p>`;
    } finally {
        newsLoading.classList.add('hidden');
    }
}

// Event Listener für das Abrufen von Aktienkursen
stockButton.addEventListener('click', () => {
    const symbol = stockSymbolInput.value.trim().toUpperCase();
    if (symbol) {
        getStockData(symbol);
    } else {
        stockDataDiv.innerHTML = `<p>Bitte ein gültiges Symbol eingeben.</p>`;
        stockChartDiv.innerHTML = '';
    }
});

// Event Listener für das Zurücksetzen
clearButton.addEventListener('click', () => {
    stockSymbolInput.value = '';
    stockDataDiv.innerHTML = '';
    stockChartDiv.innerHTML = '';
});

// Abruf der Wirtschaftsnachrichten beim Laden der Seite
getNewsData();