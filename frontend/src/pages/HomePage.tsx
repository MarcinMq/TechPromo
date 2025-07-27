import { Link } from 'react-router-dom';

function HomePage() {
  // Przykładowe dane promocji - później będą z API
  const featuredDeals = [
    {
      id: 1,
      title: "iPhone 15 Pro 128GB",
      originalPrice: 5999,
      salePrice: 4599,
      discount: 23,
      votes: { hot: 124, cold: 8 },
      comments: 45,
      image: "📱",
      category: "Telefony",
      shop: "Media Expert"
    },
    {
      id: 2,
      title: "Samsung Galaxy Watch 6",
      originalPrice: 1299,
      salePrice: 899,
      discount: 31,
      votes: { hot: 89, cold: 12 },
      comments: 23,
      image: "⌚",
      category: "Smartwatche",
      shop: "RTV Euro AGD"
    },
    {
      id: 3,
      title: "Sony WH-1000XM5 Słuchawki",
      originalPrice: 1599,
      salePrice: 1199,
      discount: 25,
      votes: { hot: 156, cold: 3 },
      comments: 67,
      image: "🎧",
      category: "Audio",
      shop: "x-kom"
    }
  ];

  return (
    <div className="homepage">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1>TechPromo</h1>
            <p className="hero-subtitle">
              Najlepsze promocje z elektroniki w jednym miejscu!
            </p>
            <p className="hero-description">
              Odkrywaj najgorętsze okazje, dziel się znaleziskami i oszczędzaj 
              razem ze społecznością. Głosuj na najlepsze promocje i buduj swoją reputację!
            </p>
        
            <div className="hero-actions">
              <Link to="/auth/register" className="btn btn-primary">
                Dołącz za darmo
              </Link>
              <Link to="/deals" className="btn btn-outline">
                Przeglądaj okazje
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Deals */}
      <div className="featured-section">
        <div className="container">
          <div className="section-header">
            <h2>🔥 Najgorętsze okazje</h2>
            <Link to="/deals" className="see-all-link">Zobacz wszystkie →</Link>
          </div>
          
          <div className="deals-grid">
            {featuredDeals.map(deal => (
              <div key={deal.id} className="deal-card">
                <div className="deal-image">
                  <span className="deal-emoji">{deal.image}</span>
                  <div className="deal-badge">-{deal.discount}%</div>
                </div>
                
                <div className="deal-content">
                  <div className="deal-category">{deal.category}</div>
                  <h3 className="deal-title">{deal.title}</h3>
                  
                  <div className="deal-prices">
                    <span className="sale-price">{deal.salePrice} zł</span>
                    <span className="original-price">{deal.originalPrice} zł</span>
                  </div>
                  
                  <div className="deal-shop">📍 {deal.shop}</div>
                  
                  <div className="deal-footer">
                    <div className="deal-votes">
                      <button className="vote-btn hot">
                        🔥 {deal.votes.hot}
                      </button>
                      <button className="vote-btn cold">
                        🧊 {deal.votes.cold}
                      </button>
                    </div>
                    <div className="deal-comments">
                      💬 {deal.comments}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="categories-section">
        <div className="container">
          <h2>Popularne kategorie</h2>
          <div className="categories-grid">
            <div className="category-card">
              <div className="category-icon">📱</div>
              <div className="category-name">Telefony</div>
              <div className="category-count">234 okazje</div>
            </div>
            <div className="category-card">
              <div className="category-icon">💻</div>
              <div className="category-name">Laptopy</div>
              <div className="category-count">156 okazji</div>
            </div>
            <div className="category-card">
              <div className="category-icon">🎧</div>
              <div className="category-name">Audio</div>
              <div className="category-count">189 okazji</div>
            </div>
            <div className="category-card">
              <div className="category-icon">📺</div>
              <div className="category-name">TV</div>
              <div className="category-count">98 okazji</div>
            </div>
            <div className="category-card">
              <div className="category-icon">🎮</div>
              <div className="category-name">Gaming</div>
              <div className="category-count">267 okazji</div>
            </div>
            <div className="category-card">
              <div className="category-icon">📷</div>
              <div className="category-name">Foto</div>
              <div className="category-count">87 okazji</div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="how-it-works">
        <div className="container">
          <h2>Jak to działa?</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Znajdź okazję</h3>
              <p>Przeglądaj tysiące promocji z elektroniki lub dodaj własną znalezioną w sieci</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Głosuj</h3>
              <p>Oceń promocje jako "HOT" 🔥 lub "COLD" 🧊 i pomóż innym znaleźć najlepsze okazje</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Dyskutuj</h3>
              <p>Komentuj, zadawaj pytania i dziel się opiniami ze społecznością</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h3>Oszczędzaj</h3>
              <p>Korzystaj z najlepszych promocji i buduj swoją reputację w społeczności</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
