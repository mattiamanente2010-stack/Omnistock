// info.js

document.addEventListener('DOMContentLoaded', () => {
    const defaultInfo = `🏢 OMNISTOCK ATLANTIS - INFO E CATALOGO 🏢\n\nBenvenuti in Omnistock, il vostro partner di fiducia per la logistica e l'archiviazione sicura ad Atlantis.\n\n📦 AFFITTO MAGAZZINI\nOffriamo magazzini sicuri e privati situati nel Centro Commerciale.\n• Prezzi competitivi e flessibili.\n• Sicurezza garantita sulle vostre casse.\n• Verifica contratto sempre disponibile online.\n\n🎟️ LOTTERIA SETTIMANALE\nTenta la fortuna con il nostro montepremi!\n• Costo di un singolo biglietto: 25$\n• Premio finale: Il 50% di tutto il fatturato raccolto.\n• Estrazione pubblica.\n\nPer qualsiasi domanda o per effettuare un affitto, aprite un Ticket nell'Area Clienti del sito.`;
        
    db.ref('config/infoAzienda').on('value', snapshot => {
        const testo = snapshot.val() || defaultInfo;
        const container = document.getElementById('testo-info-pubblica');
        if(container) {
            container.innerText = testo;
        }
    });
});
