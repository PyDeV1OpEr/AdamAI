/* ============================================================
   Adam AI — page instrumentation
   Reads live simulation state and renders the dashboard.
   It never mutates the genetic algorithm; the only writes are
   the pause flag and whole-run restarts, both of which are
   explicit user actions.
   ============================================================ */

(function () {
  'use strict';

  var SIM_WIDTH = 1200;
  var SIM_HEIGHT = 640;
  var RATE_WINDOW_MS = 15000;

  var state = {
    history: [],
    refs: {},
    genStamps: [],
    lastChartWidth: 0
  };

  var el = {};

  function $(id) {
    return document.getElementById(id);
  }

  /* ---------------- formatting helpers ---------------- */

  function fmtFitness(value) {
    if (!isFinite(value) || value <= 0) return '0';
    if (value >= 0.001) return value.toPrecision(4);
    var exp = value.toExponential(2);
    return exp.replace('e', 'e');
  }

  function fmtInt(value) {
    if (!isFinite(value)) return '—';
    return Math.round(value).toLocaleString('en-US');
  }

  /* ---------------- simulation hooks ---------------- */

  function captureGeneration(population) {
    if (!population || !population.players) return;

    var players = population.players;
    var count = players.length;
    var best = 0;
    var sum = 0;
    var bestIndex = 0;

    for (var i = 0; i < count; i++) {
      var fitness = players[i].fitness || 0;
      sum += fitness;
      if (fitness > best) {
        best = fitness;
        bestIndex = i;
      }
    }

    var champion = players[bestIndex];
    var checkpoints = 0;
    if (champion && champion.coins) {
      for (var c = 0; c < champion.coins.length; c++) {
        if (champion.coins[c].taken) checkpoints++;
      }
    }

    state.history.push({
      gen: population.gen,
      best: best,
      mean: count ? sum / count : 0,
      checkpoints: checkpoints,
      moves: champion && champion.brain ? champion.brain.directions.length : 0,
      solutionFound: !!population.solutionFound,
      minStep: population.minStep
    });

    state.genStamps.push(now());
    while (state.genStamps.length > 400) state.genStamps.shift();

    if (state.history.length > 5000) state.history.shift();

    scheduleChart();
  }

  function now() {
    return window.performance && performance.now ? performance.now() : Date.now();
  }

  function generationsPerMinute() {
    var t = now();
    var fresh = 0;
    for (var i = state.genStamps.length - 1; i >= 0; i--) {
      if (t - state.genStamps[i] <= RATE_WINDOW_MS) fresh++;
      else break;
    }
    if (!state.genStamps.length) return 0;
    var spanMs = Math.min(RATE_WINDOW_MS, t - state.genStamps[0]);
    if (spanMs < 400) return 0;
    return (fresh / spanMs) * 60000;
  }

  /* ---------------- dashboard refresh ---------------- */

  function currentMode() {
    if (window.humanPlaying) return 'human';
    if (window.replayGens) return 'replay';
    if (window.adamPaused) return 'paused';
    return 'evolving';
  }

  var MODE_LABELS = {
    evolving: 'Evolving',
    paused: 'Paused',
    human: 'Human mode',
    replay: 'Replaying best'
  };

  function refresh() {
    var population = window.testPopulation;
    if (!population) return;

    var latest = state.history.length ? state.history[state.history.length - 1] : null;
    var champion = population.players && population.players[0];

    setText('m-gen', fmtInt(population.gen));
    setText('m-pop', fmtInt(population.players ? population.players.length : 0));
    setText('m-best', latest ? fmtFitness(latest.best) : '—');
    setText('m-mean', latest ? fmtFitness(latest.mean) : '—');
    setText('m-bestever', fmtFitness(population.bestFitness || 0));
    setText(
      'm-moves',
      champion && champion.brain ? String(champion.brain.directions.length) : '—'
    );
    setText('m-checkpoints', (latest ? latest.checkpoints : 0) + ' / 7');
    setText('m-rate', fmtInt(generationsPerMinute()) + ' gen/min');

    var mode = currentMode();
    if (el.status) {
      el.status.dataset.state = mode;
      setText('sim-status-text', MODE_LABELS[mode] || 'Evolving');
    }

    if (el.pause) {
      var paused = mode === 'paused';
      el.pause.setAttribute('aria-pressed', paused ? 'true' : 'false');
      el.pause.textContent = paused ? 'Resume' : 'Pause';
    }

    if (latest && latest.solutionFound && latest.minStep && !isNaN(latest.minStep)) {
      if (el.solvedBanner) {
        el.solvedBanner.hidden = false;
        setText('solved-steps', fmtInt(latest.minStep));
      }
    }

    scheduleChart();
  }

  function setText(id, text) {
    var node = $(id);
    if (node && node.textContent !== text) node.textContent = text;
  }

  /* ---------------- fitness chart ---------------- */

  var chartQueued = false;

  function scheduleChart() {
    if (chartQueued) return;
    chartQueued = true;
    window.requestAnimationFrame(function () {
      chartQueued = false;
      drawChart();
    });
  }

  function drawChart() {
    var canvas = el.chart;
    if (!canvas) return;
    var rect = canvas.getBoundingClientRect();
    if (!rect.width) return;

    var dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    }

    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    var pad = { top: 8, right: 8, bottom: 18, left: 42 };
    var plotW = Math.max(10, rect.width - pad.left - pad.right);
    var plotH = Math.max(10, rect.height - pad.top - pad.bottom);

    if (!state.history.length) {
      ctx.fillStyle = 'rgba(148, 158, 172, 0.75)';
      ctx.font = '11px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('waiting for the first generation to finish…', rect.width / 2, rect.height / 2);
      return;
    }

    var points = state.history;

    // downsample to at most ~2 points per pixel
    var maxPoints = Math.max(60, Math.floor(plotW * 2));
    var series = points;
    if (points.length > maxPoints) {
      var stride = points.length / maxPoints;
      series = [];
      for (var i = 0; i < maxPoints; i++) {
        var idx = Math.min(points.length - 1, Math.floor(i * stride));
        series.push(points[idx]);
      }
    }

    var values = [];
    for (var v = 0; v < series.length; v++) {
      if (series[v].best > 0) values.push(series[v].best);
      if (series[v].mean > 0) values.push(series[v].mean);
    }
    if (!values.length) values.push(1e-12);

    var logs = values.map(function (n) { return Math.log(n) / Math.LN10; });
    var minLog = Math.min.apply(null, logs);
    var maxLog = Math.max.apply(null, logs);
    if (maxLog - minLog < 1) {
      var mid = (maxLog + minLog) / 2;
      minLog = mid - 0.5;
      maxLog = mid + 0.5;
    }
    var padLog = (maxLog - minLog) * 0.08;
    minLog -= padLog;
    maxLog += padLog;

    function xAt(i) {
      if (series.length === 1) return pad.left + plotW / 2;
      return pad.left + (i / (series.length - 1)) * plotW;
    }

    function yAt(value) {
      var l = Math.log(Math.max(value, 1e-30)) / Math.LN10;
      var t = (l - minLog) / (maxLog - minLog);
      return pad.top + plotH - t * plotH;
    }

    // decade grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.055)';
    ctx.fillStyle = 'rgba(148, 158, 172, 0.7)';
    ctx.lineWidth = 1;
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    var startDecade = Math.ceil(minLog);
    for (var d = startDecade; d <= Math.floor(maxLog); d++) {
      var y = pad.top + plotH - ((d - minLog) / (maxLog - minLog)) * plotH;
      ctx.beginPath();
      ctx.moveTo(pad.left, Math.round(y) + 0.5);
      ctx.lineTo(pad.left + plotW, Math.round(y) + 0.5);
      ctx.stroke();
      ctx.fillText('1e' + d, pad.left - 7, y);
    }

    // baseline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + plotH + 0.5);
    ctx.lineTo(pad.left + plotW, pad.top + plotH + 0.5);
    ctx.stroke();

    function stroke(accessor, color, width) {
      ctx.beginPath();
      var started = false;
      for (var j = 0; j < series.length; j++) {
        var value = accessor(series[j]);
        if (!(value > 0)) { started = false; continue; }
        var px = xAt(j);
        var py = yAt(value);
        if (!started) { ctx.moveTo(px, py); started = true; }
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    stroke(function (p) { return p.mean; }, 'rgba(240, 184, 102, 0.6)', 1.2);
    stroke(function (p) { return p.best; }, '#46e0b0', 1.6);

    // generation axis labels
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(148, 158, 172, 0.7)';
    var firstGen = series[0].gen;
    var lastGen = series[series.length - 1].gen;
    ctx.fillText('gen ' + firstGen, pad.left, pad.top + plotH + 5);
    ctx.textAlign = 'right';
    ctx.fillText('gen ' + lastGen, pad.left + plotW, pad.top + plotH + 5);
  }

  /* ---------------- canvas fit ---------------- */

  function fitStage() {
    var stage = $('sim-stage');
    if (!stage) return;
    var canvas = stage.querySelector('canvas');
    if (!canvas) return;

    var wrapper = stage.parentElement;
    var styles = window.getComputedStyle(wrapper);
    var inner =
      wrapper.clientWidth -
      parseFloat(styles.paddingLeft || 0) -
      parseFloat(styles.paddingRight || 0);

    var scale = Math.min(1, Math.max(0.28, inner / SIM_WIDTH));

    canvas.style.width = Math.round(SIM_WIDTH * scale) + 'px';
    canvas.style.height = Math.round(SIM_HEIGHT * scale) + 'px';
    stage.style.width = Math.round(SIM_WIDTH * scale) + 'px';
    stage.style.height = Math.round(SIM_HEIGHT * scale) + 'px';
  }

  /* ---------------- controls ---------------- */

  function bindControls() {
    el.pause = $('btn-pause');
    el.replay = $('btn-replay');
    el.human = $('btn-human');
    el.restart = $('btn-restart');
    el.status = $('sim-status');
    el.chart = $('fitness-chart');
    el.solvedBanner = $('solved-banner');

    if (el.pause) {
      el.pause.addEventListener('click', function () {
        window.adamPaused = !window.adamPaused;
        refresh();
      });
    }

    if (el.replay) {
      el.replay.addEventListener('click', function () {
        if (typeof window.toggleReplay === 'function') {
          window.toggleReplay();
          refresh();
        }
      });
    }

    if (el.human) {
      el.human.addEventListener('click', function () {
        if (typeof window.toggleHumanMode === 'function') {
          window.toggleHumanMode();
          refresh();
        }
      });
    }

    if (el.restart) {
      el.restart.addEventListener('click', function () {
        if (typeof window.restartRun !== 'function') return;
        window.restartRun();
        state.history = [];
        state.genStamps = [];
        if (el.solvedBanner) el.solvedBanner.hidden = true;
        scheduleChart();
        refresh();
      });
    }

    var wrapper = $('sim-stage') ? $('sim-stage').parentElement : null;
    if (wrapper && window.ResizeObserver) {
      new ResizeObserver(function () { fitStage(); }).observe(wrapper);
    }
    window.addEventListener('resize', fitStage);
    window.addEventListener('orientationchange', fitStage);
  }

  /* ---------------- API consumed by the sketch ---------------- */

  window.AdamAI = {
    captureGeneration: captureGeneration,

    onSimulationReady: function () {
      fitStage();
      refresh();
      scheduleChart();
    },

    onModeChange: function () {
      refresh();
    },

    onHumanWin: function () {
      refresh();
    },

    onRestart: function () {
      state.history = [];
      state.genStamps = [];
      refresh();
    },

    bindControlRefs: function (refs) {
      state.refs = refs || {};
    },

    syncControlLabels: function (values) {
      var refs = state.refs;
      if (refs.population && values.populationSize !== undefined) {
        refs.population.html(String(values.populationSize));
      }
      if (refs.mutation && values.mutationRate !== undefined) {
        refs.mutation.html(String(values.mutationRate));
      }
      if (refs.speed && values.evolutionSpeed !== undefined) {
        refs.speed.html(String(values.evolutionSpeed));
      }
      if (refs.moves && values.increaseMovesBy !== undefined) {
        refs.moves.html(String(values.increaseMovesBy));
      }
      if (refs.every && values.increaseEvery !== undefined) {
        refs.every.html(String(values.increaseEvery));
      }
      refresh();
    }
  };

  /* ---------------- boot ---------------- */

  function boot() {
    bindControls();
    // The sketch starts itself on window load; refresh on a light interval so
    // generation counters stay live even between evaluations.
    window.setInterval(refresh, 250);
    window.addEventListener('load', function () {
      fitStage();
      scheduleChart();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
