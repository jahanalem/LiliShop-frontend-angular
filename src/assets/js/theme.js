const heroSlider = new Swiper('.hero-slider', {
    slidesPerView: 1,
    loop: true,
    breakpoints: {
        768: {
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            }
        }
    }
});


const productsSlider = new Swiper('.products-slider', {
    slidesPerView: 2,
    spaceBetween: 20,
    breakpoints: {
        768: {
            slidesPerView: 3,
        },
        991: {
            slidesPerView: 4
        },
        1400: {
            slidesPerView: 5
        }
    },
    pagination: {
        el: '.swiper-pagination',
        dynamicBullets: true,
    }
});


const brandsSlider = new Swiper('.brands-slider', {
    slidesPerView: 2,
    spaceBetween: 30,
    breakpoints: {
        768: {
            slidesPerView: 3,
        },
        991: {
            slidesPerView: 6
        }
    },
    pagination: {
        el: '.swiper-pagination',
        dynamicBullets: true,
    }
});
/* ==============================================
    DETAILS SLIDER THUMBNAILS
  ============================================== */
var galleryThumbs = new Swiper('#detailSliderThumb', {
    spaceBetween: 10,
    slidesPerView: 8,
    watchSlidesVisibility: true,
    watchSlidesProgress: true,
});
/* ==============================================
    GLIGHTBOX
  ============================================== */
const lightbox = GLightbox({
    touchNavigation: true,
    loop: true,
    autoplayVideos: true
});



/* ==============================================
    DETAILS SLIDER
  ============================================== */
var detailSlider = new Swiper('#detailSlider', {
    spaceBetween: 10,
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
    thumbs: {
        swiper: galleryThumbs
    }
});




/* ==============================================
    OPEN & CLOSE SEARCH PANEL
  ============================================== */
function openSearch() {
    this.addEventListener('click', function (e) {
        let searchPanel = document.getElementById('searchPanel');
        e.preventDefault();
        searchPanel.classList.remove('d-none');
    });
}

function closeSearch() {
    this.addEventListener('click', function () {
        let searchPanel = document.getElementById('searchPanel');
        searchPanel.classList.add('d-none');;
    });
}


/* ==============================================
    INC & DEC BUTTONS
  ============================================== */

function increase (x) {
    var inputVal = x.previousElementSibling;
    inputVal.value++;
}
function decrease (x) {
    var inputVal = x.nextElementSibling;
    if (inputVal.value > 1) {
        inputVal.value--;
    }
}



/* ==============================================
    MULTILEVEL DROPDOWNS
  ============================================== */
  let dropdownElementList = [].slice.call(document.querySelectorAll('.dropdown-toggle'));
  let dropdownSubmenuElementList = [].slice.call(document.querySelectorAll('.dropdown-submenu-toggle'));
  let dropdownMenus = [].slice.call(document.querySelectorAll('.dropdown-menu'));

  let dropdownList = dropdownElementList.map(function (dropdownToggleEl) {
      return new bootstrap.Dropdown(dropdownToggleEl);
  });

  let submenuList = dropdownSubmenuElementList.map(function(e) {
      e.onclick = function(e){
          e.target.parentNode.querySelector('ul').classList.toggle('show');
          e.stopPropagation();
          e.preventDefault();
      }
  });
  function closeAllSubmenus(){
     let dropdownSubmenus = [].slice.call(document.querySelectorAll('.dropdown-submenu'));
    dropdownSubmenus.map(function (submenu) {
        submenu.classList.remove('show');
    });
  }


  //I'm using "click" but it works with any event
  document.addEventListener('click', function(event) {
      var specifiedElement = document.querySelector('.dropdown');
      var isClickInside = specifiedElement.contains(event.target);

      if (!isClickInside) {
          closeAllSubmenus();
      }
  });
