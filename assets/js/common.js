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
    <nav style="position: sticky; top: 1rem; z-index: 1000; margin: 0 auto; max-width: 900px; padding: 0.5rem 1rem; background: rgba(15, 17, 21, 0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); border-radius: 99px; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 1rem; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <a href="/" style="display: flex; align-items: center; gap: 0.5rem; color: #fff; text-decoration: none; font-weight: 900; font-size: 1.1rem; margin-right: auto; padding-left: 0.5rem;">
            <i class="fa-solid fa-building-shield" style="color: var(--primary-light);"></i> Omnistock
        </a>
        <div style="display: flex; flex-wrap: wrap; gap: 0.25rem; align-items: center; justify-content: center;">
            ${styleLink('/', '<i class="fa-solid fa-house" style="margin-right: 6px; opacity: 0.8;"></i>Home')}
            ${styleLink('/pages/shop.html', '<i class="fa-solid fa-store" style="margin-right: 6px; opacity: 0.8;"></i>Vetrina')}
            ${styleLink('/pages/info.html', '<i class="fa-solid fa-book-open" style="margin-right: 6px; opacity: 0.8;"></i>Supporto')}
            ${styleLink('/pages/clienti.html', '<i class="fa-solid fa-user" style="margin-right: 6px; opacity: 0.8;"></i>Area Clienti')}
            
            <span id="nav-auth-section" style="margin-left: 0.5rem; border-left: 1px solid rgba(255,255,255,0.1); padding-left: 1rem; display: flex; align-items: center;">
                <a href="/pages/staff.html" style="background: rgba(37,99,235,0.15); color: #60a5fa; padding: 0.5rem 1rem; border-radius: 99px; border: 1px solid rgba(37,99,235,0.3); text-decoration: none; font-size: 0.85rem; font-weight: 800; transition: all 0.2s;">Area Staff</a>
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
                        <a href="/pages/staff-dashboard.html" style="background: rgba(16,185,129,0.15); color: #10b981; padding: 0.5rem 1rem; border-radius: 99px; border: 1px solid rgba(16,185,129,0.3); text-decoration: none; font-size: 0.85rem; font-weight: 800;"><i class="fa-solid fa-user-tie"></i> Dashboard</a>
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
