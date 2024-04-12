/*

Logic to parse through the layers:
* This method assume a new cityIOdata object is propagated on each update on cityIO, so that deeply nested layer update will still rerender this component *

- loop over the cityIOdata.LAYERS
- for LAYER[i] get the layer's type (i.e Trip, Line, Arch, Heatmap, etc)
- for each layer type, populate a deckgl layer instance 
- if the layer has optional props field, use it to inform the layer props 
*/

import { mapSettings as settings } from "../../settings/settings";
import { SimpleMeshLayer, BitmapLayer } from "deck.gl";
import { OBJLoader } from "@loaders.gl/obj";
import { CubeGeometry } from "@luma.gl/engine";
import DeckMap from "./BaseMap";
import { TileLayer } from "@deck.gl/geo-layers";

export default function ProjectionDeckMap(props) {
  // get the cityIOdata from the props
  const cityIOdata = props.cityIOdata;
  // create a new cube geometry
  const cube = new CubeGeometry({ type: "x,z", xlen: 0, ylen: 0, zlen: 0 });
  // get the viewStateEditMode from the props
  const viewStateEditMode = props.viewStateEditMode;
  const layersVisibilityControl = props.layersVisibilityControl;

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

  const layersArray = () => {
    return [
      new TileLayer({
        data:
          mapStyle &&
          `https://api.mapbox.com/styles/v1/relnox/${mapStyle}/tiles/256/{z}/{x}/{y}?access_token=` +
            process.env.REACT_APP_MAPBOX_TOKEN +
            "&attribution=false&logo=false&fresh=true",
        minZoom: 0,
        maxZoom: 21,
        tileSize: 256,

        renderSubLayers: (props) => {
          const {
            bbox: { west, south, east, north },
          } = props.tile;

          return new BitmapLayer(props, {
            data: null,
            image: props.data,
            bounds: [west, south, east, north],
          });
        },
      }),

      new SimpleMeshLayer({
        id: "mesh-layer",
        data: GEOGRID.features,
        loaders: [OBJLoader],
        mesh: cube,
        getPosition: (d) => {
          const pntArr = d.geometry.coordinates[0];
          const first = pntArr[1];
          const last = pntArr[pntArr.length - 2];
          const center = [
            (first[0] + last[0]) / 2,
            (first[1] + last[1]) / 2,
            1,
          ];
          return center;
        },
        getColor: (d) => d.properties.color,
        opacity: 1,
        getOrientation: (d) => [-180, header.rotation, -90],
        getScale: (d) => [
          GEOGRID.properties.header.cellSize / 2.1,
          1,
          GEOGRID.properties.header.cellSize / 2.1,
        ],

        updateTriggers: {
          getScale: GEOGRID,
        },
      }),
    ];
  };

  return (
    <DeckMap
      header={cityIOdata.GEOGRID.properties.header}
      viewStateEditMode={viewStateEditMode}
      layers={layersArray(layersVisibilityControl)}
    />
  );
}
