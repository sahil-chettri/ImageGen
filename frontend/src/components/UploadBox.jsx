import { useState } from "react";

function UploadBox({ setImage }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const generateImage = async () => {
    if (!prompt) return alert("Enter prompt");

    setLoading(true);

    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_HF_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: prompt,
          }),
        }
      );

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);

      setImage(imageUrl);
    } catch (error) {
      console.error(error);
      alert("Error generating image");
    }

    setLoading(false);
  };

  return (
    <div>
      <textarea
        placeholder="Describe your image..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button onClick={generateImage}>
        {loading ? "Generating..." : "Generate Image"}
      </button>
    </div>
  );
}

export default UploadBox;