# Plano de Ação: Funcionalidade `beforeRender` para Hidratação Crítica

## 1. Objetivo

Resolver o problema de "flicker" (FOUC - Flash of Unstyled Content) que ocorre em aplicações SSR quando o estado inicial renderizado pelo servidor difere do estado que o JavaScript no cliente precisa aplicar. Um exemplo clássico é uma sidebar que o servidor renderiza expandida, mas o cliente, com base no `localStorage` ou `window.innerWidth`, precisa que ela esteja colapsada desde o início.

O objetivo é criar uma solução robusta, integrada ao framework CuboMX e transparente para o desenvolvedor, que aplique esse estado crítico do lado do cliente **antes** da primeira pintura do navegador, eliminando o flicker.

A solução não deve depender de uma ferramenta de build específica (Vite, Webpack), mas pode assumir que um processo de build está em uso.

## 2. Arquitetura Proposta

A solução consiste em duas partes principais que trabalham em conjunto:

1.  **Um novo hook de ciclo de vida:** `beforeRender()` a ser definido nos componentes.
2.  **Uma nova ferramenta de linha de comando (CLI):** `cubomx build`, que virá com o pacote `npm`.

A ideia central é que o desenvolvedor declare a "lógica crítica" no hook `beforeRender`, e a ferramenta de build extraia essa lógica para gerar um script que será executado de forma síncrona no `<head>` da página.

## 3. A Experiência do Desenvolvedor

### A. O Hook `beforeRender`

O desenvolvedor define um método `beforeRender` no seu componente. Este método deve:
- Conter apenas lógica síncrona.
- Usar apenas APIs do navegador que estão disponíveis imediatamente (ex: `window`, `localStorage`).
- Retornar um objeto onde as chaves são nomes de classes CSS e os valores são booleanos indicando se a classe deve ou não ser aplicada ao elemento raiz do componente.

**Exemplo (`sidebar.js`):**
```javascript
CuboMX.component('sidebar', {
    beforeRender() {
        const isMobile = window.innerWidth <= 800;
        const storageStatus = JSON.parse(localStorage.getItem("is_sidebar_collapsed"));
        const shouldCollapse = isMobile || (!isMobile && storageStatus);
        return { 
            'collapsed': shouldCollapse,
            'outra-classe': true 
        };
    },
    // ... resto da lógica do componente (init, toggleCollapse, etc.)
});
```

### B. O Comando `cubomx build`

O desenvolvedor adiciona a execução do CLI ao seu script de build no `package.json`. O CLI receberá o "ponto de entrada" da aplicação, onde os componentes são registrados.

**Exemplo (`package.json`):**
```json
"scripts": {
  "dev": "vite",
  "build": "cubomx build --entry src/main.js --output dist/critical.js && vite build"
}
```

### C. A Injeção no Template do Servidor

O desenvolvedor configura seu template de servidor (Jinja, Blade, etc.) para injetar o conteúdo do arquivo `critical.js` gerado dentro de uma tag `<script>` no `<head>`.

**Exemplo (template base):**
```html
<head>
    <meta charset="UTF-8">
    <script>
        // O conteúdo de 'dist/critical.js' será injetado aqui pelo backend
    </script>
    <link rel="stylesheet" href="/main.css">
    <script type="module" src="/main.js"></script>
</head>
```

## 4. Detalhes da Implementação

### O Comando `cubomx build`

Este será um script Node.js que funcionará como um CLI.

1.  **Interface:** Será registrado no `package.json` do CuboMX através da chave `bin` para ser acessível como `cubomx`. Aceitará os argumentos `--entry` e `--output`.
2.  **Estratégia de "Mock":** Para descobrir os componentes sem depender do sistema de arquivos diretamente, o builder usará a seguinte estratégia:
    a. Criará um objeto "dublê" (mock) do `CuboMX` em memória.
    b. Este mock terá os métodos `component(name, definition)` e `store(name, definition)`. O método `store` será uma função vazia (no-op), mas o método `component` irá salvar a `definition` de cada componente em uma lista interna.
    c. O builder executará o arquivo de `--entry` (ex: `src/main.js`) dentro do ambiente Node.js, usando o `CuboMX` dublê. Isso fará com que todas as chamadas `CuboMX.component` populem a lista interna do builder.
3.  **Lógica de Geração de Script:**
    a. Após executar o entry point, o builder irá iterar sobre a lista de definições de componentes que ele coletou.
    b. Para cada componente que possuir o método `beforeRender`, ele irá gerar uma string de um IIFE (Immediately Invoked Function Expression).
    c. A string gerada para cada componente será no formato:
        ```javascript
        (function() {
            try {
                var el = document.querySelector('[mx-data="NOME_DO_COMPONENTE"]');
                if (el) {
                    var logic = (FUNÇÃO_BEFORE_RENDER_COMO_STRING);
                    var classes = logic();
                    for (var className in classes) {
                        if (Object.prototype.hasOwnProperty.call(classes, className) && classes[className]) {
                            el.classList.add(className);
                        }
                    }
                }
            } catch(e) { console.error(e); }
        })();
        ```
    d. Todas as strings de IIFE geradas serão concatenadas em um único bloco de texto.
    e. Este bloco de texto final será salvo no caminho especificado por `--output`.

### O Hook `beforeRender` no Runtime

Para a implementação inicial desta funcionalidade, o runtime principal do `CuboMX.js` **não precisa ser alterado**. O hook `beforeRender` é apenas uma convenção lida pela ferramenta de build. A lógica dele é executada pelo `critical.js` antes do `main.js` (que contém o CuboMX) ser carregado, resolvendo o problema do flicker de forma isolada.
