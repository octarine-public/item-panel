import { PathX } from "immortal-core/Imports"
import { ItemPanelData } from "../data"
import { RectangleX } from "../Service/Rectangle"
import { IPValidate } from "../Service/Validate"

import {
	Color,
	DOTAGameUIState_t,
	EventsSDK, GameRules,
	GameState,
	item_black_king_bar, item_tpscroll,
	RendererSDK, Vector2,
} from "wrapper/Imports"

import {
	GetItemPanelPos,
	ItemPanelBackPackState,
	ItemPanelChargeState,
	ItemPanelCooldwnState,
	ItemPanelEmptySlot,
	ItemPanelModeKey,
	ItemPanelToggleKey,
} from "../menu"

EventsSDK.on("Draw", () => {

	if (!IPValidate.IsInGame || GameState.UIState !== DOTAGameUIState_t.DOTA_GAME_UI_DOTA_INGAME)
		return

	if ((ItemPanelModeKey.selected_id === 1 && !ItemPanelData.ToggledByKey) || (ItemPanelModeKey.selected_id === 0 && !ItemPanelToggleKey.is_pressed))
		return

	const vector = GetItemPanelPos(),
		HeroSize = ItemPanelData.HeroSize,
		ItemSize = ItemPanelData.ItemSize

	ItemPanelData.Units.forEach(unit => {
		const vSize = new Vector2(vector.x + HeroSize.x, vector.y)
		const borderPosition = new RectangleX(vSize, ItemSize.Clone())

		RendererSDK.Image(
			PathX.Unit({ name: unit.Name }),
			vector, -1,
			HeroSize,
		)

		const BackPack = ItemPanelBackPackState.value ? unit.Inventory.Backpack : []
		const Items = [...unit.Items, ...BackPack].filter(x => x !== undefined)

		const renderCount = ItemPanelBackPackState.value ? 10 : 7

		for (let i = 0; i < (ItemPanelEmptySlot.value ? renderCount : (Items.length - 1)); i++) {
			RectangleX.Image(
				"panorama/images/hud/reborn/inventory_item_well_psd.vtex_c",
				borderPosition.AddPos1(new Vector2(ItemSize.x * i, 0)),
			)
		}

		Items.forEach(item => {
			if (item instanceof item_tpscroll) {
				const vSizeHero = vector.Add(new Vector2(HeroSize.x * 0.65, HeroSize.y * 0.4))
				const vSizeItem = new Vector2(ItemSize.x * 0.6, ItemSize.x * 0.6)
				const tpPosition = new RectangleX(vSizeHero, vSizeItem)

				RectangleX.Image(item.TexturePath, tpPosition.AddSizeVector(1), Color.White, 1)
				RectangleX.Image("panorama/images/hud/reborn/buff_outline_psd.vtex_c", tpPosition, item.Cooldown !== 0 ? Color.Red : Color.White, 1)

				if (ItemPanelCooldwnState.value && item.Cooldown !== 0) {
					RectangleX.Image("panorama/images/masks/softedge_circle_sharp_png.vtex_c", tpPosition, Color.Black.SetA(125))
					RectangleX.Text(Math.ceil(item.Cooldown).toString(), tpPosition)
				}

			} else {
				const rectangle3 = borderPosition.SubtractSizeVector(4)
				RectangleX.Image(item.TexturePath, rectangle3)

				if (ItemPanelChargeState.value && item.Cooldown === 0 && (item.IsDisplayingCharges || ItemPanelData.ItemDisplayingCharges(item))) {
					let text = item.CurrentCharges
					if (item instanceof item_black_king_bar) {
						switch (item.Owner?.BKBChargesUsed) {
							case 0: text = 10; break
							case 1: text = 9; break
							case 2: text = 8; break
							case 3: text = 7; break
							case 4: text = 6; break
							case 5: text = 5; break
						}
					}
					const vector2 = RendererSDK.GetTextSize(text.toString(), RendererSDK.DefaultFontName, ItemSize.y * 0.8)
					const rec4 = rectangle3.SinkToBottomRight(vector2.x * 1.1, vector2.y * 0.8)
					RectangleX.FilledRect(rec4, Color.Black)
					RectangleX.Text(text.toString(), rec4)
				}

				const IsCooldown = (item.Cooldown !== 0 || (item.EnableTime - GameRules!.RawGameTime) > 0)

				if (ItemPanelCooldwnState.value && IsCooldown) {
					const cooldown = item.Cooldown === 0 ? item.EnableTime - GameRules!.RawGameTime : item.Cooldown
					RectangleX.Image("panorama/images/masks/softedge_horizontal_png.vtex_c", rectangle3, Color.Black.SetA(125))
					RectangleX.Text(Math.ceil(cooldown).toString(), rectangle3)
				}

				borderPosition.AddforThis(new Vector2(ItemSize.x, 0))
			}
		})

		vector.AddScalarY(HeroSize.y)
	})
})
