# Documentação da Funcionalidade: Estado Inicial para `swapTemplate`

## 1. Objetivo da Funcionalidade

O objetivo é estender a função `CuboMX.swapTemplate` para que ela aceite uma nova opção chamada `state`. Este objeto `state` permitirá ao desenvolvedor fornecer dados iniciais para os componentes que serão renderizados a partir do template.

O principal caso de uso é a renderização dinâmica de listas, onde cada novo item (um componente) precisa ser criado com dados específicos (ex: uma nova mensagem de chat com seu texto e autor, um novo alerta com sua mensagem, etc.).

**Exemplo de Uso Desejado:**
```javascript
CuboMX.swapTemplate('alerta-template', {
  target: '#container:beforeend',
  state: {
    alerta: { // 'alerta' é o nome do componente em mx-data
      mensagem: 'Operação concluída com sucesso!',
      tipo: 'success'
    }
  }
});
```

## 2. Alterações Realizadas (Etapa 1 - `@src/request.js`)

Esta etapa **já foi concluída** no código. As seguintes alterações foram feitas:

1.  **Refatoração de `applySwaps`**: A função foi refatorada para parar de usar manipulação de strings de HTML (`innerHTML`) e passar a usar manipulação de nós de DOM (`replaceChildren`, `append`, etc.). Isso foi um pré-requisito técnico para permitir a modificação dos elementos *antes* de sua inserção no DOM.

2.  **Inteligência em `applySwaps`**: A função agora contém uma lógica de "pré-processamento":
    *   Ela aceita o objeto `state` vindo da chamada da função.
    *   Após criar os nós do DOM a partir do HTML do template, mas antes de inseri-los na página, ela procura por todos os elementos com o atributo `[mx-data]`.
    *   Para cada elemento encontrado, ela identifica o nome do componente (ex: "alerta" de `mx-data="alerta()"`).
    *   Ela usa esse nome como chave para procurar os dados correspondentes no objeto `state`.
    *   Se encontrar, ela anexa esses dados ao elemento usando uma propriedade especial: `el.__cubo_initial_state__ = state[componentName]`.

3.  **Atualização da Assinatura de Funções**: As funções `swapHTML` e `processDOMUpdate` foram atualizadas para aceitar a opção `state` e repassá-la até chegar na `applySwaps`.

## 3. Próximos Passos (Etapa 2 - `@src/CuboMX.js`)

Esta é a parte que **precisa ser implementada** para que a funcionalidade seja concluída.

1.  **`swapTemplate`**: A função precisa ser modificada para reconhecer a opção `state` e passá-la adiante na sua chamada para `this.swapHTML`.

2.  **`scanDOM`**: Esta função precisa ser modificada para "consumir" a propriedade que foi preparada pela `applySwaps`.
    *   Ao processar um novo elemento, ela deve verificar se `el.__cubo_initial_state__` existe.
    *   Se existir, ela deve usar `Object.assign()` para mesclar este objeto de estado na instância do componente que está sendo criada. Isso garante que o componente "nasça" com os dados corretos.

3.  **`mx-bind:` (A Correção Crítica)**: Descobrimos que a lógica padrão da diretiva `mx-bind:` (e seus atalhos como `:text`) entra em conflito com nosso objetivo.
    *   **O Problema:** Por padrão, após um componente ser criado, a diretiva `mx-bind:` "hidrata" o estado do componente a partir do conteúdo do DOM. Isso significa que ela lê o texto do template (ex: "Título Padrão") e sobrescreve o estado que acabamos de injetar (ex: "Título do Estado").
    *   **A Solução:** A diretiva `mx-bind:` precisa ser alterada para também verificar a existência da "bandeira" `__cubo_initial_state__` no elemento do componente (`el.closest('[mx-data]')`).
        *   Se a bandeira existir, a diretiva **não deve** hidratar os dados a partir do DOM, pois o estado injetado tem prioridade.
        *   Se a bandeira não existir, ela deve seguir com seu comportamento normal de hidratação para não quebrar outras funcionalidades do framework.

## 4. Testes (TDD)

Seguindo a metodologia TDD, já foram adicionados 3 testes (que atualmente falham) ao arquivo `@test/SwapTemplate.test.js` para validar a funcionalidade:

1.  **`should initialize a component with the provided initial state`**: Valida o caso de uso básico de inicializar um componente com dados específicos.
2.  **`should apply the same initial state to all instances of the same component type`**: Garante que, se um template tiver múltiplos componentes do mesmo tipo, o estado será aplicado a todos.
3.  **`should apply correct initial state to different components in the same template`**: Valida que os dados para diferentes tipos de componentes (`compA`, `compB`) são roteados corretamente para suas respectivas instâncias.

**Nota sobre Assincronicidade:** Uma descoberta importante da depuração foi que os testes falham não apenas pela ausência da implementação, mas também porque eles rodam de forma síncrona. O `MutationObserver`, que o CuboMX usa para ativar componentes, é assíncrono. Portanto, a etapa final, após a implementação do código, será ajustar esses 3 testes para que sejam `async` e esperem a atualização do DOM antes de fazer as asserções.
