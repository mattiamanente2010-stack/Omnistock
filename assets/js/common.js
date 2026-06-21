// common.js
let utenteAttuale = null;

document.addEventListener('DOMContentLoaded', () => {
    if(!window.location.pathname.includes('staff-dashboard.html')) {
        renderNavbar();
    }
    verificaSessione();
});

function renderNavbar() {
    const path = window.location.pathname;
    
    const isActive = (href) => {
        if (href === '/' && (path === '/' || path.endsWith('index.html'))) return true;
        if (href !== '/' && path.includes(href)) return true;
        return false;
    };
    
    const styleLink = (href, text) => {
        const active = isActive(href);
        const color = active ? '#ffffff' : 'var(--text-muted)';
        const weight = active ? '800' : '600';
        const background = active ? 'rgba(255,255,255,0.08)' : 'transparent';
        const padding = '0.5rem 1.25rem';
        const borderRadius = '99px';
        return `<a href="${href}" style="color: ${color}; text-decoration: none; font-size: 0.9rem; font-weight: ${weight}; background: ${background}; padding: ${padding}; border-radius: ${borderRadius}; transition: all 0.2s;" onmouseover="this.style.color='#fff'; this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.color='${color}'; this.style.background='${background}'">${text}</a>`;
    };

    const navbarHTML = `
    <nav class="global-nav">
        <a href="/" class="nav-brand">
            <i class="fa-solid fa-building-shield" style="color: var(--primary-light);"></i> Omnistock
        </a>
        <div class="nav-links">
            ${styleLink('/', '<i class="fa-solid fa-house"></i> <span class="nav-text">Home</span>')}
            ${styleLink('/pages/shop.html', '<i class="fa-solid fa-store"></i> <span class="nav-text">Vetrina</span>')}
            ${styleLink('/pages/info.html', '<i class="fa-solid fa-book-open"></i> <span class="nav-text">Supporto</span>')}
            ${styleLink('/pages/clienti.html', '<i class="fa-solid fa-user"></i> <span class="nav-text">Area Clienti</span>')}
            
            <span id="nav-auth-section" class="nav-auth">
                <a href="/pages/staff.html" style="background: rgba(37,99,235,0.15); color: #60a5fa; padding: 0.5rem 1rem; border-radius: 99px; border: 1px solid rgba(37,99,235,0.3); text-decoration: none; font-size: 0.85rem; font-weight: 800; transition: all 0.2s;"><i class="fa-solid fa-shield-halved"></i> <span class="nav-text">Area Staff</span></a>
            </span>
        </div>
    </nav>
    <div style="height: 2rem;"></div>
    `;
    
    // Insert navbar at the beginning of the body
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
}

function verificaSessione() {
    const savedToken = localStorage.getItem('omnistock_staff_token');
    const authSection = document.getElementById('nav-auth-section');
    
    if (savedToken) {
        // Interroga Firebase per verificare la validità
        db.ref('staff/' + savedToken).once('value', snapshot => {
            if (snapshot.exists()) {
                utenteAttuale = snapshot.val();
                utenteAttuale.pass = savedToken;
                
                // Aggiorna navbar
                if (authSection) {
                    authSection.innerHTML = `
                        <a href="/pages/staff-dashboard.html" style="background: rgba(16,185,129,0.15); color: #10b981; padding: 0.5rem 1rem; border-radius: 99px; border: 1px solid rgba(16,185,129,0.3); text-decoration: none; font-size: 0.85rem; font-weight: 800;"><i class="fa-solid fa-user-tie"></i> <span class="nav-text">Dashboard</span></a>
                        <button onclick="eseguiLogout()" style="background: transparent; border: none; color: #ef4444; margin-left: 0.75rem; cursor: pointer; font-size: 1.1rem; opacity: 0.8; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'" title="Esci"><i class="fa-solid fa-right-from-bracket"></i></button>
                    `;
                }
                
                // Se siamo nella dashboard, carica i dati
                if (window.location.pathname.includes('staff-dashboard.html')) {
                    if (typeof initDashboard === 'function') initDashboard();
                }
                // Se siamo nel login ma siamo già loggati, reindirizza
                if (window.location.pathname.includes('staff.html')) {
                    window.location.href = '/pages/staff-dashboard.html';
                }
            } else {
                // Token non più valido
                eseguiLogout(false);
            }
        });
    } else {
        // Non loggato
        if (window.location.pathname.includes('staff-dashboard.html')) {
            window.location.href = '/pages/staff.html';
        }
    }
}

function eseguiLogout(redirect = true) {
    localStorage.removeItem('omnistock_staff_token');
    utenteAttuale = null;
    if (redirect) {
        window.location.href = '/';
    } else {
        location.reload();
    }
}
