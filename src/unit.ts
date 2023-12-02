import {
	Color,
	DOTA_ABILITY_BEHAVIOR,
	DOTAScriptInventorySlot,
	GUIInfo,
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

	constructor(public readonly Owner: Unit) {}

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
		const texturePath = unit.TexturePath() ?? ""
		const imageRect = position.Clone()
		this.FieldRect(imageRect, Color.Black, dragging)
		imageRect.x += gap / 2
		imageRect.y += gap / 2
		imageRect.Width -= gap
		imageRect.Height -= gap
		this.Image(texturePath, imageRect, Color.White, dragging)

		// unit image border left
		const leftBorder = imageRect.Clone()
		leftBorder.Width = GUIInfo.ScaleWidth(gap)
		this.FieldRect(leftBorder, unit.Color, dragging)

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
				item.Slot >= DOTAScriptInventorySlot.DOTA_ITEM_SLOT_7 &&
				item.Slot <= DOTAScriptInventorySlot.DOTA_ITEM_SLOT_9

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
			this.FieldRect(itemPosition, borderColor, dragging)

			// item image
			const imageItemRect = itemPosition.Clone()
			imageItemRect.x += gap / 2
			imageItemRect.y += gap / 2
			imageItemRect.Width -= gap
			imageItemRect.Height -= gap
			this.Image(itemTexture, imageItemRect, Color.White, isBackPack || dragging)

			this.RenderText(cooldown, item.CurrentCharges, itemPosition, menu)
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
		menu: MenuManager
	) {
		if (cooldown > 0 && menu.Cooldown.value) {
			const text =
				menu.FormatTime.value && cooldown >= 60
					? MathSDK.FormatTime(cooldown)
					: cooldown.toFixed()
			RendererSDK.FilledRect(position.pos1, position.Size, Color.Black.SetA(100))
			RendererSDK.TextByFlags(text, position, Color.White, 2.5)
		}

		if (charges > 0 && menu.Charge.value) {
			RendererSDK.TextByFlags(
				charges.toFixed(),
				position,
				Color.White,
				2.7,
				TextFlags.Bottom | TextFlags.Right
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
		this.items.orderBy(x => (x instanceof item_tpscroll ? x.Slot : -x.Slot))
	}
}
