// staff.js
let ticketSelezionato = null;

// ========================
// L O G I N  &  A U T H
// ========================

function eseguiLogin() {
    const p = document.getElementById('password-staff').value.trim();
    if(!p) return Swal.fire('Errore','Inserisci la password','warning');
    
    if(p.includes('/') || p.includes('.') || p.includes('#') || p.includes('$') || p.includes('[')) {
        return Swal.fire('Errore', 'Caratteri non consentiti nella password', 'error');
    }
    
    db.ref('staff/' + p).once('value', snapshot => {
        if(snapshot.exists()) {
            localStorage.setItem('omnistock_staff_token', p);
            window.location.href = '/pages/staff-dashboard.html';
        } else { 
            Swal.fire({icon: 'error', title: 'Accesso Negato', text: 'Credenziali non valide.'}); 
        }
    });
}

if(document.getElementById('password-staff')) {
    document.getElementById('password-staff').addEventListener('keypress', e => {
        if (e.key === 'Enter') eseguiLogin();
    });
}

// ========================
// D A S H B O A R D  I N I T
// ========================

// Utility per i colori dei ruoli
function getColoreRuolo(ruolo) {
    if(ruolo === 'Responsabile') return '#9f1239'; // Rosso Bordeaux (rose-800 tailwind)
    if(ruolo === 'Dirigente') return '#f59e0b'; // Oro
    if(ruolo === 'Vice Dirigente') return '#60a5fa'; // Azzurro
    return 'var(--text-muted)';
}

function initDashboard() {
    document.getElementById('nome-badge').innerText = utenteAttuale.nome;
    
    const ruoloBadge = document.getElementById('ruolo-badge');
    ruoloBadge.innerText = utenteAttuale.ruolo;
    ruoloBadge.style.color = getColoreRuolo(utenteAttuale.ruolo);
    
    gestisciPermessi();
    caricaStatistiche();
    
    // Inizializza i moduli
    inizializzaModuloMagazzini();
    inizializzaModuloTicket();
    inizializzaModuloExtra();
    inizializzaModuloShop();
    inizializzaModuloPersonale();
}

function gestisciPermessi() {
    const isBoss = utenteAttuale && (utenteAttuale.ruolo === 'Dirigente' || utenteAttuale.ruolo === 'Vice Dirigente');
    let p = utenteAttuale.permessi || {};
    
    if (isBoss) {
        p.dash = true; p.magazzini = true; p.lotteria = true; p.shop = true; p.ticket = true; 
        p.annunci = true; p.config = true; p.staff = true; p.info = true; p.winrate = true;
    }
    
    ['dash','magazzini','lotteria','shop','ticket','annunci','info','staff'].forEach(k => {
        const b = document.getElementById('btn-tab-'+k);
        if(b) p[k] ? b.style.display = 'inline-flex' : b.style.display = 'none';
    });
    
    if(p.winrate && document.getElementById('card-incasso')) document.getElementById('card-incasso').style.display = 'flex';
    if(document.getElementById('config-magazzini') && isBoss) document.getElementById('config-magazzini').style.display = 'block';
    
    if(p.dash) switchStaffTab('dash'); 
    else if(p.magazzini) switchStaffTab('magazzini'); 
    else if(p.ticket) switchStaffTab('ticket');
}

