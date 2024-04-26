import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { GeoJsonLayer } from "@deck.gl/layers";
import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer } from "@deck.gl/layers";
import { SimpleMeshLayer } from "deck.gl";
import { ArcLayer } from "@deck.gl/layers";

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
    getLineColor: [255, 255, 255],
    getFillColor: [200, 200, 200],
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

export const createMeshLayer = (GEOGRID, cube, header, OBJLoader) => {
  return new SimpleMeshLayer({
    id: "grid-layer",
    data: GEOGRID.features,
    loaders: [OBJLoader],
    opacity: 0.9,
    mesh: cube,

    // parameters: {
    //   depthMask: false,
    // },
    getPosition: (d) => {
      const pntArr = d.geometry.coordinates[0];
      const first = pntArr[1];
      const last = pntArr[pntArr.length - 2];
      const center = [(first[0] + last[0]) / 2, (first[1] + last[1]) / 2, 1];
      return center;
    },
    getColor: (d) => d.properties.color,
    getOrientation: (d) => [-180, header.rotation, -90],
    getScale: (d) => [
      GEOGRID.properties.header.cellSize / 2.1,
      1,
      GEOGRID.properties.header.cellSize / 2.1,
    ],
    updateTriggers: {
      getScale: GEOGRID,
    },
  });
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
