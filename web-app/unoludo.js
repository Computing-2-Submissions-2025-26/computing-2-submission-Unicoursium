/**
 * Unoludo.js is a module to model and play Unoludo,
 * a turn-based board game combining UNO-inspired card play
 * with Ludo-inspired plane movement.
 *
 * @namespace Unoludo
 * @author Unico Yin
 * @version 2025/26
 */
import R from "./ramda.js";

const Unoludo = Object.create(null);

/**
 * The four colours used by both cards and planes.
 * @memberof Unoludo
 * @readonly
 * @enum {string}
 */
Unoludo.colours = Object.freeze(["red", "yellow", "blue", "green"]);

/**
 * The number values used in Unoludo.
 * 0 is a shield card. 1-6 are movement cards.
 * @memberof Unoludo
 * @readonly
 * @enum {number}
 */
Unoludo.number_values = Object.freeze([0, 1, 2, 3, 4, 5, 6]);

/**
 * A colour used by cards and planes.
 * @memberof Unoludo
 * @typedef {"red" | "yellow" | "blue" | "green"} Colour
 */

/**
 * A card type in Unoludo.
 * @memberof Unoludo
 * @typedef {"number" | "skip" | "reverse" | "draw2" | "wild" | "wild4"} CardType
 */

/**
 * A card in the Unoludo deck.
 * @memberof Unoludo
 * @typedef {Object} Card
 * @property {string} id A unique identifier for the card.
 * @property {Unoludo.CardType} type The rule category of the card.
 * @property {(Unoludo.Colour | "wild")} colour The colour of the card, or "wild".
 * @property {number} [value] The number value on a number card.
 */

/**
 * A plane controlled by one player.
 * @memberof Unoludo
 * @typedef {Object} Plane
 * @property {"base" | "track" | "home" | "finished"} status The plane's current area.
 * @property {number} position The plane's position. -1 means not on a path.
 * @property {boolean} shielded Whether the plane is protected from being sent back to base.
 * @property {boolean} frozen Whether the plane is unable to move this turn.
 */

/**
 * A player in Unoludo.
 * @memberof Unoludo
 * @typedef {Object} Player
 * @property {number} id The player's id.
 * @property {string} name The player's display name.
 * @property {Unoludo.Card[]} hand The player's current hand.
 * @property {Object} planes The player's planes, indexed by colour.
 */

/**
 * Complete Unoludo game state.
 * @memberof Unoludo
 * @typedef {Object} State
 * @property {Unoludo.Card[]} draw_pile The cards available to draw.
 * @property {Unoludo.Card[]} discard_pile The cards that have been played.
 * @property {Unoludo.Player[]} players The players in turn order.
 * @property {number} current_player The id of the player whose turn it is.
 * @property {(Unoludo.Colour | undefined)} active_colour The colour currently required by the discard pile.
 * @property {(number | undefined)} winner The winning player id, if the game has ended.
 * @property {string[]} log A human-readable game log.
 */

/**
 * Create a card object.
 * @memberof Unoludo
 * @function
 * @param {string} id The card id.
 * @param {Unoludo.CardType} type The card type.
 * @param {(Unoludo.Colour | "wild")} colour The card colour.
 * @param {number} [value] The card number value, if it has one.
 * @returns {Unoludo.Card} A card.
 */
Unoludo.card = function (id, type, colour, value) {
    const card = {
        id: id,
        type: type,
        colour: colour
    };

    if (value !== undefined) {
        card.value = value;
    }

    return Object.freeze(card);
};

/**
 * Create several copies of one card description.
 * @function
 * @param {string} prefix The base id prefix.
 * @param {number} count The number of cards to create.
 * @param {Unoludo.CardType} type The card type.
 * @param {(Unoludo.Colour | "wild")} colour The card colour.
 * @param {number} [value] The card value, if it has one.
 * @returns {Unoludo.Card[]} The created cards.
 */
const create_copies = function (prefix, count, type, colour, value) {
    const cards = [];
    let index = 0;

    while (index < count) {
        cards.push(Unoludo.card(
            prefix + "-" + index,
            type,
            colour,
            value
        ));
        index += 1;
    }

    return Object.freeze(cards);
};

