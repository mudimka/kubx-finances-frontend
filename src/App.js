import { useState, useEffect } from "react";
import './App.css';

const API_BASE = "http://192.168.3.15/api";

function Row({ label, value, bold }) {
  return (
    <div className="row">
      <span className={bold ? "label bold" : "label"}>{label}</span>
      <span className={bold ? "value bold" : "value"}>{value}</span>
    </div>
  );
}

function Login({ onLogin }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  const handleLogin = () => {
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/Auth/login/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ login, password, login_type: 'login' }),
    })
      .then(r => r.json())
      .then(json => {
        if (json.status === 'ok') {
          setLoggedIn(true);
          setUserData(json.result);
        } else {
          setError(json.result?.login || json.result?.password || 'Ошибка авторизации');
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Авторизация</h1>
        <input
          className="login-input"
          type="text"
          placeholder="Логин"
          value={login}
          onChange={e => setLogin(e.target.value)}
        />
        <input
          className="login-input"
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && <p className="login-error">{error}</p>}
        {!loggedIn ? (
          <button className="login-btn" onClick={handleLogin} disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        ) : (
          <button className="login-btn" onClick={() => onLogin(userData || {})}>
            Подтвердить вход
          </button>
        )}
      </div>
    </div>
  );
}

function Finances({ data }) {
  if (!data) return <p>Загрузка...</p>;

  return (
    <div className="block">
      {(data.items || []).map((item, i) => (
        <div key={i} className="card">
          <Row label="Контрагент" value={item.contragent} />
          <Row label="Сумма аванса" value={`${item.advance_sum} р.`} />
          <Row label="Кредитный лимит" value={`${item.credit_limit} р.`} />
          <Row label="Свободный кредитный лимит" value={`${item.credit_limit_free} р.`} />
          <Row label="Отсрочка" value={`${item.delay} д.`} />
          <Row label="Дата ближайшего платежа" value={item.next_payment_date} bold />
          <Row label="Израсходованный кредитный лимит" value={`${item.credit_limit_used} р.`} />
          <div className="status">
            <span className={item.credit_available ? "ok" : "no"}>
              {item.credit_available ? "✓ Доступна покупка в счёт кредитного лимита" : "✗ Покупка в кредит недоступна"}
            </span>
          </div>
          <p className="updated">Обновление от {item.date_update}</p>
        </div>
      ))}
    </div>
  );
}

function Debts({ data }) {
  if (!data) return <p>Загрузка...</p>;

  return (
    <div className="block">
      {(data.items || []).map((item, i) => (
        <div key={i} className="debt-card">
          <div className="debt-row">
            <div className="debt-item">
              <span className="debt-label">Общая задолженность</span>
              <span className="debt-value"> {item.debt} р.</span>
            </div>
            <div className="debt-item">
              <span className="debt-label">Просроченная задолженность</span>
              <span className="debt-value"> {item.overdue_sum} р.</span>
            </div>
            <div className="debt-item">
              <span className="debt-label">Количество дней просрочки</span>
              <span className="debt-value"> {item.overdue_days} дней</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReconciliationActs({ data }) {
  const [page, setPage] = useState(1);
  const limit = 5;

  if (!data) return <p>Загрузка...</p>;

  const items = data.items || [];
  const total = data.count || 0;
  const pages = Math.ceil(total / limit);

  return (
    <div className="block">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Юр. лицо</th>
              <th>№ Договора</th>
              <th>Период</th>
              <th>Дата формирования</th>
              <th>Скачать</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td>{item.contragent}</td>
                <td>{item.contract_number}</td>
                <td>{item.period_from} — {item.period_to}</td>
                <td>{item.date_formed}</td>
                <td>
                  {item.file
                    ? <a className="download-btn" href={item.file} target="_blank" rel="noreferrer">⬇</a>
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="pagination">
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} className={page === i + 1 ? "active" : ""} onClick={() => setPage(i + 1)}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const TABS = ["Баланс", "Задолженность по заказам", "Акты сверки"];

export default function App() {
  const [tab, setTab] = useState(0);
  const [user, setUser] = useState(null);
  const [financesData, setFinancesData] = useState(null);
  const [actsData, setActsData] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE}/Finances/get/`, { credentials: 'include' })
      .then(r => r.json())
      .then(json => setFinancesData(json.result));
    fetch(`${API_BASE}/ReconciliationActs/get/?page=1&limit=5`, { credentials: 'include' })
      .then(r => r.json())
      .then(json => setActsData(json.result));
  }, [user]);

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="app">
      <div className="app-header">
        <h1>Финансы</h1>
        <span className="user-info">{user.firstName} {user.lastName}</span>
      </div>
      <div className="tabs">
        {TABS.map((t, i) => (
          <button key={i} className={tab === i ? "tab active" : "tab"} onClick={() => setTab(i)}>
            {t}
          </button>
        ))}
      </div>
      {tab === 0 && <Finances data={financesData} />}
      {tab === 1 && <Debts data={financesData} />}
      {tab === 2 && <ReconciliationActs data={actsData} />}
    </div>
  );
}