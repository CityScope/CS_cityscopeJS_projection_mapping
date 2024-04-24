import { useState, useEffect } from "react";
import ProjectionDeckMap from "./ProjectionDeckMap";
import Keystoner from "./Components/Keystoner";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { getCityIOUrl } from "../settings/settings";

export default function ProjectionMapping(props) {
  const tableName = props.tableName;
  // state to store the cityIO data
  const [cityIOData, setCityIOData] = useState();

  const { readyState, sendJsonMessage, lastJsonMessage } = useWebSocket(
    //  get cityIO url from the settings
    getCityIOUrl.test,
    {
      share: true,
      shouldReconnect: () => true,
    }
  );

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        type: "LISTEN",
        content: {
          gridId: tableName,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyState]);

  // when lastJsonMessage updates, print it to the console
  useEffect(() => {
    if (lastJsonMessage && lastJsonMessage.type === "GRID") {
      console.log("Socket open with", tableName, lastJsonMessage);
      const cityIOdata = lastJsonMessage.content;
      setCityIOData(cityIOdata);
      const numCols = cityIOdata.GEOGRID.properties.header.ncols;
      const numRows = cityIOdata.GEOGRID.properties.header.nrows;
      setTableRatio(numCols / numRows);
      console.log("Table ratio: ", numCols / numRows);
    } else if (
      lastJsonMessage &&
      lastJsonMessage.type === "GEOGRIDDATA_UPDATE"
    ) {
      // setCityIOData so that GEOGRIDDATA nested data is updated
      setCityIOData((prev) => {
        return {
          ...prev,
          GEOGRIDDATA: lastJsonMessage.content,
        };
      });
      // if the lastJsonMessage is of type "INDICATOR", log it
    } else if (lastJsonMessage && lastJsonMessage.type === "INDICATOR") {
      // setCityIOData so that the INDICATOR nested data is updated
      setCityIOData((prev) => {
        return {
          ...prev,
          LAYERS: lastJsonMessage.content?.moduleData?.deckgl,
        };
      });

      // if the lastJsonMessage is of type "ERROR", log it
    } else if (lastJsonMessage && lastJsonMessage.type === "ERROR") {
      console.error("Error from CityIO", lastJsonMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastJsonMessage]);

  const [editMode, setEditMode] = useState(false);
  const [viewStateEditMode, setViewStateEditMode] = useState(false);
  const [tableRatio, setTableRatio] = useState();

  const clearLocalStorage = () => {
    if (localStorage.getItem("projMap")) {
      localStorage.removeItem("projMap");
    }
    if (localStorage.getItem("projectionViewStateStorage")) {
      localStorage.removeItem("projectionViewStateStorage");
    }
    window.location.reload();
  };

  useEffect(() => {
    console.log("Keystone starting...");
    const onKeyDown = ({ key }) => {
      if (key === " ") {
        setEditMode((editMode) => !editMode);
      }
      // if the key is 'z', display the viewState editor
      if (key === "z") {
        setViewStateEditMode((viewStateEditMode) => !viewStateEditMode);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {tableRatio && (
        <div
          // ! this div's props are
          // ! controlling the projection z-index
          // ! above the menus

          style={{
            height: "100vh",
            width: "100vw",
            overflow: "hidden",
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 1000,
          }}
        >
          <div>
            <Keystoner
              style={{
                height: "100vh",
                width: `${tableRatio * 100}vh`,
                backgroundColor: editMode ? "red" : null,
                // have 1px border to show the edges of the projection
                border: editMode ? "1px solid red" : "1px solid white",
              }}
              isEditMode={editMode}
            >
              <ProjectionDeckMap
                viewStateEditMode={viewStateEditMode}
                cityIOdata={cityIOData}
              />
            </Keystoner>
          </div>
        </div>
      )}
      {editMode && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
          }}
        >
          <button onClick={() => clearLocalStorage()}>
            Clear Local Storage
          </button>
        </div>
      )}
    </>
  );
}