/**
 * Create all coloured cards for one colour.
 * Each colour contains:
 * - 0 x 4
 * - 1-6 x 6 each
 * - Skip x 4
 * - Reverse x 4
 * - Draw Two x 4
 *
 * @function
 * @param {Unoludo.Colour} colour The colour to create cards for.
 * @returns {Unoludo.Card[]} The coloured cards.
 */
const create_colour_cards = function (colour) {
    const zero_cards = create_copies(
        colour + "-number-0",
        4,
        "number",
        colour,
        0
    );

    const movement_cards = [1, 2, 3, 4, 5, 6].flatMap(function (value) {
        return create_copies(
            colour + "-number-" + value,
            6,
            "number",
            colour,
            value
        );
    });

    const skip_cards = create_copies(colour + "-skip", 4, "skip", colour);
    const reverse_cards = create_copies(
        colour + "-reverse",
        4,
        "reverse",
        colour
    );
    const draw_two_cards = create_copies(
        colour + "-draw2",
        4,
        "draw2",
        colour
    );

    return [
        ...zero_cards,
        ...movement_cards,
        ...skip_cards,
        ...reverse_cards,
        ...draw_two_cards
    ];
};

/**
 * Create the full Unoludo deck.
 *
 * The deck contains 216 cards:
 * - 16 zero shield cards
 * - 144 movement cards from 1 to 6
 * - 16 Skip cards
 * - 16 Reverse cards
 * - 16 Draw Two cards
 * - 4 Wild cards
 * - 4 Wild +4 cards
 *
 * @memberof Unoludo
 * @function
 * @returns {Unoludo.Card[]} The ordered, unshuffled deck.
 */
Unoludo.create_deck = function () {
    const coloured_cards = Unoludo.colours.flatMap(create_colour_cards);
    const wild_cards = create_copies("wild", 4, "wild", "wild");
    const wild_four_cards = create_copies("wild4", 4, "wild4", "wild");

    return Object.freeze([
        ...coloured_cards,
        ...wild_cards,
        ...wild_four_cards
    ]);
};

/**
 * Return a shuffled copy of a deck.
 *
 * This uses the Fisher-Yates shuffle. It returns a new array and does not
 * mutate the original deck.
 *
 * @memberof Unoludo
 * @function
 * @param {Unoludo.Card[]} deck The deck to shuffle.
 * @param {function} [random = Math.random] A random number function.
 * @returns {Unoludo.Card[]} A shuffled deck.
 */
Unoludo.shuffle_deck = function (deck, random = Math.random) {
    const shuffled = [...deck];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swap_index = Math.floor(random() * (index + 1));
        const temporary = shuffled[index];
        shuffled[index] = shuffled[swap_index];
        shuffled[swap_index] = temporary;
    }

    return Object.freeze(shuffled);
};

/**
 * Create an empty plane.
 * @memberof Unoludo
 * @function
 * @returns {Unoludo.Plane} A plane in base.
 */
Unoludo.empty_plane = function () {
    return Object.freeze({
        status: "base",
        position: -1,
        shielded: false,
        frozen: false
    });
};

/**
 * Create one player's four planes.
 * @memberof Unoludo
 * @function
 * @returns {Object} Four planes indexed by colour.
 */
Unoludo.empty_planes = function () {
    return Object.freeze({
        red: Unoludo.empty_plane(),
        yellow: Unoludo.empty_plane(),
        blue: Unoludo.empty_plane(),
        green: Unoludo.empty_plane()
    });
};

/**
 * Create players with empty hands and all planes in base.
 * @memberof Unoludo
 * @function
 * @param {string[]} player_names The names of the players.
 * @returns {Unoludo.Player[]} The created players.
 */
Unoludo.create_players = function (player_names) {
    return Object.freeze(player_names.map(function (name, index) {
        return Object.freeze({
            id: index,
            name,
            hand: Object.freeze([]),
            planes: Unoludo.empty_planes()
        });
    }));
};

/**
 * Deal cards to every player.
 * This returns new players and the remaining draw pile.
 *
 * @memberof Unoludo
 * @function
 * @param {Unoludo.Player[]} players The players to deal to.
 * @param {Unoludo.Card[]} draw_pile The draw pile.
 * @param {number} hand_size The number of cards for each player.
 * @returns {Object} An object containing players and draw_pile.
 */
