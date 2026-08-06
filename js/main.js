/* ============================================================
   Khamlia Tour — Interacción de la página

   Índice
   1. Global (todas las páginas): reveal, menú móvil, scroll-to
   2. Página Experiencias: filtro de chips
   3. Página Tour detalle: acordeón de itinerario, reserva WhatsApp
   4. Página Inicio: formulario de contacto
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ============ 1. GLOBAL (todas las páginas) ============ */

  /* --- Animación "reveal" al hacer scroll --- */
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach((el) => io.observe(el));

  /* --- Menú móvil --- */
  const menuIcon = document.querySelector('.nav-menu-icon');
  const navLinks = document.querySelector('.nav-links');
  if (menuIcon && navLinks) {
    menuIcon.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  /* --- Botones con scroll suave a una sección (data-scroll-to="id") --- */
  document.querySelectorAll('[data-scroll-to]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.getAttribute('data-scroll-to'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* --- Botones de navegación simple (data-href="url"), sin onclick inline
     para poder aplicar una Content-Security-Policy estricta --- */
  document.querySelectorAll('[data-href]').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.location.href = btn.getAttribute('data-href');
    });
  });

  /* --- Carrusel de imágenes de la portada --- */
  const hero = document.getElementById('heroCarousel');
  if (hero) {
    const slides = hero.querySelectorAll('.hero-bg');
    const dots = hero.querySelectorAll('.hero-dot');
    let current = 0;
    let timer;

    const goTo = (index) => {
      slides[current].classList.remove('active');
      dots[current].classList.remove('active');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
    };

    const restartAutoplay = () => {
      clearInterval(timer);
      timer = setInterval(() => goTo(current + 1), 6000);
    };

    hero.querySelector('.hero-arrow.next').addEventListener('click', () => { goTo(current + 1); restartAutoplay(); });
    hero.querySelector('.hero-arrow.prev').addEventListener('click', () => { goTo(current - 1); restartAutoplay(); });
    dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i); restartAutoplay(); }));

    restartAutoplay();
  }

  /* ============ 2. PÁGINA: Experiencias ============ */

  /* --- Filtros de categoría --- */
  const chips = document.querySelectorAll('.chip[data-filter]');
  const tourCards = document.querySelectorAll('.tour-card[data-category]');
  if (chips.length && tourCards.length) {
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        const filter = chip.getAttribute('data-filter');
        tourCards.forEach((card) => {
          const show = filter === 'all' || card.getAttribute('data-category') === filter;
          card.style.display = show ? '' : 'none';
        });
      });
    });

    /* Deep-link desde Destinos: experiencias.html?cat=desierto preselecciona el chip */
    const urlCat = new URLSearchParams(window.location.search).get('cat');
    if (urlCat) {
      const targetChip = document.querySelector(`.chip[data-filter="${urlCat}"]`);
      if (targetChip) targetChip.click();
    }
  }

  /* ============ 3. PÁGINA: Tour detalle ============ */

  /* --- Acordeón del itinerario --- */
  document.querySelectorAll('.day-card-top').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.day-card');
      const isOpen = card.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
  });

  /* --- Tarjeta de reserva: prellenar el mensaje de WhatsApp con fecha y viajeros --- */
  const waBtn = document.getElementById('whatsappBookBtn');
  const bookingDate = document.getElementById('bookingDate');
  const bookingReturnDate = document.getElementById('bookingReturnDate');
  const bookingGuests = document.getElementById('bookingGuests');
  if (waBtn && bookingGuests) {
    const baseUrl = waBtn.getAttribute('href').split('?')[0];
    const tourTitleEl = document.querySelector('.tour-detail h1');
    const tourName = tourTitleEl ? (tourTitleEl.innerText || tourTitleEl.textContent).replace(/\s+/g, ' ').trim() : 'este tour';
    const today = new Date().toISOString().split('T')[0];
    if (bookingDate) bookingDate.min = today;
    if (bookingReturnDate) bookingReturnDate.min = today;

    const updateWaLink = () => {
      if (bookingReturnDate) bookingReturnDate.min = bookingDate && bookingDate.value ? bookingDate.value : today;

      let msg = `Hola, me interesa reservar "${tourName}" para ${bookingGuests.value}`;
      if (bookingDate && bookingDate.value) msg += ` con salida el ${bookingDate.value}`;
      if (bookingReturnDate && bookingReturnDate.value) msg += ` y regreso el ${bookingReturnDate.value}`;
      msg += '. ¿Podrían confirmarme disponibilidad?';
      waBtn.setAttribute('href', `${baseUrl}?text=${encodeURIComponent(msg)}`);
    };
    bookingGuests.addEventListener('change', updateWaLink);
    if (bookingDate) bookingDate.addEventListener('change', updateWaLink);
    if (bookingReturnDate) bookingReturnDate.addEventListener('change', updateWaLink);
    updateWaLink();
  }

  /* ============ 4. PÁGINA: Inicio ============ */

  /* --- Formulario de contacto ---
     Se envía vía FormSubmit.co (sin backend propio). El endpoint AJAX
     evita que la página navegue y nos deja mostrar el estado in-situ. */
  const form = document.getElementById('contactForm');
  const note = document.getElementById('formNote');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const ajaxUrl = form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/');

      submitBtn.disabled = true;
      note.textContent = 'Enviando...';

      fetch(ajaxUrl, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Error al enviar');
          note.textContent = '¡Gracias! Hemos recibido tu mensaje y te escribiremos en menos de 48h.';
          form.reset();
        })
        .catch(() => {
          note.textContent = 'No se pudo enviar. Escríbenos directamente a khamliatour@gmail.com.';
        })
        .finally(() => {
          submitBtn.disabled = false;
        });
    });
  }

});
