import Unoludo from "./unoludo.js";

/*global console*/

const base_state = Unoludo.create_initial_state(["Player 1", "Player 2"], {
    shuffle: false
});

const red_6 = Unoludo.card("test-red-6", "number", "red", 6);

const player_1 = base_state.players[0];

const test_player_1 = Object.freeze({
    id: player_1.id,
    name: player_1.name,
    hand: Object.freeze([red_6]),
    planes: player_1.planes
});

const test_state = Unoludo.update_player(base_state, 0, test_player_1);

const launched_state = Unoludo.play_number_card(
    test_state,
    "test-red-6",
    "red"
);

console.log("Before launch:", test_state.players[0].planes.red);
console.log("After launch:", launched_state.players[0].planes.red);
console.log("Player hand after launch:", launched_state.players[0].hand);
console.log("Top discard after launch:", Unoludo.top_discard(launched_state));