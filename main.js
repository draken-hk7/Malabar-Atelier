import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
  // 1. Page Loader
  const loader = document.getElementById('loader');
  setTimeout(() => {
    loader.style.opacity = '0';
    loader.style.visibility = 'hidden';
  }, 2500); // Wait 2.5s to show logo pulse

  // 2. Lenis Smooth Scroll
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Integrate Lenis with GSAP ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // 3. Custom Cursor
  const cursor = document.querySelector('.custom-cursor');
  if (window.matchMedia("(pointer: fine)").matches) {
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });

    const interactiveElements = document.querySelectorAll('a, button, .masonry-item, .accordion-header');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
  }

  // 4. Navbar & Hamburger Menu
  const navbar = document.querySelector('.navbar');
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-links a');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
  });

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('active');
    });
  });

  // 5. Hero Canvas Scrubber
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas.getContext('2d');
  const frameCount = 120;
  const currentFrame = index => `/frames/frame_${String(index + 1).padStart(3, '0')}.svg`;
  
  let currentFrameIndex = 0;

  // Update canvas size
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render(currentFrameIndex);
  }
  window.addEventListener('resize', resizeCanvas);

  const images = [];

  // Preload images
  for (let i = 0; i < frameCount; i++) {
    const img = new Image();
    img.src = currentFrame(i);
    images.push(img);
  }

  // Draw first frame when loaded
  images[0].onload = () => {
    resizeCanvas();
  };

  function render(frameIndex) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const img = images[frameIndex];
    if(img) {
      // Draw centered, covering canvas
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width / 2) - (img.width / 2) * scale;
      const y = (canvas.height / 2) - (img.height / 2) * scale;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    }
  }

  const heroTl = gsap.timeline({
    scrollTrigger: {
      trigger: "#hero",
      start: "top top",
      end: "+=300%",
      pin: true,
      scrub: 1,
      onUpdate: (self) => {
        currentFrameIndex = Math.min(
          frameCount - 1,
          Math.floor(self.progress * frameCount)
        );
        render(currentFrameIndex);
      }
    }
  });

  // Fade out text early on scroll
  heroTl.to('.hero-content', {
    opacity: 0,
    yPercent: -20, // Moves up relative to its own height, avoiding transform conflicts
    duration: 0.15 // Finishes fading in the first 15% of the scroll
  })
  .to({}, { duration: 0.85 }); // Pad timeline so the scrub maps correctly

  // 6. Horizontal Scroll for Craft Process
  const processTrack = document.querySelector('.process-track');
  
  // Only apply horizontal scroll on desktop
  ScrollTrigger.matchMedia({
    "(min-width: 769px)": function() {
      gsap.to(processTrack, {
        x: () => -(processTrack.scrollWidth - window.innerWidth + 100), // padding offset
        ease: "none",
        scrollTrigger: {
          trigger: ".process",
          start: "top center",
          end: () => "+=" + (processTrack.scrollWidth - window.innerWidth),
          scrub: 1,
          pin: true,
          anticipatePin: 1
        }
      });
    }
  });

  // 7. Lightbox for Gallery
  const masonryItems = document.querySelectorAll('.masonry-item');
  const lightbox = document.getElementById('lightbox');
  const lightboxContent = document.querySelector('.lightbox-content');
  const lightboxClose = document.querySelector('.lightbox-close');

  masonryItems.forEach(item => {
    item.addEventListener('click', () => {
      // In a real scenario, fetch img src. Here we just set bg color
      const bgColor = window.getComputedStyle(item).backgroundColor;
      lightboxContent.style.backgroundColor = bgColor;
      lightbox.classList.add('active');
      lenis.stop(); // stop scrolling
    });
  });

  lightboxClose.addEventListener('click', () => {
    lightbox.classList.remove('active');
    lenis.start();
  });

  // 8. FAQ Accordion
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const content = item.querySelector('.accordion-content');
      const isActive = item.classList.contains('active');

      // Close all
      document.querySelectorAll('.accordion-item').forEach(acc => {
        acc.classList.remove('active');
        acc.querySelector('.accordion-content').style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add('active');
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  });

  // 9. Testimonials Carousel Dragging (Simple Implementation)
  const slider = document.querySelector('.carousel-track');
  let isDown = false;
  let startX;
  let scrollLeft;

  slider.addEventListener('mousedown', (e) => {
    isDown = true;
    slider.style.cursor = 'grabbing';
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
  });
  slider.addEventListener('mouseleave', () => {
    isDown = false;
    slider.style.cursor = 'grab';
  });
  slider.addEventListener('mouseup', () => {
    isDown = false;
    slider.style.cursor = 'grab';
  });
  slider.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 2; // scroll-fast
    slider.scrollLeft = scrollLeft - walk;
  });

  // Touch events for mobile carousel
  slider.addEventListener('touchstart', (e) => {
    isDown = true;
    startX = e.touches[0].pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
  });
  slider.addEventListener('touchend', () => {
    isDown = false;
  });
  slider.addEventListener('touchmove', (e) => {
    if (!isDown) return;
    const x = e.touches[0].pageX - slider.offsetLeft;
    const walk = (x - startX) * 2;
    slider.scrollLeft = scrollLeft - walk;
  });

});
