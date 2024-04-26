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
import { useRef, useState, useEffect } from "react";
import { OBJLoader } from "@loaders.gl/obj";

export default function ProjectionDeckMap(props) {
  // create a ref to store an index
  const indexRef = useRef(0);

  const [layersToRender, setLayersToRender] = useState([]);

  // get the cityIOdata from the props
  const cityIOdata = props.cityIOdata;

  const cube = new CubeGeometry({ type: "x,z", xlen: 0, ylen: 0, zlen: 0 });

  // get the viewStateEditMode from the props
  const viewStateEditMode = props.viewStateEditMode;

  // get the GEOGRID object from the cityIOdata
  const GEOGRID = cityIOdata.GEOGRID;

  // layersData is either cityIOdata.LAYERS if exist or cityIOdata.deckgl if not
  const layersData = cityIOdata.LAYERS || cityIOdata.deckgl;

  useEffect(() => {
    function handleClick(event) {
      if (event.key === "Enter") {
        // increment the indexRef if small than the length of the layers in cityIOdata.deckgl
        if (indexRef.current < layersData.length - 1) {
          indexRef.current++;
        } else {
          // reset the indexRef to 0 if it is equal to the length of the layers in cityIOdata.deckgl
          indexRef.current = 0;
        }

        createLayersArray();
      }
    }
    window.addEventListener("keydown", handleClick);

    return () => window.removeEventListener("keydown", handleClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // use effect to create the layers array every time the cityIOdata changes
  useEffect(() => {
    createLayersArray();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityIOdata]);

  const createLayersArray = () => {
    const styles = settings.map.mapStyles;
    const mapStyle = styles.Light;

    const l = [];
    l.push(
      // add the tile layer to the layers array
      createTileLayer(mapStyle),
      createMeshLayer(
        cityIOdata,
        GEOGRID,
        cube,
        GEOGRID.properties.header,
        OBJLoader
      )
    );

    const layer = layersData[indexRef.current];
    const layerType = layer.type;

    if (layerType === "heatmap") {
      l.push(createHeatmapLayer(indexRef.current, layer, GEOGRID));
    } else if (layerType === "arc") {
      l.push(createArcLayer(indexRef.current, layer, GEOGRID));
    }

    setLayersToRender(l);
  };

  return (
    <DeckMap
      header={cityIOdata.GEOGRID.properties.header}
      viewStateEditMode={viewStateEditMode}
      layersArray={layersToRender}
    />
  );
}
