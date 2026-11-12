var tileSize = 50;
var xoff = 50;
var yoff = 100;

//human playing vars
var humanPlaying = false;
var left = false;
var right = false;
var up = false;
var down = false;
var p;

//arrays
var tiles = [];
var solids = [];
var dots = [];
var savedDots = [];

var showBest = true;

var winArea;//a solid which is the win zone i.e. the green bits

//gen replay vars
var replayGens = false;
var genPlayer;
var upToGenPos = 0;

//population vars
var numberOfSteps = 10;
var testPopulation;

var winCounter = -1;
var flip = true;

//population size vars
var populationSize = 500;

//mutation rate vars
var mutationRate = 0.04;

//evolution speed vars
var evolutionSpeed = 1;

//increaseMoves
var increaseMovesBy = 5;
var increaseEvery = 5;

//pause flag, toggled from the page controls
var adamPaused = false;

function setup() {
  var canvas = createCanvas(1200, 640);
  canvas.parent('sim-stage');
  htmlStuff();
  for (var i = 0; i < 22; i++) {
    tiles[i] = [];
    for (var j = 0; j < 10; j++) {
      tiles[i][j] = new Tile(i, j);
    }
  }

  setLevel1Walls();
  setLevel1Goal();
  setLevel1SafeArea();
  setEdges();
  setSolids();

  p = new Player();
  setDots();
  winArea = new Solid(tiles[17][1], tiles[20][2]);
  testPopulation = new Population(populationSize);

  //prevents the window from moving from the arrow keys or the spacebar
  window.addEventListener("keydown", function (e) {
    if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
      e.preventDefault();
    }
  }, false);

  if (window.AdamAI) {
    window.AdamAI.onSimulationReady();
  }
}

var showedCoin = false;
function draw() {
  showedCoin = false;
  background(230, 230, 255);
  drawTiles();
  writeShit();

  if (humanPlaying) {//if the user is controlling the square
    if ((p.dead && p.fadeCounter <= 0) || p.reachedGoal) {
      //reset player and dots
      if (p.reachedGoal) {
        winCounter = 100;
        if (window.AdamAI) {
          window.AdamAI.onHumanWin();
        }
      }
      p = new Player();
      p.human = true;
      resetDots();

    } else {
      //update the dots and the players and show them to the screen
      moveAndShowDots();
      p.update();
      p.show();
    }
  } else if (replayGens) {//if replaying the best generations
    if ((genPlayer.dead && genPlayer.fadeCounter <= 0) || genPlayer.reachedGoal) { //if the current gen is done
      upToGenPos++;//next gen
      if (testPopulation.genPlayers.length <= upToGenPos) {//if reached the final gen
        //stop replaying gens
        upToGenPos = 0;
        replayGens = false;
        //return the dots to their saved position
        loadDots();
      } else {//if there are more generations to show
        //set gen player as the best player of that generation
        genPlayer = testPopulation.genPlayers[upToGenPos].gimmeBaby();
        //reset the dots positions
        resetDots();
      }
    } else {//if not done
      moveAndShowDots();
      genPlayer.update();
      genPlayer.show();
    }
  } else if (testPopulation.allPlayersDead()) {
    //genetic algorithm
    testPopulation.calculateFitness();

    //read-only analytics snapshot, taken before selection replaces the population
    if (window.AdamAI) {
      window.AdamAI.captureGeneration(testPopulation);
    }

    testPopulation.naturalSelection();
    testPopulation.mutateDemBabies();
    //reset dots
    resetDots();

    //every N generations increase the number of moves by M
    if (testPopulation.gen % increaseEvery == 0) {
      testPopulation.increaseMoves();
    }

  } else {
    if (!adamPaused) {
      for (var j = 0; j < evolutionSpeed; j++) {
        for (var i = 0; i < dots.length; i++) {
          dots[i].move();
        }
        testPopulation.update();
      }
    }

    for (var i = 0; i < dots.length; i++) {
      dots[i].show();
    }
    testPopulation.show();
  }
}

function moveAndShowDots() {
  for (var i = 0; i < dots.length; i++) {
    dots[i].move();
    dots[i].show();
  }
}

function resetDots() {
  for (var i = 0; i < dots.length; i++) {
    dots[i].resetDot();
  }
}

function drawTiles() {
  for (var i = 0; i < tiles.length; i++) {
    for (var j = 0; j < tiles[0].length; j++) {
      tiles[i][j].show();
    }
  }
  for (var i = 0; i < tiles.length; i++) {
    for (var j = 0; j < tiles[0].length; j++) {
      tiles[i][j].showEdges();
    }
  }
}

function loadDots() {
  for (var i = 0; i < dots.length; i++) {
    dots[i] = savedDots[i].clone();
  }
}

