import { MapChip, MapChipProperties,  AutoTileMapChipProperties, isAutoTileMapChipProperties, AutoTileMapChip } from './../MapChip'
import { MapMatrix } from './MapMatrix'

export type ColiderTypes = 'colider' | 'none'

export type ColiderMapProperties = {
  chipCountX: number,
  chipCountY: number,
  coliders: Array<ColiderTypes>
}

export class ColiderMap extends MapMatrix<ColiderTypes> {
  toObject(): ColiderMapProperties {
    return {
      chipCountX: this._chipCountX,
      chipCountY: this._chipCountY,
      coliders: this._items
    }
  }

  static fromObject(val: ColiderMapProperties) {
    return new ColiderMap(val.chipCountX, val.chipCountY, val.coliders)
  }

  protected allocate() {
    super.allocate('none')
  }
}
