/* Play page: three small, dependency-free games.
   Every control is a native button, radio or link so the page keeps working
   with a keyboard and with assistive technology. */
(() => {
  'use strict';
  const shuffle = list => list
    .map(value => [Math.random(), value])
    .sort((a, b) => a[0] - b[0])
    .map(entry => entry[1]);

  /* ------------------------------------------------------- counter match -- */
  const matchGrid = document.getElementById('matchGrid');
  if (matchGrid) {
    const pairs = [
      ['Sourdough', 'Wild yeast and lactic acid bacteria'],
      ['Kombucha', 'A SCOBY and sweet tea'],
      ['Spirulina', 'Alkaline water and light'],
      ['Hooch', 'Dark liquid: the starter is hungry'],
      ['Pellicle', 'The cellulose layer on the tea'],
      ['Mould', 'Fuzzy or pink growth: discard']
    ];
    const status = document.getElementById('matchStatus');
    const live = document.getElementById('matchLive');
    const reset = document.getElementById('matchReset');
    let open = [];
    let matched = 0;
    let tries = 0;
    let locked = false;

    const build = () => {
      matchGrid.textContent = '';
      open = [];
      matched = 0;
      tries = 0;
      locked = false;
      const deck = shuffle(pairs.flatMap((pair, index) => (
        [{ id: index, text: pair[0] }, { id: index, text: pair[1] }]
      )));
      deck.forEach((card, index) => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'match-card';
        button.dataset.id = String(card.id);
        button.dataset.text = card.text;
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-label', 'Card ' + (index + 1) + ', face down');
        const label = document.createElement('span');
        label.className = 'match-text';
        button.append(label);
        button.addEventListener('click', () => turn(button));
        item.append(button);
        matchGrid.append(item);
      });
      if (status) status.textContent = 'Six pairs. Turn two cards at a time.';
      if (live) live.textContent = '';
    };

    const turn = button => {
      if (locked || button.classList.contains('matched') || open.includes(button)) return;
      button.setAttribute('aria-pressed', 'true');
      button.querySelector('.match-text').textContent = button.dataset.text;
      button.setAttribute('aria-label', button.dataset.text);
      open.push(button);
      if (open.length < 2) return;

      tries += 1;
      const [first, second] = open;
      if (first.dataset.id === second.dataset.id) {
        first.classList.add('matched');
        second.classList.add('matched');
        first.setAttribute('aria-disabled', 'true');
        second.setAttribute('aria-disabled', 'true');
        open = [];
        matched += 1;
        if (status) status.textContent = 'Matched. ' + matched + ' of 6 pairs found.';
        if (live) live.textContent = first.dataset.text + ' matched. ' + matched + ' of 6 pairs.';
        if (matched === pairs.length && live) {
          live.textContent = 'All six pairs found in ' + tries + ' tries. That is the whole counter.';
        }
        return;
      }

      locked = true;
      if (status) status.textContent = 'Not a pair. Turning them back over.';
      if (live) live.textContent = 'Not a pair.';
      window.setTimeout(() => {
        [first, second].forEach(card => {
          card.setAttribute('aria-pressed', 'false');
          card.setAttribute('aria-label', 'Face-down card');
          card.querySelector('.match-text').textContent = '';
        });
        open = [];
        locked = false;
      }, 850);
    };

    if (reset) reset.addEventListener('click', build);
    build();
  }

  /* --------------------------------------------------------- a week order -- */
  const orderPool = document.getElementById('orderPool');
  if (orderPool) {
    const steps = [
      'Mix 50 g flour with 50 g water',
      'Cover loosely and leave it somewhere warm',
      'Each day: keep 50 g, then feed 50 g flour and 50 g water',
      'Wait for a rise and fall you can predict',
      'Bake with it, or refrigerate it and feed weekly'
    ];
    const chosen = document.getElementById('orderChosen');
    const status = document.getElementById('orderStatus');
    const live = document.getElementById('orderLive');
    const check = document.getElementById('orderCheck');
    const reset = document.getElementById('orderReset');
    let picked = [];

    const render = () => {
      orderPool.textContent = '';
      chosen.textContent = '';
      steps.forEach((step, index) => {
        if (picked.includes(index)) return;
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'kit-chip';
        button.textContent = step;
        button.addEventListener('click', () => {
          picked.push(index);
          if (live) live.textContent = picked.length + ' of 5 steps placed.';
          render();
        });
        item.append(button);
        orderPool.append(item);
      });
      picked.forEach((index, position) => {
        const item = document.createElement('li');
        const label = document.createElement('span');
        label.textContent = steps[index];
        const undo = document.createElement('button');
        undo.type = 'button';
        undo.className = 'order-undo';
        undo.textContent = 'Remove';
        undo.setAttribute('aria-label', 'Remove step ' + (position + 1) + ': ' + steps[index]);
        undo.addEventListener('click', () => {
          picked = picked.slice(0, position);
          render();
        });
        item.append(label, undo);
        chosen.append(item);
      });
      if (status) {
        status.textContent = picked.length === 5
          ? 'All five placed. Check your order.'
          : picked.length + ' of 5 placed.';
      }
    };

    if (check) {
      check.addEventListener('click', () => {
        if (picked.length < 5) {
          if (live) live.textContent = 'Place all five steps first.';
          return;
        }
        const wrongAt = picked.findIndex((value, index) => value !== index);
        if (wrongAt === -1) {
          if (live) live.textContent = 'That is the order. Feed, wait, read, repeat — then bake or refrigerate.';
        } else {
          if (live) live.textContent = 'Not yet. Step ' + (wrongAt + 1) + ' is out of place.';
        }
      });
    }

    if (reset) {
      reset.addEventListener('click', () => {
        picked = [];
        if (live) live.textContent = 'Cleared. Place the steps again.';
        render();
      });
    }

    render();
  }

  /* ---------------------------------------------------------- read the jar */
  const quiz = document.getElementById('quizForm');
  if (quiz) {
    const questions = Array.from(quiz.querySelectorAll('.quiz-q'));
    const scoreLine = document.getElementById('quizScore');

    quiz.addEventListener('submit', event => {
      event.preventDefault();
      let answered = 0;
      let right = 0;

      questions.forEach(question => {
        const picked = question.querySelector('input[type="radio"]:checked');
        const feedback = question.querySelector('.quiz-feedback');
        if (!picked) {
          question.removeAttribute('data-state');
          if (feedback) feedback.hidden = true;
          return;
        }
        answered += 1;
        const correct = picked.value === question.dataset.answer;
        if (correct) right += 1;
        question.dataset.state = correct ? 'right' : 'wrong';
        if (feedback) {
          feedback.hidden = false;
          feedback.dataset.verdict = correct ? 'right' : 'wrong';
        }
      });

      if (!scoreLine) return;
      if (answered < questions.length) {
        scoreLine.textContent = 'Answer all five questions to see the reasoning ('
          + answered + ' of ' + questions.length + ' answered).';
        return;
      }
      scoreLine.textContent = right + ' of ' + questions.length
        + ' correct. Read the notes under each question — the reasoning matters more than the score.';
    });
  }
})();