function saveDots() {
  for (var i = 0; i < dots.length; i++) {
    savedDots[i] = dots[i].clone();
  }
}

function writeShit() {
  fill(0, 0, 0);
  textSize(18);
  noStroke();
  text("Press SPACE to show the generation that the A.I. belongs to.", 390, 590);
  text("Press P to play the game yourself.     Press G to replay evolution highlights.", 390, 620);
  textSize(20);

  if (winCounter > 0) {
    winCounter--;
    if (winCounter % 10 == 0) {
      flip = !flip;
    }
    push();
    translate(width / 2, height / 2);
    if (flip) {
      scale(-1.0, 1.0);
    }
    noStroke();
    fill(20, 20, 26, 235);
    rectMode(CENTER);
    rect(0, 0, 620, 120, 12);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(40);
    text("CHECKPOINT REACHED", 0, -12);
    textSize(18);
    fill(120, 220, 180);
    text("a human survived the maze", 0, 34);
    pop();
    textAlign(LEFT, BASELINE);
    textSize(36);
    noStroke();
  }

  if (replayGens) {
    text("Generation: " + genPlayer.gen, 60, 60);
    text("Number of moves: " + genPlayer.brain.directions.length, 940, 60);
  } else if (!humanPlaying) {
    text("Generation: " + testPopulation.gen, 60, 60);
    if (testPopulation.solutionFound) {
      text("Wins in " + testPopulation.minStep + " moves", 940, 60);
    } else {
      text("Number of moves: " + testPopulation.players[0].brain.directions.length, 940, 60);
    }
  } else {
    text("Solo gameplay", 560, 60);
  }
}

function keyPressed() {
  if (humanPlaying) {
    switch (keyCode) {
      case UP_ARROW:
        up = true;
        break;
      case DOWN_ARROW:
        down = true;
        break;
      case RIGHT_ARROW:
        right = true;
        break;
      case LEFT_ARROW:
        left = true;
        break;
    }
    switch (key) {
      case 'W':
      case 'w':
        up = true;
        break;
      case 'S':
      case 's':
        down = true;
        break;
      case 'D':
      case 'd':
        right = true;
        break;
      case 'A':
      case 'a':
        left = true;
        break;
    }
    setPlayerVelocity();
  } else {//if human is not playing
    switch (key) {
      case ' ':
        showBest = !showBest;
        break;
      case 'G':
      case 'g'://replay gens
        toggleReplay();
        break;
    }
  }

  if (key == 'P' || key == 'p') {
    toggleHumanMode();
  }
}

//---------------------------------------------------------------------------------------------------------------------
// Mode switches, shared by the keyboard shortcuts and the page buttons.

function toggleReplay() {
  if (humanPlaying) {
    return;
  }
  if (replayGens) {
    upToGenPos = 0;
    replayGens = false;
    loadDots();
  } else if (testPopulation.genPlayers.length > 0) {
    replayGens = true;
    genPlayer = testPopulation.genPlayers[0].gimmeBaby();
    saveDots();
    resetDots();
  }
  if (window.AdamAI) {
    window.AdamAI.onModeChange();
  }
}

function toggleHumanMode() {
  if (humanPlaying) {//if human is currently playing
    humanPlaying = false;
    loadDots();
  } else {//if AI is currently playing
    if (replayGens) {
      upToGenPos = 0;
      replayGens = false;
    }
    humanPlaying = true;
    p = new Player();
    p.human = true;
    //save the positions of the dots
    saveDots();
    resetDots();
  }
  if (window.AdamAI) {
    window.AdamAI.onModeChange();
  }
}

// Starts a brand new run from the current population size.
function restartRun() {
  humanPlaying = false;
  replayGens = false;
  upToGenPos = 0;
  winCounter = -1;
  adamPaused = false;
  showBest = true;
  testPopulation = new Population(populationSize);
  resetDots();
  if (window.AdamAI) {
    window.AdamAI.onRestart();
  }
}

function keyReleased() {
  if (humanPlaying) {
    switch (keyCode) {
      case UP_ARROW:
        up = false;
        break;
      case DOWN_ARROW:
        down = false;
        break;
      case RIGHT_ARROW:
        right = false;
        break;
      case LEFT_ARROW:
        left = false;
        break;
    }
    switch (key) {
      case 'W':
      case 'w':
        up = false;
        break;
      case 'S':
      case 's':
        down = false;
        break;
      case 'D':
      case 'd':
        right = false;
        break;
      case 'A':
      case 'a':
        left = false;
        break;
    }

    setPlayerVelocity();
  }
}

