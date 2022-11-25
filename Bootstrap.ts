import "./Translate"

import { EventsX } from "github.com/octarine-private/immortal-core/index"
import { EventsSDK, InputEventSDK } from "github.com/octarine-public/wrapper/index"

import { ItemPanelManager } from "./Manager/Main"
import { MenuManager } from "./Manager/Menu"

const IMenu = new MenuManager()
const IManager = new ItemPanelManager(IMenu)

EventsSDK.on("Draw", () => IManager.OnDraw())

EventsX.on("GameEnded", () => IManager.OnGameEnded())

EventsX.on("GameStarted", () => IManager.OnGameEnded())

EventsSDK.on("PostDataUpdate", () => IManager.OnPostDataUpdate())

InputEventSDK.on("MouseKeyUp", key => IManager.OnMouseKeyUp(key))

InputEventSDK.on("MouseKeyDown", key => IManager.OnMouseKeyDown(key))

EventsX.on("EntityCreated", entity => IManager.OnEntityCreated(entity))

EventsX.on("EntityChanged", entity => IManager.OnEntityChanged(entity))

EventsX.on("LifeStateChanged", entity => IManager.OnLifeStateChanged(entity))

EventsX.on("EntityDestroyed", entity => IManager.OnEntityDestroyed(entity))

EventsX.on("UnitAbilitiesChanged", (unit, abil, transferred) =>
	IManager.OnUnitAbilitiesChanged(unit, abil, transferred)
)

EventsX.on("UnitItemsChanged", (unit, abil, transferred) =>
	IManager.OnUnitItemsChanged(unit, abil, transferred)
)
