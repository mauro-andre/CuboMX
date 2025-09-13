# Arquitetura do Refactor do CuboMX

Este documento detalha as decisões de arquitetura e o estado atual do `CuboMX-refactor.js`.

## 1. Visão Geral da Arquitetura: API "Plana" e Global

Decidimos por uma abordagem "disruptiva" que simplifica radicalmente a API pública e o modelo mental do framework.

- **Namespace Único e Plano:** Todas as entidades reativas (stores, singletons, componentes com `ref`) são acessíveis diretamente no objeto global `CuboMX`. Não existem mais os namespaces `CuboMX.stores` ou `CuboMX.refs`.
  - Exemplo: `CuboMX.theme`, `CuboMX.user`, `CuboMX.contactForm`.

- **Colisão de Nomes:** Como consequência, nomes de stores, singletons e `mx-ref`s devem ser únicos em toda a aplicação. A implementação deve lançar um erro claro no console se houver uma tentativa de registrar um nome que já está em uso.

- **Trade-off:** Aceitamos que o HTML se tornará um pouco mais verboso (ex: `mx-text="form.email"` em vez de `mx-text="email"`) em troca de uma previsibilidade e simplicidade absolutas do sistema, eliminando a "mágica" da busca por escopo no DOM.

## 2. O Papel das Diretivas

- **`mx-data` (Apenas Ciclo de Vida):** A única responsabilidade desta diretiva é gerenciar o ciclo de vida de um componente. Ela diz ao CuboMX: "Enquanto este elemento existir no DOM, garanta que o proxy correspondente exista em `CuboMX`". Ela **não** cria um escopo para os elementos filhos.

- **Todas as Outras Diretivas (Globais e Explícitas):** Todas as outras diretivas (`mx-text`, `mx-on`, `:class`, etc.) são sempre avaliadas no contexto do objeto global `CuboMX`. Elas devem ser explícitas e conter o nome do proxy que desejam acessar.
  - Exemplo: `<span mx-text="counter.value">` sempre se refere a `CuboMX.counter.value`.

## 3. Estrutura Interna do Código (`CuboMX-refactor.js`)

- **`activeProxies`:** É o coração do estado da aplicação. Um objeto JavaScript plano que armazena todos os proxies ativos, usando seus nomes globais como chaves.

- **`CuboMX` (Proxy Global):** O próprio objeto `CuboMX` exportado é um `Proxy`. Isso permite que ele intercepte acessos a propriedades. Se a propriedade for um método da API (`.start`, `.component`), ele a retorna. Se não for, ele a procura dentro do `activeProxies`, criando assim a API plana dinâmica.

- **`createProxy(obj, name)`:** É a fábrica central para todos os objetos reativos. Ela recebe um objeto e seu nome global, e retorna um `Proxy` que:
  - No `get`: Implementa a funcionalidade `this.$watch`.
  - No `set`: Contém a lógica de reatividade. Atualmente, ele dispara `watchers` registrados e reavalia todas as `bindings` (diretivas) do DOM.

- **`CuboMX.component`:** Unificamos `singleton` e `factory`. Agora existe apenas `CuboMX.component(name, definition)`. A lógica de `scanDOM` diferencia se é um singleton ou factory com base na presença de `()` no atributo `mx-data`.

- **`mx-ref` Gerado:** Para factories anônimas (sem `mx-ref`), a função `scanDOM` gera um `mx-ref` único (ex: `_cubo_0`), o atribui ao elemento no DOM e o usa como chave no `activeProxies`. Isso garante que todos os componentes tenham um vínculo com o DOM para o gerenciamento do ciclo de vida (`destroy`).

- **Inicialização (`start` e `scanDOM`):
  1. Os `stores` são processados e seus proxies são criados.
  2. `scanDOM` varre o `document.body` em busca de `mx-data` e cria os proxies dos componentes.
  3. Todos os novos proxies (de stores e componentes) que possuem um método `init` são adicionados a uma `initQueue`.
  4. A função `processInit` é chamada com essa fila, executando todos os `init()` somente após todos os proxies já existirem.
  5. A função `bindDirectives` é chamada para registrar as diretivas reativas do DOM.
  6. Um `MutationObserver` é iniciado para observar futuras alterações no DOM, disparando `scanDOM`/`processInit`/`bindDirectives` para novos elementos e `destroyProxies` para elementos removidos.

## 4. Testes (TDD)

Todo o desenvolvimento está sendo guiado por testes usando Vitest e JSDOM.

- **`test/FlatAPI.test.js`:** Valida a criação de proxies e sua exposição na API global plana para stores, singletons e refs.
- **`test/DOM-Mutation.test.js`:** Valida o ciclo de vida dinâmico, garantindo que `init()` e `destroy()` são chamados corretamente quando elementos são adicionados/removidos do DOM.
- **`test/Directive-Evaluation.test.js`:** Valida a avaliação e reatividade das diretivas do DOM, começando com `mx-text`.