//set the velocity of the player based on what keys are currently down
function setPlayerVelocity() {
  p.vel.y = 0;
  if (up) {
    p.vel.y -= 1;
  }
  if (down) {
    p.vel.y += 1;
  }
  p.vel.x = 0;
  if (left) {
    p.vel.x -= 1;
  }
  if (right) {
    p.vel.x += 1;
  }
}

//---------------------------------------------------------------------------------------------------------------------
// Builds the evolution-cycle controls into the page panel.
// Each control writes straight to the global the simulation already reads.
function ctrlGroup(parent, label, value) {
  var group = createDiv('').parent(parent).addClass('ctrl');
  var head = createDiv('').parent(group).addClass('ctrl-head');
  createSpan(label).parent(head).addClass('ctrl-name');
  var valueEl = createSpan(value).parent(head).addClass('ctrl-value');
  var buttons = createDiv('').parent(group).addClass('ctrl-btns');
  return { value: valueEl, buttons: buttons };
}

function ctrlButton(parent, label, handler, hint) {
  var b = createButton(label).parent(parent).addClass('ctrl-btn');
  if (hint) {
    b.attribute('title', hint);
  }
  b.mousePressed(handler);
  return b;
}

function htmlStuff() {
  var panel = createDiv('').parent('sim-controls').id('sim-panel-controls');

  createElement('h3', 'Evolution cycle').parent(panel).addClass('panel-title');

  var popGroup = ctrlGroup(panel, 'Population size', populationSize);
  ctrlButton(popGroup.buttons, '−', minusPopSize, 'Remove 100 individuals (minimum 100)');
  ctrlButton(popGroup.buttons, '+', plusPopSize, 'Add 100 individuals (maximum 10000)');

  var mrGroup = ctrlGroup(panel, 'Mutation rate', mutationRate);
  ctrlButton(mrGroup.buttons, '½', minusmr, 'Halve the mutation rate');
  ctrlButton(mrGroup.buttons, '×2', plusmr, 'Double the mutation rate');

  var speedGroup = ctrlGroup(panel, 'Steps per frame', evolutionSpeed);
  ctrlButton(speedGroup.buttons, '−', minusSpeed, 'Slow the visualisation down');
  ctrlButton(speedGroup.buttons, '+', plusSpeed, 'Run more simulation steps per frame');

  var movesGroup = ctrlGroup(panel, 'Moves added', increaseMovesBy);
  ctrlButton(movesGroup.buttons, '−', minusMoves, 'Add fewer directions per bump');
  ctrlButton(movesGroup.buttons, '+', plusMoves, 'Add more directions per bump');

  var everyGroup = ctrlGroup(panel, 'Every N generations', increaseEvery);
  ctrlButton(everyGroup.buttons, '−', minusEvery, 'Bump the move budget more often');
  ctrlButton(everyGroup.buttons, '+', plusEvery, 'Bump the move budget less often');

  createDiv('The move budget grows every N generations until a genome first reaches the goal.')
    .parent(panel).addClass('panel-note');

  if (window.AdamAI) {
    window.AdamAI.bindControlRefs({
      population: popGroup.value,
      mutation: mrGroup.value,
      speed: speedGroup.value,
      moves: movesGroup.value,
      every: everyGroup.value
    });
  }
}

function minusPopSize() {
  if (populationSize > 100) {
    populationSize -= 100;
  }
  syncControls();
}

function plusPopSize() {
  if (populationSize < 10000) {
    populationSize += 100;
  }
  syncControls();
}

function minusmr() {
  if (mutationRate > 0.0001) {
    mutationRate /= 2.0;
  }
  syncControls();
}

function plusmr() {
  if (mutationRate <= 0.5) {
    mutationRate *= 2.0;
  }
  syncControls();
}

function minusSpeed() {
  if (evolutionSpeed > 1) {
    evolutionSpeed -= 1;
  }
  syncControls();
}

function plusSpeed() {
  if (evolutionSpeed <= 7) {
    evolutionSpeed += 1;
  }
  syncControls();
}

function minusMoves() {
  if (increaseMovesBy > 1) {
    increaseMovesBy -= 1;
  }
  syncControls();
}

function plusMoves() {
  if (increaseMovesBy < 500) {
    increaseMovesBy += 1;
  }
  syncControls();
}

function minusEvery() {
  if (increaseEvery > 1) {
    increaseEvery -= 1;
  }
  syncControls();
}

function plusEvery() {
  if (increaseEvery < 100) {
    increaseEvery += 1;
  }
  syncControls();
}

//the control read-outs live in the page now, so refresh them from current state
function syncControls() {
  if (window.AdamAI) {
    window.AdamAI.syncControlLabels({
      populationSize: populationSize,
      mutationRate: mutationRate,
      evolutionSpeed: evolutionSpeed,
      increaseMovesBy: increaseMovesBy,
      increaseEvery: increaseEvery
    });
  }
}
