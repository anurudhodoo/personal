const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Opening wipe */
window.addEventListener("load", () => {
  const wipe = $(".intro-wipe");
  window.setTimeout(() => {
    wipe?.classList.add("is-hidden");
    window.setTimeout(() => { if (wipe) wipe.hidden = true; }, reducedMotion ? 0 : 1100);
  }, reducedMotion ? 0 : 520);
});

/* Mobile navigation */
const menuToggle = $(".menu-toggle");
const mobileMenu = $(".mobile-menu");

const setMenu = (open) => {
  menuToggle?.classList.toggle("is-open", open);
  mobileMenu?.classList.toggle("is-open", open);
  menuToggle?.setAttribute("aria-expanded", String(open));
  menuToggle?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  mobileMenu?.setAttribute("aria-hidden", String(!open));
  document.body.classList.toggle("menu-open", open);
};

menuToggle?.addEventListener("click", () => setMenu(!mobileMenu.classList.contains("is-open")));
$$('.mobile-menu a').forEach((link) => link.addEventListener("click", () => setMenu(false)));
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenu(false);
});

/* Scroll reveals */
const revealItems = $$(".reveal, .reveal-lines");
if (reducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: .14, rootMargin: "0px 0px -5%" });

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 3, 2) * 70}ms`;
    revealObserver.observe(item);
  });
}

/* Small desktop pointer */
const cursor = $(".cursor");
const cursorLabel = $(".cursor span");
let cursorX = 0;
let cursorY = 0;
let cursorRenderX = 0;
let cursorRenderY = 0;

if (cursor && window.matchMedia("(pointer: fine)").matches && !reducedMotion) {
  window.addEventListener("pointermove", (event) => {
    cursorX = event.clientX;
    cursorY = event.clientY;
    cursor.classList.add("is-visible");
  }, { passive: true });

  const renderCursor = () => {
    cursorRenderX += (cursorX - cursorRenderX) * .2;
    cursorRenderY += (cursorY - cursorRenderY) * .2;
    cursor.style.left = `${cursorRenderX}px`;
    cursor.style.top = `${cursorRenderY}px`;
    window.requestAnimationFrame(renderCursor);
  };
  renderCursor();

  $$('[data-cursor], a, button').forEach((item) => {
    item.addEventListener("pointerenter", () => {
      cursor.classList.add("is-text");
      cursorLabel.textContent = item.dataset.cursor || (item.matches("a") ? "OPEN" : "GO");
    });
    item.addEventListener("pointerleave", () => {
      cursor.classList.remove("is-text");
      cursorLabel.textContent = "VIEW";
    });
  });
}

/* Gentle portrait response */
const hero = $(".hero");
const heroPortrait = $(".portrait-window");
if (hero && heroPortrait && !reducedMotion && window.matchMedia("(pointer: fine)").matches) {
  hero.addEventListener("pointermove", (event) => {
    const bounds = hero.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    heroPortrait.style.marginLeft = `${x * 12}px`;
    heroPortrait.style.marginTop = `${y * 9}px`;
  }, { passive: true });
  hero.addEventListener("pointerleave", () => {
    heroPortrait.style.marginLeft = "0";
    heroPortrait.style.marginTop = "0";
  });
}

/* Project carousel: auto-play, arrows, keyboard, mouse and touch drag */
const carousel = $(".carousel");
const viewport = $(".carousel-viewport");
const track = $(".carousel-track");
const slides = $$(".project-slide");
const prevButton = $(".carousel-prev");
const nextButton = $(".carousel-next");
const progress = $(".carousel-progress span");
const currentCount = $(".carousel-count strong");

let activeSlide = 0;
let dragStart = 0;
let dragDelta = 0;
let isDragging = false;
let carouselTimer;

const updateCarousel = (animate = true) => {
  if (!track || !slides.length) return;
  track.classList.toggle("is-dragging", !animate);
  track.style.transform = `translate3d(-${activeSlide * 100}%, 0, 0)`;
  if (progress) progress.style.transform = `translateX(${activeSlide * 100}%)`;
  if (currentCount) currentCount.textContent = String(activeSlide + 1).padStart(2, "0");
  slides.forEach((slide, index) => slide.setAttribute("aria-hidden", String(index !== activeSlide)));
};

const goToSlide = (index) => {
  activeSlide = (index + slides.length) % slides.length;
  updateCarousel();
  restartCarousel();
};

const stopCarousel = () => window.clearInterval(carouselTimer);
const startCarousel = () => {
  stopCarousel();
  if (reducedMotion || document.hidden) return;
  carouselTimer = window.setInterval(() => {
    activeSlide = (activeSlide + 1) % slides.length;
    updateCarousel();
  }, 5200);
};
const restartCarousel = () => startCarousel();

prevButton?.addEventListener("click", () => goToSlide(activeSlide - 1));
nextButton?.addEventListener("click", () => goToSlide(activeSlide + 1));

carousel?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") goToSlide(activeSlide - 1);
  if (event.key === "ArrowRight") goToSlide(activeSlide + 1);
});
carousel?.setAttribute("tabindex", "0");

viewport?.addEventListener("pointerdown", (event) => {
  isDragging = true;
  dragStart = event.clientX;
  dragDelta = 0;
  viewport.setPointerCapture?.(event.pointerId);
  viewport.classList.add("is-dragging");
  track.classList.add("is-dragging");
  stopCarousel();
});

viewport?.addEventListener("pointermove", (event) => {
  if (!isDragging) return;
  dragDelta = event.clientX - dragStart;
  const width = viewport.clientWidth || 1;
  const offset = activeSlide * width - dragDelta;
  track.style.transform = `translate3d(-${offset}px, 0, 0)`;
});

const finishDrag = () => {
  if (!isDragging) return;
  isDragging = false;
  viewport.classList.remove("is-dragging");
  track.classList.remove("is-dragging");
  const threshold = Math.min(110, viewport.clientWidth * .16);
  if (Math.abs(dragDelta) > threshold) activeSlide += dragDelta < 0 ? 1 : -1;
  activeSlide = (activeSlide + slides.length) % slides.length;
  dragDelta = 0;
  updateCarousel();
  startCarousel();
};

viewport?.addEventListener("pointerup", finishDrag);
viewport?.addEventListener("pointercancel", finishDrag);
viewport?.addEventListener("lostpointercapture", finishDrag);
carousel?.addEventListener("mouseenter", stopCarousel);
carousel?.addEventListener("mouseleave", startCarousel);
document.addEventListener("visibilitychange", startCarousel);
window.addEventListener("resize", () => updateCarousel(false));

updateCarousel(false);
startCarousel();

/* Live India time */
const timeElement = $("#localTime");
const updateTime = () => {
  if (!timeElement) return;
  timeElement.textContent = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
};
updateTime();
window.setInterval(updateTime, 30000);
