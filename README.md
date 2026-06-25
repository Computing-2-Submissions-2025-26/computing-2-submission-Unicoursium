# Unoludo Game

### CID: 02606654

## Intro

Unoludo is a turn-based board game that combines the card-matching strategy of UNO with the race-and-capture movement of Ludo. Each player controls four planes and tries to move all of them from base, through the main track, into the home lane, and finally to the finish.

Players use coloured cards to control movement and special actions. Number cards move planes around the board, while a 6 can launch a plane from base. Special cards add tactical choices: shield cards protect planes, Skip can freeze an opponent's planes, Reverse can move an opponent backwards, Wild cards can affect any player's plane, and Wild +4 offers powerful bonus effects.

The game supports singleplayer and multiplayer, you can also play with CPU opponents and your friends in multiplayer mode. The game has tutorials.



## Game Modes

### Singleplayer

Singleplayer starts a local game against CPU opponents. The player plays blue, while the other colours are controlled by CPU players.

### Multiplayer

Multiplayer allows players to create or join a room using a **room code**. The room host can add friends to join or add CPU players.

#### IMPORTANT:

When running the project locally from source code, multiplayer can be tested by opening multiple copies of the same browser tab and joining the same room code. I also deployed this game on [Unoludo](unoludo.unicoy.uk).

### Basic Tutorial

Basic Tutorial introduces the core rules step by step. It teaches players how to launch planes, match cards by colour or number, move along the track, use shields, capture opponents, draw when no card can be played, enter the home lane, and win the game.

### Enhanced Tutorial

Enhanced Tutorial explains the more advanced card effects and reward mechanics. It covers Draw Two, Reverse, Wild, Wild +4, reward cards, colour selection, moving other players' planes, and the bonus cards gained after playing the final card in a hand.



## Running the Project

Install the **project dependencies** first:

```bash
npm install
```

Run the unit tests:

```bash
npm test
```

Run JSLint:

```bash
npm run lint
```

Generate the JSDoc API documentation:

```bash
npx jsdoc -c jsdoc.json
```

Open the web application locally from:

```text
web-app/index.html
```

The generated API documentation is available from:

```text
docs/index.html
```



[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/H6lPFq0J)

# Computing 2 Coursework Submission.

**CID**: 02606654

This is the submission template for your Computing 2 Applications coursework submission.

## Checklist

### Install dependencies locally

This template relies on a a few packages from the Node Package Manager, npm.
To install them run the following commands in the terminal.

```properties
npm install
```

These won't be uploaded to your repository because of the `.gitignore`.
I'll run the same commands when I download your repos.

### Game Module – API

*You will produce an API specification, i.e. a list of function names and their signatures, for a Javascript module that represents the state of your game and the operations you can perform on it that advances the game or provides information.*

- [x] Include a `.js ` module file in `/web-app` containing the API using `jsdoc`.
- [x] Update `/jsdoc.json` to point to this module in `.source.include` (line 7)
- [x] Compile jsdoc using the run configuration `Generate Docs`
- [x] Check the generated docs have compiled correctly.

### Game Module – Implementation

*You will implement, in Javascript, the module you specified above. Such that your game can be simulated in code, e.g. in the debug console.*

- [x] The file above should be fully implemented.

### Unit Tests – Specification

*For the Game module API you have produced, write a set of unit tests descriptions that specify the expected behaviour of one aspect of your API, e.g. you might pick the win condition, or how the state changes when a move is made.*

- [x] Write unit test definitions in `/web-app/tests`.
- [x] Check the headings appear in the Testing sidebar.

### Unit Tests – Implementation

*Implement in code the unit tests specified above.*

- [x] Implement the tests above.

### Web Application

*Produce a web application that allows a user to interface with your game module.*

- Implement in `/web-app`
  - [x] `index.html`
  - [x] `default.css`
  - [x] `main.js`
  - [x] Any other files you need to include.

### Finally

- [x] Push to GitHub.
- [x] Sync the changes.
- [x] Check submission on GitHub website.
