// GitHub API integration
async function fetchGitHubStars() {
    try {
        const response = await fetch('https://api.github.com/repos/osasisorae/trak');
        const data = await response.json();
        const stars = data.stargazers_count || 0;
        
        // Update star counts
        document.getElementById('github-stars').textContent = `⭐ ${stars}`;
        const footerStars = document.getElementById('footer-stars');
        if (footerStars) {
            footerStars.textContent = `⭐ ${stars} Star on GitHub`;
        }
    } catch (error) {
        console.log('Could not fetch GitHub stars');
    }
}

// Smooth scrolling
function scrollToWaitlist() {
    document.getElementById('waitlist').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Video demo functions
function playHeroVideo() {
    const videoContainer = document.querySelector('.video-preview');
    const overlay = document.querySelector('.video-overlay');
    const playButton = document.querySelector('.play-button-large');
    
    // For demo purposes, show message
    overlay.innerHTML = `
        <h3>Demo Video Coming Soon!</h3>
        <p>Check out our <a href="https://github.com/osasisorae/trak/blob/main/DEMO.md" target="_blank" style="color: white; text-decoration: underline;">demo script</a> for now</p>
    `;
    playButton.style.display = 'none';
}

function playMainDemo() {
    const videoContainer = document.querySelector('.video-container');
    const videoInfo = document.querySelector('.video-info');
    const playButton = document.querySelector('.play-button-xl');
    
    // For demo purposes, show message
    videoInfo.innerHTML = `
        <h3>Full Demo Coming Soon!</h3>
        <p>Check out our <a href="https://github.com/osasisorae/trak/blob/main/DEMO.md" target="_blank" style="color: white; text-decoration: underline;">demo script</a> for now</p>
        <span class="video-duration">Available Soon</span>
    `;
    playButton.style.display = 'none';
}

function playFeatureDemo(feature) {
    // For demo purposes, just show an alert
    const featureNames = {
        'dashboard': 'Team Dashboard Demo',
        'ai-insights': 'AI Usage Insights Demo', 
        'quality-gates': 'Quality Gates Demo'
    };
    
    alert(`${featureNames[feature]} coming soon! Check out our GitHub repo for more details.`);
}

// Enhanced waitlist form submission
async function submitWaitlist(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    const submitText = document.getElementById('submit-text');
    
    // Show loading state
    submitButton.classList.add('loading');
    submitText.textContent = 'Joining waitlist...';
    
    try {
        // Collect enhanced form data
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            company: formData.get('company'),
            role: formData.get('role'),
            team_size: formData.get('team_size'),
            ai_tools: formData.get('ai_tools'),
            timestamp: new Date().toISOString(),
            source: 'landing_page'
        };
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // For now, just log to console (in production, send to your backend)
        console.log('Enhanced waitlist submission:', data);
        
        // Show success state
        submitButton.classList.remove('loading');
        submitButton.classList.add('success');
        submitText.textContent = 'Welcome to the beta program!';
        
        // Reset form
        form.reset();
        
        // Show success notification
        showNotification('🎉 You\'re on the list! We\'ll be in touch with early access details soon.', 'success');
        
        // Reset button after 4 seconds
        setTimeout(() => {
            submitButton.classList.remove('success');
            submitText.textContent = 'Get Early Access - 50% Off';
        }, 4000);
        
    } catch (error) {
        // Show error state
        submitButton.classList.remove('loading');
        submitButton.classList.add('error');
        submitText.textContent = 'Try again';
        
        showNotification('Something went wrong. Please try again.', 'error');
        
        // Reset button after 3 seconds
        setTimeout(() => {
            submitButton.classList.remove('error');
            submitText.textContent = 'Get Early Access - 50% Off';
        }, 3000);
    }
}

// Enhanced notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '100px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '12px',
        color: 'white',
        fontWeight: '500',
        zIndex: '9999',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease-out',
        maxWidth: '400px',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
    });
    
    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6'
    };
    notification.style.background = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 6 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 6000);
}

// Intersection Observer for animations
function setupAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll(
        '.solution-feature, .testimonial-card, .pricing-card, .demo-feature-card'
    );
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    fetchGitHubStars();
    setupAnimations();
    
    // Update GitHub stars every 5 minutes
    setInterval(fetchGitHubStars, 5 * 60 * 1000);
});

// Handle navigation link clicks
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Enhanced scroll effect for navigation
window.addEventListener('scroll', () => {
    const nav = document.querySelector('.nav');
    if (window.scrollY > 50) {
        nav.style.background = 'rgba(255, 255, 255, 0.98)';
        nav.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)';
    } else {
        nav.style.background = 'rgba(255, 255, 255, 0.95)';
        nav.style.boxShadow = 'none';
    }
});
