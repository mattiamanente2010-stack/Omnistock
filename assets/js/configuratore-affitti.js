// configuratore-affitti.js

let selectedTipoAppartamento = null;

document.addEventListener('DOMContentLoaded', () => {
    // Carica Disponibilità Appartamenti
    db.ref('config/affittiDisp').on('value', snapshot => {
        const d = snapshot.val() || { piccola:0, media:0, grande:0, vip:0 };
        aggiornaOpzioniAppartamenti(d);
    });

    // Carica Optional
    db.ref('config/affittiOptionals').on('value', snapshot => {
        const val = snapshot.val() || "Wi-Fi Fibra, Posto Auto Coperto, Servizio Pulizie, TV 8K";
        const container = document.getElementById('container-optional-dinamici');
        if(container) {
            container.innerHTML = '';
            const opts = val.split(',').map(v => v.trim()).filter(v => v);
            if(opts.length === 0) {
                container.innerHTML = '<p class="text-muted">Nessun optional disponibile.</p>';
            } else {
                opts.forEach(opt => {
                    container.innerHTML += `
                        <label style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; cursor: pointer; transition: all 0.3s;" 
                               onmouseover="if(!this.querySelector('input').checked) this.style.background='rgba(59,130,246,0.05)'" 
                               onmouseout="if(!this.querySelector('input').checked) this.style.background='rgba(255,255,255,0.02)'">
                            <span style="font-weight: 700; color: #fff; font-size: 0.95rem;">${opt}</span>
                            <div style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.5); transition: all 0.2s;" class="opt-visual-check"></div>
                            <input type="checkbox" value="${opt}" class="opt-checkbox" style="display: none;" 
                                   onchange="
                                        const parent = this.parentElement;
                                        const visual = parent.querySelector('.opt-visual-check');
                                        if(this.checked) {
                                            parent.style.borderColor = '#3b82f6';
                                            parent.style.background = 'rgba(59,130,246,0.1)';
                                            visual.style.background = '#3b82f6';
                                            visual.style.borderColor = '#3b82f6';
                                            visual.innerHTML = '<i class=\\'fa-solid fa-check\\' style=\\'color:#fff; font-size:12px;\\'></i>';
                                        } else {
                                            parent.style.borderColor = 'rgba(255,255,255,0.05)';
                                            parent.style.background = 'rgba(255,255,255,0.02)';
                                            visual.style.background = 'rgba(0,0,0,0.5)';
                                            visual.style.borderColor = 'rgba(255,255,255,0.2)';
                                            visual.innerHTML = '';
                                        }
                                   ">
                        </label>
                    `;
                });
            }
        }
    });
});

function aggiornaOpzioniAppartamenti(d) {
    const container = document.getElementById('container-tipologie');
    if(!container) return;
    container.innerHTML = '';
    
    const aggiungiCard = (nome, disp, isVip) => {
        if(disp <= 0) return;
        const color = isVip ? '#eab308' : '#3b82f6';
        const iconClass = isVip ? 'fa-solid fa-crown' : 'fa-solid fa-house';
        
        const isSelectedClass = (selectedTipoAppartamento === nome) ? 'selected' : '';
        
        const html = `
            <div class="wizard-card ${isSelectedClass}" onclick="selezionaTipo(this, '${nome}')" data-tipo="${nome}">
                <i class="${iconClass}" style="color:${color}; font-size:1.8rem; margin-bottom: 1rem; display:block;"></i>
                <div style="font-weight: 800; font-size: 1.25rem; margin-bottom: 0.5rem; color: #fff;">${nome}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 700;">Camere Libere: <span style="color: ${color};">${disp}</span></div>
            </div>
        `;
        container.innerHTML += html;
    };

    aggiungiCard('Piccola', d.piccola, false);
    aggiungiCard('Media', d.media, false);
    aggiungiCard('Grande', d.grande, false);
    aggiungiCard('VIP', d.vip, true);

    if(container.innerHTML === '') {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem; grid-column: 1 / -1; text-align: center;">Nessun appartamento disponibile al momento.</p>';
    }
}

function selezionaTipo(element, valore) {
    document.querySelectorAll('.wizard-card').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedTipoAppartamento = valore;
}

function updateProgress(step) {
    const line = document.getElementById('progress-line');
    if (step === 1) line.style.width = '0%';
    if (step === 2) line.style.width = '50%';
    if (step === 3) line.style.width = '100%';

    for(let i=1; i<=3; i++) {
        const ind = document.getElementById('ind-'+i);
        ind.className = 'step-indicator';
        if (i < step) ind.classList.add('completed');
        if (i === step) ind.classList.add('active');
    }
}

function nextStep(toStep) {
    if (toStep === 2) {
        if (!selectedTipoAppartamento) {
            Swal.fire('Attenzione', 'Seleziona una tipologia di appartamento prima di procedere.', 'warning');
            return;
        }
    }
    
    if (toStep === 3) {
        const nick = document.getElementById('prenota-nick').value.trim();
        const giorni = document.getElementById('prenota-giorni').value;
        if (!nick || !giorni || giorni <= 0) {
            Swal.fire('Attenzione', 'Inserisci un nome valido e i giorni di durata.', 'warning');
            return;
        }
        
        // Popola riepilogo
        document.getElementById('riepilogo-nick').innerText = nick;
        document.getElementById('riepilogo-tipo').innerText = selectedTipoAppartamento;
        document.getElementById('riepilogo-giorni').innerText = giorni + ' Giorni';
        
        const checkBoxes = document.querySelectorAll('.opt-checkbox:checked');
        let optionals = [];
        checkBoxes.forEach(c => optionals.push(c.value));
        document.getElementById('riepilogo-opt').innerText = optionals.length > 0 ? optionals.join(', ') : 'Nessuno';
    }

    document.querySelectorAll('.step-container').forEach(el => el.classList.remove('active'));
    document.getElementById('step-' + toStep).classList.add('active');
    updateProgress(toStep);
}

function prevStep(toStep) {
    document.querySelectorAll('.step-container').forEach(el => el.classList.remove('active'));
    document.getElementById('step-' + toStep).classList.add('active');
    updateProgress(toStep);
}

function inviaPrenotazione() {
    const nick = document.getElementById('prenota-nick').value.trim().toLowerCase();
    const giorni = document.getElementById('prenota-giorni').value;
    const optStr = document.getElementById('riepilogo-opt').innerText;

    db.ref('prenotazioni_appartamenti/' + Date.now()).set({
        nick: nick,
        tipo: selectedTipoAppartamento,
        giorni: parseInt(giorni),
        optional: optStr
    }).then(() => {
        Swal.fire({
            icon: 'success',
            title: 'Richiesta Inviata!',
            text: 'Un membro della Direzione valuterà la tua richiesta per l\\'appartamento.',
            confirmButtonText: 'Torna alla Home',
            confirmButtonColor: '#3b82f6',
            allowOutsideClick: false
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = '../index.html';
            }
        });
    }).catch(error => {
        Swal.fire('Errore', error.message, 'error');
    });
}
