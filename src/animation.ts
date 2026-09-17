/** How long a cell takes to come in, in seconds on the draw clock. */
const APPEAR = 0.32
/** How long the accent ring over a cell that just arrived takes to fade off it. */
const FLASH = 0.85
/** How long a cell takes to glide to a column the row's reflow handed it. */
const SLIDE = 0.2
/**
 * The head start each further cell born in the same frame gives up. A panel opening on a full
 * inventory cascades instead of flashing every slot at once, and a single purchase - the one thing
 * this is all for - still starts the instant it lands.
 */
const STAGGER = 0.035

/** `t` eased out: away quickly, into its place softly. */
export function easeOut(value: number): number {
	const rest = 1 - value
	return 1 - rest * rest * rest
}

/**
 * `t` eased out past its end and back, so a cell settles into its slot with a little weight behind
 * it. The overshoot is what reads as something arriving rather than something switched on.
 */
export function easeOutBack(value: number): number {
	const over = 2.4
	const rest = value - 1
	return 1 + (over + 1) * rest * rest * rest + over * rest * rest
}

/** Where a cell stands this frame, and how far into its entrance it is. */
export interface ISlotMotion {
	/**
	 * The column it is drawn at, eased: an item leaving the row leaves the ones after it gliding
	 * into the gap instead of jumping a cell sideways.
	 */
	readonly slot: number
	/** Its entrance, 0 the frame it arrives and 1 once it has settled. Raw, for the caller to shape. */
	readonly appear: number
	/** The ring a newcomer wears, 1 the moment it lands and 0 once it has faded. */
	readonly flash: number
}

interface ISlotState extends ISlotMotion {
	slot: number
	appear: number
	flash: number
	/** When the entrance starts - ahead of the clock while a cell waits its turn in a cascade. */
	born: number
	/** Whether this one is rung in: the panel's own first fill is not news, every later arrival is. */
	rings: boolean
	from: number
	to: number
	since: number
	seen: number
}

/** What a cell is drawn in while the motion is switched off, and what an unplaced key answers. */
const SETTLED: ISlotState = {
	slot: 0,
	appear: 1,
	flash: 0,
	born: 0,
	rings: false,
	from: 0,
	to: 0,
	since: 0,
	seen: 0
}

/**
 * The entrances and the reflow of one panel's cells, kept between frames and read back in the
 * immediate-mode shape the drawing itself is written in: open a frame, place every cell the layout
 * has, close it and whatever was not placed is gone.
 */
export class SlotMotion {
	private now = 0
	private next = 0
	private standing = false
	private enabled = true
	private readonly states = new Map<object, ISlotState>()

	/** Opens a frame on the draw clock, in seconds. */
	public Begin(now: number, enabled: boolean): void {
		if (!enabled) {
			if (this.enabled) {
				this.Reset()
			}
			this.enabled = false
			return
		}
		// the preview runs on a clock that stands still while its motion is held, and drops back to
		// it from the wall clock the moment it is: an entrance timed against that would never end
		if (now < this.now) {
			for (const state of this.states.values()) {
				state.born = now - FLASH
				state.since = now - SLIDE
			}
		}
		this.enabled = true
		this.now = now
		this.next = now
	}

	/**
	 * Puts `key` in column `slot` for this frame and answers where it is actually drawn: a key the
	 * panel has not carried before starts its entrance here, one the layout moved glides to it.
	 */
	public Place(key: object, slot: number): ISlotMotion {
		if (!this.enabled) {
			SETTLED.slot = slot
			return SETTLED
		}
		const now = this.now
		let state = this.states.get(key)
		if (state === undefined) {
			state = {
				slot,
				appear: 0,
				flash: 0,
				born: this.next,
				rings: this.standing,
				from: slot,
				to: slot,
				since: now - SLIDE,
				seen: now
			}
			this.next += STAGGER
			this.states.set(key, state)
		} else if (state.to !== slot) {
			state.from = state.slot
			state.to = slot
			state.since = now
		}
		state.seen = now
		const life = now - state.born
		state.slot =
			state.from +
			(state.to - state.from) * easeOut(share(now - state.since, SLIDE))
		state.appear = share(life, APPEAR)
		state.flash = state.rings ? 1 - share(life, FLASH) : 0
		return state
	}

	/** Closes the frame: every cell the layout did not place this time is dropped. */
	public End(): void {
		if (!this.enabled) {
			return
		}
		const states = this.states
		for (const [key, state] of states) {
			if (state.seen !== this.now) {
				states.delete(key)
			}
		}
		// a panel that emptied - turned off by its key, its heroes gone - opens cold when it comes
		// back, so a row returning whole does not arrive wearing a ring on every one of its cells
		this.standing = states.size > 0
	}

	/** Forgets every cell, for a panel that has stopped being drawn at all. */
	public Reset(): void {
		this.states.clear()
		this.standing = false
	}
}

/** How far `elapsed` has carried through a span of `length`, held to 0-1. */
function share(elapsed: number, length: number): number {
	return elapsed <= 0 ? 0 : Math.min(elapsed / length, 1)
}