function switchStaffTab(tabId) {
    document.querySelectorAll('.staff-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    const targetTab = document.getElementById('tab-' + tabId);
    const targetBtn = document.getElementById('btn-tab-' + tabId);
    
    if(targetTab) targetTab.classList.add('active');
    if(targetBtn) targetBtn.classList.add('active');
}

function caricaStatistiche() {
    db.ref('affitti').on('value', s => { if(document.getElementById('stat-affitti')) document.getElementById('stat-affitti').innerText = s.val() ? Object.keys(s.val()).length : 0; });
    db.ref('staff').on('value', s => { if(document.getElementById('stat-staff')) document.getElementById('stat-staff').innerText = s.val() ? Object.keys(s.val()).length : 0; });
    
    db.ref('lotteria/biglietti').on('value', s => {
        const list = s.val() || {}; let count = 0;
        for(let k in list) count += list[k].quantita;
        if(document.getElementById('stat-biglietti')) document.getElementById('stat-biglietti').innerText = count;
        if(document.getElementById('stat-incasso')) document.getElementById('stat-incasso').innerText = (count * 25) + "$";
    });
    
    db.ref('config/magDisp').on('value', s => {
        const d = s.val() || {s:0, m:0, l:0, vips:0, vipm:0, vipl:0};
        const sum = (parseInt(d.s)||0) + (parseInt(d.m)||0) + (parseInt(d.l)||0) + (parseInt(d.vips)||0) + (parseInt(d.vipm)||0) + (parseInt(d.vipl)||0);
        if(document.getElementById('stat-disp')) document.getElementById('stat-disp').innerText = sum;
    });
    
    db.ref('prenotazioni_mag').on('value', s => {
        if(document.getElementById('stat-prenotazioni')) document.getElementById('stat-prenotazioni').innerText = s.val() ? Object.keys(s.val()).length : 0;
    });
    
    db.ref('shop/items').on('value', s => {
        if(document.getElementById('stat-vetrina')) document.getElementById('stat-vetrina').innerText = s.val() ? Object.keys(s.val()).length : 0;
    });
}

function apriModalPassword() {
    Swal.fire({
        title: 'Modifica Password',
        html: `<input id="swal-old" class="form-control mb-4" placeholder="Vecchia Password" type="password">
               <input id="swal-new" class="form-control" placeholder="Nuova Password" type="password">`,
        focusConfirm: false,
        confirmButtonText: 'Aggiorna',
        confirmButtonColor: 'var(--primary)',
        preConfirm: () => [document.getElementById('swal-old').value, document.getElementById('swal-new').value]
    }).then(r => {
        if(r.isConfirmed) {
            const [oldP, newP] = r.value;
            if(oldP !== utenteAttuale.pass) return Swal.fire('Errore', 'Vecchia password errata', 'error');
            if(newP.length < 4) return Swal.fire('Errore', 'Password troppo corta', 'error');
            
            db.ref('staff/'+newP).set({ nome: utenteAttuale.nome, ruolo: utenteAttuale.ruolo, permessi: utenteAttuale.permessi || {} }).then(() => {
                db.ref('staff/'+utenteAttuale.pass).remove();
                localStorage.setItem('omnistock_staff_token', newP);
                Swal.fire('Successo', 'Password aggiornata', 'success').then(() => location.reload());
            });
        }
    });
}

// ========================
// M O D U L O  M A G A Z Z I N I
// ========================

function inizializzaModuloMagazzini() {
    if(!document.getElementById('set-disp-s')) return;
    
    db.ref('config/magDisp').on('value', s => {
        const d = s.val() || {s: 0, m: 0, l: 0, vips: 0, vipm: 0, vipl: 0};
        document.getElementById('set-disp-s').value = d.s; document.getElementById('set-disp-m').value = d.m; document.getElementById('set-disp-l').value = d.l;
        document.getElementById('set-disp-vips').value = d.vips; document.getElementById('set-disp-vipm').value = d.vipm; document.getElementById('set-disp-vipl').value = d.vipl;
    });
    
    db.ref('config/magOptionals').on('value', s => { document.getElementById('set-opt-list').value = s.val() || ''; });
    
    db.ref('prenotazioni_mag').on('value', s => {
        const tbody = document.querySelector('#tabella-prenotazioni-mag tbody');
        const p = s.val() || {}; tbody.innerHTML = ''; let count = 0;
        
        for(let id in p) {
            count++; const req = p[id];
            tbody.innerHTML += `
                <tr>
                    <td><span style="font-weight: 800; text-transform: capitalize;">${req.nick}</span></td>
                    <td><div class="badge badge-primary">${req.tipo}</div><div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">${req.giorni} Giorni</div></td>
                    <td><span style="font-size: 0.8rem; color: var(--text-muted);">${req.optional || 'Nessuno'}</span></td>
                    <td style="text-align: right;">
                        <button onclick="copiaPrenotazione('${req.nick}', '${req.tipo}', ${req.giorni})" class="btn btn-outline" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;" title="Usa per Contratto">Processa</button>
                        <button onclick="eliminaPrenotazione('${id}')" class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: #ef4444; border-color: rgba(239,68,68,0.3); margin-left: 0.5rem;"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`;
        }
        if(count === 0) tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Nessuna prenotazione.</td></tr>';
    });
    
    db.ref('affitti').on('value', s => {
        const tbody = document.querySelector('#tabella-magazzini tbody');
        const list = s.val() || {}; tbody.innerHTML = '';
        
        for(let nick in list) {
            const aff = list[nick];
            const rimanenti = Math.ceil((aff.scadenza - Date.now()) / 86400000);
            const statusClass = rimanenti > 0 ? 'badge-success' : 'badge-danger';
            const statusText = rimanenti > 0 ? rimanenti + ' gg' : 'Scaduto';
            
            tbody.innerHTML += `
                <tr>
                    <td style="font-weight: 800; text-transform: capitalize;">${nick}</td>
                    <td><span style="font-family: monospace; font-weight: 900; color: var(--primary-light);">${aff.magazzino}</span> (${aff.tipo})</td>
                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                    <td style="text-align: right;">
                        <button onclick="rinnovaAffitto('${nick}', ${aff.scadenza})" class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"><i class="fa-solid fa-plus"></i> gg</button>
                        <button onclick="eliminaAffitto('${nick}')" class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: #ef4444; border-color: rgba(239,68,68,0.3); margin-left: 0.5rem;"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>`;
        }
        if(Object.keys(list).length === 0) tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Nessun contratto.</td></tr>';
    });
}

function aggiornaMagazziniDisponibili() {
    db.ref('config/magDisp').set({
        s: parseInt(document.getElementById('set-disp-s').value)||0, m: parseInt(document.getElementById('set-disp-m').value)||0, l: parseInt(document.getElementById('set-disp-l').value)||0,
        vips: parseInt(document.getElementById('set-disp-vips').value)||0, vipm: parseInt(document.getElementById('set-disp-vipm').value)||0, vipl: parseInt(document.getElementById('set-disp-vipl').value)||0
    });
    db.ref('config/magOptionals').set(document.getElementById('set-opt-list').value.trim());
    Swal.fire('Fatto', 'Disponibilità aggiornata.', 'success');
}

function registraAffitto() {
    const nick = document.getElementById('add-nick').value.trim().toLowerCase();
    const mag = document.getElementById('add-magazzino').value.trim().toUpperCase();
    const tipo = document.getElementById('add-tipo').value;
    const giorni = parseInt(document.getElementById('add-giorni').value);
    
    if(!nick || !mag || !giorni) return Swal.fire('Errore', 'Compila tutti i campi', 'warning');
    db.ref('affitti/' + nick).set({ magazzino: mag, tipo: tipo, scadenza: Date.now() + (giorni * 86400000) }).then(() => {
        document.getElementById('add-nick').value = ''; document.getElementById('add-magazzino').value = '';
        Swal.fire('Registrato', 'Contratto attivo per ' + nick, 'success');
    });
}

function copiaPrenotazione(nick, tipo, giorni) { document.getElementById('add-nick').value = nick; document.getElementById('add-tipo').value = tipo; document.getElementById('add-giorni').value = giorni; document.getElementById('add-magazzino').focus(); }
function eliminaPrenotazione(id) { db.ref('prenotazioni_mag/' + id).remove(); }
function eliminaAffitto(nick) { Swal.fire({ title: 'Cancellare contratto?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Elimina' }).then(r => { if(r.isConfirmed) db.ref('affitti/' + nick).remove(); }); }

function rinnovaAffitto(nick, oldScadenza) {
    Swal.fire({ title: 'Quanti giorni aggiungi?', input: 'number', inputAttributes: { min: 1 }, showCancelButton: true, confirmButtonText: 'Rinnova', confirmButtonColor: 'var(--primary)' }).then(r => {
        if(r.isConfirmed && r.value) {
            const start = oldScadenza > Date.now() ? oldScadenza : Date.now();
            db.ref('affitti/' + nick).update({ scadenza: start + (parseInt(r.value) * 86400000) });
            Swal.fire('Fatto', 'Contratto rinnovato', 'success');
        }
    });
}

// ========================
// M O D U L O  T I C K E T
// ========================

function inizializzaModuloTicket() {
    const inputChat = document.getElementById('input-chat-staff');
    if(inputChat) inputChat.addEventListener('keypress', e => { if(e.key === 'Enter') inviaMessaggioStaff(); });

    db.ref('tickets').on('value', s => {
        const list = s.val() || {}; const container = document.getElementById('lista-ticket-staff'); 
        if(!container) return; container.innerHTML = ''; let aperti = 0;
        
        for(let nick in list) {
            aperti++; const isSel = ticketSelezionato === nick;
            container.innerHTML += `
                <div onclick="selezionaTicket('${nick}')" style="padding: 1rem; border-radius: 12px; cursor: pointer; margin-bottom: 0.5rem; border: 1px solid ${isSel ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}; background: ${isSel ? 'rgba(37,99,235,0.1)' : 'rgba(0,0,0,0.3)'}; transition: all 0.2s;">
                    <div style="font-weight: 800; text-transform: capitalize;">${nick}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-top: 4px;">Ticket Aperto</div>
                </div>`;
        }
        if(document.getElementById('stat-ticket')) document.getElementById('stat-ticket').innerText = aperti;
        const badge = document.getElementById('badge-ticket');
        if(badge) { if(aperti > 0) { badge.innerText = aperti; badge.style.display = 'block'; } else badge.style.display = 'none'; }
    });
}

function selezionaTicket(nick) {
    ticketSelezionato = nick;
    document.getElementById('chat-header-staff').innerHTML = `<i class="fa-solid fa-inbox"></i> Chat con <strong style="text-transform: capitalize; color: var(--text-light); margin-left: 0.5rem;">${nick}</strong>`;
    document.getElementById('btn-chiudi-ticket').style.display = 'inline-block';
    document.getElementById('chat-controls-staff').style.display = 'flex';
    
    db.ref('tickets/'+nick+'/messages').off();
    db.ref('tickets/'+nick+'/messages').on('value', s => {
        const box = document.getElementById('chat-box-staff'); box.innerHTML = '';
        if(s.exists()){
            Object.values(s.val()).forEach(m => {
                const isClient = m.sender === nick; const cls = isClient ? 'msg-client' : 'msg-staff'; 
                box.innerHTML += `<div class="msg ${cls}"><span style="font-size: 0.65rem; opacity: 0.8; display: block; margin-bottom: 4px; font-weight: 800; text-transform: uppercase;">${(isClient ? nick : m.sender).toUpperCase()}</span>${m.text}</div>`;
            });
            setTimeout(() => box.scrollTop = box.scrollHeight, 50);
        }
    });
}

function inviaMessaggioStaff() {
    const input = document.getElementById('input-chat-staff'); const testo = input.value.trim();
    if(!testo || !ticketSelezionato) return;
    db.ref('tickets/' + ticketSelezionato + '/messages/' + Date.now()).set({ sender: utenteAttuale.nome, text: testo, timestamp: Date.now() });
    input.value = '';
}

function eliminaTicketCorrente() {
    if(!ticketSelezionato) return;
    Swal.fire({ title: 'Chiudere ticket?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Sì' }).then(r => {
        if(r.isConfirmed) {
            db.ref('tickets/' + ticketSelezionato).remove();
            ticketSelezionato = null;
            document.getElementById('chat-header-staff').innerHTML = '<i class="fa-solid fa-inbox"></i> Seleziona una chat';
            document.getElementById('btn-chiudi-ticket').style.display = 'none'; document.getElementById('chat-box-staff').innerHTML = ''; document.getElementById('chat-controls-staff').style.display = 'none';
        }
    });
}

// ========================
// M O D U L O  E X T R A (Lotteria, Annunci, Info)
// ========================

function inizializzaModuloExtra() {
    // Lotteria Data & Biglietti
    if(document.getElementById('set-data-lotteria')) {
        db.ref('config/dataLotteria').on('value', s => { document.getElementById('set-data-lotteria').value = s.val() || ''; });
        
        db.ref('lotteria/biglietti').on('value', s => {
            const list = s.val() || {}; const tb = document.querySelector('#tabella-biglietti tbody');
            if(!tb) return; tb.innerHTML = ''; let count = 0;
            
            for(let nick in list) {
                count++;
                tb.innerHTML += `
                <tr>
                    <td style="font-weight: 800; text-transform: capitalize;">${nick}</td>
                    <td><div style="display: inline-block; background: rgba(37,99,235,0.1); color: var(--primary-light); padding: 0.2rem 0.6rem; border-radius: 6px; font-weight: 900;">${list[nick].quantita}</div></td>
                    <td style="text-align: right;"><button onclick="eliminaBigliettiUtente('${nick}')" class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: #ef4444; border-color: rgba(239,68,68,0.3);"><i class="fa-solid fa-trash"></i></button></td>
                </tr>`;
            }
            if(count === 0) tb.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Nessun biglietto venduto.</td></tr>';
        });
    }
    
    // Annunci
    if(document.getElementById('lista-annunci-staff')) {
        db.ref('annunci').on('value', s => {
            const list = s.val() || {};
            const container = document.getElementById('lista-annunci-staff');
            container.innerHTML = '';
            for(let id in list) {
                container.innerHTML += `
                    <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 800; color: var(--text-light); margin-bottom: 0.25rem;">${list[id].titolo}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${new Date(list[id].data).toLocaleString()}</div>
                        </div>
                        <button onclick="eliminaAnnuncio('${id}')" class="btn btn-outline" style="color: #ef4444; border-color: rgba(239,68,68,0.3); padding: 0.5rem;"><i class="fa-solid fa-trash"></i></button>
                    </div>`;
            }
            if(Object.keys(list).length === 0) container.innerHTML = '<p class="text-muted text-center">Nessun annuncio pubblicato.</p>';
        });
    }
    
    // Info / Catalogo
    if(document.getElementById('testo-info-staff')) {
        db.ref('config/infoAzienda').on('value', s => { document.getElementById('testo-info-staff').value = s.val() || ''; });
    }
}

function aggiornaDataLotteria() {
    const data = document.getElementById('set-data-lotteria').value.trim();
    db.ref('config/dataLotteria').set(data).then(() => Swal.fire('Fatto', 'Data lotteria aggiornata.', 'success'));
}

function vendiBiglietti() {
    const nick = document.getElementById('lotteria-nick').value.trim().toLowerCase();
    const qta = parseInt(document.getElementById('lotteria-quantita').value);
    if(!nick || !qta || qta <= 0) return Swal.fire('Errore', 'Inserisci nick e quantità valida', 'warning');
    
    db.ref('lotteria/biglietti/'+nick).once('value', s => {
        const attuali = s.val() ? s.val().quantita : 0;
        db.ref('lotteria/biglietti/'+nick).set({ quantita: attuali + qta }).then(()=>{
            document.getElementById('lotteria-nick').value = ''; document.getElementById('lotteria-quantita').value = '';
            Swal.fire('Registrato', `Aggiunti ${qta} biglietti a ${nick}.`, 'success');
        });
    });
}

function eliminaBigliettiUtente(nick) {
    Swal.fire({title:'Rimuovere i biglietti di questo utente?', icon:'warning', showCancelButton:true, confirmButtonColor:'#ef4444', confirmButtonText:'Sì, elimina'}).then(r=>{
        if(r.isConfirmed) db.ref('lotteria/biglietti/'+nick).remove();
    });
}

function azzeraLotteria() {
    Swal.fire({ title: 'Cancellare TUTTI i biglietti?', text: 'Questa operazione è irreversibile e va fatta dopo una estrazione.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Azzera' }).then(r => {
        if(r.isConfirmed) db.ref('lotteria/biglietti').remove().then(() => Swal.fire('Fatto', 'Lotteria azzerata.', 'success'));
    });
}

function pubblicaAnnuncio() {
    const titolo = document.getElementById('annuncio-titolo').value.trim();
    const testo = document.getElementById('annuncio-testo').value.trim();
    if(!titolo || !testo) return Swal.fire('Errore', 'Compila titolo e testo', 'warning');
    
    db.ref('annunci/' + Date.now()).set({ titolo: titolo, testo: testo, data: Date.now() }).then(() => {
        document.getElementById('annuncio-titolo').value = ''; document.getElementById('annuncio-testo').value = '';
        Swal.fire('Pubblicato', 'Annuncio visibile a tutti.', 'success');
    });
}

function eliminaAnnuncio(id) { db.ref('annunci/' + id).remove(); }

function salvaInfoAzienda() {
    const testo = document.getElementById('testo-info-staff').value.trim();
    db.ref('config/infoAzienda').set(testo).then(() => Swal.fire('Salvato', 'Documentazione aggiornata pubblicamente.', 'success'));
}

// ========================
// M O D U L O  S H O P (VETRINA)
// ========================

function inizializzaModuloShop() {
    if(!document.getElementById('lista-shop-staff')) return;
    
    // Lista Inventario
    db.ref('shop/items').on('value', s => {
        const list = s.val() || {}; const c = document.getElementById('lista-shop-staff'); c.innerHTML = '';
        for(let id in list) {
            const item = list[id];
            c.innerHTML += `
            <div style="background: rgba(255,255,255,0.02); padding: 1.25rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255,255,255,0.05); transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='rgba(255,255,255,0.02)'">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 40px; height: 40px; border-radius: 8px; background: rgba(37,99,235,0.1); display: flex; align-items: center; justify-content: center; color: var(--primary-light);">
                        <i class="fa-solid fa-box"></i>
                    </div>
                    <div>
                        <div style="font-weight: 800; color: #fff; font-size: 1rem;">${item.nome}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-top: 2px;">
                            <span style="color: #10b981;">${item.prezzo}$</span> • ${item.stato==='disponibile'?'<span style="color:var(--primary-light);">Disponibile</span>':'<span style="color:#f59e0b;">Prenotato</span>'}
                        </div>
                    </div>
                </div>
                <button onclick="eliminaArticoloShop('${id}')" class="btn btn-outline" style="padding: 0.5rem 0.75rem; color: #ef4444; border-color: rgba(239,68,68,0.3); font-size: 0.8rem;" title="Rimuovi Articolo"><i class="fa-solid fa-trash"></i></button>
            </div>`;
        }
        if(Object.keys(list).length === 0) c.innerHTML = '<p class="text-muted text-center">Nessun articolo in vetrina.</p>';
    });
    
    // Lista Ordini/Prenotazioni
    db.ref('shop/orders').on('value', s => {
        const list = s.val() || {}; const tb = document.querySelector('#tabella-ordini-shop tbody'); tb.innerHTML = '';
        for(let id in list) {
            const ord = list[id];
            tb.innerHTML += `
            <tr style="transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                <td style="text-transform: capitalize; font-weight: 800; color: #fff;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-user text-muted" style="font-size: 0.75rem;"></i></div>
                        ${ord.nick}
                    </div>
                </td>
                <td style="font-weight: 600; color: var(--text-light);">${ord.item_nome}</td>
                <td><span style="font-family: monospace; background: rgba(37,99,235,0.1); border: 1px solid rgba(37,99,235,0.2); color: var(--primary-light); padding: 0.4rem 0.75rem; border-radius: 8px; font-weight: 900; letter-spacing: 2px;">${ord.codice}</span></td>
                <td style="text-align: right;"><button onclick="consegnaOrdineShop('${id}', '${ord.item_id}')" class="btn btn-primary" style="padding: 0.4rem 1rem; font-size: 0.8rem;"><i class="fa-solid fa-check mr-2"></i> Consegnato</button></td>
            </tr>`;
        }
        if(Object.keys(list).length === 0) tb.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Nessun ordine in attesa.</td></tr>';
    });
}

function aggiungiArticoloShop() {
    const nome = document.getElementById('shop-nome').value.trim();
    const prezzo = document.getElementById('shop-prezzo').value.trim();
    const desc = document.getElementById('shop-desc').value.trim();
    if(!nome || !prezzo || !desc) return Swal.fire('Errore', 'Compila tutti i campi', 'warning');
    
    db.ref('shop/items/'+Date.now()).set({nome: nome, prezzo: parseInt(prezzo), desc: desc, stato: 'disponibile'}).then(()=>{
        document.getElementById('shop-nome').value=''; document.getElementById('shop-prezzo').value=''; document.getElementById('shop-desc').value='';
        Swal.fire('Aggiunto', 'Articolo pubblicato in vetrina.', 'success');
    });
}

function eliminaArticoloShop(id) {
    Swal.fire({title: 'Eliminare articolo?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Elimina'}).then(r => {
        if(r.isConfirmed) db.ref('shop/items/'+id).remove();
    });
}

function consegnaOrdineShop(orderId, itemId) {
    Swal.fire({title: 'Articolo Consegnato?', text: 'Hai verificato il codice e consegnato l\'oggetto?', icon: 'question', showCancelButton: true, confirmButtonColor: '#10b981', confirmButtonText: 'Conferma'}).then(r => {
        if(r.isConfirmed) {
            db.ref('shop/orders/'+orderId).remove();
            db.ref('shop/items/'+itemId).remove(); // Rimuoviamo l'articolo dall'inventario definitivamente
            Swal.fire('Archiviato', 'Ordine completato con successo.', 'success');
        }
    });
}

// ========================
// M O D U L O  P E R S O N A L E
// ========================

function inizializzaModuloPersonale() {
    if(!document.getElementById('lista-personale-staff')) return;
    
    db.ref('staff').on('value', s => {
        const list = s.val() || {}; const c = document.getElementById('lista-personale-staff'); c.innerHTML = '';
        for(let pass in list) {
            const st = list[pass];
            const isMe = pass === utenteAttuale.pass;
            c.innerHTML += `
            <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255,255,255,0.05);">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-user-tie text-muted"></i></div>
                    <div>
                        <div style="font-weight: 800; color: #fff;">${st.nome} ${isMe ? '<span style="color:var(--primary-light); font-size: 0.7rem; vertical-align: top;">(Tu)</span>' : ''}</div>
                        <div style="font-size: 0.8rem; font-weight: 700; color: ${getColoreRuolo(st.ruolo)}; text-transform: uppercase;">${st.ruolo}</div>
                    </div>
                </div>
                ${!isMe ? `
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="modificaStaff('${pass}', '${st.nome.replace(/'/g, "\\'")}', '${st.ruolo}')" class="btn btn-outline" style="padding: 0.5rem; color: #3b82f6; border-color: rgba(59,130,246,0.3);" title="Modifica Ruolo"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="eliminaStaff('${pass}')" class="btn btn-outline" style="padding: 0.5rem; color: #ef4444; border-color: rgba(239,68,68,0.3);" title="Licenzia"><i class="fa-solid fa-user-minus"></i></button>
                </div>
                ` : ''}
            </div>`;
        }
    });
}

