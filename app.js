class StockData {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.stockDataDiv = document.getElementById('stock-data');
        this.stockLoading = document.getElementById('stock-loading');
        this.stockError = document.getElementById('stock-error');
    }

    showLoading() {
        this.stockLoading.classList.remove('d-none');
        this.stockDataDiv.innerHTML = '';
        this.stockError.classList.add('d-none');
    }

    hideLoading() {
        this.stockLoading.classList.add('d-none');
    }

    showError(message) {
        this.stockError.classList.remove('d-none');
        this.stockError.textContent = message;
        this.stockDataDiv.innerHTML = '';
    }

    async fetchStockData(symbol) {
        if (!/^[A-Z0-9.]{1,10}$/.test(symbol)) {
            throw new Error('Ungültiges Aktien-Symbol. Verwende z.B. AAPL.');
        }
        this.showLoading();
        try {
            const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${this.apiKey}`;
            const response = await fetch(url);
            const data = await response.json();
            console.log('Stock API Response:', data);

            if (data['Time Series (5min)']) {
                const latestData = data['Time Series (5min)'][Object.keys(data['Time Series (5min)'])[0]];
                return {
                    symbol,
                    price: latestData['4. close'],
                    time: Object.keys(data['Time Series (5min)'])[0]
                };
            } else {
                const errorMsg = data['Error Message'] || data['Note'] || 'Unbekannter Fehler';
                if (errorMsg.includes('Invalid API call')) {
                    throw new Error('Ungültiger API-Aufruf. Überprüfe das Aktien-Symbol oder den API-Schlüssel.');
                } else if (errorMsg.includes('rate limit')) {
                    throw new Error('API-Ratenlimit überschritten. Warte einen Moment und versuche es erneut.');
                } else {
                    throw new Error(`Aktie nicht gefunden: ${errorMsg}`);
                }
            }
        } catch (error) {
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    displayStockData(data) {
        this.stockDataDiv.innerHTML = `
            <p><strong>Symbol:</strong> ${data.symbol}</p>
            <p><strong>Preis:</strong> $${data.price}</p>
            <p><strong>Letzte Aktualisierung:</strong> ${data.time}</p>
        `;
        this.stockError.classList.add('d-none');
    }

    renderChart(symbol) {
        const chartContainer = document.getElementById('stock-chart');
        chartContainer.innerHTML = '';
        new TradingView.widget({
            container_id: 'stock-chart',
            width: '100%',
            height: '100%',
            symbol: symbol,
            interval: 'D',
            timezone: 'Etc/UTC',
            theme: 'light',
            style: '1',
            locale: 'de',
            toolbar_bg: '#f1f3f6',
            enable_publishing: false,
            allow_symbol_change: false,
            studies: ['MACD@tv-basicstudies', 'RSI@tv-basicstudies']
        });
    }
}

class NewsData {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.newsArticles = document.getElementById('news-articles');
        this.newsLoading = document.getElementById('news-loading');
        this.newsError = document.getElementById('news-error');
    }

    showLoading() {
        this.newsLoading.classList.remove('d-none');
        this.newsArticles.innerHTML = '';
        this.newsError.classList.add('d-none');
    }

    hideLoading() {
        this.newsLoading.classList.add('d-none');
    }

    showError(message) {
        this.newsError.classList.remove('d-none');
        this.newsError.textContent = message;
        this.newsArticles.innerHTML = '';
    }

    async fetchNews() {
        this.showLoading();
        try {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const url = `https://newsapi.org/v2/everything?q=finance&from=${sevenDaysAgo}&sortBy=publishedAt&apiKey=${this.apiKey}`;
            const response = await fetch(url);
            const data = await response.json();
            console.log('News API Response:', data);

            if (data.status === 'ok' && data.articles && data.articles.length > 0) {
                return data.articles.slice(0, 10);
            } else {
                throw new Error(`Keine Nachrichten gefunden: ${data.message || 'Unbekannter Fehler'}`);
            }
        } catch (error) {
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    displayNews(articles) {
        this.newsArticles.innerHTML = articles.map(article => `
            <div class="col-12 news-card">
                <div class="card h-100">
                    <div class="row g-0">
                        <div class="col-md-3">
                            <img
                                src="${article.urlToImage || 'https://via.placeholder.com/120x80?text=Keine+Vorschau'}"
                                class="img-fluid"
                                alt="${article.title}"
                            >
                        </div>
                        <div class="col-md-9">
                            <div class="card-body">
                                <h5 class="card-title">
                                    <a href="${article.url}" target="_blank">${article.title}</a>
                                </h5>
                                <p class="card-text">${article.description || 'Keine Beschreibung verfügbar.'}</p>
                                <p class="card-text">
                                    <small class="text-muted">Veröffentlicht: ${new Date(article.publishedAt).toLocaleDateString('de-DE')}</small>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        this.newsError.classList.add('d-none');
    }
}

const stockApiKey = 'ER2Y71UDXLB3GYD2';
const newsApiKey = '9f93ea8923da420399009e9ec07ce70b';

const stockDataInstance = new StockData(stockApiKey);
const newsDataInstance = new NewsData(newsApiKey);

document.getElementById('get-stock-data').addEventListener('click', async () => {
    const symbolInput = document.getElementById('stock-symbol');
    const symbol = symbolInput.value.trim().toUpperCase();
    if (!symbol) {
        stockDataInstance.showError('Bitte ein Aktien-Symbol eingeben.');
        return;
    }
    try {
        const stockData = await stockDataInstance.fetchStockData(symbol);
        stockDataInstance.displayStockData(stockData);
        stockDataInstance.renderChart(symbol);
    } catch (error) {
        stockDataInstance.showError(error.message);
    }
});

document.getElementById('clear-stock-data').addEventListener('click', () => {
    document.getElementById('stock-symbol').value = '';
    stockDataInstance.stockDataDiv.innerHTML = '';
    stockDataInstance.stockError.classList.add('d-none');
    document.getElementById('stock-chart').innerHTML = '';
});

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Bootstrap tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].forEach(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

    // Scroll button logic
    const scrollBtn = document.getElementById('scroll-btn');
    const scrollThreshold = 200; // Pixels from top/bottom to toggle arrow

    const updateScrollButton = () => {
        const scrollTop = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // Near top (≤ 200px): show down arrow
        if (scrollTop <= scrollThreshold) {
            scrollBtn.classList.remove('d-none');
            scrollBtn.querySelector('i').className = 'bi bi-arrow-down';
            scrollBtn.setAttribute('data-bs-original-title', 'Zum Ende scrollen');
        }
        // Near bottom (within 200px): show up arrow
        else if (scrollTop + windowHeight >= documentHeight - scrollThreshold) {
            scrollBtn.classList.remove('d-none');
            scrollBtn.querySelector('i').className = 'bi bi-arrow-up';
            scrollBtn.setAttribute('data-bs-original-title', 'Zum Anfang scrollen');
        }
        // In middle: hide button
        else {
            scrollBtn.classList.add('d-none');
        }
    };

    window.addEventListener('scroll', updateScrollButton);
    updateScrollButton(); // Initial check

    scrollBtn.addEventListener('click', () => {
        const isDownArrow = scrollBtn.querySelector('i').className.includes('bi-arrow-down');
        if (isDownArrow) {
            window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        // Update tooltip after click
        const tooltip = bootstrap.Tooltip.getInstance(scrollBtn);
        if (tooltip) {
            tooltip.hide();
            setTimeout(() => {
                tooltip.update();
            }, 100);
        }
    });

    // Fetch news
    try {
        const newsArticles = await newsDataInstance.fetchNews();
        newsDataInstance.displayNews(newsArticles);
    } catch (error) {
        newsDataInstance.showError(error.message);
    }
});