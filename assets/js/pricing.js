// Animation on scroll
function animateOnScroll() {
    const elements = document.querySelectorAll('.pricing-card, .faq-card');

    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;

        if (elementTop < window.innerHeight - elementVisible) {
            element.classList.add('animate');
        }
    });
}

// Billing toggle functionality
const billingToggle = document.querySelector('.billing-toggle input');
const monthlyPrices = document.querySelectorAll('.price .amount');
const annualPrices = document.querySelectorAll('.billed-annually');
const originalPrices = [44, 80, 228];
const annualDiscount = 0.8; // 20% discount

billingToggle.addEventListener('change', function () {
    if (this.checked) {
        // Switch to annual pricing
        monthlyPrices.forEach((element, index) => {
            const annualPrice = Math.round(originalPrices[index] * 12 * annualDiscount);
            element.textContent = Math.round(originalPrices[index] * annualDiscount);
            annualPrices[index].textContent = `$${annualPrice} billed annually`;
        });
    } else {
        // Switch to monthly pricing
        monthlyPrices.forEach((element, index) => {
            element.textContent = originalPrices[index];
            const annualPrice = Math.round(originalPrices[index] * 12 * annualDiscount);
            annualPrices[index].textContent = `$${annualPrice} billed annually`;
        });
    }
});