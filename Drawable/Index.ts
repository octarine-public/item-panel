import { UnitX } from "immortal-core/Imports"
import DrwableItems, { IDrwableUnit } from "./Items"

export const MapDrawable = new Map<string, DrwableItems>()

export default class DrawInteraction {

	constructor(protected unit: UnitX) { }

	protected get KeyName() {
		return `${this.unit.Handle}_${this.unit.Name}`
	}

	public Has(unit?: UnitX) {
		const key = unit === undefined
			? this.KeyName
			: this.KeyNameUnit(unit)
		return MapDrawable.has(key)
	}

	public Set<T extends IDrwableUnit>(class_: Constructor<DrwableItems>, option: T) {
		MapDrawable.set(this.KeyName, new class_(option))
	}

	public Get<T extends IDrwableUnit>() {
		const getDraw = MapDrawable.get(this.KeyName)
		return getDraw as Nullable<T>
	}

	public Delete<T extends DrwableItems>(unit?: UnitX) {
		const key = unit === undefined
			? this.KeyName
			: this.KeyNameUnit(unit)
		const getDraw = MapDrawable.get(key)
		if (getDraw === undefined)
			return undefined
		MapDrawable.delete(key)
		return getDraw as T
	}

	public OnUpdateCallback<T extends DrwableItems>(callback: (classType: T) => void) {
		const getDraw = MapDrawable.get(this.KeyName)
		if (getDraw !== undefined)
			callback(getDraw as T)
	}

	protected KeyNameUnit(unit: UnitX) {
		return `${unit.Handle}_${unit.Name}`
	}
}