function aggiungiStaff() {
    const nome = document.getElementById('staff-nome').value.trim();
    const pass = document.getElementById('staff-pass').value.trim();
    const ruolo = document.getElementById('staff-ruolo').value;
    
    if(!nome || !pass) return Swal.fire('Errore', 'Compila nome e password', 'warning');
    if(pass.includes('.') || pass.includes('#') || pass.includes('$') || pass.includes('[') || pass.includes(']')) return Swal.fire('Errore', 'Caratteri non validi nella password', 'error');
    if(pass.length < 4) return Swal.fire('Errore', 'Password troppo debole (min 4 caratteri)', 'warning');
    
    const isBoss = (ruolo === 'Dirigente' || ruolo === 'Vice Dirigente' || ruolo === 'Responsabile');
    // I boss vedono tutto. I dipendenti standard vedono solo Dash, Magazzini e Ticket.
    const permessi = isBoss ? {dash:true, magazzini:true, lotteria:true, shop:true, ticket:true, annunci:true, config:true, staff:true, info:true, winrate:true} : {dash:true, magazzini:true, ticket:true};
    
    db.ref('staff/'+pass).once('value', snapshot => {
        if(snapshot.exists()) return Swal.fire('Errore', 'Questa password è già in uso da un altro dipendente.', 'error');
        
        db.ref('staff/'+pass).set({nome: nome, ruolo: ruolo, permessi: permessi}).then(()=>{
            document.getElementById('staff-nome').value=''; document.getElementById('staff-pass').value='';
            Swal.fire('Registrato', 'Nuovo membro del personale aggiunto.', 'success');
        });
    });
}

