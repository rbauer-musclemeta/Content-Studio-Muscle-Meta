import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/use-toast';

const PickleballCourseStyled = () => {
  const { toast } = useToast();
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Load the custom CSS
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/pickleball-course.css';
    document.head.appendChild(link);

    return () => {
      // Cleanup: remove the CSS when component unmounts
      document.head.removeChild(link);
    };
  }, []);

  const handleEnrollment = async () => {
    setIsEnrolling(true);
    
    try {
      const currentUrl = window.location.origin;
      const successUrl = `${currentUrl}/courses/pickleball-3p-system/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${currentUrl}/courses/pickleball-3p-system`;

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/payments/checkout/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_id: 'pickleball-3p-system',
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            course_title: 'The Science Behind the 3P System',
            instructor: 'Randy Bauer, PT',
            source: 'pickleball_styled_course_page'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create checkout session');
      }

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      toast({
        title: "Enrollment Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleCTAClick = () => {
    const modulesSection = document.querySelector('.modules');
    if (modulesSection) {
      modulesSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      setTimeout(() => {
        const firstModule = document.querySelector('.module-card');
        const firstHeader = firstModule?.querySelector('.module-card__header');
        if (firstHeader && !firstModule.classList.contains('module-card--expanded')) {
          toggleModule(firstHeader);
        }
      }, 800);
    }
  };

  const toggleModule = (header) => {
    const moduleNumber = header.dataset.module;
    const moduleCard = header.closest('.module-card');
    const moduleContent = document.querySelector(`[data-content="${moduleNumber}"]`);
    const icon = header.querySelector('.module-card__icon');

    if (!moduleCard || !moduleContent) return;

    const isExpanded = moduleCard.classList.contains('module-card--expanded');

    if (isExpanded) {
      moduleCard.classList.remove('module-card--expanded');
      moduleContent.style.maxHeight = '0';
      header.setAttribute('aria-expanded', 'false');
    } else {
      moduleCard.classList.add('module-card--expanded');
      const scrollHeight = moduleContent.scrollHeight;
      moduleContent.style.maxHeight = scrollHeight + 'px';
      header.setAttribute('aria-expanded', 'true');
    }

    if (icon) {
      icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
    }
  };

  useEffect(() => {
    // Bind module toggle events
    const moduleHeaders = document.querySelectorAll('.module-card__header');
    
    const handleModuleClick = (e) => {
      e.preventDefault();
      toggleModule(e.currentTarget);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleModule(e.currentTarget);
      }
    };

    moduleHeaders.forEach(header => {
      header.addEventListener('click', handleModuleClick);
      header.addEventListener('keydown', handleKeyDown);
    });

    // Bind CTA buttons
    const ctaButtons = document.querySelectorAll('.cta__button, .hero__cta-button');
    ctaButtons.forEach(button => {
      button.addEventListener('click', handleCTAClick);
    });

    // Cleanup
    return () => {
      moduleHeaders.forEach(header => {
        header.removeEventListener('click', handleModuleClick);
        header.removeEventListener('keydown', handleKeyDown);
      });
      ctaButtons.forEach(button => {
        button.removeEventListener('click', handleCTAClick);
      });
    };
  }, []);

  return (
    <div className="pickleball-course">
      {/* Header Section */}
      <header className="header">
        <div className="container">
          <div className="header__content">
            <div className="brand">
              <h1 className="brand__name">Muscle-Meta</h1>
              <p className="brand__tagline">Evidence-Based Movement Solutions</p>
            </div>
            <div className="instructor">
              <p className="instructor__name">Randy Bauer PT</p>
              <p className="instructor__credentials">Physical Therapist & Performance Specialist</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero__content">
            <div className="hero__text">
              <h1 className="hero__title">The Science Behind the 3P System</h1>
              <h2 className="hero__subtitle">Preparation, Prevention, and Performance for Pickleball Excellence</h2>
              <p className="hero__description">
                Revolutionary Evidence-Based Approach to Pickleball Training
              </p>
              <p className="hero__overview">
                This comprehensive framework addresses the sport's unique challenges through three interconnected pillars, 
                built on cutting-edge research in muscle-metabolic health, injury prevention science, and performance optimization.
              </p>
            </div>
            <div className="hero__stats">
              <div className="stat-card stat-card--error">
                <div className="stat-card__number">68.5%</div>
                <div className="stat-card__label">Annual injury rate in pickleball</div>
              </div>
              <div className="stat-card stat-card--success">
                <div className="stat-card__number">70%</div>
                <div className="stat-card__label">Injury reduction with 3P System</div>
              </div>
              <div className="stat-card stat-card--warning">
                <div className="stat-card__number">$2,400</div>
                <div className="stat-card__label">Average injury cost</div>
              </div>
              <div className="stat-card stat-card--performance">
                <div className="stat-card__number">25-40%</div>
                <div className="stat-card__label">Performance improvement</div>
              </div>
            </div>
            <div className="hero__cta">
              <button className="hero__cta-button">Begin Your Course</button>
            </div>
          </div>
        </div>
      </section>

      {/* Course Modules Section */}
      <section className="modules">
        <div className="container">
          <h2 className="modules__title">Course Modules</h2>
          <p className="modules__subtitle">Interactive learning path with downloadable resources</p>
          
          <div className="modules__list">
            {/* Module 1 */}
            <div className="module-card">
              <button className="module-card__header" data-module="1" tabindex="0" role="button" aria-expanded="false">
                <div className="module-card__info">
                  <div className="module-card__number">Module 1</div>
                  <h3 className="module-card__title">Foundation Assessment & The Muscle-Meta Matrix</h3>
                  <p className="module-card__description">Master the comprehensive assessment framework and understand the four pillars of muscle-metabolic health</p>
                </div>
                <div className="module-card__icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </button>
              <div className="module-card__content" data-content="1">
                <div className="lessons">
                  <div className="lesson">
                    <h4 className="lesson__title">1.1 Complete Movement & Fitness Assessment</h4>
                    <p className="lesson__content">Learn to conduct comprehensive self-assessments including grip strength, balance testing, functional movement screening, and metabolic flexibility evaluation</p>
                  </div>
                  <div className="lesson">
                    <h4 className="lesson__title">1.2 The 4-Pillar Muscle-Meta Matrix Framework</h4>
                    <p className="lesson__content">Deep dive into Exercise & Movement, Nutrition & Metabolism, Recovery & Stress, and Balance & Brain Health pillars</p>
                  </div>
                  <div className="lesson">
                    <h4 className="lesson__title">1.3 Risk Stratification & Tier Classification</h4>
                    <p className="lesson__content">Understand the Foundation Builder, Game Ready, and Elite Ready classification system and determine your starting point</p>
                  </div>
                  <div className="lesson">
                    <h4 className="lesson__title">1.4 Personal Foundation Blueprint Creation</h4>
                    <p className="lesson__content">Create your personalized training roadmap based on assessment results and tier classification</p>
                  </div>
                </div>
                <div className="resources">
                  <h4 className="resources__title">Downloadable Resources</h4>
                  <ul className="resources__list">
                    <li><a href="#" className="resource-link">Assessment Workbook</a></li>
                    <li><a href="#" className="resource-link">Movement Screening Checklist</a></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Module 2 */}
            <div className="module-card">
              <button className="module-card__header" data-module="2" tabindex="0" role="button" aria-expanded="false">
                <div className="module-card__info">
                  <div className="module-card__number">Module 2</div>
                  <h3 className="module-card__title">PREPARATION - Building Your Pickleball Foundation</h3>
                  <p className="module-card__description">4-6 week systematic preparation protocols for injury-resistant play and optimal performance readiness</p>
                </div>
                <div className="module-card__icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </button>
              <div className="module-card__content" data-content="2">
                <div className="lessons">
                  <div className="lesson">
                    <h4 className="lesson__title">2.1 Joint Mobility & Movement Pattern Mastery</h4>
                    <p className="lesson__content">Restore pickleball-specific joint mobility and master fundamental movement patterns before high-intensity play</p>
                  </div>
                  <div className="lesson">
                    <h4 className="lesson__title">2.2 Strength Foundation Development</h4>
                    <p className="lesson__content">Build posterior chain strength, core stability, and movement competency using progressive loading principles</p>
                  </div>
                  <div className="lesson">
                    <h4 className="lesson__title">2.3 VILPA Integration & Metabolic Base Building</h4>
                    <p className="lesson__content">Integrate 4-minute daily VILPA protocols and build cardiovascular base using evidence-based movement snacks</p>
                  </div>
                  <div className="lesson">
                    <h4 className="lesson__title">2.4 Progressive Loading Toward Sport Participation</h4>
                    <p className="lesson__content">Systematic progression from foundation movements to sport-specific demands over 4-6 week timeline</p>
                  </div>
                </div>
                <div className="resources">
                  <h4 className="resources__title">Downloadable Resources</h4>
                  <ul className="resources__list">
                    <li><a href="#" className="resource-link">Foundation Training Guide</a></li>
                    <li><a href="#" className="resource-link">VILPA Activity Progressions</a></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Module 3 */}
            <div className="module-card">
              <button className="module-card__header" data-module="3" tabindex="0" role="button" aria-expanded="false">
                <div className="module-card__info">
                  <div className="module-card__number">Module 3</div>
                  <h3 className="module-card__title">PREVENTION - Your Insurance Policy</h3>
                  <p className="module-card__description">Smart load management and movement quality protocols for documented 70% injury reduction</p>
                </div>
                <div className="module-card__icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </button>
              <div className="module-card__content" data-content="3">
                <div className="lessons">
                  <div className="lesson">
                    <h4 className="lesson__title">3.1 Risk Screening & Movement Quality Assessment</h4>
                    <p className="lesson__content">Ongoing screening protocols to identify movement limitations and injury risk factors before they cause problems</p>
                  </div>
                  <div className="lesson">
                    <h4 className="lesson__title">3.2 Load Management & Recovery Protocols</h4>
                    <p className="lesson__content">Balance training stress with recovery capacity using heart rate variability and subjective wellness monitoring</p>
                  </div>
                  <div className="lesson">
                    <h4 className="lesson__title">3.3 Pre-Play Preparation Routines</h4>
                    <p className="lesson__content">Dynamic warm-up sequences, activation exercises, and court-ready preparation protocols</p>
                  </div>
                  <div className="lesson">
                    <h4 className="lesson__title">3.4 Environmental & Equipment Optimization</h4>
                    <p className="lesson__content">Equipment selection, court surface considerations, and environmental modifications for injury prevention</p>
                  </div>
                </div>
                <div className="resources">
                  <h4 className="resources__title">Downloadable Resources</h4>
                  <ul className="resources__list">
                    <li><a href="#" className="resource-link">Prevention Protocol Handbook</a></li>
                    <li><a href="#" className="resource-link">Load Management Tracker</a></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Module 4 */}
            <div className="module-card">
              <button className="module-card__header" data-module="4" tabindex="0" role="button" aria-expanded="false">
                <div className="module-card__info">
                  <div className="module-card__number">Module 4</div>
                  <h3 className="module-card__title">PERFORMANCE - Optimizing Your Game</h3>
                  <p className="module-card__description">Sport-specific training protocols for 25-40% performance improvement and competitive excellence</p>
                </div>
                <div className="module-card__icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </button>
              <div className="module-card__content" data-content="4">
                <div className="lessons">
                  <div className="lesson">
                    <h4 className="lesson__title">4.1 Power Development & Explosive Training</h4>
                    <p className="lesson__content">Plyometric training, explosive strength development, and power transfer for enhanced shot-making ability</p>
                  </div>
                  <div className="lesson">
                    <h4 className="lesson__title">4.2 Reactive Agility & Court Movement</h4>
                    <p className="lesson__content">Unpredictable stimulus-response training, court positioning, and movement efficiency optimization</p>
                  </div>
                  <div className="lesson">
                    <h4 className="lesson__title">4.3 Endurance Integration & Energy Systems</h4>
                    <p className="lesson__content">Aerobic capacity building, anaerobic power development, and energy system integration for sustained performance</p>
                  </div>
                  <div className="lesson">
                    <h4 className="lesson__title">4.4 Competition Preparation & Peak Performance</h4>
                    <p className="lesson__content">Tournament preparation, competition simulation, and peak performance maintenance strategies</p>
                  </div>
                </div>
                <div className="resources">
                  <h4 className="resources__title">Downloadable Resources</h4>
                  <ul className="resources__list">
                    <li><a href="#" className="resource-link">Performance Training Manual</a></li>
                    <li><a href="#" className="resource-link">Competition Readiness Checklist</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta">
        <div className="container">
          <div className="cta__content">
            <h2 className="cta__title">Ready to Transform Your Pickleball Game?</h2>
            <p className="cta__description">Join thousands of players who have reduced their injury risk and improved performance with the 3P System</p>
            <button 
              className="cta__button"
              onClick={handleEnrollment}
              disabled={isEnrolling}
            >
              {isEnrolling ? 'Processing...' : 'Begin Your Course'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="footer">
        <div className="container">
          <div className="footer__content">
            <div className="guarantee">
              <h3 className="guarantee__title">Course Guarantee</h3>
              <p className="guarantee__text">70% injury reduction or money back</p>
            </div>
            <div className="contact">
              <h3 className="contact__title">Contact Muscle-Meta</h3>
              <p className="contact__email">info@muscle-meta.com</p>
              <p className="contact__phone">1-800-MUSCLE</p>
            </div>
          </div>
          <div className="footer__bottom">
            <p>&copy; 2025 Muscle-Meta. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PickleballCourseStyled;