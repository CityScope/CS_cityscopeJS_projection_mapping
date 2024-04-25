/*

Logic to parse through the layers:
* This method assume a new cityIOdata object is propagated on each update on cityIO, so that deeply nested layer update will still rerender this component *

- loop over the cityIOdata.LAYERS
- for LAYER[i] get the layer's type (i.e Trip, Line, Arch, Heatmap, etc)
- for each layer type, populate a deckgl layer instance 
- if the layer has optional props field, use it to inform the layer props 
*/

import { mapSettings as settings } from "../../settings/settings";
import { CubeGeometry } from "@luma.gl/engine";
import DeckMap from "./BaseMap";
import {
  createHeatmapLayer,
  createMeshLayer,
  createTileLayer,
  createArcLayer,
} from "./layers";
import { OBJLoader } from "@loaders.gl/obj";

export default function ProjectionDeckMap(props) {
  // get the cityIOdata from the props
  const cityIOdata = props.cityIOdata;

  const cube = new CubeGeometry({ type: "x,z", xlen: 0, ylen: 0, zlen: 0 });

  // get the viewStateEditMode from the props
  const viewStateEditMode = props.viewStateEditMode;

  // get the GEOGRID object from the cityIOdata
  const GEOGRID = cityIOdata.GEOGRID;

  /*
  replace every GEOGRID.features[x].properties
  with cityIOdata.GEOGRIDDATA[x] to update the
  properties of each grid cell
  */
  for (let i = 0; i < GEOGRID.features?.length; i++) {
    // update GEOGRID features from GEOGRIDDATA on cityio
    GEOGRID.features[i].properties = cityIOdata.GEOGRIDDATA[i];
    // inject id with ES7 copy of the object
    GEOGRID.features[i].properties = {
      ...GEOGRID.features[i].properties,
      id: i,
    };
  }

  const header = GEOGRID.properties.header;
  const styles = settings.map.mapStyles;
  // ! TO DO: change the mapStyle to the desired style via the settings
  const mapStyle = styles.Light;

  const baseLayers = () => {
    return [
      createTileLayer(mapStyle),
      createMeshLayer(GEOGRID, cube, header, OBJLoader),
    ];
  };

  const layersArray = () => {
    const deckglLayers = [];

    // layersData is either cityIOdata.LAYERS if exist or cityIOdata.deckgl if not
    const layersData = cityIOdata.LAYERS || cityIOdata.deckgl;

    for (let i = 0; i < layersData.length; i++) {
      const layer = layersData[i];
      const layerType = layer.type;
      // const layerId = layer.id;

      if (layerType === "heatmap") {
        deckglLayers.push(createHeatmapLayer(i, layer, GEOGRID));
      } else if (layerType === "arc") {
        deckglLayers.push(createArcLayer(i, layer, GEOGRID));
      }
    }

    return deckglLayers;
  };

  return (
    <DeckMap
      header={cityIOdata.GEOGRID.properties.header}
      viewStateEditMode={viewStateEditMode}
      layers={{ baseLayers: baseLayers(), layers: layersArray() }}
    />
  );
}
