// =============================================
// INFO.JS - Static Pages (About, Contact)
// =============================================

// Initialize contact form
function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
}

// Handle contact form submission
async function handleContactSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('contact-name')?.value;
    const email = document.getElementById('contact-email')?.value;
    const subject = document.getElementById('contact-subject')?.value;
    const message = document.getElementById('contact-message')?.value;
    
    if (!name || !email || !message) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }
    
    // Show sending status
    const submitBtn = document.querySelector('#contact-form .submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;
    
    try {
        // In a real application, you would send this to your backend
        // const response = await fetch('../api.php?request=contact', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ name, email, subject, message })
        // });
        // const data = await response.json();
        
        // For demo, simulate success
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showToast('Message sent successfully! We\'ll get back to you soon.', 'success');
        document.getElementById('contact-form').reset();
        
    } catch (error) {
        console.error('Contact form error:', error);
        showToast('Failed to send message. Please try again later.', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Initialize FAQ interactions (optional)
function initFAQ() {
    const faqCards = document.querySelectorAll('.faq-card');
    faqCards.forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('expanded');
        });
    });
}

// Initialize newsletter form if present
function initNewsletter() {
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            const email = emailInput?.value;
            
            if (!email || !validateEmail(email)) {
                showToast('Please enter a valid email address', 'error');
                return;
            }
            
            showToast('Subscribed successfully!', 'success');
            emailInput.value = '';
        });
    }
}

// Initialize all static page features
document.addEventListener('DOMContentLoaded', () => {
    initContactForm();
    initFAQ();
    initNewsletter();
});

// Make functions global
window.initContactForm = initContactForm;
window.handleContactSubmit = handleContactSubmit;