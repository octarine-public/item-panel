import { MenuManager } from "./menu"
import { IsBackpackSlot, UnitData } from "./unit"

const ROW_HEIGHT = 26
const HERO_WIDTH = 42
const ITEM_WIDTH = 34
const ROW_GAP = 4
const ITEM_GAP = 3
const INSET = 2
const STRIP_WIDTH = 2
const RADIUS = 5
const COOLDOWN_FONT = 11
const CHARGES_FONT = 10

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

export class GUIHelper {
	private pad = 0
	private inset = 0
	private radius = 0
	private rowGap = 0
	private itemGap = 0
	private rowHeight = 0
	private heroWidth = 0
	private itemWidth = 0
	private stripWidth = 0
	private rows: UnitData[] = []
	private readonly size = new Vector2()
	private readonly box = new Rectangle()
	private readonly imagePos = new Vector2()
	private readonly imageSize = new Vector2()
	private readonly panel: MenuSDK.OverlayPanel

	private readonly drawContent = (origin: Vector2) => {
		this.frame(origin)
		const rows = this.rows
		for (let index = 0; index < rows.length; index++) {
			const data = rows[index]
			const unit = data.Owner
			const y = this.rowTop(index)
			this.hero(
				unit.TexturePath() ?? ImageData.GetUnitTexture(unit.Name) ?? "",
				unit.Color,
				y
			)
			let x = this.box.x + this.pad + this.heroWidth + this.itemGap
			for (const item of data.visible) {
				x = this.item(
					item.TexturePath,
					Math.round(item.Cooldown),
					item.CurrentCharges,
					IsBackpackSlot(item),
					x,
					y
				)
			}
		}
	}

	private readonly drawPreview = (origin: Vector2) => {
		this.frame(origin)
		const backPack = this.menu.BackPack.value
		for (let index = 0; index < PREVIEW_ROWS.length; index++) {
			const row = PREVIEW_ROWS[index]
			const y = this.rowTop(index)
			this.hero(row.texture, row.color, y)
			let x = this.box.x + this.pad + this.heroWidth + this.itemGap
			for (const item of row.items) {
				if (!backPack && item.backpack) {
					continue
				}
				x = this.item(
					item.texture,
					item.cooldown,
					item.charges,
					item.backpack,
					x,
					y
				)
			}
		}
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
			let count = 0
			for (const item of row.items) {
				if (backPack || !item.backpack) {
					count++
				}
			}
			maxItems = Math.max(maxItems, count)
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
		this.panel.Reset()
	}

	private measure(rowCount: number, maxItems: number): void {
		MenuSDK.setHudScale(this.panel.Scale)
		this.pad = MenuSDK.hudW(MenuSDK.HudCard.Pad)
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
			Math.round(
				this.pad * 2 + this.heroWidth + (this.itemGap + this.itemWidth) * slots
			),
			Math.round(
				this.pad * 2 +
					this.rowHeight * rowCount +
					this.rowGap * Math.max(rowCount - 1, 0)
			)
		)
	}

	private frame(origin: Vector2): void {
		const box = this.box
		box.pos1.CopyFrom(origin)
		box.pos2.SetVector(origin.x + this.size.x, origin.y + this.size.y)
		MenuSDK.HudCard.Frame(box)
	}

	private rowTop(index: number): number {
		return this.box.y + this.pad + (this.rowHeight + this.rowGap) * index
	}

	private hero(texture: string, color: Color, y: number): void {
		const x = this.box.x + this.pad
		const inset = this.inset
		MenuSDK.HudCard.Plate(
			x,
			y,
			this.heroWidth,
			this.rowHeight,
			this.radius,
			BLACK,
			MenuSDK.hudAlpha(180)
		)
		this.imagePos.SetVector(x + inset, y + inset)
		this.imageSize.SetVector(this.heroWidth - inset * 2, this.rowHeight - inset * 2)
		MenuSDK.HudCard.Image(
			texture,
			this.imagePos,
			this.imageSize,
			Color.WhiteReadonly,
			MenuSDK.hudAlpha(),
			Math.max(this.radius - inset, 0)
		)
		MenuSDK.HudCard.Fill(
			x + inset,
			y + inset,
			this.stripWidth,
			this.rowHeight - inset * 2,
			MenuSDK.HudColors.readable(color),
			MenuSDK.hudAlpha()
		)
	}

	private item(
		texture: string,
		cooldown: number,
		charges: number,
		backpack: boolean,
		x: number,
		y: number
	): number {
		const menu = this.menu
		const inset = this.inset
		const rowHeight = this.rowHeight
		const itemWidth = this.itemWidth
		const imageRadius = Math.max(this.radius - inset, 0)
		const plateColor = backpack || cooldown > 0 ? MenuSDK.HudColors.kill : BLACK
		MenuSDK.HudCard.Plate(
			x,
			y,
			itemWidth,
			rowHeight,
			this.radius,
			plateColor,
			MenuSDK.hudAlpha(backpack ? 120 : 180)
		)
		this.imagePos.SetVector(x + inset, y + inset)
		this.imageSize.SetVector(itemWidth - inset * 2, rowHeight - inset * 2)
		MenuSDK.HudCard.Image(
			texture,
			this.imagePos,
			this.imageSize,
			Color.WhiteReadonly,
			MenuSDK.hudAlpha(backpack ? 140 : 255),
			imageRadius
		)
		if (cooldown > 0 && menu.Cooldown.value) {
			MenuSDK.HudCard.Plate(
				x + inset,
				y + inset,
				itemWidth - inset * 2,
				rowHeight - inset * 2,
				imageRadius,
				BLACK,
				MenuSDK.hudAlpha(120)
			)
			MenuSDK.HudText.Center(
				x,
				y + rowHeight / 2,
				itemWidth,
				menu.FormatTime.value && cooldown >= 60
					? Math.formatTime(cooldown)
					: cooldown.toFixed(),
				COOLDOWN_FONT,
				Color.WhiteReadonly,
				MenuSDK.HudBold
			)
		}
		if (charges > 0 && menu.Charge.value) {
			MenuSDK.HudText.Right(
				x + itemWidth - inset * 2,
				y + rowHeight - MenuSDK.hudH(7),
				charges.toFixed(),
				CHARGES_FONT,
				Color.WhiteReadonly,
				MenuSDK.HudBold
			)
		}
		return x + itemWidth + this.itemGap
	}
}