Unoludo.deal_initial_hands = function (players, draw_pile, hand_size = 5) {
    let remaining_draw_pile = [...draw_pile];

    const dealt_players = players.map(function (player) {
        const hand = remaining_draw_pile.slice(0, hand_size);
        remaining_draw_pile = remaining_draw_pile.slice(hand_size);

        return Object.freeze({
            ...player,
            hand: Object.freeze(hand)
        });
    });

    return Object.freeze({
        players: Object.freeze(dealt_players),
        draw_pile: Object.freeze(remaining_draw_pile)
    });
};

/**
 * Find the first non-wild card in a deck.
 * This is useful for starting the discard pile.
 *
 * @function
 * @param {Unoludo.Card[]} deck The deck to search.
 * @returns {number} The index of the first non-wild card, or -1.
 */
const first_coloured_card_index = function (deck) {
    return deck.findIndex(function (card) {
        return card.colour !== "wild";
    });
};

/**
 * Start a discard pile by taking the first coloured card from the draw pile.
 *
 * @memberof Unoludo
 * @function
 * @param {Unoludo.Card[]} draw_pile The current draw pile.
 * @returns {Object} An object containing draw_pile, discard_pile, and active_colour.
 */
Unoludo.start_discard_pile = function (draw_pile) {
    const index = first_coloured_card_index(draw_pile);

    if (index < 0) {
        return undefined;
    }

    const top_card = draw_pile[index];
    const remaining_draw_pile = [
        ...draw_pile.slice(0, index),
        ...draw_pile.slice(index + 1)
    ];

    return Object.freeze({
        draw_pile: Object.freeze(remaining_draw_pile),
        discard_pile: Object.freeze([top_card]),
        active_colour: top_card.colour
    });
};

/**
 * Create a new initial game state.
 *
 * @memberof Unoludo
 * @function
 * @param {string[]} player_names The player names in turn order.
 * @param {Object} [options] Optional setup options.
 * @param {number} [options.hand_size = 5] The initial hand size.
 * @param {boolean} [options.shuffle = true] Whether to shuffle the deck.
 * @param {function} [options.random = Math.random] Random function for shuffling.
 * @returns {Unoludo.State} The initial state.
 */
Unoludo.create_initial_state = function (player_names, options = {}) {
    const hand_size = (
    options.hand_size === undefined
    ? 5
    : options.hand_size
    );
    const should_shuffle = options.shuffle ?? true;
    const random = options.random ?? Math.random;

    const deck = (
        should_shuffle
        ? Unoludo.shuffle_deck(Unoludo.create_deck(), random)
        : Unoludo.create_deck()
    );

    const players = Unoludo.create_players(player_names);
    const dealt = Unoludo.deal_initial_hands(players, deck, hand_size);
    const discard_setup = Unoludo.start_discard_pile(dealt.draw_pile);

    return Object.freeze({
        draw_pile: discard_setup.draw_pile,
        discard_pile: discard_setup.discard_pile,
        players: dealt.players,
        current_player: 0,
        active_colour: discard_setup.active_colour,
        winner: undefined,
        log: Object.freeze(["Game started."])
    });
};

/**
 * Return the top card of the discard pile.
 *
 * @memberof Unoludo
 * @function
 * @param {Unoludo.State} state The game state.
 * @returns {Unoludo.Card} The top discard card.
 */
Unoludo.top_discard = function (state) {
    return state.discard_pile[state.discard_pile.length - 1];
};

/**
 * Return the current player.
 *
 * @memberof Unoludo
 * @function
 * @param {Unoludo.State} state The game state.
 * @returns {Unoludo.Player} The current player.
 */
Unoludo.current_player = function (state) {
    return state.players[state.current_player];
};

/**
 * Return whether the game has ended.
 *
 * @memberof Unoludo
 * @function
 * @param {Unoludo.State} state The game state.
 * @returns {boolean} Whether the game has ended.
 */
Unoludo.is_ended = function (state) {
    return state.winner !== undefined;
};

