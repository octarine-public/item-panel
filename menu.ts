import { GUIInfo, Menu, RendererSDK, Vector2 } from "wrapper/Imports"

const ItemPanelTree = Menu.AddEntryDeep(["Visual", "Item Panel"])
export const ItemPanelState = ItemPanelTree.AddToggle("State", false, "State script: ON or OFF")

export const ItemPanelAllyState = ItemPanelTree.AddToggle("Ally")
export const ItemPanelBackPackState = ItemPanelTree.AddToggle("Backpack")

export const ItemPanelPingClick = ItemPanelTree.AddToggle("ItemPanel_PingClick")

export const ItemPanelCooldwnState = ItemPanelTree.AddToggle("ItemPanel_Cooldwn_State", true)

export const ItemPanelChargeState = ItemPanelTree.AddToggle("ItemPanel_Charge_State", true)

export const ItemPanelEmptySlot = ItemPanelTree.AddToggle("ItemPanel_EmptySlot")

const ItemPanelKeysTree = ItemPanelTree.AddNode("ItemPanel_Keys")

export const ItemPanelToggleKey = ItemPanelKeysTree.AddKeybind("ItemPanel_Key", "", "Key bind turn on/off panel")

export const ItemPanelModeKey = ItemPanelKeysTree.AddDropdown("ItemPanel_KeyMode", ["Hold key", "Toggled"], 1)

const ItemPanelSettingsTree = ItemPanelTree.AddNode("Settings")
export const ItemPanelSettingsSize = ItemPanelSettingsTree.AddSlider("Size", 35, 20, 60)

const ItemPanelSettingsPosX = ItemPanelSettingsTree.AddSlider("Position: X", 100, 0, 1920)
const ItemPanelSettingsPosY = ItemPanelSettingsTree.AddSlider("Position: Y", 100, 0, 1080)
export function GetItemPanelPos(): Vector2 {
	const screen_size = RendererSDK.WindowSize
	return new Vector2(
		GUIInfo.ScaleWidth(ItemPanelSettingsPosX.value, screen_size),
		GUIInfo.ScaleHeight(ItemPanelSettingsPosY.value, screen_size),
	)
}

Menu.Localization.AddLocalizationUnit("english", new Map([
	["ItemPanel_KeyMode", "Bind mode"],
	["ItemPanel_Key", "Bind"],
	["ItemPanel_Keys", "Binds"],
	["ItemPanel_EmptySlot", "Show empty slots"],
	["ItemPanel_Charge_State", "Show charges"],
	["ItemPanel_Cooldwn_State", "Show cooldowns"],
	["ItemPanel_PingClick", "Ping on click"],
]))
Menu.Localization.AddLocalizationUnit("russian", new Map([
	["Ally", "Союзники"],
	["Item Panel", "Панель предметов"],
	["Backpack", "Рюкзак"],
	["ItemPanel_KeyMode", "Режим бинда"],
	["Hold key", "Удерживать"],
	["Toggled", "Переключать"],
	["ItemPanel_Key", "Бинд"],
	["Key bind turn on/off panel", "Клавиша бинда на включение и выключение панели"],
	["ItemPanel_Keys", "Бинды"],
	["ItemPanel_EmptySlot", "Показать пустые слоты"],
	["ItemPanel_Charge_State", "Количество чарджей"],
	["ItemPanel_Cooldwn_State", "Время перезарядки"],
	["ItemPanel_PingClick", "Оповещения"],
]))
