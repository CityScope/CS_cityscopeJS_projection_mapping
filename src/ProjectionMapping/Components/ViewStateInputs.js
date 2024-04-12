function ViewStateInputs(props) {
  const { viewState, setViewState } = props;

  // Function to handle input change
  const handleInputChange = (key, value) => {
    setViewState({
      ...viewState,
      [key]: value,
    });
  };

  // Create input fields
  const viewToggles = Object.keys(viewState).map((key) => {
    if (Number.isFinite(viewState[key])) {
      return (
        <>
          <label>{key}</label>
          <br />
          <input
            // 100% width
            style={{ width: "90%" }}
            key={key}
            type="number"
            value={viewState[key]}
            onChange={(e) => handleInputChange(key, parseFloat(e.target.value))}
          />
          <br />
        </>
      );
    } else {
      return null;
    }
  });

  return (
    <div
      style={{
        padding: "1vh",
        position: "absolute",
        bottom: "1vh",
        left: "1vw",
        zIndex: "tooltip",
        backgroundColor: "rgba(255, 0, 0,.9)",
      }}
    >
      <div>
        {/* Message */}
        Changes are saved automatically. Press [ z ] again to hide.
      </div>
      <div>
        {/* Input fields */}
        {viewToggles}
      </div>
    </div>
  );
}

export default ViewStateInputs;
