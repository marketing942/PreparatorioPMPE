/* =========================================================
   CPPEM · PREPARATÓRIO ONLINE PMPE — venda direta ao checkout
   ---------------------------------------------------------
     1. CONFIG      preço e link do checkout — ÚNICO lugar
     2. PREÇO       escreve o CONFIG nos [data-slot] e nos CTAs
     3. ABERTURA    a colisão de entrada e a saída dela
     4. PÁGINA      header, progresso, parallax, dock
     5. REVEAL      entrada ao rolar + contagem dos números
     6. ATMOSFERA   brasas, faíscas, estilhaços, brilho no cursor
   ========================================================= */
(function () {
  "use strict";

  /* =========================================================
     1 · CONFIG
     ---------------------------------------------------------
     ⚠️ É AQUI que entram o link do checkout e os valores. O
     aplicarPreco() reescreve todo [data-slot] do HTML no
     carregamento, então um valor trocado só no index.html é
     sobrescrito no primeiro quadro — o arquivo mostraria um
     preço e o navegador outro.

     Os números devem espelhar a tela do checkout LINHA POR
     LINHA: qualquer arredondamento diferente vira desconfiança
     no momento exato em que a pessoa vai digitar o cartão.
     ========================================================= */
  var CONFIG = {
    pagina:  "preparatorio-online-pmpe",
    produto: "Preparatório Online PMPE",
    whats:   "558173105354",

    /* Só a URL BASE. O link copiado do navegador vinha com name, email, phone
       e ip de uma compra de teste, mais fbclid/sck e as UTMs de uma campanha:
       colado inteiro, todo comprador cairia no checkout como "Teste Teste" e
       toda venda seria atribuída àquela campanha. As UTMs de quem chega pelo
       anúncio são repassadas pelo linkCheckout(), abaixo.
       O slug ainda diz "preparatorio-online": é o endereço REAL da página de
       pagamento e não acompanha o nome do produto — trocar aqui quebra o botão.
       Vazio, os botões levam ao WhatsApp — a página nunca fica com CTA morto.
       (A mesma URL está no fallback dos botões e no JSON-LD do index.html.) */
    checkout: "https://checkout.cppem.com.br/pay/preparatorio-online-para-a-policia-militar-de-pernambuco-pmpe-01",

    /* Espelham a tela do checkout: "R$ 437,00 Total · Até 12 x R$ 44,68".
       ⚠️ 12 × 44,68 = 536,16: o cartão TEM juros. A página não pode dizer
       "sem juros" em lugar nenhum.
       `de` e `economia` vazios somem da tela (todo [data-se] sem valor fica
       hidden) — um preço cheio inventado seria número falso na cara do
       comprador. Se um dia houver "de/por" de verdade, é só preencher. */
    preco: {
      parcelas: "12x",
      parcela:  "R$ 44,68",     // o número GRANDE da página
      nota:     "no cartão",    // o que acompanha a parcela
      vista:    "R$ 437,00",    // o total do checkout
      de:       "",             // valor cheio, riscado acima da parcela
      economia: ""              // valor cheio − à vista
    }
  };

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var raiz = document.documentElement;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function push(dados) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(dados);
  }

  /* =========================================================
     2 · PREÇO E CHECKOUT
     ========================================================= */

  /* UTMs em first touch: só existem na URL do PRIMEIRO acesso. Guardadas no
     carregamento, elas seguem para o checkout mesmo depois de um reload ou de
     um redirect do anúncio — sem isso a venda chega sem origem. */
  var UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  (function guardarUTMs() {
    var qs = new URLSearchParams(location.search);
    UTM.forEach(function (k) {
      var v = qs.get(k);
      if (v) { try { sessionStorage.setItem(k, v); } catch (e) { /* sem storage */ } }
    });
  })();
  function utm(k) {
    var v = new URLSearchParams(location.search).get(k);
    if (v) return v;
    try { return sessionStorage.getItem(k) || ""; } catch (e) { return ""; }
  }

  function linkCheckout() {
    try {
      var u = new URL(CONFIG.checkout);
      UTM.forEach(function (k) {
        var v = utm(k);
        if (v && !u.searchParams.has(k)) u.searchParams.set(k, v);
      });
      return u.toString();
    } catch (e) { return CONFIG.checkout; }
  }

  (function aplicarPreco() {
    var p = CONFIG.preco;
    var valores = {
      "preco-de":      p.de,
      "parcelas":      p.parcelas,
      "preco-parcela": p.parcela,
      "nota":          p.nota,
      "preco-vista":   p.vista,
      "economia":      p.economia,
      "cta-preco":     "Garantir minha vaga por " + p.parcelas + " " + p.parcela,
      "dock-sub":      p.parcelas + " " + p.parcela + " ou " + p.vista + " à vista"
    };
    Object.keys(valores).forEach(function (slot) {
      $$('[data-slot="' + slot + '"]').forEach(function (el) { el.textContent = valores[slot]; });
    });
    /* linha opcional sem valor não aparece — nem como texto em branco */
    $$("[data-se]").forEach(function (el) { el.hidden = !p[el.getAttribute("data-se")]; });

    /* O checkout abre na MESMA aba (é o esperado de um fluxo de pagamento). A
       rede de segurança do WhatsApp abre em outra, para a página continuar
       aberta atrás da conversa. */
    var href = CONFIG.checkout ? linkCheckout()
      : "https://wa.me/" + CONFIG.whats + "?text=" + encodeURIComponent(
          "Olá! Tenho interesse na " + CONFIG.produto + ". Como faço para garantir minha vaga?");
    $$("[data-checkout]").forEach(function (btn) {
      btn.href = href;
      if (CONFIG.checkout) { btn.removeAttribute("target"); btn.removeAttribute("rel"); }
      else { btn.target = "_blank"; btn.rel = "noopener"; }
      btn.addEventListener("click", function () {
        push({
          event: "clique_checkout",
          pagina: CONFIG.pagina,
          produto: CONFIG.produto,
          destino: CONFIG.checkout ? "checkout" : "whatsapp",
          cta_text: (btn.textContent || "").trim()
        });
      });
    });
  })();

  /* =========================================================
     3 · A ENTRADA
     ---------------------------------------------------------
     A cena mora na hero e é toda CSS (ver "A ENTRADA" no
     styles.css). Aqui só:
       · soltar os estilhaços no instante da batida
       · destravar a página quando ela termina
       · deixar qualquer toque, tecla ou rolagem pular

     O instante da batida é ESCUTADO, não calculado: o
     animationend do voo do emblema da esquerda dispara
     exatamente quando ele encosta no outro. Comparar o
     --impacto com performance.now() erraria pelo tempo que a
     página levou para pintar — os dois relógios começam em
     momentos diferentes.

     Sair é só tirar a classe do <html>: como todo estado da
     cena é `html.is-abertura ...` sobre a hero de verdade, a
     página assume o estado final no mesmo quadro. É isso que
     faz pular no meio não custar nada.
     ========================================================= */
  var choque = $(".choque");
  var comAbertura = raiz.classList.contains("is-abertura");
  var saiu = false;
  var DEPOIS_DA_BATIDA = 1550;   /* casa com o `tempo` do CSS: --impacto + 1.55s */

  /* Os estilhaços são os únicos que dependem de JS: o script cria os <i> com
     ângulo, distância e tamanho sorteados, e a animação é CSS. Sem JS a
     batida acontece igual — só não solta faísca. */
  var TONS_CACO = ["#F0DCB0", "#C9AE7A", "#C4703F"];
  function estilhacar(quantos, base, variacao, atraso) {
    var alvo = document.getElementById("estilhacos");
    if (!alvo || reduced) return;
    for (var i = 0; i < quantos; i++) {
      var caco = document.createElement("i");
      /* espalha em torno da horizontal, e não em círculo: as duas massas
         vieram dos lados. ±38° é o que separa "explosão" de "chuveiro" */
      var ang = (i % 2 === 0 ? 0 : 180) + (Math.random() * 76 - 38);
      caco.className = "estilhaco";
      caco.style.setProperty("--ox", "50%");
      caco.style.setProperty("--ang", ang.toFixed(1) + "deg");
      /* cqw, e não %: em transform a porcentagem é do PRÓPRIO caco (4px), e
         os cacos ficariam empilhados no centro */
      caco.style.setProperty("--dist", (base + Math.random() * variacao).toFixed(0) + "cqw");
      caco.style.setProperty("--s", (2 + Math.random() * 4).toFixed(1) + "px");
      caco.style.setProperty("--cor", TONS_CACO[Math.floor(Math.random() * 3)]);
      caco.style.setProperty("--dur", (.55 + Math.random() * .5).toFixed(2) + "s");
      caco.style.setProperty("--atraso", (atraso + Math.random() * .09).toFixed(3) + "s");
      alvo.appendChild(caco);
    }
  }

  /* Sair NÃO tira a classe da coreografia: só o estado "rodando". Tirar a
     coreografia devolveria cada peça para a animação normal da cascata, e
     trocar a animação de um elemento no meio do caminho faz o navegador
     tratá-la como nova — o título e o medalhão re-entravam do zero depois da
     cena. Quem pula ganha `is-pulado`, que congela tudo no estado final. */
  function sairAbertura(pulou) {
    if (saiu) return;
    saiu = true;
    try { sessionStorage.setItem("pmpe-abertura", "1"); } catch (e) { /* sem storage */ }
    raiz.classList.remove("is-entrando");
    if (pulou) raiz.classList.add("is-pulado");
    if (choque) {
      choque.classList.add("is-fim");
      setTimeout(function () { if (choque.parentNode) choque.parentNode.removeChild(choque); }, 400);
    }
    window.scrollTo(0, 0);
    ligarObservadores();
  }

  if (comAbertura && choque) {
    var esquerdo = $(".choque__emblema--a", choque);
    if (esquerdo) {
      esquerdo.addEventListener("animationend", function (e) {
        if (e.animationName !== "voa-esq") return;   /* ignora a passagem */
        estilhacar(26, 90, 160, 0);
        /* fim natural: a cena chegou ao fim sozinha, então não há nada para
           congelar — as peças já estão todas no estado final */
        setTimeout(function () { sairAbertura(false); }, DEPOIS_DA_BATIDA);
      });
    }

    function pular() { sairAbertura(true); }
    document.addEventListener("click", pular);
    window.addEventListener("wheel", pular, { passive: true, once: true });
    document.addEventListener("keydown", function (e) {
      /* Tab também pula: quem navega por teclado não pode dar de cara com o
         foco num botão que ainda está invisível */
      if (/^(Escape|Enter| |Tab|ArrowDown|PageDown)$/.test(e.key)) pular();
    });
    /* Rede de segurança: numa aba em segundo plano as animações não rodam e o
       animationend pode nunca chegar. A entrada não pode virar uma parede. */
    setTimeout(pular, 5200);
  } else if (choque) {
    choque.parentNode.removeChild(choque);
  }

  /* =========================================================
     4 · HEADER, PROGRESSO, PARALLAX E DOCK
     ========================================================= */
  var header    = document.getElementById("header");
  var progress  = document.getElementById("progress");
  var heroBg    = document.getElementById("heroBg");
  var tropaFoto = document.getElementById("tropaFoto");
  var dock      = document.getElementById("dock");
  var whats     = document.getElementById("whats");
  var ticking   = false;

  function render() {
    var y = window.scrollY, h = window.innerHeight;
    if (header) header.classList.toggle("is-stuck", y > 40);

    if (progress) {
      var max = document.documentElement.scrollHeight - h;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    }

    /* dock e WhatsApp entram juntos, só depois da hero: o olho registra UMA
       mudança, e antes disso o CTA da dobra já está na tela */
    var passouHero = y > h * 0.85;
    if (dock)  dock.classList.toggle("is-on", passouHero);
    if (whats) whats.classList.toggle("is-on", passouHero);

    if (!reduced) {
      if (heroBg && y < h * 1.2) heroBg.style.transform = "translate3d(0," + (y * 0.16).toFixed(1) + "px,0)";
      /* a tropa anda mais devagar que a página: o .tropa__foto tem 14% de
         sobra em cima e embaixo exatamente para este deslocamento */
      if (tropaFoto) {
        var r = tropaFoto.parentNode.getBoundingClientRect();
        if (r.bottom > 0 && r.top < h) {
          tropaFoto.style.transform = "translate3d(0," + (r.top * -0.12).toFixed(1) + "px,0)";
        }
      }
    }
    ticking = false;
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(render); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  render();

  /* =========================================================
     5 · REVEAL AO ROLAR + CONTAGEM
     ---------------------------------------------------------
     O reveal usa a propriedade `translate`, e não `transform`,
     e a classe SAI depois que a entrada termina: assim ele não
     briga com o hover dos cards (que usa transform) nem deixa
     a transição dele por cima da transição própria de cada um.

     Os observadores só ligam depois da abertura: um
     IntersectionObserver não sabe que há uma cortina na frente,
     e a ficha da hero contaria enquanto ninguém olhava.
     ========================================================= */
  var alvos = $$(
    ".section__head, .item, .vaga, .etapas, " +
    ".duo__foto, .duo__texto, .galeria, .vs-wrap, .oferta__resumo, .preco__moldura, .faq__item, .final__inner"
  );

  function formatar(n) { return n.toLocaleString("pt-BR"); }

  /* só anima número PURO em pt-BR ("1.320", "15"): "14K+" e "AO VIVO" não
     casam e ficam parados, que é o certo */
  function contar(el) {
    var bruto = el.textContent.trim();
    if (!/^\d{1,3}(\.\d{3})*$/.test(bruto)) return;
    var destino = parseInt(bruto.replace(/\./g, ""), 10);
    if (!destino || reduced) return;
    var dur = 1100, ini = null;
    el.textContent = "0";
    function passo(ts) {
      if (ini === null) ini = ts;
      var p = Math.min((ts - ini) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);   /* easeOutCubic: trava como painel */
      el.textContent = formatar(Math.round(destino * e));
      if (p < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  var observadoresLigados = false;
  function ligarObservadores() {
    if (observadoresLigados) return;
    observadoresLigados = true;

    if (!("IntersectionObserver" in window) || reduced) return;

    alvos.forEach(function (el) { el.classList.add("reveal"); });

    var io = new IntersectionObserver(function (entries) {
      var i = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, atraso = i++ * 70;
        el.style.transitionDelay = atraso + "ms";
        el.classList.add("is-visible");
        io.unobserve(el);
        setTimeout(function () {
          el.classList.remove("reveal", "reveal--esq", "reveal--dir", "is-visible");
          el.style.transitionDelay = "";
        }, 800 + atraso);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px" });
    alvos.forEach(function (el) { io.observe(el); });

    var ioNum = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        contar(e.target);
        ioNum.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    $$(".vaga__num, .stat b, .final h2 .gold").forEach(function (el) { ioNum.observe(el); });
  }

  /* sem JS de reveal, as classes de lado vindas do HTML não podem esconder nada */
  if (!("IntersectionObserver" in window) || reduced) {
    $$(".reveal--esq, .reveal--dir").forEach(function (el) { el.classList.remove("reveal--esq", "reveal--dir"); });
  }

  if (!comAbertura) ligarObservadores();

  /* =========================================================
     6 · ATMOSFERA
     ========================================================= */

  /* ─── estilhaços da colisão curta ──────────────────────────
     Só quando a entrada cheia NÃO tocou: aí a batida é a de dentro do
     medalhão, e os cacos saem menores e mais perto. O CSS segura cada um
     pelo animation-delay, mas o delay conta a partir da inserção no DOM —
     alinhamos os dois relógios somando o tempo que já passou. */
  var medalhao = $(".fusao--hero");
  if (medalhao && !reduced && raiz.classList.contains("sem-abertura")) {
    var impacto = parseFloat(getComputedStyle(medalhao).getPropertyValue("--impacto")) || 1;
    estilhacar(18, 42, 68, Math.max(0, impacto * 1000 - performance.now()) / 1000);
  }

  /* ─── brasas ───────────────────────────────────────────────
     Cada uma é um <i> com quatro variáveis; a animação é CSS e só mexe em
     transform e opacity. Um terço em brasa quente, o resto em ouro: todas do
     mesmo tom deixava a camada chapada. Atraso negativo para a camada já
     nascer povoada. */
  var TONS = ["rgba(201,174,122,.9)", "rgba(175,146,86,.85)", "rgba(196,112,63,.85)"];
  function semear(alvo, quantidade) {
    if (!alvo || reduced) return;
    for (var b = 0; b < quantidade; b++) {
      var br = document.createElement("i");
      br.className = "brasa";
      br.style.setProperty("--x", (Math.random() * 100).toFixed(2) + "%");
      br.style.setProperty("--s", (2 + Math.random() * 3).toFixed(1) + "px");
      br.style.setProperty("--cor", TONS[Math.random() < .34 ? 2 : (Math.random() < .5 ? 0 : 1)]);
      br.style.setProperty("--op", (.35 + Math.random() * .45).toFixed(2));
      br.style.setProperty("--dur", (13 + Math.random() * 13).toFixed(1) + "s");
      br.style.setProperty("--atraso", "-" + (Math.random() * 26).toFixed(1) + "s");
      alvo.appendChild(br);
    }
  }
  semear(document.getElementById("brasas"), 26);
  semear(document.getElementById("investBrasas"), 14);

  var sparks = document.getElementById("sparks");
  if (sparks && !reduced) {
    for (var s = 0; s < 16; s++) {
      var sp = document.createElement("i");
      sp.className = "spark";
      sp.style.left = (Math.random() * 100) + "%";
      sp.style.bottom = (Math.random() * 40) + "%";
      sp.style.animationDuration = (7 + Math.random() * 7) + "s";
      sp.style.animationDelay = (Math.random() * 8) + "s";
      sparks.appendChild(sp);
    }
  }

  /* ─── brilho seguindo o cursor ─── */
  $$(".item").forEach(function (el) {
    el.addEventListener("mousemove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      el.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
  });

  /* ─── imagem do medalhão que não carrega → sigla no lugar ───
     `complete && naturalWidth === 0` pega as que JÁ falharam antes deste
     script rodar. */
  $$(".fusao__lado img").forEach(function (img) {
    function cair() { img.parentNode.classList.add("is-fallback"); }
    img.addEventListener("error", cair);
    if (img.complete && img.naturalWidth === 0) cair();
  });

  var ano = document.getElementById("year");
  if (ano) ano.textContent = new Date().getFullYear();

})();
