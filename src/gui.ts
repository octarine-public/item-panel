import { easeOut, easeOutBack, ISlotMotion, SlotMotion } from "./animation"
import { MenuManager } from "./menu"
import { IsBackpackSlot, UnitData } from "./unit"

const ROW_HEIGHT = 26
const HERO_WIDTH = 42
const ITEM_WIDTH = 36
const ROW_GAP = 2
const ITEM_GAP = 2
const INSET = 1
const STRIP_WIDTH = 2
const RADIUS = 5
const COOLDOWN_FONT = 11
const CHARGES_FONT = 10

/** What a cell is scaled to as its entrance starts: it grows into its slot, it does not blink on. */
const POP_FROM = 0.7
/** The share of the entrance spent fading in, so a cell is solid well before it stops moving. */
const POP_FADE = 0.55
/** How far past a cell's edge its ring has been thrown by the time it is gone, in dp. */
const PING_SPREAD = 4
/** The accent wash over the face of a cell that has just landed, at its brightest. */
const PING_TINT = 90
/** The accent the ring itself is struck in. */
const PING_EDGE = 235
/** How much of the ring's life it holds full strength for before it starts to go. */
const PING_HOLD = 1.5

/** How long the preview takes to drop a cell and bring it back, in seconds. */
const PREVIEW_CYCLE = 4
/** The share of that cycle the cell spends away - long enough to read the row without it. */
const PREVIEW_AWAY = 0.28
/** How far the next row's cycle is pushed off the one above it, so they do not arrive together. */
const PREVIEW_OFFSET = 0.5

const BLACK = Color.Black
const DIRE_COLORS = Color.PlayerColorDire

interface IPreviewItem {
	readonly texture: string
	readonly cooldown: number
	readonly charges: number
	readonly backpack: boolean
}

interface IPreviewRow {
	readonly texture: string
	readonly color: Color
	readonly items: IPreviewItem[]
}

const PREVIEW_ROWS: IPreviewRow[] = [
	{
		texture: ImageData.GetHeroTexture("npc_dota_hero_pudge"),
		color: DIRE_COLORS[0],
		items: [
			{
				texture: ImageData.GetItemTexture("item_tpscroll"),
				cooldown: 80,
				charges: 2,
				backpack: false
			},
			{
				texture: ImageData.GetItemTexture("item_blink"),
				cooldown: 8,
				charges: 0,
				backpack: false
			},
			{
				texture: ImageData.GetItemTexture("item_black_king_bar"),
				cooldown: 0,
				charges: 0,
				backpack: false
			},
			{
				texture: ImageData.GetItemTexture("item_magic_wand"),
				cooldown: 0,
				charges: 14,
				backpack: false
			},
			{
				texture: ImageData.GetItemTexture("item_ultimate_scepter"),
				cooldown: 0,
				charges: 0,
				backpack: true
			}
		]
	},
	{
		texture: ImageData.GetHeroTexture("npc_dota_hero_axe"),
		color: DIRE_COLORS[2],
		items: [
			{
				texture: ImageData.GetItemTexture("item_tpscroll"),
				cooldown: 0,
				charges: 1,
				backpack: false
			},
			{
				texture: ImageData.GetItemTexture("item_blade_mail"),
				cooldown: 0,
				charges: 0,
				backpack: false
			},
			{
				texture: ImageData.GetItemTexture("item_arcane_boots"),
				cooldown: 0,
				charges: 0,
				backpack: false
			}
		]
	}
]

/** How many of a preview row's cells the panel's own filters leave standing. */
function previewCount(row: IPreviewRow, backPack: boolean): number {
	let count = 0
	for (const item of row.items) {
		if (backPack || !item.backpack) {
			count++
		}
	}
	return count
}

/** Whether a preview row's last cell is away this instant, on the stage's own cycle. */
function previewAway(now: number, index: number): boolean {
	return (now / PREVIEW_CYCLE + index * PREVIEW_OFFSET) % 1 < PREVIEW_AWAY
}

export class GUIHelper {
	private inset = 0
	private radius = 0
	private rowGap = 0
	private itemGap = 0
	private rowHeight = 0
	private heroWidth = 0
	private itemWidth = 0
	private stripWidth = 0
	/** The fade the panel itself is drawn at, held while one cell is faded by its own entrance. */
	private outerAlpha = 1
	private rows: UnitData[] = []
	private readonly size = new Vector2()
	private readonly imagePos = new Vector2()
	private readonly imageSize = new Vector2()
	private readonly motion = new SlotMotion()
	private readonly previewMotion = new SlotMotion()
	private readonly panel: MenuSDK.OverlayPanel

