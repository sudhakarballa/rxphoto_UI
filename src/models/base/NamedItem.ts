export interface INamedItem
{
	id: number;
	name: string;
	desc: string;
}

export interface ISelectableNamedItem extends INamedItem {
	active: string;
}
