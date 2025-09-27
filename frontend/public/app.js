// Course Module Dropdown Functionality
class CourseModules {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupInitialState();
    }

    bindEvents() {
        // Get all module headers
        const moduleHeaders = document.querySelectorAll('.module-card__header');
        
        moduleHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleModule(header);
            });

            // Add keyboard support
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleModule(header);
                }
            });
        });

        // CTA Button functionality - handle both buttons
        const ctaButtons = document.querySelectorAll('.cta__button, .hero__cta-button');
        ctaButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.handleCTAClick();
            });
        });

        // Resource link tracking
        const resourceLinks = document.querySelectorAll('.resource-link');
        resourceLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleResourceClick(link);
            });
        });
    }

    setupInitialState() {
        // Ensure all modules start collapsed
        const moduleCards = document.querySelectorAll('.module-card');
        moduleCards.forEach(card => {
            card.classList.remove('module-card--expanded');
        });

        const moduleContents = document.querySelectorAll('.module-card__content');
        moduleContents.forEach(content => {
            content.style.maxHeight = '0';
        });
    }

    toggleModule(header) {
        const moduleNumber = header.dataset.module;
        const moduleCard = header.closest('.module-card');
        const moduleContent = document.querySelector(`[data-content="${moduleNumber}"]`);
        const icon = header.querySelector('.module-card__icon');

        if (!moduleCard || !moduleContent) return;

        const isExpanded = moduleCard.classList.contains('module-card--expanded');

        if (isExpanded) {
            // Collapse the module
            this.collapseModule(moduleCard, moduleContent);
        } else {
            // Expand the module (and optionally collapse others)
            this.expandModule(moduleCard, moduleContent);
        }

        // Add smooth rotation to icon
        if (icon) {
            icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
        }

        // Track interaction
        this.trackModuleInteraction(moduleNumber, !isExpanded);
    }

    expandModule(moduleCard, moduleContent) {
        // Add expanded class
        moduleCard.classList.add('module-card--expanded');

        // Calculate the actual height needed
        const scrollHeight = moduleContent.scrollHeight;
        
        // Set max-height to allow smooth transition
        moduleContent.style.maxHeight = scrollHeight + 'px';

        // Smooth scroll to module if it's not fully visible
        setTimeout(() => {
            this.scrollToModuleIfNeeded(moduleCard);
        }, 150);
    }

    collapseModule(moduleCard, moduleContent) {
        // Remove expanded class
        moduleCard.classList.remove('module-card--expanded');

        // Collapse content
        moduleContent.style.maxHeight = '0';
    }

    scrollToModuleIfNeeded(moduleCard) {
        const rect = moduleCard.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // If module header is not fully visible, scroll to it
        if (rect.top < 0 || rect.bottom > viewportHeight) {
            moduleCard.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    handleCTAClick() {
        // Scroll to modules section
        const modulesSection = document.querySelector('.modules');
        if (modulesSection) {
            modulesSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            // Optional: Auto-expand first module after scrolling
            setTimeout(() => {
                const firstModule = document.querySelector('.module-card');
                const firstHeader = firstModule?.querySelector('.module-card__header');
                if (firstHeader && !firstModule.classList.contains('module-card--expanded')) {
                    this.toggleModule(firstHeader);
                }
            }, 800);
        }

        // Track CTA interaction
        this.trackEvent('cta_clicked', 'begin_course');
    }

    handleResourceClick(link) {
        const resourceName = link.textContent.trim();
        
        // Show download notification
        this.showNotification(`${resourceName} will be available after course enrollment`, 'info');
        
        // Track resource interest
        this.trackEvent('resource_clicked', resourceName);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `
            <div class="notification__content">
                <span class="notification__message">${message}</span>
                <button class="notification__close" aria-label="Close notification">×</button>
            </div>
        `;

        // Add styles for notification
        this.addNotificationStyles();

        // Add to page
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => {
            notification.classList.add('notification--show');
        }, 100);

        // Auto hide after 5 seconds
        setTimeout(() => {
            this.hideNotification(notification);
        }, 5000);

        // Handle close button
        const closeBtn = notification.querySelector('.notification__close');
        closeBtn.addEventListener('click', () => {
            this.hideNotification(notification);
        });
    }

    hideNotification(notification) {
        notification.classList.remove('notification--show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    addNotificationStyles() {
        // Check if styles already added
        if (document.querySelector('#notification-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--color-surface);
                border: 1px solid var(--color-border);
                border-left: 4px solid var(--color-info);
                border-radius: var(--radius-base);
                box-shadow: var(--shadow-lg);
                padding: var(--space-16);
                max-width: 400px;
                transform: translateX(100%);
                transition: transform var(--duration-normal) var(--ease-standard);
                z-index: 1000;
            }

            .notification--show {
                transform: translateX(0);
            }

            .notification--info {
                border-left-color: var(--color-info);
            }

            .notification--success {
                border-left-color: var(--color-success);
            }

            .notification--warning {
                border-left-color: var(--color-warning);
            }

            .notification--error {
                border-left-color: var(--color-error);
            }

            .notification__content {
                display: flex;
                align-items: flex-start;
                gap: var(--space-12);
            }

            .notification__message {
                flex: 1;
                font-size: var(--font-size-sm);
                color: var(--color-text);
                line-height: var(--line-height-normal);
            }

            .notification__close {
                background: none;
                border: none;
                font-size: var(--font-size-lg);
                color: var(--color-text-secondary);
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: var(--radius-sm);
                transition: background-color var(--duration-fast) var(--ease-standard);
            }

            .notification__close:hover {
                background: var(--color-secondary);
                color: var(--color-text);
            }

            @media (max-width: 480px) {
                .notification {
                    right: 16px;
                    left: 16px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    trackModuleInteraction(moduleNumber, expanded) {
        // Analytics tracking (placeholder)
        if (typeof gtag !== 'undefined') {
            gtag('event', expanded ? 'module_expanded' : 'module_collapsed', {
                'module_number': moduleNumber,
                'event_category': 'course_interaction'
            });
        }
    }

    trackEvent(action, label) {
        // Analytics tracking (placeholder)
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                'event_label': label,
                'event_category': 'course_interaction'
            });
        }
    }
}

// Smooth scrolling enhancement
class SmoothScrolling {
    constructor() {
        this.init();
    }

    init() {
        // Enhance existing anchor links
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
}

// Page Loading Animation
class PageAnimations {
    constructor() {
        this.init();
    }

    init() {
        // Add loading class to prevent flash of unstyled content
        document.body.classList.add('page-loading');

        // Remove loading class when page is ready
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                document.body.classList.remove('page-loading');
                document.body.classList.add('page-loaded');
            }, 100);
        });

        // Add intersection observer for scroll animations
        this.setupScrollAnimations();
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements for animation
        const animatedElements = document.querySelectorAll('.stat-card, .module-card');
        animatedElements.forEach(el => {
            observer.observe(el);
        });
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CourseModules();
    new SmoothScrolling();
    new PageAnimations();
});

// Add some additional interactive enhancements
document.addEventListener('DOMContentLoaded', () => {
    // Add hover effects to stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-4px)';
            card.style.transition = 'transform 0.2s ease';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });

    // Add focus styles for better accessibility
    const focusableElements = document.querySelectorAll('button, a, [tabindex]');
    focusableElements.forEach(el => {
        el.addEventListener('focus', () => {
            el.classList.add('has-focus');
        });

        el.addEventListener('blur', () => {
            el.classList.remove('has-focus');
        });
    });
});