// clienti.js
let nomeClienteAttuale = '';

function accediAreaCliente() {
    const nick = document.getElementById('search-nick').value.trim().toLowerCase();
    if(!nick) return Swal.fire('Errore', 'Inserisci il tuo nome in città', 'warning');
    
    nomeClienteAttuale = nick;
    
    document.getElementById('login-cliente-section').style.display = 'none';
    document.getElementById('dashboard-cliente-section').style.display = 'block';
    document.getElementById('client-name-display').innerText = nick;
    
    caricaDatiCliente(nick);
    gestisciTicketCliente(nick);
}

function esciAreaCliente() {
    nomeClienteAttuale = '';
    document.getElementById('search-nick').value = '';
    document.getElementById('login-cliente-section').style.display = 'block';
    document.getElementById('dashboard-cliente-section').style.display = 'none';
    
    // Stop listening to specific ticket
    db.ref('tickets/' + nomeClienteAttuale).off();
}

document.getElementById('search-nick').addEventListener('keypress', e => {
    if(e.key === 'Enter') accediAreaCliente();
});

document.getElementById('input-chat-client').addEventListener('keypress', e => {
    if(e.key === 'Enter') inviaMessaggio('client');
});

function caricaDatiCliente(nick) {
    const containerMag = document.getElementById('risultato-cliente');
    const containerOrdini = document.getElementById('risultato-ordini-cliente');
    const titoloOrdini = document.getElementById('titolo-ordini-cliente');
    
    containerMag.innerHTML = '<p class="text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Ricerca contratti in corso...</p>';
    
    // Contratto Magazzino
    db.ref('affitti/' + nick).on('value', s => {
        const d = s.val();
        if(d) {
            const gg = Math.ceil((d.scadenza - Date.now()) / 86400000);
            containerMag.innerHTML = `
                <div class="service-card" style="border-left: 4px solid var(--primary);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <p style="font-size: 0.75rem; text-transform: uppercase; font-weight: 800; color: var(--text-muted);">Tipo Contratto</p>
                            <p style="font-size: 1.1rem; font-weight: 800; color: var(--text-dark);">${d.tipo || 'Standard'}</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="font-size: 0.75rem; text-transform: uppercase; font-weight: 800; color: var(--text-muted);">Magazzino</p>
                            <p style="font-family: monospace; font-size: 1.25rem; font-weight: 900; color: var(--primary);">${d.magazzino}</p>
                        </div>
                    </div>
                    <div style="background: rgba(0,0,0,0.03); padding: 0.75rem; border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-size: 0.85rem; font-weight: 600;">Stato Pagamento</span>
                        <span class="badge ${gg > 0 ? 'badge-success' : 'badge-danger'}">${gg > 0 ? gg + ' Giorni Rimanenti' : 'Scaduto'}</span>
                    </div>
                </div>
            `;
        } else {
            containerMag.innerHTML = `
                <div style="text-align: center; padding: 2rem; background: rgba(0,0,0,0.02); border-radius: 12px; border: 1px dashed rgba(0,0,0,0.1);">
                    <p style="color: var(--text-muted); font-size: 0.95rem;">Non hai nessun contratto di affitto attivo.</p>
                </div>
            `;
        }
    });

    // Ordini Shop
    db.ref('shop/orders').on('value', s => {
        const orders = s.val() || {};
        let myOrdersHTML = '';
        let hasOrders = false;
        
        for(let k in orders) {
            if(orders[k].nick === nick) {
                hasOrders = true;
                myOrdersHTML += `
                    <div class="service-card" style="border-left: 4px solid var(--accent);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <p style="font-weight: 800; font-size: 1.1rem;">${orders[k].item_nome}</p>
                            <span class="badge" style="background: rgba(249, 115, 22, 0.1); color: var(--accent);">Da Ritirare</span>
                        </div>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Mostra questo codice in sede per il ritiro:</p>
                        <div style="font-family: monospace; font-size: 1.5rem; font-weight: 900; letter-spacing: 2px; color: var(--accent); background: rgba(249, 115, 22, 0.05); padding: 0.5rem 1rem; border-radius: 8px; border: 1px dashed rgba(249, 115, 22, 0.3); display: inline-block;">
                            ${orders[k].codice}
                        </div>
                    </div>
                `;
            }
        }
        
        if(hasOrders) {
            titoloOrdini.style.display = 'flex';
            containerOrdini.innerHTML = myOrdersHTML;
        } else {
            titoloOrdini.style.display = 'none';
            containerOrdini.innerHTML = '';
        }
    });

    // Lotteria
    db.ref('lotteria/biglietti/' + nick).on('value', s => {
        const d = s.val();
        const titoloLotteria = document.getElementById('titolo-lotteria-cliente');
        const containerLotteria = document.getElementById('risultato-lotteria-cliente');
        
        if(d && d.quantita > 0) {
            titoloLotteria.style.display = 'flex';
            containerLotteria.innerHTML = `
                <div class="service-card" style="border-left: 4px solid #f59e0b; background: linear-gradient(to right, rgba(245, 158, 11, 0.05), transparent);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <p style="font-weight: 800; font-size: 1.1rem; color: #f59e0b;">Biglietti Lotteria d'Oro</p>
                        <i class="fa-solid fa-star" style="color: #f59e0b;"></i>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Hai acquistato con successo questi biglietti per l'estrazione:</p>
                    <div style="display: flex; align-items: baseline; gap: 0.5rem;">
                        <span style="font-family: monospace; font-size: 2.5rem; font-weight: 900; color: #fde047; text-shadow: 0 0 10px rgba(253, 224, 71, 0.5);">${d.quantita}</span>
                        <span style="font-size: 0.9rem; font-weight: 600; color: #f59e0b; text-transform: uppercase;">Ticket${d.quantita > 1 ? 's' : ''}</span>
                    </div>
                </div>
            `;
        } else {
            titoloLotteria.style.display = 'none';
            containerLotteria.innerHTML = '';
        }
    });
}

