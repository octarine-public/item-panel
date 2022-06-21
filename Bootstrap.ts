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

EventsX.on("EntityCreated", async entity =>
	IManager.OnEntityCreated(entity))

EventsX.on("EntityChanged", async entity =>
	IManager.OnEntityChanged(entity))

EventsX.on("LifeStateChanged", async entity =>
	IManager.OnLifeStateChanged(entity))

EventsX.on("EntityDestroyed", async entity =>
	IManager.OnEntityDestroyed(entity))

EventsX.on("UnitAbilitiesChanged", async (unit, abil, transferred) =>
	IManager.OnUnitAbilitiesChanged(unit, abil, transferred))

EventsX.on("UnitItemsChanged", async (unit, abil, transferred) =>
	IManager.OnUnitItemsChanged(unit, abil, transferred))
