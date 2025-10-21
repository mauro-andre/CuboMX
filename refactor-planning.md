# Plano de Refatoração do CuboMX: Rumo à Reatividade Transparente

## 1. Problema Atual e Necessidade de Refatoração

A discussão recente sobre a implementação do CuboMX revelou uma crescente complexidade, especialmente em torno da manipulação de arrays reativos, como o `SubArrayProxy` e o `ItemArrayProxy`. Embora a funcionalidade esteja presente, a experiência do desenvolvedor (DX) é comprometida por:

*   **Exposição de Proxies:** O desenvolvedor precisa estar ciente de que está manipulando um `SubArrayProxy` ou `ItemArrayProxy`, e não um array JavaScript nativo. Isso se manifesta na necessidade de asserções de tipo (`as SubArrayProxy<string>`) e na existência de métodos não-nativos (`.add()`, `.delete()`, `.toArray()`) para operações básicas de array.
*   **Falta de Transparência:** A "mágica" da reatividade não é totalmente transparente, exigindo que o desenvolvedor aprenda e utilize APIs específicas do CuboMX para tarefas que, idealmente, deveriam ser realizadas com JavaScript padrão.
*   **Confusão na Depuração:** A manipulação de proxies pode tornar a depuração mais complexa, pois um `console.log` pode não exibir o conteúdo esperado de forma intuitiva.

Ainda acreditamos firmemente no princípio de "HTML como fonte da verdade" e no CuboMX como uma ferramenta de hidratação que, uma vez ativada, sincroniza o estado do componente JavaScript com o DOM de forma reativa. No entanto, a forma como essa sincronização é alcançada precisa ser repensada para priorizar a simplicidade e a intuitividade para o desenvolvedor.

## 2. Visão Central da Refatoração: Reatividade Transparente

A visão para o CuboMX é a de um framework que atua como uma **camada de tradução transparente e inteligente** entre o estado do componente JavaScript e o DOM, e vice-versa. O desenvolvedor não deve precisar se preocupar em manipular proxies diretamente ou aprender métodos especiais para operações de dados comuns.

**Objetivos da Experiência do Desenvolvedor (DX):**

*   **JavaScript Idiomático:** O desenvolvedor deve escrever JavaScript padrão, manipulando objetos e arrays nativos como faria em qualquer aplicação.
*   **CuboMX como "Mágica Invisível":** O CuboMX deve ser o orquestrador silencioso que detecta as mutações nesses dados JavaScript padrão e as traduz em atualizações eficientes do DOM.
*   **Sincronização Bidirecional:** A sincronização deve ocorrer de forma fluida:
    *   **DOM -> Componente (Hidratação e Inputs):** Extrair dados do HTML para o estado do componente e atualizar o estado do componente com a interação do usuário em inputs.
    *   **Componente -> DOM (Reatividade):** Refletir as mudanças no estado do componente no DOM.

## 3. Áreas Chave de Refatoração e Abordagem Técnica

Para alcançar essa visão, as seguintes áreas serão focadas:

### 3.1. Reatividade de Arrays (SubArrayProxy e ItemArrayProxy)

*   **Problema:** Atualmente, `ItemArrayProxy` possui métodos especiais (`add()`, `delete()`, `prepend()`, `insert()`, `clear()`, `remove()`) e `SubArrayProxy` exige asserções de tipo ou métodos como `toArray()`.
*   **Meta:** O desenvolvedor deve manipular arrays usando **apenas os métodos nativos do JavaScript** (`push`, `pop`, `splice`, `shift`, `unshift`, `sort`, `reverse`, `length = X`).
*   **Abordagem Técnica:**
    *   **Proxies Transparentes:** O CuboMX deve garantir que as propriedades de array (declaradas via `mx-item` ou `::prop.array`) sejam, em tempo de execução, proxies que interceptam *todos* os métodos de mutação de array nativos.
    *   **Detecção de Mutação:** Ao detectar uma mutação nativa (ex: `items.push(novoItem)`), o CuboMX deve inferir a intenção (ex: "adicionar um novo item `mx-item`") e realizar a manipulação do DOM correspondente.
    *   **Gerenciamento de Templates:** O `ItemArrayProxy` e o `SubArrayProxy` precisarão armazenar o template HTML do elemento `mx-item` ou `::prop.array` para poderem criar novos elementos DOM quando um item é adicionado via `push` ou `splice`.
    *   **Sincronização Assíncrona:** A manipulação do DOM acionada por mutações nativas de array deve ser assíncrona (usando `setTimeout(0)` ou `Promise.resolve().then()`) para permitir que o `MutationObserver` do CuboMX processe as mudanças de forma controlada e evite loops infinitos.

### 3.2. Transparência no `console.log`

*   **Problema:** `console.log` de proxies pode ser confuso.
*   **Meta:** Quando um objeto ou array reativo é logado, o console deve exibir o **conteúdo do objeto/array subjacente** de forma intuitiva, como se fosse um tipo JavaScript normal. A indicação de que é um Proxy deve ser secundária (ex: ao expandir o objeto no console).
*   **Abordagem Técnica:** Utilizar as capacidades dos Proxies para fornecer uma representação amigável para o console, se necessário, ou confiar no comportamento padrão dos consoles modernos que já tentam desempacotar proxies.

### 3.3. Alinhamento da Definição de Tipos (TypeScript)

*   **Problema:** A necessidade de asserções de tipo (`as SubArrayProxy<string>`) ou a marcação de métodos como opcionais (`toArray?()`) que são sempre presentes em tempo de execução.
*   **Meta:** As definições de tipo devem refletir a "mágica" do runtime, permitindo que o desenvolvedor tipifique suas propriedades como `Array<T>` e o TypeScript entenda que elas se tornarão reativas em tempo de execução.
*   **Abordagem Técnica:** Investigar técnicas avançadas de TypeScript (como "declaration merging" ou "interface augmentation" para tipos nativos como `Array`) ou tipos condicionais para que a atribuição de `Array<T>` a uma propriedade reativa seja validada sem asserções explícitas.

Esta refatoração visa solidificar o CuboMX como uma ferramenta que capacita o desenvolvedor a construir interfaces dinâmicas com a simplicidade do JavaScript padrão e a robustez da reatividade transparente.
