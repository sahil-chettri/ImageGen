function OutputBox({ image }) {
  return (
    <div>
      {image ? (
        <img src={image} alt="Generated" style={{ width: "100%" }} />
      ) : (
        <p>No image generated yet</p>
      )}
    </div>
  );
}

export default OutputBox;