export default function App() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Barlow:wght@400;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #FFF1F2;
          font-family: 'Barlow', sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card {
          background: #fff;
          border: 3px solid #111;
          box-shadow: 8px 8px 0 #E11D48;
          border-radius: 4px;
          padding: 48px 56px;
          max-width: 480px;
          width: calc(100vw - 48px);
          text-align: center;
        }
        .badge {
          display: inline-block;
          background: #E11D48;
          color: #fff;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 2px;
          margin-bottom: 20px;
        }
        h1 {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 52px;
          font-weight: 900;
          line-height: 1;
          color: #111;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        h1 span { color: #E11D48; }
        .sub {
          font-size: 17px;
          color: #555;
          line-height: 1.5;
          margin-bottom: 32px;
        }
        .divider {
          width: 48px;
          height: 4px;
          background: #E11D48;
          margin: 0 auto 32px;
          border-radius: 2px;
        }
        .coming {
          background: #FFF1F2;
          border: 2px solid #E11D48;
          border-radius: 4px;
          padding: 16px 24px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #E11D48;
          letter-spacing: .04em;
          text-transform: uppercase;
        }
        .footer {
          margin-top: 32px;
          font-size: 13px;
          color: #aaa;
        }
      `}</style>
      <div className="card">
        <div className="badge">Boland's Special</div>
        <h1>WK<br/><span>Poule</span></h1>
        <div className="divider" />
        <p className="sub">
          Het WK 2026 is voorbij — bedankt voor het meedoen!<br />
          De site is tijdelijk offline.
        </p>
        <div className="coming">Iets nieuws komt eraan...</div>
        <p className="footer">ramonboland.com</p>
      </div>
    </>
  );
}
