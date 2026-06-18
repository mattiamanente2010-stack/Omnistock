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

});
