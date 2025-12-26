/**
 * BLAINE DECK ENGINE - Advanced 3D Card Physics & Interaction
 * Versão: 2.0.0
 * Descrição: Gerencia a profundidade, animações de queda e interações táteis.
 */

(function() {
    'use strict';

    // ==========================================
    // 1. CONFIGURAÇÕES E ESTADO GLOBAL
    // ==========================================
    const CONFIG = {
        cardPath: 'cards/',
        cards: '"as","5h","9s","2s","qh","3d","qc","8h","6s","5s","9h","kc",
  "2d","jh","3s","8s","6h","xc","5d","kd","2c","3h","8d","5c",
  "ks","jd","8c","xs","kh","jc","7s","xh","ad","4s","7h","4d",
  "ac","9c","js","qd","7d","qs","xd","6c","ah","9d","4c","2h",
  "7c","3c","4h","6d"], // Expanda conforme necessário
        animationDuration: 850, // ms
        shakeIntensity: 5,      // px para o impacto
        depthOffset: 0.5,       // Deslocamento para simular espessura
        perspectiveValue: 1200
    };

    let state = {
        currentIndex: 0,
        isAnimating: false,
        touchStartX: 0,
        touchStartY: 0,
        lastInteractionTime: 0,
        autoPlayTimer: null
    };

    // ==========================================
    // 2. SELEÇÃO DE ELEMENTOS DOM
    // ==========================================
    const DOM = {
        stage: document.getElementById('stage'),
        deck: document.getElementById('deck'),
        container: document.getElementById('card-container'),
        currentCard: document.getElementById('card'),
        nextCard: document.getElementById('next-card')
    };

    // Verificação de segurança
    if (!DOM.currentCard || !DOM.deck) {
        console.error("Erro: Elementos do DOM não encontrados. Verifique o HTML.");
        return;
    }

    // ==========================================
    // 3. INICIALIZAÇÃO DO AMBIENTE 3D
    // ==========================================
    const init = () => {
        console.log("Iniciando Blaine Deck Engine...");
        
        // Configurar estado inicial das imagens
        updateCardImages();
        
        // Aplicar perspectiva inicial
        DOM.stage.style.perspective = `${CONFIG.perspectiveValue}px`;
        
        // Registrar Eventos
        registerEventListeners();
        
        // Iniciar loop de renderização leve para efeitos ociosos
        requestAnimationFrame(idleAnimationLoop);
    };

    const updateCardImages = () => {
        const nextIndex = (state.currentIndex + 1) % CONFIG.cards.length;
        DOM.currentCard.src = `${CONFIG.cardPath}${CONFIG.cards[state.currentIndex]}`;
        DOM.nextCard.src = `${CONFIG.cardPath}${CONFIG.cards[nextIndex]}`;
    };

    // ==========================================
    // 4. LÓGICA DE ANIMAÇÃO DE QUEDA (CORE)
    // ==========================================
    const triggerCardFall = (direction = 'forward') => {
        if (state.isAnimating) return;
        
        const now = Date.now();
        if (now - state.lastInteractionTime < 200) return; // Debounce extra

        state.isAnimating = true;
        state.lastInteractionTime = now;

        // Som de "papel" (Opcional: descomente se tiver o arquivo)
        // playCardSound();

        // Criar elemento de animação (Clone para manter performance)
        const fallingElement = DOM.currentCard.cloneNode(true);
        fallingElement.classList.add('falling-animation');
        
        // Adicionar variação aleatória de rotação para parecer mais real
        const randomRotation = (Math.random() - 0.5) * 10;
        fallingElement.style.setProperty('--random-rotate', `${randomRotation}deg`);
        
        DOM.container.appendChild(fallingElement);

        // Feedback de impacto no maço (Shake)
        applyDeckImpact();

        // Preparar a próxima transição
        setTimeout(() => {
            // Atualizar índices
            state.currentIndex = (state.currentIndex + 1) % CONFIG.cards.length;
            
            // A carta de fundo vira a principal sem flicker
            DOM.currentCard.src = DOM.nextCard.src;
            
            // Prepara a imagem da nova carta que ficará no fundo (ainda invisível)
            const futureIndex = (state.currentIndex + 1) % CONFIG.cards.length;
            DOM.nextCard.src = `${CONFIG.cardPath}${CONFIG.cards[futureIndex]}`;
            
            // Remover classe de animação e o elemento clonado
            fallingElement.remove();
            state.isAnimating = false;
        }, CONFIG.animationDuration);
    };

    const applyDeckImpact = () => {
        // Efeito visual de compressão do maço
        DOM.deck.style.transition = 'transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        DOM.deck.style.transform = 'rotateY(-20deg) rotateX(10deg) scale(0.96) translateZ(-10px)';
        
        setTimeout(() => {
            DOM.deck.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            DOM.deck.style.transform = 'rotateY(-20deg) rotateX(10deg) scale(1) translateZ(0)';
        }, 150);
    };

    // ==========================================
    // 5. SISTEMA DE GESTOS (SWIPE & TOUCH)
    // ==========================================
    const registerEventListeners = () => {
        // Clique mouse
        DOM.deck.addEventListener('mousedown', (e) => {
            if (e.button === 0) triggerCardFall();
        });

        // Suporte Touch
        DOM.deck.addEventListener('touchstart', handleTouchStart, { passive: true });
        DOM.deck.addEventListener('touchend', handleTouchEnd, { passive: true });
        
        // Atalhos de teclado (Espaço ou Seta para baixo)
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowDown') {
                e.preventDefault();
                triggerCardFall();
            }
        });

        // Resize handler para manter a proporção
        window.addEventListener('resize', debounce(() => {
            console.log("Ajustando perspectiva para novo tamanho de janela.");
        }, 250));
    };

    const handleTouchStart = (e) => {
        state.touchStartX = e.touches[0].clientX;
        state.touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
        const deltaY = state.touchStartY - e.changedTouches[0].clientY;
        const deltaX = state.touchStartX - e.changedTouches[0].clientX;

        // Se o movimento vertical foi significativo (arrastou para cima ou baixo)
        if (Math.abs(deltaY) > 40 || Math.abs(deltaX) > 40) {
            triggerCardFall();
        }
    };

    // ==========================================
    // 6. EFEITOS VISUAIS EXTRAS (IDLE ANIMATION)
    // ==========================================
    const idleAnimationLoop = (time) => {
        if (!state.isAnimating) {
            // Pequena flutuação para o baralho não parecer estático
            const floatX = Math.sin(time / 1000) * 0.5;
            const floatY = Math.cos(time / 1200) * 0.5;
            
            // Mantém a rotação base mas adiciona o movimento suave
            DOM.deck.style.transform = `
                rotateY(${-20 + floatX}deg) 
                rotateX(${10 + floatY}deg)
            `;
        }
        requestAnimationFrame(idleAnimationLoop);
    };

    // ==========================================
    // 7. UTILITÁRIOS (HELPERS)
    // ==========================================
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    /**
     * Simula a textura de bordas de papel variando ligeiramente
     * as cores das sombras do maço programaticamente.
     */
    const generateDynamicDepth = () => {
        const depthElement = document.querySelector('.deck-depth');
        if (!depthElement) return;

        let shadowString = "";
        for (let i = 1; i <= 15; i++) {
            const color = 220 - (i * 3);
            shadowString += `${i}px ${i}px 0px rgb(${color}, ${color}, ${color})${i === 15 ? "" : ", "}`;
        }
        // Aplicar via JS para garantir precisão
        DOM.deck.style.boxShadow = `${shadowString}, 15px 15px 30px rgba(0,0,0,0.3)`;
    };

    // Executar profundidade dinâmica
    generateDynamicDepth();

    // Iniciar tudo
    init();

    // Expor função para controle externo via console se necessário
    window.BlaineDeck = {
        next: triggerCardFall,
        status: () => state
    };

})();

/**
 * NOTA TÉCNICA:
 * Este script utiliza um IIFE (Immediately Invoked Function Expression) para evitar
 * poluição do escopo global. A lógica de "clonagem" de nós garante que a animação
 * CSS @keyframes seja executada de forma independente do estado da imagem principal,
 * permitindo transições rápidas e sem "pulos" visuais.
 */
