import { useState, useEffect } from "react";
import queryString from "query-string";
import ProjectionMapping from "./ProjectionMapping";

// a react component that will render if the URL has no query string
// telling the user to add a query string to the URL
// to search for a table

const App = () => {
  const [tableName, setTableName] = useState();

  // on init, get the adress URL to search for  a table
  useEffect(() => {
    const location = window.location;
    const parsed = queryString.parse(location.search);
    if (parsed.cityscope) {
      setTableName(parsed.cityscope);
    } else {
      setTableName(null);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {!tableName ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            color: "red",
            fontFamily: "sans-serif",
          }}
        >
          <h1>CityScope - Projection Mapping</h1>
          <p>
            To view a table, add a query string to the URL with the table name
            <br />
            Example: "?cityscope=table_name"
          </p>
        </div>
      ) : (
        <ProjectionMapping tableName={tableName} />
      )}
    </>
  );
};

export default App;