/**
 * Return whether a card can be played on the current discard state.
 *
 * A card can be played if:
 * - it is a Wild or Wild +4 card;
 * - it matches the active colour;
 * - it is a number card with the same value as the top number card;
 * - it is an action card with the same action type as the top action card.
 *
 * @memberof Unoludo
 * @function
 * @param {Unoludo.Card} card The card being played.
 * @param {Unoludo.Card} top_card The current top discard card.
 * @param {(Unoludo.Colour | undefined)} active_colour The currently active colour.
 * @returns {boolean} Whether the card can be played.
 */
Unoludo.can_play_on = function (card, top_card, active_colour) {
    if (card.colour === "wild") {
        return true;
    }

    if (card.colour === active_colour) {
        return true;
    }

    if (
        card.type === "number" &&
        top_card.type === "number" &&
        card.value === top_card.value
    ) {
        return true;
    }

    return (
        card.type !== "number" &&
        top_card.type !== "number" &&
        card.type === top_card.type
    );
};

/**
 * Return whether a card can be legally played now.
 *
 * @memberof Unoludo
 * @function
 * @param {Unoludo.Card} card The card to check.
 * @param {Unoludo.State} state The game state.
 * @returns {boolean} Whether the card can be played.
 */
Unoludo.can_play_card = function (card, state) {
    return Unoludo.can_play_on(
        card,
        Unoludo.top_discard(state),
        state.active_colour
    );
};

/**
 * Return the cards in a player's hand that are currently playable.
 *
 * @memberof Unoludo
 * @function
 * @param {Unoludo.State} state The game state.
 * @param {number} player_id The player id.
 * @returns {Unoludo.Card[]} Playable cards.
 */
Unoludo.playable_cards = function (state, player_id) {
    const player = state.players[player_id];

    return Object.freeze(player.hand.filter(function (card) {
        return Unoludo.can_play_card(card, state);
    }));
};

/**
 * Return whether a player has finished all planes.
 *
 * @memberof Unoludo
 * @function
 * @param {Unoludo.Player} player The player to check.
 * @returns {boolean} Whether all four planes are finished.
 */
Unoludo.player_has_won = function (player) {
    return Unoludo.colours.every(function (colour) {
        return player.planes[colour].status === "finished";
    });
};

/**
 * Return the next player id.
 *
 * @memberof Unoludo
 * @function
 * @param {Unoludo.State} state The game state.
 * @returns {number} The next player id.
 */
Unoludo.next_player_id = function (state) {
    return (state.current_player + 1) % state.players.length;
};

/**
 * Return a card from a player's hand by id.
 *
 * @memberof Unoludo
 * @function
 * @param {Unoludo.Player} player The player whose hand is searched.
 * @param {string} card_id The card id.
 * @returns {(Unoludo.Card | undefined)} The matching card, if found.
 */
Unoludo.card_in_hand = function (player, card_id) {
    return player.hand.find(function (card) {
        return card.id === card_id;
    });
};

/**
 * Remove one card from a player's hand.
 *
 * @memberof Unoludo
 * @function
 * @param {Unoludo.Player} player The player.
 * @param {string} card_id The card id to remove.
 * @returns {(Unoludo.Player | undefined)} The updated player, or undefined.
 */
Unoludo.remove_card_from_hand = function (player, card_id) {
    const card = Unoludo.card_in_hand(player, card_id);

    if (card === undefined) {
        return undefined;
    }

    return Object.freeze({
        ...player,
        hand: Object.freeze(player.hand.filter(function (hand_card) {
            return hand_card.id !== card_id;
        }))
    });
};

/**
 * Add an event to the game log.
 *
 * @memberof Unoludo
 * @function
 * @param {Unoludo.State} state The game state.
 * @param {string} message The message to add.
 * @returns {Unoludo.State} The updated state.
 */
Unoludo.add_log = function (state, message) {
    return Object.freeze({
        ...state,
        log: Object.freeze([...state.log, message])
    });
};

/**
 * The number of spaces on the main track.
 * This can be changed later to match the final board.
 * @memberof Unoludo
 * @readonly
 */
Unoludo.track_length = 88;

/**
 * The number of spaces in each home lane.
 * @memberof Unoludo
 * @readonly
 */
Unoludo.home_lane_length = 6;

