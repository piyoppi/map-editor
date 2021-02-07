import { MapChipFragment, MapChip, TiledMapDataItem } from '@piyoppi/tiled-map'
import { Arrangement, ArrangementPaint, ArrangementDescription } from './Arrangement'
import { BrushPaint } from './../Brush'

export const DefaultArrangementDescription: ArrangementDescription<TiledMapDataItem> = {
  name: 'DefaultArrangement',
  create: () => new DefaultArrangement()
}

export class DefaultArrangement implements Arrangement<TiledMapDataItem> {
  private _mapChips: Array<MapChipFragment> = []
  
  setMapChips(mapChips: Array<MapChipFragment>) {
    if (mapChips.length !== 1) throw new Error('Invalid count of map chips. DefaultArrangement requires a map chip.')
    this._mapChips = mapChips 
  }

  apply(paints: Array<BrushPaint>): Array<ArrangementPaint<TiledMapDataItem>> {
    if (this._mapChips.length !== 1) throw new Error('Invalid count of map chips. DefaultArrangement requires a map chip.')
    return paints.map(paint => ({...paint, item: new MapChip([this._mapChips[0]])}))
  }
}
