// GitHub API integration
async function fetchGitHubStars() {
    try {
        const response = await fetch('https://api.github.com/repos/osasisorae/trak');
        const data = await response.json();
        const stars = data.stargazers_count || 0;
        
        // Update star counts
        document.getElementById('github-stars').textContent = `⭐ ${stars}`;
        document.getElementById('github-stars-count').textContent = stars;
    } catch (error) {
        console.log('Could not fetch GitHub stars');
        document.getElementById('github-stars-count').textContent = '⭐';
    }
}

// Smooth scrolling
function scrollToWaitlist() {
    document.getElementById('waitlist').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Demo video placeholder
function playDemo() {
    const videoPlaceholder = document.querySelector('.video-placeholder');
    const overlay = document.querySelector('.video-overlay');
    const playButton = document.querySelector('.play-button');
    
    // For now, just show a message since we don't have a real video
    overlay.innerHTML = `
        <h3>Demo Coming Soon!</h3>
        <p>Check out the <a href="https://github.com/osasisorae/trak/blob/main/DEMO.md" target="_blank" style="color: white; text-decoration: underline;">demo script</a> for now</p>
    `;
    playButton.style.display = 'none';
    
    // In a real implementation, you would embed a video here
    // videoPlaceholder.innerHTML = '<iframe src="demo-video.mp4" ...></iframe>';
}

// Waitlist form submission
async function submitWaitlist(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    const submitText = document.getElementById('submit-text');
    
    // Show loading state
    submitButton.classList.add('loading');
    submitText.textContent = 'Joining...';
    
    try {
        // For demo purposes, we'll simulate a successful submission
        // In production, you'd send this to your backend or a service like Netlify Forms
        
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            company: formData.get('company'),
            team_size: formData.get('team_size'),
            timestamp: new Date().toISOString()
        };
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // For now, just log to console (in production, send to your backend)
        console.log('Waitlist submission:', data);
        
        // Show success state
        submitButton.classList.remove('loading');
        submitButton.classList.add('success');
        submitText.textContent = 'Welcome to the waitlist!';
        
        // Reset form
        form.reset();
        
        // Show success message
        showNotification('Thanks for joining! We\'ll be in touch soon.', 'success');
        
        // Reset button after 3 seconds
        setTimeout(() => {
            submitButton.classList.remove('success');
            submitText.textContent = 'Join Waitlist';
        }, 3000);
        
    } catch (error) {
        // Show error state
        submitButton.classList.remove('loading');
        submitButton.classList.add('error');
        submitText.textContent = 'Try again';
        
        showNotification('Something went wrong. Please try again.', 'error');
        
        // Reset button after 3 seconds
        setTimeout(() => {
            submitButton.classList.remove('error');
            submitText.textContent = 'Join Waitlist';
        }, 3000);
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        zIndex: '9999',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease-out',
        maxWidth: '400px'
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
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
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
    const animatedElements = document.querySelectorAll('.problem-card, .feature-section, .demo-feature');
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

// Add scroll effect to navigation
window.addEventListener('scroll', () => {
    const nav = document.querySelector('.nav');
    if (window.scrollY > 100) {
        nav.style.background = 'rgba(255, 255, 255, 0.98)';
        nav.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1)';
    } else {
        nav.style.background = 'rgba(255, 255, 255, 0.95)';
        nav.style.boxShadow = 'none';
    }
});
