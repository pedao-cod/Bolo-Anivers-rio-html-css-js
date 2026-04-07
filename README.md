# Bolo-Anivers-rio-html-css-js

# Bolo de Aniversário Interativo 🎂

Um pequeno projeto front-end interativo e romântico, desenvolvido como um presente especial de aniversário. A aplicação permite a montagem de um bolo em camadas com animações fluídas e um sistema de física simples construído do zero.

## ✨ Funcionalidades

* **Física Interativa:** As camadas do bolo caem e "quicam" ao se empilharem, simulando gravidade, inércia e colisão elástica usando a API do Canvas 2D.
* **Controles Manuais:** Botões intuitivos para soltar cada camada individualmente, permitindo que o usuário interaja ativamente com a surpresa.
* **Efeitos Visuais e Partículas:** Quando o bolo é completado, uma vela se acende com uma chama trêmula (animada via funções matemáticas de tempo) e um sistema de partículas gera confetes coloridos que caem com gravidade simulada.
* **Design Responsivo:** A interface se adapta perfeitamente tanto em telas de desktop quanto em dispositivos móveis.

## 🚀 Como rodar o projeto

Como é um projeto *vanilla* (puro e sem frameworks), não é necessário instalar nenhuma dependência (como Node.js ou npm) ou rodar um servidor local.

1. Baixe ou copie o código fonte e salve como `index.html`.
2. Dê um duplo clique no arquivo `index.html` para abri-lo em qualquer navegador de internet moderno (Google Chrome, Firefox, Safari, Edge, etc).
3. Interaja com os botões na tela para montar o bolo.

## 🛠️ Tecnologias Utilizadas

* **HTML5:** Estruturação semântica e do elemento `<canvas>`.
* **CSS3:** Estilização da interface, sombreamentos, tipografia, botões responsivos e *media queries* para adaptação mobile.
* **JavaScript (ES6):** Orientação a objetos para as camadas e confetes, *requestAnimationFrame* para o loop principal da animação e manipulação do contexto do Canvas para renderização 2D.

## ✏️ Como Personalizar

Se desejar alterar a mensagem principal para outra ocasião especial, basta editar a seguinte tag HTML dentro do arquivo `index.html`:

```html
<div class="birthday-message">
  Feliz aniversário, Minha Princesinha!<br>
  Eu te amo ao infinito, mor 🩵!
</div>
Para alterar as cores das camadas do bolo, edite a constante LAYER_COLORS no script JavaScript com os códigos Hexadecimais de sua preferência:

JavaScript
const LAYER_COLORS = ['#ff9eb5', '#ffcb85', '#a7d0f9', '#c5e8a7'];
Feito com ❤️ e código.
