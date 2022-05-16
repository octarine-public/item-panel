import { EventsX } from "immortal-core/Imports"
import { EventsSDK, InputEventSDK } from "wrapper/Imports"
import ItemPanelManager from "./Manager/Main"
import MenuManager from "./Manager/Menu"

const IMenu = new MenuManager()
const IManager = new ItemPanelManager(IMenu)

EventsSDK.on("Draw", () =>
	IManager.OnDraw())

EventsX.on("GameEnded", async () =>
	IManager.OnGameEnded())

EventsX.on("GameStarted", () =>
	IManager.OnGameEnded())

EventsSDK.on("PostDataUpdate", () =>
	IManager.OnPostDataUpdate())

InputEventSDK.on("MouseKeyUp", key =>
	IManager.OnMouseKeyUp(key))

InputEventSDK.on("MouseKeyDown", key =>
	IManager.OnMouseKeyDown(key))

EventsX.on("EntityCreated", entity =>
	IManager.OnEntityCreated(entity))

EventsX.on("LifeStateChanged", entity =>
	IManager.OnLifeStateChanged(entity))

EventsX.on("EntityDestroyed", entity =>
	IManager.OnEntityDestroyed(entity))

EventsX.on("AbilityChanged", (abil, unit, oldOwner) =>
	IManager.OnAbilityChanged(abil, unit, oldOwner))
