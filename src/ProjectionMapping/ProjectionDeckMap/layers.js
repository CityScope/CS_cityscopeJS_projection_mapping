import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { GeoJsonLayer } from "@deck.gl/layers";
import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer } from "@deck.gl/layers";
import { SimpleMeshLayer } from "deck.gl";
import { ArcLayer } from "@deck.gl/layers";
import { CubeGeometry } from "@luma.gl/core";
import { TextLayer } from "@deck.gl/layers";

/**
 * Converts a hex string to a RGB or RGBA array
 * @param {string} hex - The 6 or 8 char hex to convert
 * @returns {number[]} - Array of 3 RGB or 4 RGBA numbers
 */
function hex_to_rgba(hex) {
  const rgba = hex.match(/[0-9a-f]{2}/gi).map(x => parseInt(x, 16));
  return rgba.length === 4 ? rgba : rgba.slice(0, 3);
}

export const createHeatmapLayer = (i, layer, GEOGRID) =>
  new HeatmapLayer({
    id: `heatmap-layer-${i}`,
    data: layer.data,
    getPosition: (d) => [d.coordinates[0], d.coordinates[1], 100],
    getWeight: (d) => d.weight,
    radiusPixels: 100,
    intensity: 0.5,
    opacity: 0.85,
    threshold: 0.5,
    colorRange: [
      [0, 255, 0, 255],
      [255, 255, 0, 255],
      [255, 0, 0, 255],
      [0, 0, 0, 0],
    ],
    updateTriggers: {
      getWeight: GEOGRID,
    },
  });

export const createGeoJsonLayer = (i, layer, GEOGRID) =>
  new GeoJsonLayer({
    id: `geojson-layer-${i}`,
    data: layer.data,
    pickable: true,
    stroked: true,
    filled: true,
    extruded: true,
    lineWidthScale: 20,
    lineWidthMinPixels: 2,
    getLineColor: f => {
      const hex = f.properties.lineColor ?? f.properties.color;
      if (!hex) return [0, 0, 0];
    
      return hex_to_rgba(hex);
    },
    getFillColor: f => {
      const hex = f.properties.fillColor ?? f.properties.color;
      if (!hex) return [0, 0, 0];
    
      return hex_to_rgba(hex);
    },
    getRadius: 100,
    getLineWidth: 1,
    getElevation: 30,

    updateTriggers: {
      getFillColor: GEOGRID,
    },
  });

export const createTileLayer = (mapStyle) =>
  new TileLayer({
    id: "sat-view-layer",
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
  });

export const createMeshLayer = (cityIOdata, GEOGRID, OBJLoader) => {
  const cube = new CubeGeometry({ type: "x,z", xlen: 0, ylen: 0, zlen: 0 });

  const header = GEOGRID.properties.header;
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

  const meshLayer = new SimpleMeshLayer({
    id: "grid-layer",
    data: GEOGRID.features,
    loaders: [OBJLoader],
    opacity: 0.85,
    mesh: cube,
    getPosition: (d) => {
      const pntArr = d.geometry.coordinates[0];
      const first = pntArr[1];
      const last = pntArr[pntArr.length - 2];
      const center = [(first[0] + last[0]) / 2, (first[1] + last[1]) / 2, -1];
      return center;
    },
    getColor: (d) => d.properties.color,
    getOrientation: (d) => [-180, header.rotation, -90],
    getScale: (d) => [
      GEOGRID.properties.header.cellSize / 2.5,
      1,
      GEOGRID.properties.header.cellSize / 2.5,
    ],
    updateTriggers: {
      getScale: GEOGRID,
    },
  });

  const textLayer = new TextLayer({
    id: "text-layer",
    data: GEOGRID.features,
    getPosition: (d) => {
      const pntArr = d.geometry.coordinates[0];
      const first = pntArr[1];
      const last = pntArr[pntArr.length - 2];
      const center = [
        // center of the grid cell
        (first[0] + last[0]) / 2,
        (first[1] + last[1]) / 2,
        // make text slightly above the mesh
        d.properties.height + 1,
      ];
      return center;
    },
    getText: (d) =>
      // get the first 2 characters of the d.properties.name || d.properties.id || null,
      d.properties.name?.slice(0, 2) || d.properties.id?.slice(0, 2) || null,

    getSize: 10,
    getColor: (d) =>
      // inverse the rgb color to make text more readable
      d.properties.color.map((c) => 255 - c),
  });

  return [meshLayer, textLayer];
};

// arc layer
export const createArcLayer = (i, layer, GEOGRID) =>
  new ArcLayer({
    id: `arc-layer-${i}`,

    data: layer.data,
    getSourcePosition: (d) => d.from.coordinates,
    getTargetPosition: (d) => d.to.coordinates,
    getSourceColor: [255, 0, 0],
    getTargetColor: [0, 255, 0],
    getWidth: layer.properties.width || 1,
    updateTriggers: {
      getSourceColor: GEOGRID,
    },
  });
