
// Panel functionality
const openLoginBtn = document.getElementById('openLogin');
const openRegisterBtn = document.getElementById('openRegister');
const closeLoginBtn = document.getElementById('closeLogin');
const closeRegisterBtn = document.getElementById('closeRegister');
const loginPanel = document.getElementById('loginPanel');
const registerPanel = document.getElementById('registerPanel');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const joinlink = document.getElementById('joinlink');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginErrorMessage = document.getElementById('loginErrorMessage');
const loginSuccessMessage = document.getElementById('loginSuccessMessage');
const registerErrorMessage = document.getElementById('registerErrorMessage');

// Open/close panels
function openPanel(panel) {
    // Close any open panels first
    loginPanel.classList.remove('active');
    registerPanel.classList.remove('active');
    
    // Open the requested panel
    panel.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closePanels() {
    loginPanel.classList.remove('active');
    registerPanel.classList.remove('active');
}

// Event listeners for panel controls
openLoginBtn.addEventListener('click', () => {
    openPanel(loginPanel);
    history.replaceState(null, '', '?panel=login');
});

openRegisterBtn.addEventListener('click', () => {
    openPanel(registerPanel);
    history.replaceState(null, '', '?panel=register');
});

joinlink.addEventListener('click', () => {
    openPanel(registerPanel);
    history.replaceState(null, '', '?panel=register');
});



closeLoginBtn.addEventListener('click', () => {
  registerPanel.classList.remove('active');
  // 🔥 Remove query string completely
  history.replaceState(null, '', window.location.pathname);
});
closeRegisterBtn.addEventListener('click', () => {
  registerPanel.classList.remove('active');
  // 🔥 Remove query string completely
  history.replaceState(null, '', window.location.pathname);
});
closeLoginBtn.addEventListener('click', closePanels);
closeRegisterBtn.addEventListener('click', closePanels);

showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    openPanel(registerPanel);
    history.replaceState(null, '', '?panel=register');
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    openPanel(loginPanel);
    history.replaceState(null, '', '?panel=login');
});

// Check URL for panel parameter on load
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const panel = urlParams.get('panel');
    
    if (panel === 'login') {
        openPanel(loginPanel);
    } else if (panel === 'register') {
        openPanel(registerPanel);
    }
});
// Price update simulation
function updatePrices() {
    const priceElements = document.querySelectorAll('.asset-price');

    priceElements.forEach(el => {
        const currentPrice = parseFloat(el.textContent.replace(/[^\d.]/g, ''));
        let newPrice = currentPrice;

        const assetName = el.previousElementSibling?.textContent?.trim();

        // Special handling for Crude Oil
        if (assetName === 'Crude Oil') {
            const change = (Math.random() - 0.5) * 0.8;
            newPrice = currentPrice + change;
            if (newPrice > 73) newPrice = 73;
            if (newPrice < 69) newPrice = 69;
        } else {
            const change = (Math.random() - 0.5) * 1.2;
            newPrice = currentPrice + change;
        }

        // Update price
        el.textContent = '$' + newPrice.toFixed(2);

        // Update % change
        const changeElement = el.nextElementSibling;
        const arrow = changeElement.querySelector('i');
        const changeValue = changeElement.querySelector('span');
        const percentChange = ((newPrice - currentPrice) / currentPrice * 100).toFixed(2);

        if (newPrice > currentPrice) {
            changeElement.className = 'asset-change change-positive';
            arrow.className = 'fas fa-arrow-up';
            changeValue.textContent = '+' + percentChange + '%';
        } else {
            changeElement.className = 'asset-change change-negative';
            arrow.className = 'fas fa-arrow-down';
            changeValue.textContent = percentChange + '%';
        }
    });

    // Update main trading card (EUR/USD)
    const mainPrice = document.querySelector('.price-display');
    const currentMainPrice = parseFloat(mainPrice.textContent);
    const mainChange = (Math.random() - 0.5) * 0.01;
    const newMainPrice = currentMainPrice + mainChange;
    mainPrice.textContent = newMainPrice.toFixed(5);

    const changeElement = document.querySelector('.price-change .change-up') || 
                         document.querySelector('.price-change .change-down');
    const changeValue = Math.abs(mainChange / currentMainPrice * 100).toFixed(2);

    if (mainChange >= 0) {
        changeElement.className = 'change-up';
        changeElement.innerHTML = '+' + changeValue + '%';
    } else {
        changeElement.className = 'change-down';
        changeElement.innerHTML = '-' + changeValue + '%';
    }
}

// Update prices every 5 seconds
setInterval(updatePrices, 5000);

// Auto-hide messages after 3 seconds
function autoHideMessages() {
    const messages = document.querySelectorAll('.error-message, .success-message');
    messages.forEach(msg => {
        if (msg.style.display === 'block') {
            setTimeout(() => {
                msg.style.transition = 'opacity 0.5s ease';
                msg.style.opacity = '0';
                setTimeout(() => msg.remove(), 500);
            }, 3000);
        }
    });
}

// Check for messages on load and auto-hide
document.addEventListener('DOMContentLoaded', autoHideMessages);

//popupdetails
// Get the elements
const openBtn = document.getElementById('openPopupBtn');
const closeBtn = document.getElementById('closePopupBtn');
const popup = document.getElementById('popupOverlay');

// Open popup
openBtn.addEventListener('click', function() {
    popup.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
});

// Close popup
closeBtn.addEventListener('click', function() {
    popup.style.display = 'none';
    document.body.style.overflow = 'auto'; // Enable scrolling
});
joinlink.addEventListener('click', function() {
    popup.style.display = 'none';
    document.body.style.overflow = 'auto'; // Enable scrolling
});

// Close when clicking outside content
popup.addEventListener('click', function(e) {
    if (e.target === popup) {
        popup.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Close with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        popup.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});
// input field validation
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('registerErrorMessage');

    registerForm.addEventListener('submit', function (e) {
        e.preventDefault(); // prevent form from submitting initially

        // Collect inputs
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('reg_email').value.trim();
        const password = document.getElementById('reg_password').value.trim();
        const confirmPassword = document.getElementById('confirm_password').value.trim();
        const terms = document.getElementById('terms').checked;

        // Reset error message
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';

        // Validate Name
        if (name.length < 3 || name.length > 16) {
            showError("❌ Name must be between 3 and 30 characters.");  return;
        }

        // Validate Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email) || email.length > 30) {
            showError("❌ Enter a valid email (max 30 characters).");
            return;
        }

        // Validate Password
        if (password.length < 8 || password.length > 16) {
            showError("❌ Password must be 8 character.");
            return;
        }

        // Confirm Password
        if (password !== confirmPassword) {
            showError("❌ Passwords do not match.");
            return;
        }

        // Terms Check
        if (!terms) {
            showError("❌ You must agree to the Terms of Service.");
            return;
        }

        // ✅ If all good, submit
        registerForm.submit();
    });

    function showError(message) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = message;

        // ⏳ Remove after 3 seconds
        setTimeout(() => {
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';
        }, 3000);
    }
});
