/**
 * Utility Functions for Stylish E-Commerce
 * Consolidated from script.js and plugins initialization
 * Handles: Parallax, Product Quantity, Lightbox, Text Animation, Swiper
 */

// ============================================================================
// PARALLAX & JARALLAX
// ============================================================================
function initJarallax() {
  if (typeof jarallax !== 'undefined') {
    jarallax(document.querySelectorAll(".jarallax"));
    jarallax(document.querySelectorAll(".jarallax-img"), {
      keepImg: true,
    });
  }
}

// ============================================================================
// PRODUCT QUANTITY SPINNER
// ============================================================================
function initProductQty() {
  const $products = document.querySelectorAll('.product-qty');
  
  $products.forEach(($el_product) => {
    const $plusBtn = $el_product.querySelector('.quantity-right-plus');
    const $minusBtn = $el_product.querySelector('.quantity-left-minus');
    const $input = $el_product.querySelector('.quantity');

    if ($plusBtn) {
      $plusBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const quantity = parseInt($input.value) || 0;
        $input.value = quantity + 1;
      });
    }

    if ($minusBtn) {
      $minusBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const quantity = parseInt($input.value) || 0;
        if (quantity > 0) {
          $input.value = quantity - 1;
        }
      });
    }
  });
}

// ============================================================================
// LIGHTBOX (CHOCOLAT)
// ============================================================================
function initChocolat() {
  if (typeof Chocolat !== 'undefined') {
    const imageLinks = document.querySelectorAll('.image-link');
    if (imageLinks.length > 0) {
      Chocolat(imageLinks, {
        imageSize: 'contain',
        loop: true,
      });
    }
  }
}

// ============================================================================
// ANIMATED TEXT EFFECTS
// ============================================================================
function initTextFx() {
  const textElements = document.querySelectorAll('.txt-fx');
  
  textElements.forEach((el) => {
    let newstr = '';
    let count = 0;
    const delay = 0;
    const stagger = 10;
    const words = el.textContent.split(/\s/);
    
    words.forEach((value) => {
      newstr += '<span class="word">';
      
      for (let i = 0; i < value.length; i++) {
        newstr += `<span class='letter' style='transition-delay:${delay + stagger * count}ms;'>${value[i]}</span>`;
        count++;
      }
      
      newstr += '</span>';
      newstr += `<span class='letter' style='transition-delay:${delay}ms;'>&nbsp;</span>`;
      count++;
    });
    
    el.innerHTML = newstr;
  });
}

// ============================================================================
// SEARCH BOX TOGGLE
// ============================================================================
function initSearchBox() {
  const searchItems = document.querySelectorAll(".user-items .search-item");
  const closeButtons = document.querySelectorAll(".close-button");
  const searchBox = document.querySelector(".search-box");
  const searchInput = searchBox?.querySelector(".search-input");

  searchItems.forEach((item) => {
    item.addEventListener('click', () => {
      searchBox?.classList.toggle('active');
      if (searchInput) searchInput.focus();
    });
  });

  closeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      searchBox?.classList.remove('active');
    });
  });
}

// ============================================================================
// SWIPER CAROUSELS
// ============================================================================
function initSwipers() {
  if (typeof Swiper === 'undefined') return;

  const breakpoint = window.matchMedia('(max-width:61.93rem)');

  if (!breakpoint.matches) {
    // Main swiper
    new Swiper(".main-swiper", {
      slidesPerView: 1,
      spaceBetween: 48,
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      breakpoints: {
        900: {
          slidesPerView: 2,
          spaceBetween: 48,
        },
      },
    });

    // Thumbnail swiper
    const thumbSwiper = new Swiper(".thumb-swiper", {
      direction: 'horizontal',
      slidesPerView: 6,
      spaceBetween: 6,
      breakpoints: {
        900: {
          direction: 'vertical',
          spaceBetween: 6,
        },
      },
    });

    // Large swiper with thumbs
    new Swiper(".large-swiper", {
      spaceBetween: 48,
      effect: 'fade',
      slidesPerView: 1,
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      thumbs: {
        swiper: thumbSwiper,
      },
    });
  }

  // Product single page sliders
  const thumbSlider = new Swiper(".product-thumbnail-slider", {
    slidesPerView: 5,
    spaceBetween: 10,
    direction: "vertical",
    breakpoints: {
      0: {
        direction: "horizontal"
      },
      992: {
        direction: "vertical"
      },
    },
  });

  new Swiper(".product-large-slider", {
    slidesPerView: 1,
    spaceBetween: 0,
    effect: 'fade',
    thumbs: {
      swiper: thumbSlider,
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
  });
}

// ============================================================================
// PRELOADER
// ============================================================================
function hidePreloader() {
  window.addEventListener('load', function() {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
      preloader.style.opacity = '0';
      preloader.style.visibility = 'hidden';
      preloader.style.transition = 'all 0.3s ease';
    }
  });
}

// ============================================================================
// INITIALIZE ALL
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
  initProductQty();
  initJarallax();
  initChocolat();
  initTextFx();
  initSearchBox();
  initSwipers();
  hidePreloader();
});