	private readonly drawContent = (origin: Vector2) => {
		const motion = this.motion
		const rows = this.rows
		motion.Begin(MenuSDK.DrawClock(false), this.menu.Animation.value)
		for (let index = 0; index < rows.length; index++) {
			const data = rows[index]
			const unit = data.Owner
			const line = motion.Place(data, index)
			const y = this.rowTop(origin, line.slot)
			this.hero(
				unit.TexturePath() ?? ImageData.GetUnitTexture(unit.Name) ?? "",
				unit.Color,
				origin.x,
				y,
				line
			)
			const items = data.visible
			for (let slot = 0; slot < items.length; slot++) {
				const item = items[slot]
				const cell = motion.Place(item, slot)
				this.item(
					item.TexturePath,
					Math.round(item.Cooldown),
					item.CurrentCharges,
					IsBackpackSlot(item),
					this.slotX(origin.x, cell.slot),
					y,
					cell
				)
			}
		}
		motion.End()
	}

	private readonly drawPreview = (origin: Vector2) => {
		const menu = this.menu
		const motion = this.previewMotion
		const backPack = menu.BackPack.value
		const now = MenuSDK.PreviewClock()
		// the stage takes a cell away and brings it back, so the entrance this page is about is
		// there to watch; a stage held still, like a panel with the motion off, keeps its row whole
		// and stands its cells where they are: its clock has stopped, and an entrance timed against
		// a clock that does not run would never end
		const cycling = menu.Animation.value && MenuSDK.PreviewMotion.value
		motion.Begin(now, cycling)
		for (let index = 0; index < PREVIEW_ROWS.length; index++) {
			const row = PREVIEW_ROWS[index]
			const line = motion.Place(row, index)
			const y = this.rowTop(origin, line.slot)
			this.hero(row.texture, row.color, origin.x, y, line)
			const count = previewCount(row, backPack)
			const shown = cycling && previewAway(now, index) ? count - 1 : count
			let slot = 0
			for (const item of row.items) {
				if (!backPack && item.backpack) {
					continue
				}
				if (slot >= shown) {
					break
				}
				const cell = motion.Place(item, slot)
				this.item(
					item.texture,
					item.cooldown,
					item.charges,
					item.backpack,
					this.slotX(origin.x, cell.slot),
					y,
					cell
				)
				slot++
			}
		}
		motion.End()
	}

	constructor(private readonly menu: MenuManager) {
		this.panel = new MenuSDK.OverlayPanel(
			menu.Overlay,
			"hud-item-panel",
			MenuSDK.EPanelLife.MenuBound
		)
	}

	public Draw(rows: UnitData[], maxItems: number): void {
		this.rows = rows
		this.measure(rows.length, maxItems)
		this.panel.Draw(this.size, this.drawContent)
	}

	public DrawPreview(): void {
		const backPack = this.menu.BackPack.value
		let maxItems = 0
		for (const row of PREVIEW_ROWS) {
			maxItems = Math.max(maxItems, previewCount(row, backPack))
		}
		this.measure(PREVIEW_ROWS.length, maxItems)
		this.panel.Draw(this.size, this.drawPreview)
	}

	public MouseKeyDown(key: VMouseKeys): boolean {
		return this.panel.MouseKeyDown(key)
	}

	public MouseKeyUp(key: VMouseKeys): boolean {
		return key !== VMouseKeys.MK_LBUTTON || this.panel.MouseKeyUp()
	}

	public Reset(): void {
		this.motion.Reset()
		this.previewMotion.Reset()
		this.panel.Reset()
	}

	private measure(rowCount: number, maxItems: number): void {
		MenuSDK.setHudScale(this.panel.Scale)
		this.rowGap = MenuSDK.hudH(ROW_GAP)
		this.itemGap = MenuSDK.hudW(ITEM_GAP)
		this.rowHeight = MenuSDK.hudH(ROW_HEIGHT)
		this.heroWidth = MenuSDK.hudW(HERO_WIDTH)
		this.itemWidth = MenuSDK.hudW(ITEM_WIDTH)
		this.radius = Math.round(MenuSDK.hudRadius(RADIUS))
		this.inset = Math.max(Math.round(MenuSDK.hudW(INSET)), 1)
		this.stripWidth = Math.max(Math.round(MenuSDK.hudW(STRIP_WIDTH)), 1)
		const slots = Math.max(maxItems, 1)
		this.size.SetVector(
			Math.round(this.heroWidth + (this.itemGap + this.itemWidth) * slots),
			Math.round(
				this.rowHeight * rowCount + this.rowGap * Math.max(rowCount - 1, 0)
			)
		)
	}

	private rowTop(origin: Vector2, index: number): number {
		return origin.y + (this.rowHeight + this.rowGap) * index
	}

	/** Where the cell in column `slot` starts - a fraction of one while the row is still reflowing. */
	private slotX(originX: number, slot: number): number {
		return (
			originX +
			this.heroWidth +
			this.itemGap +
			(this.itemWidth + this.itemGap) * slot
		)
	}

	/**
	 * Fades everything a cell is about to draw by how far into its entrance it is, and answers how
	 * far its box is shrunk for it. The fade goes on the surface rather than into every call, so
	 * the readings on the cell - a cooldown, a charge count - come in with the plate under them and
	 * nothing has to carry the entrance by hand.
	 */
	private enter(motion: ISlotMotion): number {
		const appear = motion.appear
		this.outerAlpha = MenuSDK.HudAlphaScale()
		if (appear >= 1) {
			return 1
		}
		MenuSDK.SetHudAlphaScale(
			this.outerAlpha * easeOut(Math.min(appear / POP_FADE, 1))
		)
		return POP_FROM + (1 - POP_FROM) * easeOutBack(appear)
	}

