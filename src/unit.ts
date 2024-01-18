import {
	Color,
	DOTA_ABILITY_BEHAVIOR,
	DOTAScriptInventorySlot,
	GUIInfo,
	ImageData,
	Item,
	item_tpscroll,
	MathSDK,
	Rectangle,
	RendererSDK,
	TextFlags,
	Unit,
	Vector2
} from "github.com/octarine-public/wrapper/index"

import { MenuManager } from "./menu"

export class UnitData {
	public items: Item[] = []

	constructor(public readonly Owner: Unit) { }

	public Draw(
		gap: number,
		menu: MenuManager,
		maxItem: number[],
		position: Rectangle,
		dragging: boolean,
		totalPosition: Rectangle,
		itemSize: Vector2
	) {
		const unit = this.Owner
		if (!menu.Ally.value && !unit.IsEnemy()) {
			return
		}

		// unit image
		const imageRect = position.Clone()
		const texture = unit.TexturePath() ?? ImageData.GetUnitTexture(unit.Name) ?? ""
		const opacity = Math.round((1 - menu.Opacity.value / 100) * 255)
		const minAlpha = Math.max(opacity, 150)

		this.FieldRect(imageRect, Color.Black.SetA(minAlpha), dragging)
		imageRect.x += gap / 2
		imageRect.y += gap / 2
		imageRect.Width -= gap
		imageRect.Height -= gap
		this.Image(texture, imageRect, Color.White.SetA(minAlpha), dragging)

		// unit image border left
		const leftBorder = imageRect.Clone()
		leftBorder.Width = GUIInfo.ScaleWidth(gap)
		this.FieldRect(leftBorder, unit.Color.Clone().SetA(opacity), dragging)

		let countItem = 0
		const items = this.items
		const itemPosition = position.Clone()

		itemPosition.x += position.Width
		itemPosition.Width = itemSize.x
		itemPosition.Height = itemSize.y

		const costValue = menu.HiddenItems.Cost.value
		const passiveState = menu.HiddenItems.Passive.value

		for (let index = items.length - 1; index > -1; index--) {
			const item = items[index]
			if (items.length - 1 === index) {
				itemPosition.x += gap / 2
			}

			const isBackPack =
				item.ItemSlot >= DOTAScriptInventorySlot.DOTA_ITEM_SLOT_7 &&
				item.ItemSlot <= DOTAScriptInventorySlot.DOTA_ITEM_SLOT_9

			if (!menu.BackPack.value && isBackPack) {
				continue
			}

			if (
				!this.ShouldDisplayItem(item, costValue, passiveState) ||
				menu.HiddenItems.IsEnabled(item.Name)
			) {
				continue
			}

			const itemTexture = item.TexturePath
			const cooldown = Math.round(item.Cooldown)
			const borderColor =
				cooldown !== 0 || isBackPack
					? Color.Red.SetR(isBackPack ? 138 : 255)
					: Color.Black

			this.FieldRect(itemPosition, borderColor.SetA(minAlpha), dragging)

			// item image
			const imageItemRect = itemPosition.Clone()
			imageItemRect.x += gap / 2
			imageItemRect.y += gap / 2
			imageItemRect.Width -= gap
			imageItemRect.Height -= gap
			this.Image(
				itemTexture,
				imageItemRect,
				Color.White.SetA(minAlpha),
				isBackPack || dragging
			)

			this.RenderText(cooldown, item.CurrentCharges, itemPosition, opacity, menu)
			itemPosition.AddX(itemPosition.Width)

			countItem++
			maxItem.push(countItem)
		}

		position.AddY(position.Height + gap / 2)
		totalPosition.Height += position.Height
	}

	public UnitItemsChanged(newItems: Item[]) {
		this.items = newItems
		this.sortItems()
	}

	public EntityDestroyed(item: Item) {
		this.items.remove(item)
		this.sortItems()
	}

	protected RenderText(
		cooldown: number,
		charges: number,
		position: Rectangle,
		opacity: number,
		menu: MenuManager
	) {
		if (cooldown > 0 && menu.Cooldown.value) {
			const text =
				menu.FormatTime.value && cooldown >= 60
					? MathSDK.FormatTime(cooldown)
					: cooldown.toFixed()
			RendererSDK.FilledRect(position.pos1, position.Size, Color.Black.SetA(100))
			RendererSDK.TextByFlags(text, position, Color.White.SetA(opacity + 20), 2.5, TextFlags.Center, 500)
		}

		if (charges > 0 && menu.Charge.value) {
			RendererSDK.TextByFlags(
				charges.toFixed(),
				position,
				Color.White.SetA(opacity + 20),
				2.7,
				TextFlags.Bottom | TextFlags.Right,
				500
			)
		}
	}

	protected FieldRect(position: Rectangle, color = Color.White, grayscale?: boolean) {
		RendererSDK.FilledRect(
			position.pos1,
			position.Size,
			color,
			undefined,
			undefined,
			grayscale
		)
	}

	protected Image(
		path: string,
		position: Rectangle,
		color = Color.White,
		grayscale?: boolean,
		round: number = -1
	) {
		RendererSDK.Image(
			path,
			position.pos1,
			round,
			position.Size,
			color,
			undefined,
			undefined,
			grayscale
		)
	}

	protected ShouldDisplayItem(item: Item, costValue: number, passiveState: boolean) {
		return (
			(costValue <= item.Cost || item.IsNeutralDrop) &&
			(!passiveState ||
				!(
					item.HasBehavior(
						DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_PASSIVE
					) && item.MaxCooldown === 0
				))
		)
	}

	protected sortItems() {
		this.items.orderBy(x => (x instanceof item_tpscroll ? x.ItemSlot : -x.ItemSlot))
	}
}
