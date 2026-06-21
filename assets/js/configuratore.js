// configuratore.js

let selectedTipo = null;

document.addEventListener('DOMContentLoaded', () => {
    // Carica Disponibilità
    db.ref('config/magDisp').on('value', snapshot => {
        const d = snapshot.val() || { s:0, m:0, l:0, vips:0, vipm:0, vipl:0 };
        aggiornaOpzioniPrenotazione(d);
    });

    // Carica Optional
    db.ref('config/magOptionals').on('value', snapshot => {
        const val = snapshot.val() || "Telecamere, Scrivania, Zona Relax, Cassaforte Extra";
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
                               onmouseover="if(!this.querySelector('input').checked) this.style.background='rgba(255,255,255,0.05)'" 
                               onmouseout="if(!this.querySelector('input').checked) this.style.background='rgba(255,255,255,0.02)'">
                            <span style="font-weight: 700; color: #fff; font-size: 0.95rem;">${opt}</span>
                            <div style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.5); transition: all 0.2s;" class="opt-visual-check"></div>
                            <input type="checkbox" value="${opt}" class="opt-checkbox" style="display: none;" 
                                   onchange="
                                        const parent = this.parentElement;
                                        const visual = parent.querySelector('.opt-visual-check');
                                        if(this.checked) {
                                            parent.style.borderColor = 'var(--primary)';
                                            parent.style.background = 'rgba(37,99,235,0.05)';
                                            visual.style.background = 'var(--primary)';
                                            visual.style.borderColor = 'var(--primary)';
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

function aggiornaOpzioniPrenotazione(d) {
    const container = document.getElementById('container-tipologie');
    if(!container) return;
    container.innerHTML = '';
    
    const aggiungiCard = (nome, disp, isVip) => {
        if(disp <= 0) return;
        const color = isVip ? 'var(--accent)' : '#fff';
        const icon = isVip ? '<i class="fa-solid fa-crown" style="color:var(--accent); font-size:1.5rem; margin-bottom: 1rem; display:block;"></i>' : '<i class="fa-solid fa-box" style="color:var(--text-muted); font-size:1.5rem; margin-bottom: 1rem; display:block;"></i>';
        
        const isSelectedClass = (selectedTipo === nome) ? 'selected' : '';
        
        const html = `
            <div class="wizard-card ${isSelectedClass}" onclick="selezionaTipo(this, '${nome}')">
                ${icon}
                <div style="font-weight: 800; font-size: 1.25rem; margin-bottom: 0.5rem; color: ${color};">${nome}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 700;">Disponibilità: ${disp}</div>
            </div>
        `;
        container.innerHTML += html;
    };

    aggiungiCard('Standard S', d.s, false);
    aggiungiCard('Standard M', d.m, false);
    aggiungiCard('Standard L', d.l, false);
    aggiungiCard('VIP S', d.vips, true);
    aggiungiCard('VIP M', d.vipm, true);
    aggiungiCard('VIP L', d.vipl, true);

    if(container.innerHTML === '') {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem; grid-column: 1 / -1;">Nessun magazzino disponibile in questo momento.</p>';
    }
}

function selezionaTipo(element, valore) {
    document.querySelectorAll('.wizard-card').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedTipo = valore;
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
        if (!selectedTipo) {
            Swal.fire('Attenzione', 'Seleziona una tipologia di magazzino prima di procedere.', 'warning');
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
        document.getElementById('riepilogo-tipo').innerText = selectedTipo;
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

    db.ref('prenotazioni_mag/' + Date.now()).set({
        nick: nick,
        tipo: selectedTipo,
        giorni: parseInt(giorni),
        optional: optStr
    }).then(() => {
        Swal.fire({
            icon: 'success',
            title: 'Richiesta Inviata!',
            text: 'Un membro dello staff preparerà il contratto.',
            confirmButtonText: 'Torna alla Home',
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