/**
 * Replace one player in the player list.
 *
 * @function
 * @param {Unoludo.Player[]} players The current players.
 * @param {number} player_id The player to replace.
 * @param {Unoludo.Player} new_player The updated player.
 * @returns {Unoludo.Player[]} The updated player list.
 */
const replace_player = function (players, player_id, new_player) {
    return Object.freeze(players.map(function (player) {
        if (player.id === player_id) {
            return new_player;
        }
        return player;
    }));
};

/**
 * Replace one plane in a player's plane set.
 *
 * @function
 * @param {Unoludo.Player} player The player to update.
 * @param {Unoludo.Colour} plane_colour The plane colour.
 * @param {Unoludo.Plane} new_plane The updated plane.
 * @returns {Unoludo.Player} The updated player.
 */
const replace_plane_in_player = function (player, plane_colour, new_plane) {
    const planes = {
        red: player.planes.red,
        yellow: player.planes.yellow,
        blue: player.planes.blue,
        green: player.planes.green
    };

    planes[plane_colour] = new_plane;

    return Object.freeze({
        id: player.id,
        name: player.name,
        hand: player.hand,
        planes: Object.freeze(planes)
    });
};

/**
 * Replace one player in the game state.
 *
 * @memberof Unoludo
 * @function
 * @param {Unoludo.State} state The game state.
 * @param {number} player_id The player to update.
 * @param {Unoludo.Player} new_player The updated player.
 * @returns {Unoludo.State} The updated state.
 */
Unoludo.update_player = function (state, player_id, new_player) {
    return Object.freeze({
        draw_pile: state.draw_pile,
        discard_pile: state.discard_pile,
        players: replace_player(state.players, player_id, new_player),
        current_player: state.current_player,
        active_colour: state.active_colour,
        winner: state.winner,
        log: state.log
    });
};

/**
 * Replace one plane in the game state.
 *
 * @memberof Unoludo
 * @function
 * @param {Unoludo.State} state The game state.
 * @param {number} player_id The owner of the plane.
 * @param {Unoludo.Colour} plane_colour The colour of the plane.
 * @param {Unoludo.Plane} new_plane The updated plane.
 * @returns {Unoludo.State} The updated state.
 */
Unoludo.update_plane = function (
    state,
    player_id,
    plane_colour,
    new_plane
) {
    const player = state.players[player_id];
    const new_player = replace_plane_in_player(
        player,
        plane_colour,
        new_plane
    );

    return Unoludo.update_player(state, player_id, new_player);
};

/**
 * Draw cards for a player.
 *
 * If the draw pile contains fewer cards than requested, the player draws
 * as many cards as possible.
 *
 * @memberof Unoludo
 * @function
 * @param {Unoludo.State} state The game state.
 * @param {number} player_id The player drawing cards.
 * @param {number} count The number of cards to draw.
 * @returns {Unoludo.State} The updated state.
 */
Unoludo.draw_cards = function (state, player_id, count) {
    const player = state.players[player_id];
    const drawn_cards = state.draw_pile.slice(0, count);
    const remaining_draw_pile = state.draw_pile.slice(drawn_cards.length);

    const new_player = Object.freeze({
        id: player.id,
        name: player.name,
        hand: Object.freeze(player.hand.concat(drawn_cards)),
        planes: player.planes
    });

    return Object.freeze({
        draw_pile: Object.freeze(remaining_draw_pile),
        discard_pile: state.discard_pile,
        players: replace_player(state.players, player_id, new_player),
        current_player: state.current_player,
        active_colour: state.active_colour,
        winner: state.winner,
        log: Object.freeze(
            state.log.concat([
                player.name + " drew " + drawn_cards.length + " card(s)."
            ])
        )
    });
};

/**
 * Clear all shields from a player.
 *
 * @function
 * @param {Unoludo.Player} player The player to update.
 * @returns {Unoludo.Player} The updated player.
 */
const clear_shields = function (player) {
    const planes = {};

    Unoludo.colours.forEach(function (colour) {
        const plane = player.planes[colour];

        planes[colour] = Object.freeze({
            status: plane.status,
            position: plane.position,
            shielded: false,
            frozen: plane.frozen
        });
    });

    return Object.freeze({
        id: player.id,
        name: player.name,
        hand: player.hand,
        planes: Object.freeze(planes)
    });
};

