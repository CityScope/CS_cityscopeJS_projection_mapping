import { useEffect, useState } from "react";
import DeckGL from "@deck.gl/react";
import ViewStateInputs from "../Components/ViewStateInputs";
import "mapbox-gl/dist/mapbox-gl.css";

export default function BaseMap(props) {
  const header = props.header;
  const viewStateEditMode = props.viewStateEditMode;
  const layersObject = props.layers;

  useEffect(() => {
    function handleKeyDown(e) {
      // if the key pressed is enter
      if (e.key === "Enter") {
        //  ! TO SOLVE: this is a temporary solution to update the layers
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    // Don't forget to clean up
    return function cleanup() {
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [viewState, setViewState] = useState(() => {
    // on init, check if prev. local storage with
    // view state exist. If so, load it.
    if (localStorage.getItem("projectionViewStateStorage")) {
      const vs = localStorage.getItem("projectionViewStateStorage");
      console.log("loading saved projection View State from Storage...", vs);
      return JSON.parse(vs);
    } else {
      return {
        latitude: header.latitude,
        longitude: header.longitude,
        zoom: 15,
        pitch: 0,
        bearing: 360 - header.rotation || 0,
        orthographic: true,
      };
    }
  });

  useEffect(() => {
    // fix deck view rotate
    document
      .getElementById("deckgl-wrapper")
      .addEventListener("contextmenu", (evt) => evt.preventDefault());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onViewStateChange = ({ viewState }) => {
    //    save current view state to local storage
    localStorage.setItem(
      "projectionViewStateStorage",
      JSON.stringify(viewState)
    );
    // ! lock bearing to avoid odd rotation
    setViewState({ ...viewState, pitch: 0, orthographic: true });
  };

  return (
    <>
      <DeckGL
        controller={true}
        viewState={viewState}
        onViewStateChange={onViewStateChange}
        layers={layersObject.baseLayers.concat(layersObject.layers)}
      />
      {viewState && viewStateEditMode && (
        <ViewStateInputs setViewState={setViewState} viewState={viewState} />
      )}
    </>
  );
}