function gestisciTicketCliente(nick) {
    db.ref('tickets/' + nick).on('value', s => {
        if(s.exists()) {
            document.getElementById('area-apri-ticket').style.display = 'none';
            document.getElementById('area-chat-attiva').style.display = 'flex';
            document.getElementById('btn-chiudi-ticket').style.display = 'inline-block';
            
            const box = document.getElementById('chat-box-client');
            box.innerHTML = '';
            
            const messages = s.val().messages || {};
            Object.values(messages).forEach(m => {
                const isMe = m.sender === nick;
                const cls = isMe ? 'msg-client' : 'msg-staff';
                const senderName = isMe ? 'Tu' : m.sender;
                
                box.innerHTML += `
                    <div class="msg ${cls}">
                        <span style="font-size: 0.65rem; opacity: 0.8; display: block; margin-bottom: 4px; font-weight: 800; text-transform: uppercase;">${senderName}</span>
                        ${m.text}
                    </div>
                `;
            });
            setTimeout(() => box.scrollTop = box.scrollHeight, 50);
        } else {
            document.getElementById('area-apri-ticket').style.display = 'flex';
            document.getElementById('area-chat-attiva').style.display = 'none';
            document.getElementById('btn-chiudi-ticket').style.display = 'none';
        }
    });
}

function apriNuovoTicket() {
    if(!nomeClienteAttuale) return;
    const initialMsg = "Nuovo ticket aperto da " + nomeClienteAttuale;
    db.ref('tickets/' + nomeClienteAttuale + '/messages/' + Date.now()).set({
        sender: nomeClienteAttuale,
        text: initialMsg,
        timestamp: Date.now()
    });
}

function chiudiTicketClient() {
    Swal.fire({
        title: 'Chiudere il ticket?',
        text: "Non potrai più leggere questa conversazione.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Sì, chiudi'
    }).then(r => {
        if(r.isConfirmed && nomeClienteAttuale) {
            db.ref('tickets/' + nomeClienteAttuale).remove();
        }
    });
}

function inviaMessaggio(tipo) {
    // Shared between client and staff if they are in the same file, 
    // but here it's specifically for client.
    if(tipo !== 'client') return;
    
    const input = document.getElementById('input-chat-client');
    const testo = input.value.trim();
    if(!testo || !nomeClienteAttuale) return;
    
    db.ref('tickets/' + nomeClienteAttuale + '/messages/' + Date.now()).set({
        sender: nomeClienteAttuale,
        text: testo,
        timestamp: Date.now()
    });
    
    input.value = '';
}
