// shop.js

document.addEventListener('DOMContentLoaded', () => {
    db.ref('shop/items').on('value', snapshot => {
        const items = snapshot.val() || {};
        const gridPubblica = document.getElementById('grid-shop-pubblico');
        
        if(!gridPubblica) return;
        
        gridPubblica.innerHTML = '';
        let countPubblico = 0;

        for(let k in items) {
            const item = items[k];
            
            if(item.stato === 'disponibile') {
                countPubblico++;
                gridPubblica.innerHTML += `
                <div class="glass-card" style="border-top: 4px solid var(--accent); display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                    <div>
                        <h3 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem; color: var(--text-dark);">${item.nome}</h3>
                        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem;">${item.desc}</p>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 1.5rem; margin-top: auto;">
                        <span style="font-size: 1.75rem; font-weight: 900; color: #10b981;">${item.prezzo}$</span>
                        <button onclick="prenotaArticolo('${k}', '${item.nome.replace(/'/g, "\\'")}')" class="btn btn-accent"><i class="fa-solid fa-cart-arrow-down"></i> Prenota</button>
                    </div>
                </div>`;
            }
        }
        
        if(countPubblico === 0) {
            gridPubblica.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; background: rgba(255,255,255,0.5); border-radius: 24px; border: 1px dashed rgba(0,0,0,0.1);">
                <i class="fa-solid fa-box-open" style="font-size: 3rem; color: var(--text-muted); opacity: 0.5; margin-bottom: 1rem;"></i>
                <p style="color: var(--text-muted); font-size: 1.1rem; font-weight: 500;">Al momento non ci sono articoli disponibili in vetrina.</p>
            </div>`;
        }
    });
});

function prenotaArticolo(id, nome) {
    Swal.fire({
        title: 'Prenota ' + nome,
        text: "Inserisci il tuo Nickname in città. Ritirerai e pagherai l'oggetto in sede.",
        input: 'text',
        inputPlaceholder: 'Es. MarioRossi',
        showCancelButton: true,
        confirmButtonText: 'Conferma Prenotazione',
        confirmButtonColor: 'var(--accent)',
        cancelButtonText: 'Annulla'
    }).then(r => {
        if(r.isConfirmed && r.value) {
            const nick = r.value.trim().toLowerCase();
            const codice = Math.random().toString(36).substring(2, 6).toUpperCase();
            
            db.ref('shop/items/'+id).update({ stato: 'prenotato' });
            db.ref('shop/orders/'+Date.now()).set({ 
                item_id: id, 
                item_nome: nome, 
                nick: nick, 
                codice: codice 
            });
            
            Swal.fire({
                icon: 'success', 
                title: 'Prenotazione Confermata!',
                html: `
                <p style="margin-bottom: 1rem;">Il tuo codice segreto di ritiro è:</p>
                <div style="font-family: monospace; font-size: 2.5rem; font-weight: 900; letter-spacing: 4px; color: var(--accent); background: rgba(249, 115, 22, 0.1); padding: 1rem; border-radius: 12px; border: 1px dashed var(--accent); display: inline-block;">${codice}</div>
                <p style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-muted);">Puoi sempre ritrovare questo codice nel tuo Portale Cliente. Mostralo allo staff in cassa!</p>
                `
            });
        }
    });
}