	/** Hands the panel's own fade back, so the next cell starts from it and not from this one's. */
	private leave(): void {
		MenuSDK.SetHudAlphaScale(this.outerAlpha)
	}

	/**
	 * The ring a cell that has just landed wears: an accent wash over its face and a rim struck on
	 * its edge, thrown clear of it and faded as the moment passes. This is what says a new item,
	 * rather than a row that happens to be one cell wider than it was a second ago.
	 */
	private ping(
		x: number,
		y: number,
		width: number,
		height: number,
		scale: number,
		flash: number
	): void {
		if (flash <= 0) {
			return
		}
		const spread = PING_SPREAD * easeOut(1 - flash)
		const growX = MenuSDK.hudW(spread)
		const growY = MenuSDK.hudH(spread)
		MenuSDK.HudCard.Chip(
			x - growX,
			y - growY,
			width + growX * 2,
			height + growY * 2,
			RADIUS * scale + spread,
			MenuSDK.HudColors.accent,
			MenuSDK.hudAlpha(PING_TINT * flash * flash),
			MenuSDK.hudAlpha(PING_EDGE * Math.min(flash * PING_HOLD, 1))
		)
	}

	private hero(
		texture: string,
		color: Color,
		x: number,
		y: number,
		motion: ISlotMotion
	): void {
		if (motion.appear <= 0) {
			return
		}
		const scale = this.enter(motion)
		const width = this.heroWidth * scale
		const height = this.rowHeight * scale
		const left = x + (this.heroWidth - width) / 2
		const top = y + (this.rowHeight - height) / 2
		const inset = Math.max(this.inset * scale, 1)
		const radius = this.radius * scale
		MenuSDK.HudCard.Plate(
			left,
			top,
			width,
			height,
			radius,
			BLACK,
			MenuSDK.hudAlpha(180)
		)
		this.imagePos.SetVector(left + inset, top + inset)
		this.imageSize.SetVector(width - inset * 2, height - inset * 2)
		MenuSDK.HudCard.Image(
			texture,
			this.imagePos,
			this.imageSize,
			Color.WhiteReadonly,
			MenuSDK.hudAlpha(),
			Math.max(radius - inset, 0),
			0,
			"cover"
		)
		MenuSDK.HudCard.Fill(
			left + inset,
			top + inset,
			Math.max(this.stripWidth * scale, 1),
			height - inset * 2,
			MenuSDK.HudColors.readable(color),
			MenuSDK.hudAlpha()
		)
		this.leave()
	}

	private item(
		texture: string,
		cooldown: number,
		charges: number,
		backpack: boolean,
		x: number,
		y: number,
		motion: ISlotMotion
	): void {
		if (motion.appear <= 0) {
			return
		}
		const menu = this.menu
		const scale = this.enter(motion)
		const width = this.itemWidth * scale
		const height = this.rowHeight * scale
		const left = x + (this.itemWidth - width) / 2
		const top = y + (this.rowHeight - height) / 2
		const inset = Math.max(this.inset * scale, 1)
		const radius = this.radius * scale
		const imageRadius = Math.max(radius - inset, 0)
		// only a backpack slot is called out in red; an item on cooldown keeps the plain plate
		const plateColor = backpack ? MenuSDK.HudColors.kill : BLACK
		MenuSDK.HudCard.Plate(
			left,
			top,
			width,
			height,
			radius,
			plateColor,
			MenuSDK.hudAlpha(backpack ? 120 : 180)
		)
		this.imagePos.SetVector(left + inset, top + inset)
		this.imageSize.SetVector(width - inset * 2, height - inset * 2)
		MenuSDK.HudCard.Image(
			texture,
			this.imagePos,
			this.imageSize,
			Color.WhiteReadonly,
			MenuSDK.hudAlpha(backpack ? 140 : 255),
			imageRadius,
			0,
			"cover"
		)
		if (cooldown > 0 && menu.Cooldown.value) {
			MenuSDK.HudCard.Plate(
				left + inset,
				top + inset,
				width - inset * 2,
				height - inset * 2,
				imageRadius,
				BLACK,
				MenuSDK.hudAlpha(120)
			)
			MenuSDK.HudText.Center(
				left,
				top + height / 2,
				width,
				menu.FormatTime.value && cooldown >= 60
					? Math.formatTime(cooldown)
					: cooldown.toFixed(),
				COOLDOWN_FONT * scale,
				Color.WhiteReadonly,
				MenuSDK.HudBold
			)
		}
		if (charges > 0 && menu.Charge.value) {
			MenuSDK.HudText.Right(
				left + width - inset * 2,
				top + height - MenuSDK.hudH(7) * scale,
				charges.toFixed(),
				CHARGES_FONT * scale,
				Color.WhiteReadonly,
				MenuSDK.HudBold
			)
		}
		this.ping(left, top, width, height, scale, motion.flash)
		this.leave()
	}
}