/**
 * Clear all frozen states from a player.
 *
 * @function
 * @param {Unoludo.Player} player The player to update.
 * @returns {Unoludo.Player} The updated player.
 */
const clear_frozen = function (player) {
    const planes = {};

    Unoludo.colours.forEach(function (colour) {
        const plane = player.planes[colour];

        planes[colour] = Object.freeze({
            status: plane.status,
            position: plane.position,
            shielded: plane.shielded,
            frozen: false
        });
    });

    return Object.freeze({
        id: player.id,
        name: player.name,
        hand: player.hand,
        planes: Object.freeze(planes)
    });
};

/**
 * End the current player's turn.
 *
 * Frozen states are cleared from the player whose turn is ending.
 * Shields are cleared from the player whose turn is beginning, because
 * shields last until the start of that player's next turn.
 *
 * @memberof Unoludo
 * @function
 * @param {Unoludo.State} state The current game state.
 * @returns {Unoludo.State} The updated state.
 */
Unoludo.end_turn = function (state) {
    const current_player = state.players[state.current_player];
    const current_player_cleared = clear_frozen(current_player);
    const next_player_id = Unoludo.next_player_id(state);
    const next_player = state.players[next_player_id];
    const next_player_cleared = clear_shields(next_player);

    let players = replace_player(
        state.players,
        state.current_player,
        current_player_cleared
    );

    players = replace_player(
        players,
        next_player_id,
        next_player_cleared
    );

    return Object.freeze({
        draw_pile: state.draw_pile,
        discard_pile: state.discard_pile,
        players: players,
        current_player: next_player_id,
        active_colour: state.active_colour,
        winner: state.winner,
        log: Object.freeze(
            state.log.concat([
                "Turn ended. It is now "
                + next_player.name
                + "'s turn."
            ])
        )
    });
};

/**
 * Remove a card from a player and place it on the discard pile.
 *
 * @function
 * @param {Unoludo.State} state The game state.
 * @param {Unoludo.Player} updated_player The player after the card effect.
 * @param {string} card_id The played card id.
 * @param {Unoludo.Card} card The played card.
 * @param {string} message The log message.
 * @returns {Unoludo.State} The updated state.
 */
const commit_played_card = function (
    state,
    updated_player,
    card_id,
    card,
    message
) {
    const player_without_card = Unoludo.remove_card_from_hand(
        updated_player,
        card_id
    );

    if (player_without_card === undefined) {
        return undefined;
    }

    return Object.freeze({
        draw_pile: state.draw_pile,
        discard_pile: Object.freeze(state.discard_pile.concat([card])),
        players: replace_player(
            state.players,
            updated_player.id,
            player_without_card
        ),
        current_player: state.current_player,
        active_colour: card.colour,
        winner: (
            Unoludo.player_has_won(player_without_card)
            ? player_without_card.id
            : state.winner
        ),
        log: Object.freeze(state.log.concat([message]))
    });
};

/**
 * Move an active plane forward.
 *
 * This simplified movement model treats the board as:
 * main track -> home lane -> finished.
 * Overshooting the final home position is illegal.
 *
 * @function
 * @param {Unoludo.Plane} plane The plane to move.
 * @param {number} steps The number of spaces to move.
 * @returns {(Unoludo.Plane | undefined)} The moved plane, or undefined.
 */
const move_active_plane = function (plane, steps) {
    let next_position;

    if (plane.status === "track") {
        next_position = plane.position + steps;

        if (next_position < Unoludo.track_length) {
            return Object.freeze({
                status: "track",
                position: next_position,
                shielded: plane.shielded,
                frozen: plane.frozen
            });
        }

        next_position = next_position - Unoludo.track_length;

        if (next_position < Unoludo.home_lane_length) {
            return Object.freeze({
                status: "home",
                position: next_position,
                shielded: plane.shielded,
                frozen: plane.frozen
            });
        }

        if (next_position === Unoludo.home_lane_length) {
            return Object.freeze({
                status: "finished",
                position: Unoludo.home_lane_length,
                shielded: false,
                frozen: false
            });
        }

        return undefined;
    }

    if (plane.status === "home") {
        next_position = plane.position + steps;

        if (next_position < Unoludo.home_lane_length) {
            return Object.freeze({
                status: "home",
                position: next_position,
                shielded: plane.shielded,
                frozen: plane.frozen
            });
        }

        if (next_position === Unoludo.home_lane_length) {
            return Object.freeze({
                status: "finished",
                position: Unoludo.home_lane_length,
                shielded: false,
                frozen: false
            });
        }

        return undefined;
    }

    return undefined;
};

