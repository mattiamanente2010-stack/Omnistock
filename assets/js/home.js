// home.js
let magazziniDisponibiliGlobali = {};

document.addEventListener('DOMContentLoaded', () => {
    // Carica Disponibilità Magazzini
    db.ref('config/magDisp').on('value', snapshot => {
        const d = snapshot.val() || { s:0, m:0, l:0, vips:0, vipm:0, vipl:0 };
        magazziniDisponibiliGlobali = d;

        document.getElementById('disp-s').innerText = d.s || 0;
        document.getElementById('disp-m').innerText = d.m || 0;
        document.getElementById('disp-l').innerText = d.l || 0;
        document.getElementById('disp-vips').innerText = d.vips || 0;
        document.getElementById('disp-vipm').innerText = d.vipm || 0;
        document.getElementById('disp-vipl').innerText = d.vipl || 0;

        aggiornaOpzioniPrenotazione(d);
    });

    // Carica Data Lotteria
    db.ref('config/dataLotteria').on('value', snapshot => {
        document.getElementById('data-lotteria-pubblica').innerText = snapshot.val() || "Sabato 21:00";
    });

    // Carica Annunci
    db.ref('annunci').on('value', snapshot => {
        const list = snapshot.val() || {}; 
        const pub = document.getElementById('lista-annunci-pubblica'); 
        const box = document.getElementById('box-annunci');
        pub.innerHTML = ''; 
        const keys = Object.keys(list).sort((a,b) => b - a);
        
        if (keys.length > 0) { 
            box.style.display = 'block'; 
            keys.forEach(k => { 
                pub.innerHTML += `
                <div style="background: rgba(255,255,255,0.8); padding: 1rem; border-radius: 12px; border: 1px solid rgba(249, 115, 22, 0.2);">
                    <p style="font-weight: 500; margin-bottom: 0.5rem;">${list[k].testo}</p>
                    <p style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">
                        <i class="fa-solid fa-user-pen"></i> ${list[k].autore} • ${list[k].data}
                    </p>
                </div>`; 
            }); 
        } else { 
            box.style.display = 'none'; 
        }
    });

    // Carica Optional Dinamici
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

function mostraConfiguratore() {
    document.getElementById('sezione-configuratore').style.display = 'block';
    document.getElementById('sezione-configuratore').scrollIntoView({ behavior: 'smooth' });
}

function nascondiConfiguratore() {
    document.getElementById('sezione-configuratore').style.display = 'none';
}

function aggiornaOpzioniPrenotazione(d) {
    const container = document.getElementById('container-tipologie');
    if(!container) return;
    container.innerHTML = '';
    
    const aggiungiCard = (nome, disp, isVip) => {
        if(disp <= 0) return;
        const color = isVip ? 'var(--accent)' : '#fff';
        const icon = isVip ? '<i class="fa-solid fa-crown" style="color:var(--accent); font-size:0.8rem;"></i> ' : '';
        const html = `
            <div class="tipo-card" onclick="selezionaTipo(this, '${nome}')" 
                 style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1.5rem 1rem; border-radius: 12px; cursor: pointer; text-align: center; transition: all 0.3s;"
                 onmouseover="if(!this.classList.contains('selected')) this.style.background='rgba(255,255,255,0.05)'" 
                 onmouseout="if(!this.classList.contains('selected')) this.style.background='rgba(255,255,255,0.02)'">
                <div style="font-weight: 800; font-size: 1.1rem; margin-bottom: 0.5rem; color: ${color};">${icon}${nome}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;"><i class="fa-solid fa-boxes-stacked"></i> DISP: ${disp}</div>
            </div>
        `;
        container.innerHTML += html;
    };

    aggiungiCard('Size S', d.s, false);
    aggiungiCard('Size M', d.m, false);
    aggiungiCard('Size L', d.l, false);
    aggiungiCard('VIP Size S', d.vips, true);
    aggiungiCard('VIP Size M', d.vipm, true);
    aggiungiCard('VIP Size L', d.vipl, true);

    if(container.innerHTML === '') {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Nessun magazzino disponibile in questo momento.</p>';
    }
}

function selezionaTipo(element, valore) {
    // Rimuovi classe selected da tutti
    document.querySelectorAll('.tipo-card').forEach(el => {
        el.classList.remove('selected');
        el.style.borderColor = 'rgba(255,255,255,0.05)';
        el.style.background = 'rgba(255,255,255,0.02)';
        el.style.boxShadow = 'none';
    });
    
    // Aggiungi al cliccato
    element.classList.add('selected');
    element.style.borderColor = 'var(--primary)';
    element.style.background = 'rgba(37,99,235,0.05)';
    element.style.boxShadow = '0 0 15px rgba(37,99,235,0.15)';
    
    // Imposta input nascosto
    document.getElementById('prenota-tipo').value = valore;
}

function inviaPrenotazioneMagazzino() {
    const nick = document.getElementById('prenota-nick').value.trim().toLowerCase();
    const tipo = document.getElementById('prenota-tipo').value;
    const giorni = document.getElementById('prenota-giorni').value;

    if(!nick || !tipo || !giorni) {
        return Swal.fire('Errore', 'Compila tutti i campi (Nickname, Tipo, Giorni)', 'warning');
    }

    const checkBoxes = document.querySelectorAll('.opt-checkbox:checked');
    let optionals = [];
    checkBoxes.forEach(c => optionals.push(c.value));
    const optStr = optionals.length > 0 ? optionals.join(', ') : 'Nessuno';

    db.ref('prenotazioni_mag/' + Date.now()).set({
        nick: nick,
        tipo: tipo,
        giorni: parseInt(giorni),
        optional: optStr
    }).then(() => {
        document.getElementById('prenota-nick').value = '';
        checkBoxes.forEach(c => c.checked = false);
        nascondiConfiguratore();
        Swal.fire({
            icon: 'success',
            title: 'Richiesta Inviata!',
            text: 'Un membro dello staff preparerà il contratto. Controlla il Portale Cliente!'
        });
    });
}