function eliminaStaff(pass) {
    if(pass === utenteAttuale.pass) return Swal.fire('Errore', 'Non puoi licenziare te stesso!', 'error');
    Swal.fire({title:'Licenziare dipendente?', text:'Non potrà più accedere alla Dashboard.', icon:'warning', showCancelButton:true, confirmButtonColor:'#ef4444', confirmButtonText:'Sì, Licenzia'}).then(r=>{
        if(r.isConfirmed) {
            db.ref('staff/'+pass).remove();
            Swal.fire('Licenziato', 'Accesso revocato.', 'success');
        }
    });
}

function modificaStaff(pass, nome, ruoloAttuale) {
    if(pass === utenteAttuale.pass) return Swal.fire('Errore', 'Non puoi modificare i tuoi stessi permessi da qui!', 'error');
    
    Swal.fire({
        title: `Modifica ${nome}`,
        text: 'Seleziona il nuovo ruolo aziendale:',
        input: 'select',
        inputOptions: {
            'Apprendista': 'Apprendista',
            'Dipendente': 'Dipendente',
            'Responsabile': 'Responsabile',
            'Vice Dirigente': 'Vice Dirigente',
            'Dirigente': 'Dirigente'
        },
        inputValue: ruoloAttuale,
        showCancelButton: true,
        confirmButtonText: 'Aggiorna Ruolo',
        confirmButtonColor: '#2563eb',
        cancelButtonText: 'Annulla'
    }).then(r => {
        if(r.isConfirmed) {
            const nuovoRuolo = r.value;
            const isBoss = (nuovoRuolo === 'Dirigente' || nuovoRuolo === 'Vice Dirigente' || nuovoRuolo === 'Responsabile');
            const permessi = isBoss ? {dash:true, magazzini:true, lotteria:true, shop:true, ticket:true, annunci:true, config:true, staff:true, info:true, winrate:true} : {dash:true, magazzini:true, ticket:true};
            
            db.ref('staff/'+pass).update({ruolo: nuovoRuolo, permessi: permessi}).then(() => {
                Swal.fire('Aggiornato', 'Ruolo e permessi modificati con successo.', 'success');
            });
        }
    });
}
