import '../css/main.css';
import { CuboMX } from 'cubomx';
import { codeToHtml } from 'shiki';

console.log('CuboMX loaded', CuboMX);

// --- Componentes do Site ---

CuboMX.component('featureGrid', {
    handleMouseMove(event, card) {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    }
});

CuboMX.component('counter', {
    value: 0,
    increment() { this.value++ },
});

CuboMX.component('codeBlock', () => ({
    async init() {
        const pre = this.$el.querySelector('pre');
        if (!pre) return;

        const code = pre.textContent.trim();
        const lang = pre.getAttribute('data-lang');

        const html = await codeToHtml(code, {
            lang: lang,
            theme: 'dracula'
        });

        // Cria um elemento temporário para não mexer no DOM ao vivo
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const newPre = tempDiv.querySelector('pre');

        // Adiciona as classes de padding e estilo ao novo <pre>
        if (newPre) {
            // Remove o background que a Shiki adiciona, para usarmos o nosso
            newPre.style.backgroundColor = 'transparent';
            newPre.classList.add('p-6', 'text-sm');
            // Substitui o <pre> antigo pelo novo, já estilizado
            pre.replaceWith(newPre);
        }
    }
}));


// --- Iniciar CuboMX ---
CuboMX.start();

