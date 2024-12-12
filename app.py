import torch
import clip
from PIL import Image
from pathlib import Path
from flask import Flask, request, jsonify, send_file
import io

# Initialize the Flask app
app = Flask(__name__)

device = "cuda" if torch.cuda.is_available() else "cpu"

# Load the CLIP model and preprocessing
model, preprocess = clip.load("ViT-B/32", device=device)


@app.route("/process", methods=["POST"])
def process_image():
    try:
        # Check if a file is provided
        if "file" not in request.files:
            return jsonify({"error": "No image file provided"}), 400

        # Retrieve the image file
        image_file = request.files["file"]

        # Load and preprocess the image
        image = (
            preprocess(Image.open(image_file))
            .unsqueeze(0)
            .to(device, dtype=torch.float)
        )

        # Check if a .pth file is provided (old tensor)
        old_tensor = None
        if "old_tensor" in request.files:
            old_tensor_file = request.files["old_tensor"]
            old_tensor = torch.load(
                io.BytesIO(old_tensor_file.read()),
                map_location=device,
                weights_only=True,
            )

            # Check if the tensor loaded correctly
            if old_tensor is None:
                return jsonify({"error": "Failed to load the previous tensor"}), 400

            # Ensure that the tensor and new image have compatible dimensions
            if old_tensor.dim() != image.dim():
                return (
                    jsonify(
                        {"error": "Tensor dimensions do not match image dimensions"}
                    ),
                    400,
                )

            # Concatenate old tensor and new image tensor along the batch dimension
            images = torch.cat((old_tensor, image), dim=0)
        else:
            # If no old tensor is provided, just use the new image
            images = image

        # Save the updated tensor to a BytesIO object
        tensor_io = io.BytesIO()
        torch.save(images, tensor_io)
        tensor_io.seek(0)

        return send_file(
            tensor_io,
            as_attachment=True,
            download_name="updated_images_tensor.pth",
            mimetype="application/octet-stream",
        )

    except Exception as e:
        # Catch and return any errors that occur during processing
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
