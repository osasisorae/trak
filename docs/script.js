// TRAK Landing Page - JavaScript

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            document.querySelector(href).scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Form submission handler
const form = document.getElementById('earlyAccessForm');
if (form) {
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        
        // Collect form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Log the data (in production, send to your backend)
        console.log('Early Access Form Submitted:', data);
        
        // Show success message
        alert('Thank you for your interest! We\'ll be in touch soon with your early access details.');
        
        // Reset form
        form.reset();
        
        // TODO: Replace with actual backend API call
        // Example:
        // fetch('/api/early-access', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(data)
        // })
        // .then(response => response.json())
        // .then(result => {
        //     console.log('Success:', result);
        //     alert('Thank you for your interest! We\'ll be in touch soon.');
        //     form.reset();
        // })
        // .catch(error => console.error('Error:', error));
    });
}

// Smooth scroll animation on page load
window.addEventListener('load', function () {
    // Add fade-in animation to elements
    const elements = document.querySelectorAll('.crisis-card, .pricing-card, .feature');
    elements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        el.style.transitionDelay = `${index * 0.1}s`;
        
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 100);
    });
});

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function (entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements for scroll animations
document.querySelectorAll('.crisis-card, .pricing-card, .feature').forEach(el => {
    observer.observe(el);
});

// Mobile menu toggle (if needed in future)
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

// Sticky navbar effect
let lastScrollTop = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', function () {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 100) {
        navbar.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.boxShadow = 'none';
    }
    
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});

// Button click handlers
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
        // Check if button is a form submit button
        if (this.type !== 'submit') {
            // Scroll to form or show message
            const form = document.getElementById('earlyAccessForm');
            if (form && (this.textContent.includes('Early Access') || this.textContent.includes('Waitlist'))) {
                form.scrollIntoView({ behavior: 'smooth' });
                form.querySelector('input[name="fullName"]').focus();
            }
        }
    });
});

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function () {
    console.log('TRAK Landing Page loaded successfully');
    
    // Add any additional initialization here
});
