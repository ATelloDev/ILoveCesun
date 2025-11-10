// JavaScript para la página principal de Turtle Convert
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling para enlaces internos
    const internalLinks = document.querySelectorAll('a[href^="#"]');
    
    internalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Animación de contadores en stats
    const statCards = document.querySelectorAll('.stat-card');
    
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumber = entry.target.querySelector('.stat-number');
                const finalValue = parseInt(statNumber.textContent);
                animateCounter(statNumber, 0, finalValue, 2000);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    statCards.forEach(card => {
        observer.observe(card);
    });

    function animateCounter(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            
            if (element.textContent.includes('+')) {
                element.textContent = value.toLocaleString() + '+';
            } else if (element.textContent.includes('%')) {
                element.textContent = value + '%';
            } else {
                element.textContent = value;
            }
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // Efecto parallax para el hero
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        if (hero) {
            hero.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });

    // Manejo de tooltips para botones deshabilitados
    const disabledButtons = document.querySelectorAll('.cta-button:disabled');
    
    disabledButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.setAttribute('title', 'Disponible próximamente');
        });
    });

    console.log('Turtle Convert - Página principal cargada correctamente');
});