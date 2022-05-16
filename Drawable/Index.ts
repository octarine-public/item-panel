import { UnitX } from "immortal-core/Imports"
import DrwableItems, { IDrwableUnit } from "./Items"

export const MapDrawable = new Map<string, DrwableItems>()

export default class DrawInteraction {

	constructor(protected unit: UnitX) { }

	public get Has() {
		return MapDrawable.has(this.KeyName)
	}

	protected get KeyName() {
		return `${this.unit.Handle}_${this.unit.Name}`
	}

	public Set<T extends IDrwableUnit>(class_: Constructor<DrwableItems>, option: T) {
		MapDrawable.set(this.KeyName, new class_(option))
	}

	public Get<T extends IDrwableUnit>() {
		const getDraw = MapDrawable.get(this.KeyName)
		return getDraw as Nullable<T>
	}

	public Delete<T extends DrwableItems>() {
		const getDraw = MapDrawable.get(this.KeyName)
		if (getDraw === undefined)
			return undefined
		MapDrawable.delete(this.KeyName)
		return getDraw as T
	}

	public OnUpdateCallback<T extends DrwableItems>(callback: (classType: T) => void) {
		const getDraw = MapDrawable.get(this.KeyName)
		if (getDraw !== undefined)
			callback(getDraw as T)
	}
}
