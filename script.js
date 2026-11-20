// === НАСТРОЙКИ АКЦИИ (меняй числа здесь) ===
const CONFIG = {
  telegramUsername: 'katikok_smm',
  email: 'katikokbeh.94@gmail.com',
  // Дедлайн строго по Москве (+03:00)
  deadlineISO: '2026-11-30T23:59:59+03:00',
  // Остаток мест по каждому офферу (поставь 0, когда места закончатся)
  spots: {
    strategy: 2,
    mentoring: 3,
    agency: 3
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initSpots();
  initTimers();
  initOfferButtons();
  initLeadForm();
  initStickyMobileButton();
  initCookieBanner();
});

// 1. Счётчик мест
function initSpots() {
  const total = Object.values(CONFIG.spots).reduce((sum, n) => sum + Math.max(0, n), 0);
  const heroSpots = document.getElementById('total-spots-hero');
  const finalSpots = document.getElementById('total-spots-final');
  if (heroSpots) heroSpots.textContent = total;
  if (finalSpots) finalSpots.textContent = total;

  Object.entries(CONFIG.spots).forEach(([key, count]) => {
    const label = document.querySelector(`[data-spots-label="${key}"]`);
    const card = document.querySelector(`.offer-card[data-offer="${key}"]`);
    if (!label || !card) return;

    if (count <= 0) {
      label.textContent = 'Мест нет';
      card.classList.add('is-soldout');
      const btn = card.querySelector('.js-pick-offer');
      if (btn) {
        btn.textContent = 'Мест нет, записаться в лист ожидания';
        btn.dataset.pick = `Лист ожидания: ${card.querySelector('.offer-card__title')?.textContent || key}`;
      }
    } else {
      label.textContent = `Осталось мест: ${count}`;
    }
  });
}

// 2. Таймер до 30.11.2026 23:59:59 МСК
function initTimers() {
  const deadline = new Date(CONFIG.deadlineISO).getTime();
  const timers = [
    document.getElementById('hero-timer'),
    document.getElementById('final-timer')
  ].filter(Boolean);

  function update() {
    const now = Date.now();
    const diff = deadline - now;

    if (diff <= 0) {
      timers.forEach((t) => t.classList.add('hidden'));
      const ended = document.getElementById('hero-ended');
      if (ended) ended.classList.remove('hidden');
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    timers.forEach((timer) => {
      const d = timer.querySelector('[data-days]');
      const h = timer.querySelector('[data-hours]');
      const m = timer.querySelector('[data-minutes]');
      if (d) d.textContent = String(days).padStart(2, '0');
      if (h) h.textContent = String(hours).padStart(2, '0');
      if (m) m.textContent = String(minutes).padStart(2, '0');
    });
  }

  update();
  setInterval(update, 30000);
}

// 3. Кнопки «Хочу этот» на карточках
function initOfferButtons() {
  const select = document.getElementById('offer-select');
  const applySection = document.getElementById('apply');
  if (!select || !applySection) return;

  document.querySelectorAll('.js-pick-offer').forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.pick;
      if (value) {
        let option = Array.from(select.options).find((o) => o.value === value);
        if (!option) {
          option = new Option(value, value);
          select.add(option);
        }
        select.value = value;
      }
      applySection.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

// 4. Форма заявки → отправка на почту + готовое сообщение в Telegram
function initLeadForm() {
  const form = document.getElementById('lead-form');
  const successBox = document.getElementById('form-success');
  const fallbackLink = document.getElementById('fallback-tg-link');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправляем...';
    }

    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const contact = String(data.get('contact') || '').trim();
    const offer = String(data.get('offer') || '').trim();

    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source') || 'прямой заход';
    const utmCampaign = params.get('utm_campaign') || '';

    try {
      await fetch(`https://formsubmit.co/ajax/${CONFIG.email}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          _subject: `Заявка Чёрная пятница: ${offer}`,
          Имя: name,
          Контакт: contact,
          Формат: offer,
          UTM_source: utmSource,
          UTM_campaign: utmCampaign
        })
      });
    } catch (_) {
      // Даже если почтовый шлюз недоступен (например, при открытии локального файла), всё равно переводим в Telegram
    }

    const message = `ПЯТНИЦА\nИмя: ${name}\nКонтакт: ${contact}\nФормат: ${offer}${utmSource !== 'прямой заход' ? `\nИсточник: ${utmSource}` : ''}`;
    const tgUrl = `https://t.me/${CONFIG.telegramUsername}?text=${encodeURIComponent(message)}`;

    if (fallbackLink) fallbackLink.href = tgUrl;
    form.classList.add('hidden');
    if (successBox) successBox.classList.remove('hidden');

    window.open(tgUrl, '_blank', 'noopener');
  });
}

// 5. Sticky-кнопка на мобильном после первого экрана
function initStickyMobileButton() {
  const sticky = document.getElementById('mobile-sticky');
  const hero = document.getElementById('top');
  if (!sticky || !hero) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        sticky.classList.toggle('is-visible', !entry.isIntersecting);
      });
    },
    { threshold: 0.1 }
  );
  observer.observe(hero);
}

// 6. Cookie-баннер
function initCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  const btn = document.getElementById('cookie-accept');
  if (!banner || !btn) return;

  if (!localStorage.getItem('bf_cookie_ok')) {
    banner.classList.remove('hidden');
  }

  btn.addEventListener('click', () => {
    localStorage.setItem('bf_cookie_ok', '1');
    banner.classList.add('hidden');
  });
}