/**
 * Play a 0 card to shield the matching-colour active plane.
 *
 * A shield only prevents being sent back to base by capture.
 * It does not block Reverse, Wild movement, or Skip freeze.
 *
 * @memberof Unoludo
 * @function
 * @param {Unoludo.State} state The current game state.
 * @param {string} card_id The 0 card id.
 * @param {Unoludo.Colour} plane_colour The plane to shield.
 * @returns {(Unoludo.State | undefined)} The updated state, or undefined.
 */
Unoludo.play_zero_card = function (state, card_id, plane_colour) {
    const player = Unoludo.current_player(state);
    const card = Unoludo.card_in_hand(player, card_id);
    let plane;
    let new_plane;
    let updated_player;

    if (Unoludo.is_ended(state)) {
        return undefined;
    }

    if (card === undefined) {
        return undefined;
    }

    if (!Unoludo.can_play_card(card, state)) {
        return undefined;
    }

    if (
        card.type !== "number" ||
        card.value !== 0 ||
        card.colour !== plane_colour
    ) {
        return undefined;
    }

    plane = player.planes[plane_colour];

    if (plane.status === "base" || plane.status === "finished") {
        return undefined;
    }

    new_plane = Object.freeze({
        status: plane.status,
        position: plane.position,
        shielded: true,
        frozen: plane.frozen
    });

    updated_player = replace_plane_in_player(
        player,
        plane_colour,
        new_plane
    );

    return commit_played_card(
        state,
        updated_player,
        card_id,
        card,
        player.name + " played " + card.colour + " 0 and shielded "
        + plane_colour + "."
    );
};

/**
 * Play a number card from 1 to 6.
 *
 * A 6 card can launch a matching-colour plane from base to the start tile.
 * Otherwise, number cards move an active matching-colour plane by their value.
 *
 * @memberof Unoludo
 * @function
 * @param {Unoludo.State} state The current game state.
 * @param {string} card_id The number card id.
 * @param {Unoludo.Colour} plane_colour The plane to move or launch.
 * @returns {(Unoludo.State | undefined)} The updated state, or undefined.
 */
Unoludo.play_number_card = function (state, card_id, plane_colour) {
    const player = Unoludo.current_player(state);
    const card = Unoludo.card_in_hand(player, card_id);
    let plane;
    let new_plane;
    let updated_player;
    let message;

    if (Unoludo.is_ended(state)) {
        return undefined;
    }

    if (card === undefined) {
        return undefined;
    }

    if (!Unoludo.can_play_card(card, state)) {
        return undefined;
    }

    if (
        card.type !== "number" ||
        card.value < 1 ||
        card.value > 6 ||
        card.colour !== plane_colour
    ) {
        return undefined;
    }

    plane = player.planes[plane_colour];

    if (plane.frozen) {
        return undefined;
    }

    if (plane.status === "base") {
        if (card.value !== 6) {
            return undefined;
        }

        new_plane = Object.freeze({
            status: "track",
            position: 0,
            shielded: false,
            frozen: false
        });

        message = (
            player.name + " played " + card.colour + " 6 and launched "
            + plane_colour + "."
        );
    } else {
        new_plane = move_active_plane(plane, card.value);

        if (new_plane === undefined) {
            return undefined;
        }

        message = (
            player.name + " played " + card.colour + " "
            + card.value + " and moved " + plane_colour + " by "
            + card.value + "."
        );
    }

    updated_player = replace_plane_in_player(
        player,
        plane_colour,
        new_plane
    );

    return commit_played_card(
        state,
        updated_player,
        card_id,
        card,
        message
    );
};

export default Object.freeze(Unoludo);