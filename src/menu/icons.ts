const iconsPath = `${__OCT_PACKAGE_ROOT__}/scripts_files/item-panel/icons`

/** Outline glyphs of the menu: the SDK set where it has one, our own next to it otherwise. */
export const PanelIcons = {
	ItemPanel: `${iconsPath}/item-panel.svg`,
	State: Menu.Icons.Power,
	Allies: `${iconsPath}/allies.svg`,
	Backpack: `${iconsPath}/backpack.svg`,
	Charges: Menu.Icons.Zap,
	Cooldown: Menu.Icons.Timer,
	FormatTime: Menu.Icons.ClockSeconds,
	Animation: Menu.Icons.Animation,
	HideItems: Menu.Icons.EyeOff,
	Passive: `${iconsPath}/passive.svg`,
	Common: `${iconsPath}/common.svg`,
	Rare: `${iconsPath}/rare.svg`,
	Neutral: `${iconsPath}/neutral.svg`,
	Cost: `${iconsPath}/cost.svg`,
	Binds: Menu.Icons.Keyboard,
	Key: Menu.Icons.Keyboard,
	KeyMode: Menu.Icons.ToggleLeft,
	TouchPanel: Menu.Icons.Move
} as const
