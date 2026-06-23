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

const state = function (players, top_card, current_player = 0) {
    return Object.freeze({
        draw_pile: Object.freeze([]),
        discard_pile: Object.freeze([top_card]),
        players: Object.freeze(players),
        current_player: current_player,
        active_colour: top_card.colour,
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

describe("Card driven plane state transitions", function () {
    it("launches a plane from base to the gate when a playable 6 card is used", function () {
        const six = Unoludo.card("blue-6", "number", "blue", 6);
        const blue = player(
            0,
            "Blue",
            "blue",
            [six],
            Unoludo.empty_planes()
        );

        const next_state = Unoludo.play_number_card(
            state([blue], Unoludo.card("top-blue", "number", "blue", 1)),
            "blue-6",
            0
        );

        assert.deepEqual(next_state.players[0].planes[0], {
            status: "gate",
            position: -1,
            shielded: false,
            frozen: false
        });
        assert.equal(
            next_state.players[0].hand.some(function (card) {
                return card.id === "blue-6";
            }),
            false
        );
        assert.equal(next_state.discard_pile.at(-1).id, "blue-6");
    });

    it("does not launch a plane from base when the card is not a 6", function () {
        const three = Unoludo.card("blue-3", "number", "blue", 3);
        const blue = player(
            0,
            "Blue",
            "blue",
            [three],
            Unoludo.empty_planes()
        );

        const next_state = Unoludo.play_number_card(
            state([blue], Unoludo.card("top-blue", "number", "blue", 1)),
            "blue-3",
            0
        );

        assert.equal(next_state, undefined);
    });

    it("moves a plane from the gate onto the track, counting the start square as the first step", function () {
        const two = Unoludo.card("blue-2", "number", "blue", 2);
        const blue = player(
            0,
            "Blue",
            "blue",
            [two],
            four_planes(plane("gate", -1))
        );

        const next_state = Unoludo.play_number_card(
            state([blue], Unoludo.card("top-blue", "number", "blue", 1)),
            "blue-2",
            0
        );

        assert.deepEqual(next_state.players[0].planes[0], {
            status: "track",
            position: 1,
            shielded: false,
            frozen: false
        });
    });

    it("moves a plane into the home lane after passing its home entry", function () {
        const one = Unoludo.card("blue-1", "number", "blue", 1);
        const blue = player(
            0,
            "Blue",
            "blue",
            [one],
            four_planes(plane("track", 49))
        );

        const next_state = Unoludo.play_number_card(
            state([blue], Unoludo.card("top-blue", "number", "blue", 1)),
            "blue-1",
            0
        );

        assert.deepEqual(next_state.players[0].planes[0], {
            status: "home",
            position: 0,
            shielded: false,
            frozen: false
        });
    });

    it("captures an opponent plane that finishes on the same track square", function () {
        const four = Unoludo.card("blue-4", "number", "blue", 4);
        const blue = player(
            0,
            "Blue",
            "blue",
            [four],
            four_planes(plane("track", 5))
        );
        const red = player(
            1,
            "Red",
            "red",
            [],
            four_planes(plane("track", 9))
        );

        const next_state = Unoludo.play_number_card(
            state([blue, red], Unoludo.card("top-blue", "number", "blue", 1)),
            "blue-4",
            0
        );

        assert.deepEqual(next_state.players[0].planes[0], {
            status: "track",
            position: 9,
            shielded: false,
            frozen: false
        });
        assert.deepEqual(next_state.players[1].planes[0], {
            status: "base",
            position: -1,
            shielded: false,
            frozen: false
        });
        assert.match(next_state.log.at(-1), /captured Red's plane 0/u);
    });

    it("leaves a shielded opponent plane on the track instead of capturing it", function () {
        const four = Unoludo.card("blue-4", "number", "blue", 4);
        const blue = player(
            0,
            "Blue",
            "blue",
            [four],
            four_planes(plane("track", 5))
        );
        const red = player(
            1,
            "Red",
            "red",
            [],
            four_planes(plane("track", 9, {shielded: 1}))
        );

        const next_state = Unoludo.play_number_card(
            state([blue, red], Unoludo.card("top-blue", "number", "blue", 1)),
            "blue-4",
            0
        );

        assert.deepEqual(next_state.players[1].planes[0], {
            status: "track",
            position: 9,
            shielded: 1,
            frozen: false
        });
        assert.match(next_state.log.at(-1), /protected by shield/u);
    });

    it("advances every active own plane by four spaces when Wild +4 advance all is chosen", function () {
        const wild_four = Unoludo.card("wild4-advance", "wild4", "wild");
        const blue = player(
            0,
            "Blue",
            "blue",
            [wild_four],
            [
                plane("track", 5),
                plane("gate", -1),
                plane("base", -1),
                plane("finished", 5)
            ]
        );

        const next_state = Unoludo.play_wild4_card(
            state([blue], Unoludo.card("top-blue", "number", "blue", 1)),
            "wild4-advance",
            "advance_all",
            "blue"
        );

        assert.deepEqual(next_state.players[0].planes[0], {
            status: "track",
            position: 9,
            shielded: false,
            frozen: false
        });
        assert.deepEqual(next_state.players[0].planes[1], {
            status: "track",
            position: 3,
            shielded: false,
            frozen: false
        });
        assert.deepEqual(next_state.players[0].planes[2], {
            status: "base",
            position: -1,
            shielded: false,
            frozen: false
        });
        assert.deepEqual(next_state.players[0].planes[3], {
            status: "finished",
            position: 5,
            shielded: false,
            frozen: false
        });
    });

    it("keeps a shield active for two arrivals at the protected player's turn", function () {
        const zero = Unoludo.card("blue-0", "number", "blue", 0);
        const blue = player(
            0,
            "Blue",
            "blue",
            [zero],
            four_planes(plane("track", 8))
        );
        const red = player(
            1,
            "Red",
            "red",
            [],
            Unoludo.empty_planes()
        );

        let next_state = Unoludo.play_zero_card(
            state([blue, red], Unoludo.card("top-blue", "number", "blue", 1)),
            "blue-0",
            0
        );

        assert.equal(next_state.players[0].planes[0].shielded, 2);

        next_state = Unoludo.end_turn(next_state);
        assert.equal(next_state.players[0].planes[0].shielded, 2);

        next_state = Unoludo.end_turn(next_state);
        assert.equal(next_state.players[0].planes[0].shielded, 1);

        next_state = Unoludo.end_turn(next_state);
        assert.equal(next_state.players[0].planes[0].shielded, 1);

        next_state = Unoludo.end_turn(next_state);
        assert.equal(next_state.players[0].planes[0].shielded, false);
    });
});
