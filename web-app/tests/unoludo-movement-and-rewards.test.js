import assert from "node:assert/strict";

import Unoludo from "../unoludo.js";

const plane = function (status, position, extra = {}) {
    return Object.freeze({
        status: status,
        position: position,
        shielded: extra.shielded || false,
        frozen: extra.frozen || false
    });
};

const player = function (id, name, colour, hand, planes) {
    return Object.freeze({
        id: id,
        name: name,
        colour: colour,
        kind: "human",
        hand: Object.freeze(hand),
        planes: Object.freeze(planes)
    });
};

const game_state = function (players, top_card, options = {}) {
    return Object.freeze({
        draw_pile: Object.freeze(options.draw_pile || []),
        discard_pile: Object.freeze(options.discard_pile || [top_card]),
        players: Object.freeze(players),
        current_player: options.current_player || 0,
        active_colour: options.active_colour || top_card.colour,
        winner: undefined,
        player_moods: Object.freeze({}),
        log: Object.freeze([])
    });
};

const four_planes = function (first_plane) {
    return Object.freeze([
        first_plane,
        ...Unoludo.empty_planes().slice(1)
    ]);
};

describe("Track jump shortcuts", function () {
    it("sends a plane that lands exactly on a jump square to the jump target", function () {
        // Blue jumps from track 17 to track 29.
        const three = Unoludo.card("blue-jump-3", "number", "blue", 3);
        const blue = player(0, "Blue", "blue", [three], four_planes(plane("track", 14)));

        const next_state = Unoludo.play_number_card(
            game_state([blue], Unoludo.card("top-blue", "number", "blue", 1)),
            "blue-jump-3",
            0
        );

        assert.deepEqual(next_state.players[0].planes[0], {
            status: "track",
            position: 29,
            shielded: false,
            frozen: false
        });
    });

    it("does not jump when the plane only passes over the jump square", function () {
        // Moving 14 -> 18 passes over 17 without landing on it, so no jump.
        const four = Unoludo.card("blue-pass-4", "number", "blue", 4);
        const blue = player(0, "Blue", "blue", [four], four_planes(plane("track", 14)));

        const next_state = Unoludo.play_number_card(
            game_state([blue], Unoludo.card("top-blue", "number", "blue", 1)),
            "blue-pass-4",
            0
        );

        assert.equal(next_state.players[0].planes[0].position, 18);
    });
});

describe("Reverse card movement", function () {
    it("moves an opponent plane backwards but keeps it on the track", function () {
        const reverse = Unoludo.card("blue-reverse", "reverse", "blue");
        const blue = player(0, "Blue", "blue", [reverse], Unoludo.empty_planes());
        const red = player(1, "Red", "red", [], four_planes(plane("track", 30)));

        const next_state = Unoludo.play_reverse_card(
            game_state([blue, red], Unoludo.card("top-reverse", "reverse", "blue")),
            "blue-reverse",
            1,
            0,
            2
        );

        // Red starts at 26, so 30 - 2 stays on the track at 28.
        assert.deepEqual(next_state.players[1].planes[0], {
            status: "track",
            position: 28,
            shielded: false,
            frozen: false
        });
        assert.deepEqual(next_state.player_moods, {0: "smug", 1: "angry"});
    });

    it("rejects an out-of-range reverse distance", function () {
        const reverse = Unoludo.card("blue-reverse", "reverse", "blue");
        const blue = player(0, "Blue", "blue", [reverse], Unoludo.empty_planes());
        const red = player(1, "Red", "red", [], four_planes(plane("track", 30)));

        const next_state = Unoludo.play_reverse_card(
            game_state([blue, red], Unoludo.card("top-reverse", "reverse", "blue")),
            "blue-reverse",
            1,
            0,
            7
        );

        assert.equal(next_state, undefined);
    });
});

describe("Wild combo", function () {
    it("launches a base plane when paired with a 6", function () {
        const wild = Unoludo.card("wild", "wild", "wild");
        const six = Unoludo.card("blue-6", "number", "blue", 6);
        const blue = player(0, "Blue", "blue", [wild, six], Unoludo.empty_planes());

        const next_state = Unoludo.play_wild_combo(
            game_state([blue], Unoludo.card("top-red", "number", "red", 5)),
            "wild",
            "blue-6",
            0,
            0
        );

        assert.deepEqual(next_state.players[0].planes[0], {
            status: "gate",
            position: -1,
            shielded: false,
            frozen: false
        });
        assert.equal(next_state.active_colour, "blue");
    });

    it("rejects a wild combo paired with a shield (0) card", function () {
        const wild = Unoludo.card("wild", "wild", "wild");
        const zero = Unoludo.card("blue-0", "number", "blue", 0);
        const blue = player(0, "Blue", "blue", [wild, zero], four_planes(plane("track", 3)));

        const next_state = Unoludo.play_wild_combo(
            game_state([blue], Unoludo.card("top-red", "number", "red", 5)),
            "wild",
            "blue-0",
            0,
            0
        );

        assert.equal(next_state, undefined);
    });
});

describe("Reward cards", function () {
    it("launches a base plane with reward 7 (6-9 may all launch)", function () {
        const reward = Unoludo.card("reward-7", "reward", "wild", 7);
        const blue = player(0, "Blue", "blue", [reward], Unoludo.empty_planes());

        const next_state = Unoludo.play_reward_card(
            game_state([blue], Unoludo.card("top-red", "number", "red", 2)),
            "reward-7",
            0,
            0,
            "blue"
        );

        assert.deepEqual(next_state.players[0].planes[0], {
            status: "gate",
            position: -1,
            shielded: false,
            frozen: false
        });
        assert.equal(next_state.active_colour, "blue");
    });

    it("moves an active plane by the reward value", function () {
        const reward = Unoludo.card("reward-9", "reward", "wild", 9);
        const blue = player(0, "Blue", "blue", [reward], four_planes(plane("track", 0)));

        const next_state = Unoludo.play_reward_card(
            game_state([blue], Unoludo.card("top-red", "number", "red", 2)),
            "reward-9",
            0,
            0,
            "green"
        );

        assert.equal(next_state.players[0].planes[0].status, "track");
        assert.equal(next_state.players[0].planes[0].position, 9);
        assert.equal(next_state.active_colour, "green");
    });

    it("rejects a reward card with an invalid chosen colour", function () {
        const reward = Unoludo.card("reward-8", "reward", "wild", 8);
        const blue = player(0, "Blue", "blue", [reward], four_planes(plane("track", 0)));

        const next_state = Unoludo.play_reward_card(
            game_state([blue], Unoludo.card("top-red", "number", "red", 2)),
            "reward-8",
            0,
            0,
            "wild"
        );

        assert.equal(next_state, undefined);
    });
});

describe("Draw pile exhaustion", function () {
    it("refills with an emergency deck when the draw and discard piles cannot cover the draw", function () {
        const blue = player(0, "Blue", "blue", [], Unoludo.empty_planes());

        const next_state = Unoludo.draw_cards(
            game_state([blue], Unoludo.card("only-top", "number", "red", 4), {
                draw_pile: [],
                discard_pile: [Unoludo.card("only-top", "number", "red", 4)]
            }),
            0,
            3
        );

        assert.equal(next_state.players[0].hand.length, 3);
        assert.equal(
            next_state.log.includes("Draw pile was refilled from the discard pile."),
            true
        );
        // The single discard card is preserved as the top of the pile.
        assert.equal(next_state.discard_pile.at(-1).id, "only-top");
    });
});
